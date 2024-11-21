import { connectToDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
    const { db } = await connectToDatabase();

    switch (req.method) {
        case 'GET':
            try {
                const { buyerId, farmerId, orderId, populate } = req.query;
                let query = {};

                if (buyerId) {
                    query.buyerId = new ObjectId(buyerId);
                }

                if (farmerId) {
                    query['items.farmerId'] = new ObjectId(farmerId);
                }
                
                if (orderId) {
                    query._id=new ObjectId(orderId);
                }

                let orders = await db
                    .collection('orders')
                    .find(query)
                    .sort({ createdAt: -1 })
                    .toArray();

                // Populate animal and farmer details if requested
                if (populate === 'true') {
                    orders = await Promise.all(orders.map(async (order) => {
                        const populatedItems = await Promise.all(order.items.map(async (item) => {
                            // Fetch animal details
                            const animal = await db.collection('animals').findOne({
                                _id: new ObjectId(item.animalId)
                            });

                            // Fetch farmer details
                            const farmer = await db.collection('users').findOne({
                                _id: new ObjectId(item.farmerId),
                                role: 'farmer'
                            }, {
                                projection: { name: 1, phone: 1 }
                            });

                            return {
                                ...item,
                                animal,
                                farmer
                            };
                        }));

                        return {
                            ...order,
                            items: populatedItems
                        };
                    }));
                }

                return res.status(200).json(orders);
            } catch (error) {
                console.error('Error fetching orders:', error);
                return res.status(500).json({ message: 'Error fetching orders' });
            }

        case 'POST':
            try {
                const { buyerId, items, paymentMethod } = req.body;

                // Calculate total amount
                const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

                const order = {
                    buyerId: new ObjectId(buyerId),
                    items: items.map(item => ({
                        ...item,
                        animalId: new ObjectId(item.animalId),
                        farmerId: new ObjectId(item.farmerId)
                    })),
                    status: 'pending',
                    totalAmount,
                    paymentStatus: 'pending',
                    paymentMethod,
                    createdAt: new Date()
                };

                // Set animal status to reserved when order is created
                await Promise.all(
                    items.map(item =>
                        db.collection('animals').updateOne(
                            { _id: new ObjectId(item.animalId) },
                            { $set: { status: 'reserved' } }
                        )
                    )
                );

                const result = await db.collection('orders').insertOne(order);

                return res.status(201).json({
                    message: 'Order created successfully',
                    order: { ...order, _id: result.insertedId }
                });
            } catch (error) {
                console.error('Order creation error:', error);
                return res.status(500).json({ message: 'Error creating order' });
            }

        case 'PUT':
            try {
                const { orderId, status, paymentStatus } = req.body;

                // First, get the current order to check its status
                const currentOrder = await db.collection('orders').findOne(
                    { _id: new ObjectId(orderId) }
                );

                if (!currentOrder) {
                    return res.status(404).json({ message: 'Order not found' });
                }

                const updateData = {
                    ...(status && { status }),
                    ...(paymentStatus && { paymentStatus }),
                    updatedAt: new Date()
                };

                // Update order status
                const result = await db.collection('orders').updateOne(
                    { _id: new ObjectId(orderId) },
                    { $set: updateData }
                );

                // Handle animal status updates based on order status
                if (status) {
                    const animalUpdates = await Promise.all(
                        currentOrder.items.map(async (item) => {
                            const animalId = item.animalId.toString();

                            switch (status) {
                                case 'confirmed':
                                    // When order is confirmed, remove animal from list (mark as sold)
                                    await db.collection('animals').updateOne(
                                        { _id: new ObjectId(animalId) },
                                        {
                                            $set: {
                                                status: 'sold',
                                                soldAt: new Date(),
                                                soldTo: currentOrder.buyerId,
                                                orderReference: currentOrder._id
                                            }
                                        }
                                    );
                                    break;

                                case 'rejected':
                                    // When order is rejected, keep animal in list (mark as available)
                                    await db.collection('animals').updateOne(
                                        { _id: new ObjectId(animalId) },
                                        {
                                            $set: {
                                                status: 'available',
                                                lastRejectedAt: new Date()
                                            },
                                            $unset: {
                                                soldTo: "",
                                                orderReference: ""
                                            }
                                        }
                                    );
                                    break;

                                case 'cancelled':
                                    // When order is cancelled, make animal available again
                                    await db.collection('animals').updateOne(
                                        { _id: new ObjectId(animalId) },
                                        {
                                            $set: {
                                                status: 'available',
                                                lastCancelledAt: new Date()
                                            },
                                            $unset: {
                                                soldTo: "",
                                                orderReference: ""
                                            }
                                        }
                                    );
                                    break;

                                default:
                                    // For other statuses, no change to animal status
                                    break;
                            }
                        })
                    );
                }

                // Send notifications or perform additional actions here if needed

                return res.status(200).json({
                    message: 'Order updated successfully',
                    orderStatus: status,
                    paymentStatus: paymentStatus
                });

            } catch (error) {
                console.error('Order update error:', error);
                return res.status(500).json({ message: 'Error updating order', error: error.message });
            }

        default:
            res.setHeader('Allow', ['GET', 'POST', 'PUT']);
            return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
}
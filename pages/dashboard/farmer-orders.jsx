import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import useAuthStore from '../../lib/store/authStore';

export default function FarmerOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const router = useRouter();
    const { user } = useAuthStore();

    useEffect(() => {
        if (!user || user.role !== 'farmer') {
            router.push('/');
            return;
        }
        fetchFarmerOrders();
    }, [user]);

    const fetchFarmerOrders = async () => {
        try {
            // Fetch farmer's orders
            const ordersResponse = await fetch(`/api/orders?farmerId=${user._id}`);
            const ordersData = await ordersResponse.json();
            setOrders(ordersData);
        } catch (error) {
            console.error('Error fetching farmer orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOrderStatus = async (orderId, status) => {
        try {
            const response = await fetch('/api/orders', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId,
                    status
                }),
            });

            if (response.ok) {
                fetchFarmerOrders();
            }
        } catch (error) {
            console.error('Error updating order status:', error);
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Orders</h1>

            <div className="space-y-4">
                {orders.length === 0 ? (
                    <p className="text-center text-gray-500">No orders yet</p>
                ) : (
                    orders.map((order) => (
                        <Card key={order._id} className="p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">Order ID: {order._id}</p>
                                    <p className="text-gray-600">Total: ${order.totalAmount}</p>
                                    <p className="text-gray-600">Status: {order.status}</p>
                                    <p className="text-gray-600">Payment Status: {order.paymentStatus}</p>
                                </div>
                                <div className="space-x-2">
                                    {order.status === 'pending' && (
                                        <>
                                            <Button
                                                onClick={() => handleOrderStatus(order._id, 'confirmed')}
                                                className="bg-green-500 hover:bg-green-600"
                                            >
                                                Confirm
                                            </Button>
                                            <Button
                                                onClick={() => handleOrderStatus(order._id, 'rejected')}
                                                className="bg-red-500 hover:bg-red-600"
                                            >
                                                Reject
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

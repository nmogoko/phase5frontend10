import { connectToDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
    const { db } = await connectToDatabase();

    switch (req.method) {
        case 'GET':
            try {
                const { farmerId } = req.query;
                const query = farmerId
                    ? { farmerId: new ObjectId(farmerId) }
                    : { status: 'available' };

                const animals = await db
                    .collection('animals')
                    .find(query)
                    .sort({ createdAt: -1 })
                    .toArray();

                return res.status(200).json(animals);
            } catch (error) {
                return res.status(500).json({ message: 'Error fetching animals' });
            }

        case 'POST':
            try {
                const { farmerId, type, breed, age, price, description, images } = req.body;

                const animal = {
                    farmerId: new ObjectId(farmerId),
                    type,
                    breed,
                    age,
                    price,
                    description,
                    images,
                    status: 'available',
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                const result = await db.collection('animals').insertOne(animal);

                return res.status(201).json({
                    message: 'Animal listed successfully',
                    animal: { ...animal, _id: result.insertedId }
                });
            } catch (error) {
                return res.status(500).json({ message: 'Error creating animal listing' });
            }

        case 'PUT':
            try {
                const { id, farmerId, ...updateData } = req.body;

                // Ensure farmerId is converted to ObjectId
                const dataToUpdate = {
                    ...updateData,
                    farmerId: new ObjectId(farmerId),
                    updatedAt: new Date()
                };

                const result = await db.collection('animals').updateOne(
                    { _id: new ObjectId(id) },
                    { $set: dataToUpdate }
                );

                if (result.matchedCount === 0) {
                    return res.status(404).json({ message: 'Animal not found' });
                }

                // Fetch the updated document
                const updatedAnimal = await db.collection('animals').findOne(
                    { _id: new ObjectId(id) }
                );

                return res.status(200).json({
                    message: 'Animal updated successfully',
                    animal: updatedAnimal
                });
            } catch (error) {
                return res.status(500).json({ message: 'Error updating animal' });
            }

        case 'DELETE':
            try {
                const { id } = req.query;

                const result = await db.collection('animals').deleteOne(
                    { _id: new ObjectId(id) }
                );

                if (result.deletedCount === 0) {
                    return res.status(404).json({ message: 'Animal not found' });
                }

                return res.status(200).json({ message: 'Animal deleted successfully' });
            } catch (error) {
                return res.status(500).json({ message: 'Error deleting animal' });
            }

        default:
            res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
            return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }
}
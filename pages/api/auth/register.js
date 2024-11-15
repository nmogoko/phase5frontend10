import { connectToDatabase } from '../../../lib/mongodb';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { email, password, role, name, phone, location } = req.body;
        const { db } = await connectToDatabase();

        // Check if user already exists
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Validate role
        if (!['farmer', 'buyer'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = {
            email,
            password: hashedPassword,
            role,
            name,
            phone,
            location,
            createdAt: new Date(),
        };

        const result = await db.collection('users').insertOne(user);

        // Remove password from response
        delete user.password;

        return res.status(201).json({
            message: 'User created successfully',
            user: {
                ...user,
                _id: result.insertedId,
            },
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

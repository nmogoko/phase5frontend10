import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuthStore from '../../lib/store/authStore';
import { Clock } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const router = useRouter();
    const { user } = useAuthStore();

    useEffect(() => {
        if (!user || user.role !== 'buyer') {
            router.push('/');
            return;
        }
        fetchOrders();
    }, [user]);

    const fetchOrders = async () => {
        try {
            const response = await fetch(`/api/orders?buyerId=${user._id}&populate=true`);
            if (!response.ok) {
                throw new Error('Failed to fetch orders');
            }
            const data = await response.json();
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 flex items-center">
                <Clock className="mr-2" />
                Order History
            </h1>

            <ScrollArea className="h-[600px]">
                {orders.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No orders yet</p>
                ) : (
                    orders.map((order) => (
                        <Card key={order._id} className="mb-4">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold">Order ID: {order._id}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Date: {new Date(order.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end space-y-2">
                                        <Badge variant={
                                            order.status === 'confirmed' ? 'default' :
                                            order.status === 'pending' ? 'secondary' : 'destructive'
                                        }>
                                            {order.status}
                                        </Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Animal Details</TableHead>
                                            <TableHead>Farmer Details</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {order.items.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    {item.animal ? `${item.animal.breed} ${item.animal.type}` : 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    {item.farmer ? `${item.farmer.name} (${item.farmer.phone})` : 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-right">${item.price}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                            <CardFooter className="flex justify-between items-center">
                                <span className="font-semibold">Total:</span>
                                <span className="text-lg font-bold">${order.totalAmount}</span>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </ScrollArea>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuthStore from '../../lib/store/authStore';
import useCartStore from '../../lib/store/cartStore';
import { Trash2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function BuyerDashboard() {
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [checkoutError, setCheckoutError] = useState('');

    const router = useRouter();
    const { user } = useAuthStore();
    const { items, removeItem, clearCart, getTotalAmount } = useCartStore();

    useEffect(() => {
        if (!user || user.role !== 'buyer') {
            router.push('/');
            return;
        }
    }, [user]);

    const handleCheckout = async () => {
        setIsCheckingOut(true);
        setCheckoutError('');
        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    buyerId: user._id,
                    items: items.map(item => ({
                        animalId: item._id,
                        price: item.price,
                        farmerId: item.farmerId
                    })),
                    paymentMethod: 'card'
                }),
            });

            const data = await response.json();

            if (response.ok) {
                clearCart();
                alert('Order placed successfully! The farmer will review your order shortly.');
            } else {
                throw new Error(data.message || 'Failed to place order');
            }
        } catch (error) {
            console.error('Error creating order:', error);
            setCheckoutError(error.message || 'Failed to place order. Please try again.');
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
          <Card className="m-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center">
                <ShoppingCart className="mr-2" />
                Shopping Cart
              </CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-muted-foreground">Your cart is empty</p>
              ) : (
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Animal</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell>{item.breed} {item.type}</TableCell>
                          <TableCell className="text-right">${item.price}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => removeItem(item._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
            {items.length > 0 && (
              <CardFooter className="flex flex-col space-y-4">
                <Separator />
                <div className="flex justify-between items-center w-full">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold">${getTotalAmount()}</span>
                </div>
                {checkoutError && (
                  <div className="text-red-500 text-sm w-full text-center">
                    {checkoutError}
                  </div>
                )}
                <div className="flex justify-end space-x-4 w-full">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline">Clear Cart</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently clear your shopping cart.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={clearCart}>Continue</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                  >
                    {isCheckingOut ? 'Processing...' : 'Checkout'}
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>
    );
}

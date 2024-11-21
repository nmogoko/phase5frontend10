import { useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from 'components/ui/button';
import { Input } from 'components/ui/input';

export default function Payment() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [mpesaName, setMpesaName] = useState('');
    const router = useRouter();

    const handlePayment = async () => {
        try {
            const response = await fetch('https://farmart-backend-f2uh.onrender.com/initiate-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phoneNumber,
                    mpesaName,
                }),
            });

            if (!response.ok) {
                throw new Error('Payment submission failed');
            }

            const data = await response.json();
            alert(`Payment successful: ${data.message}`);
            router.push('/dashboard/order-history');
        } catch (error) {
            console.error('Error submitting payment:', error);
            alert('Payment submission failed. Please try again.');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Payment</h1>
            <div className="space-y-4">
                <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <Input
                        id="phoneNumber"
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Enter your phone number"
                    />
                </div>
                <div>
                    <label htmlFor="mpesaName" className="block text-sm font-medium text-gray-700">MPesa Name</label>
                    <Input
                        id="mpesaName"
                        type="text"
                        value={mpesaName}
                        onChange={(e) => setMpesaName(e.target.value)}
                        placeholder="Enter your MPesa name"
                    />
                </div>
                <Button onClick={handlePayment}>Submit Payment</Button>
            </div>
        </div>
    );
}

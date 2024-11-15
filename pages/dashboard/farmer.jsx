import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import useAuthStore from '../../lib/store/authStore';

export default function FarmerDashboard() {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingAnimal, setEditingAnimal] = useState(null);
    const [formData, setFormData] = useState({
        type: '',
        breed: '',
        age: '',
        price: '',
        description: '',
        image: ''
    });

    const router = useRouter();
    const { user } = useAuthStore();

    useEffect(() => {
        if (!user || user.role !== 'farmer') {
            router.push('/');
            return;
        }
        fetchFarmerAnimals();
    }, [user]);

    const fetchFarmerAnimals = async () => {
        try {
            const animalsResponse = await fetch(`/api/animals?farmerId=${user._id}`);
            const animalsData = await animalsResponse.json();
            setAnimals(animalsData);
        } catch (error) {
            console.error('Error fetching farmer animals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('Image size should be less than 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    image: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const method = editingAnimal ? 'PUT' : 'POST';
            const url = '/api/animals';
            
            const payload = {
                ...formData,
                farmerId: user._id,
                age: parseInt(formData.age),
                price: parseFloat(formData.price),
                images: formData.image ? [formData.image] : [] // Convert single image to array for API compatibility
            };

            // If editing, include the animal ID
            if (editingAnimal) {
                payload.id = editingAnimal._id;
            }

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const result = await response.json();
                
                if (editingAnimal) {
                    // Update the specific animal in the local state
                    setAnimals(prevAnimals => 
                        prevAnimals.map(animal => 
                            animal._id === editingAnimal._id ? result.animal : animal
                        )
                    );
                } else {
                    // Add the new animal to the local state
                    setAnimals(prevAnimals => [result.animal, ...prevAnimals]);
                }

                setShowForm(false);
                setEditingAnimal(null);
                setFormData({
                    type: '',
                    breed: '',
                    age: '',
                    price: '',
                    description: '',
                    image: ''
                });
            }
        } catch (error) {
            console.error('Error creating/updating animal listing:', error);
        }
    };

    const handleEditAnimal = (animal) => {
        setEditingAnimal(animal);
        setFormData({
            type: animal.type,
            breed: animal.breed,
            age: animal.age.toString(),
            price: animal.price.toString(),
            description: animal.description,
            image: animal.images?.[0] || '' // Get first image if exists
        });
        setShowForm(true);
    };

    const handleDeleteAnimal = async (animalId) => {
        try {
            const response = await fetch(`/api/animals?id=${animalId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setAnimals(prevAnimals => prevAnimals.filter(animal => animal._id !== animalId));
            } else {
                const errorData = await response.json();
                console.error('Error deleting animal:', errorData.message);
            }
        } catch (error) {
            console.error('Error deleting animal:', error);
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Farmer Dashboard</h1>

            {/* Add/Edit New Animal Button */}
            <Button
                onClick={() => {
                    setShowForm(!showForm);
                    if (editingAnimal) {
                        setEditingAnimal(null);
                        setFormData({
                            type: '',
                            breed: '',
                            age: '',
                            price: '',
                            description: '',
                            image: ''
                        });
                    }
                }}
                className="mb-8"
            >
                {showForm ? 'Cancel' : (editingAnimal ? 'Cancel Edit' : 'Add New Animal')}
            </Button>

            {/* Add/Edit Animal Form */}
            {showForm && (
                <Card className="p-6 mb-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block mb-1">Type</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                                required
                            >
                                <option value="">Select Type</option>
                                <option value="camel">Camel</option>
                                <option value="cow">Cow</option>
                                <option value="goat">Goat</option>
                                <option value="sheep">Sheep</option>
                                <option value="chicken">Chicken</option>
                            </select>
                        </div>

                        <div>
                            <label className="block mb-1">Breed</label>
                            <input
                                type="text"
                                name="breed"
                                value={formData.breed}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>

                        <div>
                            <label className="block mb-1">Age (months)</label>
                            <input
                                type="number"
                                name="age"
                                value={formData.age}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>

                        <div>
                            <label className="block mb-1">Price ($)</label>
                            <input
                                type="number"
                                name="price"
                                value={formData.price}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>

                        <div>
                            <label className="block mb-1">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                                rows="4"
                                required
                            />
                        </div>

                        <div>
                            <label className="block mb-1">Image</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="w-full p-2 border rounded"
                                required={!editingAnimal}
                            />
                            {formData.image && (
                                <img
                                    src={formData.image}
                                    alt="Preview"
                                    className="mt-2 w-full max-h-48 object-cover rounded"
                                />
                            )}
                        </div>

                        <Button type="submit">
                            {editingAnimal ? 'Update Animal' : 'Add Animal'}
                        </Button>
                    </form>
                </Card>
            )}

            {/* Animals List */}
            <h2 className="text-2xl font-bold mb-4">Your Animals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {animals.map((animal) => (
                    <Card key={animal._id} className="p-4">
                        {animal.images?.[0] && (
                            <img
                                src={animal.images[0]}
                                alt={`${animal.breed} ${animal.type}`}
                                className="w-full h-48 object-cover rounded-md mb-4"
                            />
                        )}
                        <h3 className="text-xl font-semibold mb-2">{animal.breed} {animal.type}</h3>
                        <p className="text-gray-600">Age: {animal.age} months</p>
                        <p className="text-green-600 font-bold">Price: ${animal.price}</p>
                        <p className="text-gray-700 mt-2">{animal.description}</p>
                        <div className="mt-4 flex justify-between items-center">
                            <span className={`px-2 py-1 rounded ${
                                animal.status === 'available' ? 'bg-green-100 text-green-800' :
                                animal.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                                {animal.status}
                            </span>
                            <div className="space-x-2">
                                <Button 
                                    onClick={() => handleEditAnimal(animal)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white"
                                >
                                    Edit
                                </Button>
                                <Button 
                                    onClick={() => handleDeleteAnimal(animal._id)}
                                    className="bg-red-500 hover:bg-red-600 text-white"
                                >
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
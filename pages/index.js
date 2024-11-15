import { useState, useEffect } from 'react';
import useAuthStore from '../lib/store/authStore';
import useCartStore from '../lib/store/cartStore';
import Link from 'next/link';
import { Search, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
    const [animals, setAnimals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBreed, setFilterBreed] = useState('all');
    const [filterAge, setFilterAge] = useState('all');
    const [sortBy, setSortBy] = useState('price-asc');
    
    const { user } = useAuthStore();
    const { addItem } = useCartStore();

    useEffect(() => {
        fetchAnimals();
    }, []);

    const fetchAnimals = async () => {
        try {
            const response = await fetch('/api/animals');
            const data = await response.json();
            setAnimals(data);
        } catch (error) {
            console.error('Error fetching animals:', error);
        } finally {
            setLoading(false);
        }
    };

    const uniqueBreeds = ['all', ...new Set(animals.map(animal => animal.breed))];

    const sortedAndFilteredAnimals = animals
        .filter(animal => {
            const matchesSearch = animal.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
                animal.type.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesBreed = filterBreed === 'all' || animal.breed === filterBreed;
            const matchesAge = filterAge === 'all' || 
                (filterAge === '0-12' && animal.age <= 12) ||
                (filterAge === '13-24' && animal.age > 12 && animal.age <= 24) ||
                (filterAge === '24+' && animal.age > 24);
            return matchesSearch && matchesBreed && matchesAge;
        })
        .sort((a, b) => {
            switch(sortBy) {
                case 'price-asc':
                    return a.price - b.price;
                case 'price-desc':
                    return b.price - a.price;
                case 'age-asc':
                    return a.age - b.age;
                case 'age-desc':
                    return b.age - a.age;
                default:
                    return 0;
            }
        });

    const handleAddToCart = (animal) => {
        addItem(animal);
    };

    return (
        <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-12 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl font-extrabold mb-4">FARMART</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Your Premier Livestock Marketplace - Quality Animals, Seamless Transactions
          </p>
          {!user && (
            <div className="flex justify-center gap-4">
              <Button asChild variant="secondary" size="lg">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-white border-white hover:bg-white hover:text-blue-600">
                <Link href="/auth/register">Register</Link>
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <Input
              type="text"
              placeholder="Search by breed..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={filterBreed} onValueChange={setFilterBreed}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by Breed" />
            </SelectTrigger>
            <SelectContent>
              {uniqueBreeds.map(breed => (
                <SelectItem key={breed} value={breed}>
                  {breed === 'all' ? 'All Breeds' : breed}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterAge} onValueChange={setFilterAge}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by Age" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ages</SelectItem>
              <SelectItem value="0-12">0-12 months</SelectItem>
              <SelectItem value="13-24">13-24 months</SelectItem>
              <SelectItem value="24+">24+ months</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="age-asc">Age: Young to Old</SelectItem>
              <SelectItem value="age-desc">Age: Old to Young</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center text-xl text-gray-600">
            Loading available livestock...
          </div>
        ) : (
          <>
            {sortedAndFilteredAnimals.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-2xl mb-4">No animals found</p>
                  <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedAndFilteredAnimals.map((animal) => (
                  <Card key={animal._id} className="overflow-hidden transition-transform hover:scale-105">
                    <CardHeader className="p-0">
                      <div className="relative">
                        <img
                          src={animal.images[0]}
                          alt={`${animal.breed} ${animal.type}`}
                          className="w-full h-56 object-cover"
                        />
                        <span className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-sm">
                          {animal.type.toUpperCase()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <CardTitle className="text-2xl mb-2">{animal.breed}</CardTitle>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-600">Age: {animal.age} months</span>
                        <span className="text-green-600 font-bold text-xl">${animal.price}</span>
                      </div>
                      <p className="text-gray-700 mb-4 line-clamp-3">{animal.description}</p>
                    </CardContent>
                    <CardFooter>
                      {user && user.role === 'buyer' && (
                        <Button onClick={() => handleAddToCart(animal)} className="w-full">
                          Add to Cart
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose FARMART?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Verified Livestock', description: 'All animals are health-checked and come with complete documentation.', icon: 'check-circle' },
              { title: 'Transparent Pricing', description: 'Fair and competitive prices with no hidden costs.', icon: 'dollar-sign' },
              { title: 'Easy Transactions', description: 'Seamless buying process with secure payment and delivery options.', icon: 'shopping-cart' },
            ].map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-green-100 text-green-600 mb-4">
                    {feature.icon === 'check-circle' && <CheckCircle className="h-8 w-8" />}
                    {feature.icon === 'dollar-sign' && <DollarSign className="h-8 w-8" />}
                    {feature.icon === 'shopping-cart' && <ShoppingCart className="h-8 w-8" />}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
    );
}


function CheckCircle(props) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    )
  }
  
  function DollarSign(props) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" x2="12" y1="2" y2="22" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    )
  }
  
  function ShoppingCart(props) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="8" cy="21" r="1" />
        <circle cx="19" cy="21" r="1" />
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      </svg>
    )
  }

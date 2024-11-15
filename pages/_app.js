import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuthStore from '../lib/store/authStore';
import Navigation from '../components/Navigation';
import '../styles/globals.css';

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/register'
];

function App({ Component, pageProps }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Check if the current route requires authentication
    const isPublicRoute = publicRoutes.includes(router.pathname);

    if (!isAuthenticated && !isPublicRoute) {
      router.push('/auth/login');
    }

    // Redirect to appropriate dashboard if already logged in and trying to access auth pages
    if (isAuthenticated && (router.pathname === '/auth/login' || router.pathname === '/auth/register')) {
      router.push(user.role === 'farmer' ? '/dashboard/farmer' : '/dashboard/buyer');
    }
  }, [isAuthenticated, router.pathname]);

  // Don't show navigation on auth pages
  const showNavigation = !router.pathname.startsWith('/auth/');

  return (
    <div className="min-h-screen bg-gray-50">
      {showNavigation && <Navigation />}
      <main className="pt-4">
        <Component {...pageProps} />
      </main>
    </div>
  );
}

export default App;

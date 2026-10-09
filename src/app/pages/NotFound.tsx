import { Link } from 'react-router';
import { Flower2 } from 'lucide-react';
import { Button } from '../components/ui/button';

export function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Flower2 className="w-24 h-24 text-purple-200 mx-auto mb-4" />
        <h1 className="text-6xl font-bold text-gray-800 mb-2">404</h1>
        <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          Oops! The page you're looking for doesn't exist.
        </p>
        <Link to="/">
          <Button size="lg">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

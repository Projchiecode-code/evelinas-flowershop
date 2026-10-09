import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { AdminLayout } from './components/AdminLayout';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { BouquetDetail } from './pages/BouquetDetail';
import { Gallery } from './pages/Gallery';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { OrderConfirmation } from './pages/OrderConfirmation';
import { OrderTracking } from './pages/OrderTracking';
import { OrderHistory } from './pages/OrderHistory';
import { AIRecommendations } from './pages/AIRecommendations';
import { Favorites } from './pages/Favorites';
import { Profile } from './pages/Profile';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ProductManagement } from './pages/admin/ProductManagement';
import { OrderManagement } from './pages/admin/OrderManagement';
import { RecommendationManagement } from './pages/admin/RecommendationManagement';
import { ReviewsManagement } from './pages/admin/ReviewsManagement';
import { GalleryManagement } from './pages/admin/GalleryManagement';
import { NotificationManagement } from './pages/admin/NotificationManagement';
import { Reports } from './pages/admin/Reports';
import { NotFound } from './pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'catalog', Component: Catalog },
      { path: 'shop', Component: Catalog },
      { path: 'bouquet/:id', Component: BouquetDetail },
      { path: 'gallery', Component: Gallery },
      { path: 'cart', Component: Cart },
      { path: 'checkout', Component: Checkout },
      { path: 'order-confirmation/:orderId', Component: OrderConfirmation },
      { path: 'track', Component: OrderTracking },
      { path: 'order-history', Component: OrderHistory },
      { path: 'recommendations', Component: AIRecommendations },
      { path: 'favorites', Component: Favorites },
      { path: 'profile', Component: Profile },
      { path: '*', Component: NotFound },
    ],
  },
  { path: '/login', Component: Login },
  { path: '/register', Component: Register },
  { path: '/forgot-password', Component: ForgotPassword },
  {
    path: '/admin',
    Component: AdminLayout,
    children: [
      { index: true, Component: AdminDashboard },
      { path: 'products', Component: ProductManagement },
      { path: 'orders', Component: OrderManagement },
      { path: 'recommendations', Component: RecommendationManagement },
      { path: 'reviews', Component: ReviewsManagement },
      { path: 'gallery', Component: GalleryManagement },
      { path: 'notifications', Component: NotificationManagement },
      { path: 'reports', Component: Reports },
    ],
  },
]);

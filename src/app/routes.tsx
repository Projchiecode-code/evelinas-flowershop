import { createBrowserRouter } from 'react-router';
import { lazy } from 'react';
import { Layout } from './components/Layout';
import { AdminLayout } from './components/AdminLayout';

// Every page is code-split: the first paint downloads only the shell (header,
// contexts, cart) plus the current route's chunk, instead of one ~1.1 MB
// bundle that tripped Vite's 500 kB chunk warning on every build. Pages are
// named exports, so adapt each for React.lazy's default export; App.tsx wraps
// <RouterProvider> in <Suspense> to cover the chunk-load gap.
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Catalog = lazy(() => import('./pages/Catalog').then(m => ({ default: m.Catalog })));
const BouquetDetail = lazy(() => import('./pages/BouquetDetail').then(m => ({ default: m.BouquetDetail })));
const Gallery = lazy(() => import('./pages/Gallery').then(m => ({ default: m.Gallery })));
const Cart = lazy(() => import('./pages/Cart').then(m => ({ default: m.Cart })));
const Checkout = lazy(() => import('./pages/Checkout').then(m => ({ default: m.Checkout })));
const OrderConfirmation = lazy(() => import('./pages/OrderConfirmation').then(m => ({ default: m.OrderConfirmation })));
const OrderTracking = lazy(() => import('./pages/OrderTracking').then(m => ({ default: m.OrderTracking })));
const OrderHistory = lazy(() => import('./pages/OrderHistory').then(m => ({ default: m.OrderHistory })));
const AIRecommendations = lazy(() => import('./pages/AIRecommendations').then(m => ({ default: m.AIRecommendations })));
const Favorites = lazy(() => import('./pages/Favorites').then(m => ({ default: m.Favorites })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const ProductManagement = lazy(() => import('./pages/admin/ProductManagement').then(m => ({ default: m.ProductManagement })));
const OrderManagement = lazy(() => import('./pages/admin/OrderManagement').then(m => ({ default: m.OrderManagement })));
const RecommendationManagement = lazy(() => import('./pages/admin/RecommendationManagement').then(m => ({ default: m.RecommendationManagement })));
const ReviewsManagement = lazy(() => import('./pages/admin/ReviewsManagement').then(m => ({ default: m.ReviewsManagement })));
const GalleryManagement = lazy(() => import('./pages/admin/GalleryManagement').then(m => ({ default: m.GalleryManagement })));
const NotificationManagement = lazy(() => import('./pages/admin/NotificationManagement').then(m => ({ default: m.NotificationManagement })));
const Reports = lazy(() => import('./pages/admin/Reports').then(m => ({ default: m.Reports })));

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

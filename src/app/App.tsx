import { Suspense } from "react";
import { RouterProvider } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { CartProvider } from "./contexts/CartContext";
import { OrderProvider } from "./contexts/OrderContext";
import { AuthProvider } from "./contexts/AuthContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { ReviewsProvider } from "./contexts/ReviewsContext";
import { GalleryProvider } from "./contexts/GalleryContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { ProductsProvider } from "./contexts/ProductsContext";
import { router } from "./routes";

/** Shown while a lazily-loaded route chunk downloads (routes.tsx). */
function RouteFallback() {
  return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center">
      <div className="text-center text-gray-500">
        <span className="inline-block animate-spin text-3xl mb-3">🌸</span>
        <p>Loading…</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    /* MARKER-MAKE-KIT-INVOKED */
    <AuthProvider>
      <NotificationsProvider>
        <FavoritesProvider>
          <ReviewsProvider>
            <GalleryProvider>
              <CartProvider>
                <OrderProvider>
                  <ProductsProvider>
                    <Suspense fallback={<RouteFallback />}>
                      <RouterProvider router={router} />
                    </Suspense>
                    <Toaster position="top-right" richColors />
                  </ProductsProvider>
                </OrderProvider>
              </CartProvider>
            </GalleryProvider>
          </ReviewsProvider>
        </FavoritesProvider>
      </NotificationsProvider>
    </AuthProvider>
  );
}
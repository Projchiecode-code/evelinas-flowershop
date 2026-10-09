import { RouterProvider } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { CartProvider } from "./contexts/CartContext";
import { OrderProvider } from "./contexts/OrderContext";
import { AuthProvider } from "./contexts/AuthContext";
import { FavoritesProvider } from "./contexts/FavoritesContext";
import { ReviewsProvider } from "./contexts/ReviewsContext";
import { GalleryProvider } from "./contexts/GalleryContext";
import { NotificationsProvider } from "./contexts/NotificationsContext";
import { router } from "./routes";

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
                  <RouterProvider router={router} />
                  <Toaster position="top-right" richColors />
                </OrderProvider>
              </CartProvider>
            </GalleryProvider>
          </ReviewsProvider>
        </FavoritesProvider>
      </NotificationsProvider>
    </AuthProvider>
  );
}
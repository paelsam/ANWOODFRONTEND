import Catalog from "@/pages/Catalog";
import Login from "@/pages/Login";
import Admin from "@/pages/Admin";
import Cart from "@/pages/Cart";
import Quotation from "@/pages/Quotation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Notification from "@/components/layout/Notification";
import { AppContext } from "@/contexts/AppContext";
import { useNotification } from "@/hooks/useNotification";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useState } from "react";

export default function App() {
  const [page, setPage] = useState("catalog");
  const { notification, notify } = useNotification();
  const { user, authLoading, login, logout } = useAuth({ notify });
  const {
    cart,
    serverCart,
    addToCart,
    removeFromCart,
    updateCartQty,
    clearCart,
    refreshCart,
    getCartItemCount,
    getCartTotal,
  } = useCart({ user, notify });

  const ctx = {
    page,
    setPage,
    user,
    login,
    logout,
    notify,
    authLoading,
    cart,
    serverCart,
    addToCart,
    removeFromCart,
    updateCartQty,
    clearCart,
    refreshCart,
    getCartItemCount,
    getCartTotal,
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg text-text-muted font-display text-lg">
        Cargando ANGWOOD…
      </div>
    );
  }

  return (
    <AppContext.Provider value={ctx}>
      <div className="flex flex-col min-h-screen bg-bg">
        <Header />
        <Notification notification={notification} />
        <main className="flex-1 w-full">
          {page === "login" && <Login />}
          {page === "admin" && <Admin />}
          {page === "cart" && <Cart />}
          {page === "quotation" && <Quotation />}
          {page === "catalog" && (
            <Catalog />
          )}
        </main>
        <Footer />
      </div>
    </AppContext.Provider>
  );
}
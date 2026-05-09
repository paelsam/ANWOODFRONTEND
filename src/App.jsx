import Login from "@/pages/Login";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Notification from "@/components/layout/Notification";
import { AppContext } from "@/contexts/AppContext";
import { useNotification } from "@/hooks/useNotification";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

export default function App() {
  const [page, setPage] = useState("home");
  const { notification, notify } = useNotification();
  const { user, authLoading, login, logout } = useAuth({ notify });

  const ctx = { page, setPage, user, login, logout, notify, authLoading };

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
          {page === "home" && (
            <div className="p-10 text-center text-text-muted">
              Bienvenido a ANGWOOD
            </div>
          )}
        </main>
        <Footer />
      </div>
    </AppContext.Provider>
  );
}

import { LogIn, LogOut, User } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import logo from "@/assets/logo.png";

function NavButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={
        "inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition cursor-pointer " +
        (active
          ? "bg-primary/10 text-primary"
          : "text-text-muted hover:text-primary hover:bg-surface-2")
      }
    >
      {children}
    </button>
  );
}

export default function Header() {
  const { page, setPage, user, logout } = useApp();
  const displayName = user?.full_name || user?.username || "";

  return (
    <header className="sticky top-0 z-50 h-16 px-6 md:px-8 flex items-center justify-between bg-bg-soft/85 backdrop-blur border-b border-border">
      <button
        type="button"
        onClick={() => setPage("catalog")}
        className="flex items-center gap-3 cursor-pointer"
      >
        <img
          src={logo}
          alt="ANGWOOD"
          className="h-9 w-9 object-contain rounded-sm"
        />
        <div className="leading-none text-left">
          <div className="font-display font-black text-xl tracking-[3px] uppercase text-primary">
            ANGWOOD
          </div>
          <div className="text-[10px] tracking-[4px] uppercase text-text-subtle font-medium mt-0.5">
            Maderas Angulo
          </div>
        </div>
      </button>

      <div className="flex-1" aria-hidden />

      <div>
        {user ? (
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-surface-2 border border-border">
            <User size={14} className="text-primary" />
            <div className="leading-tight">
              <div className="text-[13px] font-semibold text-text">
                {displayName}
              </div>
              {user.username && user.full_name && (
                <div className="text-[10px] uppercase tracking-wide font-semibold text-accent">
                  {user.username}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={logout}
              className="ml-1 inline-flex items-center justify-center w-7 h-7 rounded-md border border-border text-text-subtle hover:border-danger hover:text-danger transition"
              aria-label="Cerrar sesión"
            >
              <LogOut size={12} />
            </button>
          </div>
        ) : (
          <NavButton active={page === "login"} onClick={() => setPage("login")}>
            <LogIn size={16} />
            <span>Iniciar sesión</span>
          </NavButton>
        )}
      </div>
    </header>
  );
}

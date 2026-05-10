import { useState } from "react";
import { Lock, User as UserIcon, Mail } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { authAPI } from "@/services/auth";
import { setStoredUser } from "@/utils/token";

export default function Login() {
  const { login, setPage, notify } = useApp();
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      setPage("home");
    } catch (err) {
      setError(err.message || "Credenciales incorrectas. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError("");
    if (!username || !email || !password) {
      setError("Completa usuario, correo y contraseña.");
      return;
    }
    setLoading(true);
    try {
      await authAPI.register({
        username,
        email,
        phone: phone || undefined,
        full_name: fullName || undefined,
        password,
      });
      setStoredUser({
        username,
        email,
        phone: fullName || undefined,
        full_name: fullName || undefined,
      });
      notify("¡Cuenta creada! Inicia sesión ahora.");
      setMode("login");
    } catch (err) {
      setError(err.message || "Error al registrarse.");
    } finally {
      setLoading(false);
    }
  };

  const handle = mode === "login" ? handleLogin : handleRegister;

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-12 bg-gradient-to-b from-bg-soft to-bg">
      <div className="w-full max-w-md bg-white border border-border rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="font-display font-black text-3xl tracking-[3px] uppercase text-primary">
            ANGWOOD
          </div>
          <p className="text-sm text-text-muted mt-2">
            {mode === "login"
              ? "Inicia sesión para acceder a todas las funcionalidades"
              : "Crea tu cuenta para continuar"}
          </p>
        </div>

        {error && <div className="form-error">{error}</div>}

        {mode === "register" && (
          <div className="form-group">
            <label className="form-label">Nombre completo (opcional)</label>
            <input
              className="form-input"
              type="text"
              placeholder="Tu nombre"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label inline-flex items-center gap-1.5">
            <UserIcon size={12} />
            Usuario
          </label>
          <input
            className="form-input"
            type="text"
            placeholder="nombre_usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handle()}
            autoComplete="username"
          />
        </div>

        {mode === "register" && (
          <div>
            <div className="form-group">
              <label className="form-label inline-flex items-center gap-1.5">
                <Mail size={12} />
                Correo electrónico
              </label>
              <input
                className="form-input"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label inline-flex items-center gap-1.5">
                <Mail size={12} />
                Phone
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="3152589872"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="phone"
              />
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label inline-flex items-center gap-1.5">
            <Lock size={12} />
            Contraseña
          </label>
          <input
            className="form-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handle()}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
          />
        </div>

        <button
          type="button"
          className="btn btn-primary w-full mt-2"
          onClick={handle}
          disabled={
            loading || !username || !password || (mode === "register" && !email)
          }
        >
          {loading
            ? mode === "login"
              ? "Iniciando sesión..."
              : "Registrando..."
            : mode === "login"
              ? "Iniciar sesión"
              : "Crear cuenta"}
        </button>

        <div className="text-center mt-5 text-sm text-text-muted">
          {mode === "login" ? (
            <>
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                className="text-primary font-semibold hover:underline cursor-pointer"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
              >
                Regístrate
              </button>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                className="text-primary font-semibold hover:underline cursor-pointer"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
              >
                Inicia sesión
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

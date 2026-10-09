import React, { useState } from 'react';
import { Mail, Lock, ShieldAlert } from 'lucide-react';
import Catalogo from './Catalogo';
import AdminDashboard from './AdminDashboard';
import ProveedorView from './ProveedorView';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    // <-- Control de Acceso Basado en Roles (Simulación OWASP)
    if (password === '123456') {
      setError(false);
      if (email === 'admin@sabores.cl') {
        setUserRole('admin');
      } else if (email === 'lavega@sabores.cl') {
        setUserRole('proveedor');
      } else if (email === 'trabajador@sabores.cl') { // El trabajador usa trabajador@sabores.cl
        setUserRole('trabajador');
      } else {
        setError(true); // Correo no existe
      }
    } else {
      setError(true); // Contraseña incorrecta
    }
  };

  // <-- Función para poder cerrar sesión desde cualquier pantalla
  const handleLogout = () => {
    setUserRole(null);
    setEmail('');
    setPassword('');
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

// Por si tengo que demostrar el acceso por google      
      if (user.email === 'ja.fernandezg21@gmail.com' || user.email === 'admin@sabores.cl') {
      setUserRole('admin');
    } else {
      setUserRole('trabajador');
    }
// Evaluamos el correo corporativo de Google para asignar su rol exacto
      if (user.email === 'admin@sabores.cl') {
        setUserRole('admin');
      } else if (user.email === 'lavega@sabores.cl') {
        setUserRole('proveedor');
      } else if (user.email === 'trabajador@sabores.cl') {
        setUserRole('trabajador');
      } else {
        // Si el correo no pertenece a los perfiles
        alert(`El correo ${user.email} no cuenta con permisos asignados en el sistema.`);
        setUserRole(null);
      }
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error.message);
      alert("No se pudo iniciar sesión con Google.");
    }
  };

  // <-- Si el usuario inició sesión correctamente, se muestra su respectiva pantalla
  if (userRole === 'admin') {
    return <AdminDashboard onLogout={handleLogout} />;
  }
  if (userRole === 'proveedor') {
    return <ProveedorView onLogout={handleLogout} />;
  }
  if (userRole === 'trabajador') {
    return <Catalogo onLogout={handleLogout} />;
  }

  // Si no ha iniciado sesión, se muestra el Login
  return (
    <div className="flex h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-100 p-10">
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-light tracking-widest text-slate-800 uppercase">
            Sabores
          </h1>
          <p className="text-slate-400 mt-3 text-xs uppercase tracking-widest font-bold">
            Portal Corporativo
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 text-red-600 p-4 rounded-lg border border-red-100">
            <ShieldAlert size={20} className="flex-shrink-0" strokeWidth={2.5} />
            <span className="text-sm font-light">
              Acceso denegado. Credenciales inválidas.
            </span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-500 mb-2">
              Correo Corporativo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" strokeWidth={3} />
              </div>
              <input
                type="email"
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all font-light text-slate-700"
                placeholder="trabajador@empresa.cl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-500 mb-2">
              Contraseña de acceso
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" strokeWidth={3} />
              </div>
              <input
                type="password"
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all font-light text-slate-700"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 pb-4">
            <div className="flex items-center">
              <input
                id="recordar"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500 cursor-pointer transition-all"
              />
              <label htmlFor="recordar" className="ml-2 block text-sm font-bold text-slate-500 cursor-pointer">
                Recordar sesión
              </label>
            </div>
            <a href="#" className="text-sm font-bold text-orange-500 hover:text-orange-600 transition-colors">
              ¿Problemas de acceso?
            </a>
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 text-white font-bold tracking-wider py-3 px-4 rounded-lg hover:bg-orange-600 transition-all shadow-sm"
          >
            Ingresar al Sistema
          </button>
        </form>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full mt-4 bg-white border border-slate-300 text-slate-700 py-3 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-3 cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Ingresar con Google
        </button>

        <div className="mt-10 pt-6 border-t border-slate-100">
          <p className="text-xs text-slate-400 text-center leading-relaxed font-light">
            <span className="font-bold">Uso exclusivo</span> corporativo. Sistema auditado bajo la <span className="font-bold text-slate-500">Ley 21.459</span> y estándar <span className="font-bold text-slate-500">ISO 27000</span>.
          </p>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100">
          <p className="text-xs text-slate-400 text-center leading-relaxed font-light">
            <span className="font-bold">Uso exclusivo</span> corporativo. Sistema auditado bajo la <span className="font-bold text-slate-500">Ley 21.459</span> y estándar <span className="font-bold text-slate-500">ISO 27000</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
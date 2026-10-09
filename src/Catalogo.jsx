import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, User, Home, Trash2, Clock, LogOut } from 'lucide-react';

// --- IMPORTACIONES CLOUD FIREBASE ---
import { db } from './firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';

export default function Catalogo({ onLogout }) {
  // --- ESTADOS GLOBALES ---
  const [vistaActual, setVistaActual] = useState('inicio'); 
  const [saldo, setSaldo] = useState(30000);
  const [carrito, setCarrito] = useState([]);
  const [historial, setHistorial] = useState([]);
  
  // --- ESTADOS DE BÚSQUEDA Y FILTROS ---
  const [busqueda, setBusqueda] = useState('');
  const [filtroActivo, setFiltroActivo] = useState(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  // --- EL ESTADO INICIA VACÍO: Los datos vienen de Firestore ---
  const [platosBase, setPlatosBase] = useState([]);

  // --- LECTURA EN TIEMPO REAL DESDE FIRESTORE ---
  useEffect(() => {
    // Escucha los cambios en la colección 'platos' de la base de datos
    const unsubscribe = onSnapshot(collection(db, 'platos'), (snapshot) => {
      const platosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPlatosBase(platosData);
    });

    // Limpia la conexión al salir
    return () => unsubscribe();
  }, []);

  // --- MAPA DE COLORES PARA LOS FILTROS ---
  const coloresFiltros = {
    'Vegano': { inactivo: 'bg-green-100 text-green-700 border-green-200', activo: 'bg-green-600 text-white border-green-600' },
    'Sin Gluten': { inactivo: 'bg-orange-100 text-orange-700 border-orange-200', activo: 'bg-orange-500 text-white border-orange-500' },
    'Proteico': { inactivo: 'bg-red-100 text-red-700 border-red-200', activo: 'bg-red-600 text-white border-red-600' },
    'Tradicional': { inactivo: 'bg-blue-100 text-blue-700 border-blue-200', activo: 'bg-blue-600 text-white border-blue-600' }
  };

  const etiquetas = ['Vegano', 'Sin Gluten', 'Proteico', 'Tradicional'];

  // --- LÓGICA DE FILTRADO ---
  const platosFiltrados = platosBase.filter(plato => {
    const nombreValido = plato.nombre ? plato.nombre.toLowerCase() : '';
    const proveedorValido = plato.proveedor ? plato.proveedor.toLowerCase() : '';
    
    const coincideBusqueda = nombreValido.includes(busqueda.toLowerCase()) || 
                             proveedorValido.includes(busqueda.toLowerCase());
                             
    const coincideFiltro = filtroActivo && plato.tags ? plato.tags.includes(filtroActivo) : true;
    
    return coincideBusqueda && coincideFiltro;
  });

  // --- FUNCIONES DEL CARRITO ---
  const agregarAlCarrito = (plato) => setCarrito([...carrito, plato]);
  
  const eliminarDelCarrito = (index) => {
    const nuevoCarrito = [...carrito];
    nuevoCarrito.splice(index, 1);
    setCarrito(nuevoCarrito);
  };

  const totalCarrito = carrito.reduce((total, plato) => total + Number(plato.precio), 0);

  // --- LÓGICA DE COMPRA (Descuenta el stock en la nube) ---
  const procesarCompra = async () => {
    if (saldo >= totalCarrito) {
      setSaldo(prev => prev - totalCarrito);
      
      const nuevaCompra = {
        id: `PED-${Math.floor(Math.random() * 10000)}`,
        fecha: new Date().toLocaleDateString(),
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        platos: carrito,
        total: totalCarrito
      };
      
      setHistorial([nuevaCompra, ...historial]);

      // Descontar el stock de cada plato comprado en Firebase
      for (const platoComprado of carrito) {
        const platoDb = platosBase.find(p => p.id === platoComprado.id);
        if (platoDb && platoDb.stock > 0) {
          const nuevoStock = platoDb.stock - 1;
          const nuevoEstado = nuevoStock === 0 ? 'Agotado' : nuevoStock <= 10 ? 'Crítico' : 'Óptimo';
          
          await updateDoc(doc(db, 'platos', platoDb.id), {
            stock: nuevoStock,
            estado: nuevoEstado
          });
        }
      }

      setCarrito([]);
      setMostrarConfirmacion(false);
      setVistaActual('perfil');
      alert('¡Compra realizada con éxito! Tu pedido está en preparación.');
    }
  };

  // COMPONENTES DE VISTA

  const renderVistaCatalogo = () => (
    <div className="animate-in fade-in duration-300 w-full">
      {/* BUSCADOR */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar platos o proveedores..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 shadow-sm bg-white outline-none focus:ring-2 focus:ring-orange-500 font-medium text-slate-700 text-base"
        />
      </div>

      {/* FILTROS RÁPIDOS */}
      <div className="flex gap-3 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {etiquetas.map(tag => {
          const colores = coloresFiltros[tag];
          const estaActivo = filtroActivo === tag;
          return (
            <button
              key={tag}
              onClick={() => setFiltroActivo(estaActivo ? null : tag)}
              className={`px-5 py-2.5 rounded-full whitespace-nowrap font-bold text-sm border shadow-sm transition-all ${
                estaActivo ? colores.activo : colores.inactivo
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* GRILLA DE PLATOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platosFiltrados.length === 0 ? (
          <p className="text-center text-slate-500 py-8 font-medium col-span-full">Cargando platos desde la nube o no se encontraron resultados.</p>
        ) : (
          platosFiltrados.map((plato) => (
            <div key={plato.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex gap-4 items-start mb-4">
                <div className="bg-slate-50 w-16 h-16 rounded-2xl flex justify-center items-center border border-slate-100 shadow-sm flex-shrink-0 overflow-hidden">
                  {plato.imagen ? (
                    <img src={plato.imagen} alt={plato.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">🍽️</span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight flex flex-col items-start gap-1">
                    {plato.nombre}
                    {plato.stock <= 10 && plato.stock > 0 && (
                      <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                        Últimos {plato.stock}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">{plato.proveedor || 'Proveedor'}</p>
                </div>
              </div>
              <div className="flex justify-between items-center mt-auto border-t border-slate-50 pt-4">
                <p className="text-slate-900 font-bold text-xl">${Number(plato.precio).toLocaleString('es-CL')}</p>
                
                <button 
                  onClick={() => agregarAlCarrito(plato)}
                  disabled={plato.stock === 0 || plato.estado === 'Agotado'}
                  className={`px-5 py-2.5 rounded-full font-bold transition-all shadow-sm text-sm flex items-center gap-1 ${
                    plato.stock === 0 || plato.estado === 'Agotado'
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      : 'bg-orange-500 text-white hover:bg-orange-600 active:scale-95'
                  }`}
                >
                  {plato.stock === 0 || plato.estado === 'Agotado' ? 'Agotado' : 'Agregar +'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderVistaCarrito = () => (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300">
      <h2 className="font-bold text-slate-800 text-xl mb-6 flex items-center gap-2">
        <ShoppingCart className="text-orange-500" /> Mi Pedido
      </h2>

      {carrito.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm flex-1 flex flex-col justify-center items-center">
          <ShoppingCart className="text-slate-300 mb-4" size={48} />
          <p className="text-slate-500 font-medium">Tu carrito está vacío</p>
          <button onClick={() => setVistaActual('inicio')} className="mt-4 text-orange-500 font-bold lg:hidden">
            Volver al catálogo
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col flex-1 overflow-hidden">
          <div className="p-4 space-y-2 overflow-y-auto max-h-[50vh] lg:max-h-[calc(100vh-350px)]">
            {carrito.map((plato, index) => (
              <div key={index} className="flex justify-between items-center border-b border-slate-50 pb-3 last:border-0 last:pb-0 pt-2">
                <div className="flex items-center gap-3">
                  {plato.imagen ? (
                    <img src={plato.imagen} alt={plato.nombre} className="w-10 h-10 rounded-xl object-cover border border-slate-100" />
                  ) : (
                    <span className="text-2xl bg-slate-50 p-2 rounded-xl">🍽️</span>
                  )}
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{plato.nombre}</p>
                    <p className="text-sm text-slate-500">${Number(plato.precio).toLocaleString('es-CL')}</p>
                  </div>
                </div>
                <button onClick={() => eliminarDelCarrito(index)} className="text-red-400 hover:text-red-600 p-2 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          
          <div className="bg-slate-50 p-5 border-t border-slate-100 mt-auto">
            <div className="flex justify-between items-center mb-5">
              <span className="font-bold text-slate-600">Total a pagar:</span>
              <span className="text-2xl font-bold text-slate-900">${totalCarrito.toLocaleString('es-CL')}</span>
            </div>
            
            {totalCarrito > saldo ? (
              <div className="bg-red-100 text-red-700 p-4 rounded-xl font-bold text-sm text-center">
                Fondos insuficientes.
              </div>
            ) : (
              <button 
                onClick={() => setMostrarConfirmacion(true)}
                className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold shadow-md hover:bg-orange-600 active:scale-[0.98] transition-all text-lg"
              >
                Aceptar Compra
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderVistaPerfil = () => (
    <div className="animate-in fade-in duration-300 w-full">
      <h2 className="font-bold text-slate-800 text-xl mb-6 flex items-center gap-2">
        <User className="text-blue-500" /> Perfil
      </h2>

      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-md mb-8">
        <p className="text-sm text-slate-400 mb-1">Nombre </p>
        <p className="text-xl font-bold mb-4">Marcela Vera</p>
        
        <p className="text-sm text-slate-400 mb-1">Empresa Asociada</p>
        <p className="text-lg font-bold mb-4">Grupo Falabella (Convenio Activo)</p>
        
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 mt-4 flex justify-between items-center">
          <span className="text-slate-300 font-medium">Saldo Disponible</span>
          <span className="text-2xl font-bold text-yellow-500">${saldo.toLocaleString('es-CL')}</span>
        </div>
      </div>

      <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
        <Clock className="text-slate-500" /> Historial de Consumo
      </h3>
      
      <div className="space-y-4">
        {historial.length === 0 ? (
          <p className="text-slate-500 bg-white p-8 rounded-3xl border border-slate-100 text-center font-medium shadow-sm">
            Aún no has realizado compras.
          </p>
        ) : (
          historial.map((compra) => (
            <div key={compra.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-3">
                <span className="font-bold text-slate-800">{compra.fecha} - {compra.hora}</span>
                <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">Procesado</span>
              </div>
              <div className="space-y-2 mb-4">
                {compra.platos.map((p, i) => (
                  <p key={i} className="text-sm text-slate-600 flex justify-between font-medium">
                    <span>1x {p.nombre}</span>
                    <span>${Number(p.precio).toLocaleString('es-CL')}</span>
                  </p>
                ))}
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <span className="font-bold text-slate-900 text-lg">Total: ${compra.total.toLocaleString('es-CL')}</span>
              </div>
            </div>
          ))
        )}
      </div>
      
      <button onClick={onLogout} className="lg:hidden w-full mt-8 bg-white border-2 border-red-100 text-red-500 py-4 rounded-xl font-bold hover:bg-red-50 transition-colors">
        Cerrar Sesión
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-light pb-24 lg:pb-0">
      
      {/* HEADER RESPONSIVO */}
      <header className="bg-slate-900 text-white p-4 lg:px-8 lg:py-4 shadow-md sticky top-0 z-40 rounded-b-3xl lg:rounded-none">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          {/* Bienvenida */}
          <div>
            <p className="text-[10px] lg:text-xs text-slate-400 font-bold tracking-widest uppercase">Sabores</p>
            <h1 className="text-lg lg:text-xl font-bold flex items-center gap-2 mt-1">
              <User size={20}/> Hola, Marcela
            </h1>
          </div>

          {/* Navegación para Computador (Oculto en Móvil) */}
          <div className="hidden lg:flex items-center gap-8">
            <button onClick={() => setVistaActual('inicio')} className={`font-bold transition-all text-sm uppercase tracking-wide hover:text-orange-400 ${vistaActual === 'inicio' ? 'text-orange-500' : 'text-slate-300'}`}>
              Catálogo
            </button>
            <button onClick={() => setVistaActual('perfil')} className={`font-bold transition-all text-sm uppercase tracking-wide hover:text-orange-400 ${vistaActual === 'perfil' ? 'text-orange-500' : 'text-slate-300'}`}>
              Mi Perfil
            </button>
            
            <div className="bg-slate-800 border border-slate-700 px-5 py-2 rounded-2xl text-right shadow-inner ml-4">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Saldo</p>
              <p className="text-lg font-bold text-yellow-500">${saldo.toLocaleString('es-CL')}</p>
            </div>
            
            <button onClick={onLogout} className="text-red-400 hover:text-red-300 font-bold flex items-center gap-2 ml-2">
              <LogOut size={20}/> Salir
            </button>
          </div>

          {/* Saldo en Móvil (Oculto en PC) */}
          <div className="lg:hidden bg-slate-800 border border-slate-700 px-4 py-2 rounded-2xl text-right shadow-inner">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Saldo</p>
            <p className="text-lg font-bold text-yellow-500">${saldo.toLocaleString('es-CL')}</p>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      
      {/* LAYOUT MÓVIL Y TABLET (Una sola columna) */}
      <main className="max-w-4xl mx-auto w-full p-4 mt-2 lg:hidden">
        {vistaActual === 'inicio' && renderVistaCatalogo()}
        {vistaActual === 'carrito' && renderVistaCarrito()}
        {vistaActual === 'perfil' && renderVistaPerfil()}
      </main>

      {/* LAYOUT COMPUTADOR (Dos columnas simultáneas) */}
      <main className="hidden lg:flex max-w-7xl mx-auto w-full p-8 gap-10 mt-4 items-start relative">
        
        {/* Columna Izquierda: Muestra Catálogo o Perfil */}
        <div className="flex-[2] min-w-0">
          {vistaActual === 'perfil' ? renderVistaPerfil() : renderVistaCatalogo()}
        </div>

        {/* Columna Derecha: Carrito Fijo estilo App de Delivery */}
        <div className="flex-1 w-full min-w-[350px] sticky top-[100px] bg-white rounded-[2rem] p-6 shadow-lg border border-slate-100 h-[calc(100vh-140px)]">
          {renderVistaCarrito()}
        </div>
      </main>

      {/* CONFIRMACIÓN DE COMPRA */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-orange-500 p-8 text-center">
              <ShoppingCart className="text-white mx-auto mb-3" size={48} />
              <h3 className="text-2xl font-bold text-white">Confirmar Pedido</h3>
            </div>
            <div className="p-8">
              <p className="text-slate-600 text-center mb-8 text-lg leading-relaxed">
                Estás a punto de descontar <strong className="text-slate-900">${totalCarrito.toLocaleString('es-CL')}</strong> de tu saldo.<br/>¿Estás seguro de realizar esta compra?
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setMostrarConfirmacion(false)}
                  className="flex-1 py-4 font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={procesarCompra}
                  className="flex-1 py-4 font-bold text-white bg-green-500 rounded-xl hover:bg-green-600 active:scale-[0.98] transition-all"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NAVEGACIÓN INFERIOR (Solo en Móvil/Tablet) */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 flex justify-around py-3 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-40 pb-safe">
        <button 
          onClick={() => setVistaActual('inicio')}
          className={`flex flex-col items-center w-20 transition-colors ${vistaActual === 'inicio' ? 'text-orange-500' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Home size={24} className={vistaActual === 'inicio' ? 'fill-orange-100' : ''} />
          <span className="text-[10px] font-bold mt-1">Inicio</span>
        </button>
        
        <button 
          onClick={() => setVistaActual('carrito')}
          className={`flex flex-col items-center w-20 transition-colors relative ${vistaActual === 'carrito' ? 'text-orange-500' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className="relative">
            <ShoppingCart size={24} className={vistaActual === 'carrito' ? 'fill-orange-100' : ''} />
            {carrito.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex justify-center items-center border-2 border-white shadow-sm">
                {carrito.length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold mt-1">Carrito</span>
        </button>
        
        <button 
          onClick={() => setVistaActual('perfil')}
          className={`flex flex-col items-center w-20 transition-colors ${vistaActual === 'perfil' ? 'text-orange-500' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <User size={24} className={vistaActual === 'perfil' ? 'fill-orange-100' : ''} />
          <span className="text-[10px] font-bold mt-1">Perfil</span>
        </button>
      </div>

    </div>
  );
}
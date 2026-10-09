import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Package, BarChart2, User, MinusCircle, Plus, Minus, TrendingUp, DollarSign, AlertCircle, CheckCircle2, Wallet, FileText, Building, Trash2, X, Edit2, Image as ImageIcon, Database } from 'lucide-react';

// --- IMPORTACIONES CLOUD FIREBASE ---
import { db } from './firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';

export default function ProveedorView({ onLogout }) {
  const [vistaActual, setVistaActual] = useState('inventario');
  const [mostrarDetallePorciones, setMostrarDetallePorciones] = useState(false);
  const [mostrarDetalleIngresos, setMostrarDetalleIngresos] = useState(false);

  const fileInputRef = useRef(null);
  const [platoActualImagen, setPlatoActualImagen] = useState(null);

  // --- EL ESTADO INICIA VACÍO: Los datos vienen de Firestore ---
  const [platos, setPlatos] = useState([]);

  // --- LECTURA EN TIEMPO REAL DESDE FIRESTORE ---
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'platos'), (snapshot) => {
      const platosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // La Vega Central solo ve sus propios platos
      const misPlatos = platosData.filter(plato => plato.proveedor === 'La Vega Central');
      
      // Ordenamos para que no salten de posición
      misPlatos.sort((a, b) => a.nombre.localeCompare(b.nombre));
      
      setPlatos(misPlatos);
    });
    return () => unsubscribe();
  }, []);

  // --- FUNCIONES QUE ESCRIBEN EN LA NUBE ---
  
  const actualizarStock = async (id, cantidad, stockActual) => {
    const nuevoStock = Math.max(0, stockActual + cantidad);
    const estado = nuevoStock === 0 ? 'Agotado' : nuevoStock <= 10 ? 'Crítico' : 'Óptimo';
    await updateDoc(doc(db, 'platos', id), { stock: nuevoStock, estado: estado });
  };

  const agotarStock = async (id) => {
    await updateDoc(doc(db, 'platos', id), { stock: 0, estado: 'Agotado' });
  };

  const cambiarPrecio = async (id, nuevoPrecio) => {
    await updateDoc(doc(db, 'platos', id), { precio: Number(nuevoPrecio) });
  };

  const cambiarNombre = async (id, nuevoNombre) => {
    await updateDoc(doc(db, 'platos', id), { nombre: nuevoNombre });
  };

  const agregarPlato = async () => {
    await addDoc(collection(db, 'platos'), {
      nombre: 'Nuevo Plato',
      stock: 40,
      precio: 5000,
      estado: 'Óptimo',
      imagen: '',
      proveedor: 'La Vega Central', // Al agregar, se asigna automáticamente a este proveedor
      tags: ['Tradicional'] 
    });
  };

  const borrarPlato = async (id) => {
    const confirmar = window.confirm("¿Estás seguro de que deseas eliminar este plato de tu inventario en la nube?");
    if (confirmar) {
      await deleteDoc(doc(db, 'platos', id));
    }
  };

  const abrirSelectorImagen = (id) => {
    setPlatoActualImagen(id);
    fileInputRef.current.click();
  };

  const manejarCargaImagen = async (event) => {
    const file = event.target.files[0];
    if (file && platoActualImagen) {
      const imageUrl = URL.createObjectURL(file); 
      await updateDoc(doc(db, 'platos', platoActualImagen), { imagen: imageUrl });
    }
    event.target.value = null; 
  };


  // VISTA INVENTARIO
  const renderVistaInventario = () => (
    <div className="animate-in fade-in duration-300 w-full">
      <div className="md:hidden mb-6 text-center border-b border-slate-200 pb-4">
         <h2 className="text-xl font-bold text-slate-800">La Vega Central</h2>
         <p className="text-sm text-slate-500">Gestión de Inventario Cloud</p>
      </div>

      {/* SECCIÓN DE MÉTRICAS OPERATIVAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div 
          onClick={() => setMostrarDetallePorciones(true)}
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold">Porciones Vendidas Hoy</p>
            <p className="text-2xl font-bold text-slate-800">94</p>
          </div>
        </div>

        <div 
          onClick={() => setMostrarDetalleIngresos(true)}
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="bg-green-100 p-3 rounded-full text-green-600">
            <DollarSign size={24} />
          </div>
         <div>
            <p className="text-sm text-slate-500 font-bold">Ingresos Proyectados</p>
            <p className="text-2xl font-bold text-blue-900">$511.000</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-full text-orange-600">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold">Platos en Catálogo</p>
            <p className="text-2xl font-bold text-slate-800">{platos.length} activos</p>
          </div>
        </div>
      </div>

      <div className="bg-[#fef3c7] border border-[#fde68a] p-4 rounded-xl shadow-sm flex items-start sm:items-center gap-3 mb-8">
        <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5 sm:mt-0" size={20} />
        <p className="text-sm text-yellow-800 font-bold">
          Gestiona tu menú en vivo para que las empresas puedan ver la disponibilidad al instante.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <h3 className="text-lg md:text-xl font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
          <Package className="text-orange-500" size={24} /> 
          Control de Stock en Vivo
        </h3>
        
        {/* BOTÓN DE AGREGAR */}
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={agregarPlato}
            className="flex-1 sm:flex-none bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={18} /> Nuevo
          </button>
        </div>
      </div>

      {/* GRILLA MULTI-PLATO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8">
        {platos.map((plato) => (
          <div key={plato.id} className="bg-white border border-slate-200 p-5 md:p-6 rounded-2xl shadow-sm flex flex-col justify-between relative group">
            
            <div className="absolute top-4 right-4 flex gap-2">
              <button 
                onClick={() => abrirSelectorImagen(plato.id)}
                className="text-slate-400 hover:text-blue-500 bg-white rounded-full p-2 hover:bg-blue-50 transition-colors border border-slate-100 shadow-sm"
                title="Cargar Imagen Local"
              >
                <ImageIcon size={18} />
              </button>
              <button 
                onClick={() => borrarPlato(plato.id)}
                className="text-slate-400 hover:text-red-500 bg-white rounded-full p-2 hover:bg-red-50 transition-colors border border-slate-100 shadow-sm"
                title="Borrar Plato"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4 pr-20">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200 flex justify-center items-center">
                {plato.imagen ? (
                  <img src={plato.imagen} alt={plato.nombre} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">🍽️</span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 group/edit">
                  <input 
                    type="text" 
                    value={plato.nombre}
                    onChange={(e) => cambiarNombre(plato.id, e.target.value)}
                    className="font-bold text-slate-800 text-lg md:text-xl bg-transparent border-b-2 border-transparent hover:border-slate-300 focus:border-orange-500 focus:outline-none w-full transition-colors"
                  />
                  <Edit2 size={14} className="text-slate-300 group-hover/edit:text-slate-500 flex-shrink-0" />
                </div>
                <div className="mt-2 flex flex-col items-start gap-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1 ${
                    plato.estado === 'Óptimo' ? 'bg-green-50 text-green-700 border-green-200' : 
                    plato.estado === 'Crítico' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                    'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {plato.estado === 'Óptimo' && <CheckCircle2 size={12} />}
                    {plato.estado === 'Crítico' && <AlertCircle size={12} />}
                    {plato.estado === 'Agotado' && <MinusCircle size={12} />}
                    {plato.estado}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Restaurante: {plato.proveedor}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
              <div className="flex-1 w-full bg-slate-50 rounded-xl p-4 border border-slate-100 flex justify-between items-center">
                <button 
                  onClick={() => actualizarStock(plato.id, -1, plato.stock)}
                  disabled={plato.stock === 0}
                  className="w-12 h-12 bg-white text-red-500 rounded-full font-bold shadow-sm flex justify-center items-center border border-red-100 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus size={20} />
                </button>
                
                <div className="text-center">
                  <span className="block text-3xl font-bold text-slate-800">{plato.stock}</span>
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Unidades</span>
                </div>

                <button 
                  onClick={() => actualizarStock(plato.id, 1, plato.stock)}
                  className="w-12 h-12 bg-white text-green-500 rounded-full font-bold shadow-sm flex justify-center items-center border border-green-100 hover:bg-green-50 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-auto">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                </div>
                <input 
                  type="number" 
                  value={plato.precio}
                  onChange={(e) => cambiarPrecio(plato.id, e.target.value)}
                  className="w-full pl-9 pr-3 py-3 rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-700 text-sm shadow-sm"
                  title="Ajustar precio"
                />
              </div>
              
              <button 
                onClick={() => agotarStock(plato.id)}
                disabled={plato.stock === 0}
                className="sm:w-1/2 bg-slate-900 text-white py-3 px-4 rounded-xl font-bold text-sm flex justify-center items-center gap-2 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <MinusCircle size={16} className={plato.stock === 0 ? "text-slate-500" : "text-red-500"} /> 
                Agotar
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );

  // VISTA FINANZAS
  const renderVistaFinanzas = () => (
    <div className="animate-in fade-in duration-300 w-full max-w-4xl mx-auto">
      <div className="md:hidden mb-6 text-center border-b border-slate-200 pb-4">
         <h2 className="text-xl font-bold text-slate-800">Finanzas</h2>
         <p className="text-sm text-slate-500">Resumen y Liquidaciones</p>
      </div>

      <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-lg mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-2">Saldo pendiente a transferir</p>
          <p className="text-5xl font-bold text-green-400 mb-2">$1.845.000</p>
          <p className="text-sm text-slate-300 flex items-center gap-2 mt-4">
            <CheckCircle2 size={16} className="text-green-500"/> Próximo corte de liquidación: Viernes 16
          </p>
        </div>
        <div className="absolute right-[-20px] bottom-[-40px] opacity-10">
          <DollarSign size={200} />
        </div>
      </div>

      <h3 className="font-bold text-slate-800 text-lg md:text-xl mb-4 flex items-center gap-2 uppercase tracking-wide">
        <FileText className="text-slate-500" size={24} /> Últimas Liquidaciones Pagadas
      </h3>
      
      <div className="space-y-4">
        {[
          { id: 'LIQ-094', fecha: 'Viernes 09 (Mes actual)', monto: 1650000 },
          { id: 'LIQ-093', fecha: 'Viernes 02 (Mes actual)', monto: 1720000 },
          { id: 'LIQ-092', fecha: 'Viernes 25 (Mes anterior)', monto: 1580000 },
        ].map((liq) => (
          <div key={liq.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="bg-green-50 p-3 rounded-full text-green-600 hidden sm:block">
                <Wallet size={24} />
              </div>
              <div>
                <p className="font-bold text-slate-800 md:text-lg">{liq.fecha}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-900 text-lg md:text-xl">${liq.monto.toLocaleString('es-CL')}</p>
              <p className="text-xs font-bold text-green-600">Transferido exitosamente</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // VISTA PERFIL
  const renderVistaPerfil = () => (
    <div className="animate-in fade-in duration-300 w-full max-w-3xl mx-auto">
      <div className="md:hidden mb-6 text-center border-b border-slate-200 pb-4">
         <h2 className="text-xl font-bold text-slate-800">Mi Perfil</h2>
         <p className="text-sm text-slate-500">Datos Comerciales</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="bg-slate-50 p-6 border-b border-slate-200 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-4xl font-bold shadow-sm">
            LV
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800">La Vega Central</h3>
            <p className="text-slate-500 font-medium">Restaurante/Proveedor Oficial "Sabores"</p>
          </div>
        </div>
        
        <div className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Razón Social</p>
              <p className="font-bold text-slate-800 text-lg">Comercial La Vega SpA</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">RUT Empresa</p>
              <p className="font-bold text-slate-800 text-lg">76.543.210-K</p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cuenta Bancaria para Depósitos</p>
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <Building className="text-slate-400 hidden sm:block" size={32} />
              <div>
                <p className="font-bold text-slate-800 md:text-lg">Banco de Chile - Cuenta Corriente</p>
                <p className="text-sm text-slate-500 font-bold">N° 9988776655</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-light pb-20 md:pb-0 relative">
      
      {/* INPUT OCULTO PARA CARGAR IMÁGENES LOCALES */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={manejarCargaImagen} 
        className="hidden" 
      />

      <header className="bg-slate-900 text-white p-4 md:p-6 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Portal Proveedores</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold hidden md:block">Gestión SaaS - La Vega Central</p>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => setVistaActual('inventario')} 
              className={`flex items-center gap-2 font-bold transition-colors ${vistaActual === 'inventario' ? 'text-orange-500' : 'text-slate-300 hover:text-white'}`}
            >
              <Package size={20} /> Inventario
            </button>
            <button 
              onClick={() => setVistaActual('finanzas')} 
              className={`flex items-center gap-2 font-bold transition-colors ${vistaActual === 'finanzas' ? 'text-orange-500' : 'text-slate-300 hover:text-white'}`}
            >
              <BarChart2 size={20} /> Finanzas
            </button>
            <button 
              onClick={() => setVistaActual('perfil')} 
              className={`flex items-center gap-2 font-bold transition-colors ${vistaActual === 'perfil' ? 'text-orange-500' : 'text-slate-300 hover:text-white'}`}
            >
              <User size={20} /> Mi Perfil
            </button>
            <div className="h-6 w-px bg-slate-700 mx-2"></div>
            <button onClick={onLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 font-bold">
              <LogOut size={20} /> Salir
            </button>
          </div>

          <button onClick={onLogout} className="md:hidden text-slate-400 hover:text-white">
            <LogOut size={24} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full p-4 md:p-8 mt-2">
        {vistaActual === 'inventario' && renderVistaInventario()}
        {vistaActual === 'finanzas' && renderVistaFinanzas()}
        {vistaActual === 'perfil' && renderVistaPerfil()}
      </main>

      {/* DETALLE DE PORCIONES VENDIDAS */}
      {mostrarDetallePorciones && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center bg-slate-50 p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <TrendingUp className="text-blue-500" /> Desglose de Porciones
              </h3>
              <button onClick={() => setMostrarDetallePorciones(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-medium">Pastel de Choclo</span>
                  <span className="font-bold text-slate-800">30 unid.</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-4">
                  <span className="text-slate-600 font-medium">Humitas</span>
                  <span className="font-bold text-slate-800">40 unid.</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-4">
                  <span className="text-slate-600 font-medium">Ensalada César</span>
                  <span className="font-bold text-slate-800">24 unid.</span>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Total Entregado</span>
                <span className="font-bold text-blue-700 text-xl">94</span>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => setMostrarDetallePorciones(false)}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETALLE DE INGRESOS PROYECTADOS */}
      {mostrarDetalleIngresos && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center bg-slate-50 p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <DollarSign className="text-green-500" /> Detalle de Recaudación
              </h3>
              <button onClick={() => setMostrarDetalleIngresos(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <div>
                    <span className="text-slate-800 font-bold block">Pastel de Choclo</span>
                    <span className="text-slate-400 text-xs">30 x $6.500</span>
                  </div>
                  <span className="font-bold text-slate-600">$195.000</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-4">
                  <div>
                    <span className="text-slate-800 font-bold block">Humitas</span>
                    <span className="text-slate-400 text-xs">40 x $5.500</span>
                  </div>
                  <span className="font-bold text-slate-600">$220.000</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-4">
                  <div>
                    <span className="text-slate-800 font-bold block">Ensalada César</span>
                    <span className="text-slate-400 text-xs">24 x $4.000</span>
                  </div>
                  <span className="font-bold text-slate-600">$96.000</span>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex justify-between items-center">
                <span className="text-xs font-bold text-green-800 uppercase tracking-wider">Total a Recibir</span>
                <span className="font-bold text-green-700 text-xl">$511.000</span>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => setMostrarDetalleIngresos(false)}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NAVEGACIÓN INFERIOR PARA MÓVIL */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900 text-slate-400 flex justify-around py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 pb-safe">
        <button 
          onClick={() => setVistaActual('inventario')} 
          className={`flex flex-col items-center transition-colors ${vistaActual === 'inventario' ? 'text-orange-500' : 'hover:text-white'}`}
        >
          <Package size={24} />
          <span className="text-[10px] font-bold mt-1">Inventario</span>
        </button>
        <button 
          onClick={() => setVistaActual('finanzas')} 
          className={`flex flex-col items-center transition-colors ${vistaActual === 'finanzas' ? 'text-orange-500' : 'hover:text-white'}`}
        >
          <BarChart2 size={24} />
          <span className="text-[10px] font-bold mt-1">Finanzas</span>
        </button>
        <button 
          onClick={() => setVistaActual('perfil')} 
          className={`flex flex-col items-center transition-colors ${vistaActual === 'perfil' ? 'text-orange-500' : 'hover:text-white'}`}
        >
          <User size={24} />
          <span className="text-[10px] font-bold mt-1">Perfil</span>
        </button>
      </div>

    </div>
  );
}
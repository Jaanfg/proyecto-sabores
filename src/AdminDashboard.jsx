import React, { useState, useEffect } from 'react';
import { LogOut, DollarSign, Package, Truck, AlertTriangle, BarChart2, Home, Users, Settings, ShieldCheck, Activity, Server, Database, Clock, Building, Briefcase, Lock, X, CheckCircle2, XCircle } from 'lucide-react';

// --- IMPORTACIONES CLOUD FIREBASE ---
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function AdminDashboard({ onLogout }) {
  // --- Estado para manejar la navegación ---
  const [vistaActual, setVistaActual] = useState('resumen');
  
  // --- Estado para el historial de transacciones ---
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  // --- Estado para las opciones de reporte ---
  const [mostrarOpcionesReporte, setMostrarOpcionesReporte] = useState(false);

  // --- ESTADO PARA FIREBASE (Métricas Reales) ---
  const [platos, setPlatos] = useState([]);
  const [alertasStock, setAlertasStock] = useState([]);

  // --- LECTURA EN TIEMPO REAL DESDE FIRESTORE ---
  useEffect(() => {
    // Escucha todos los platos de todos los proveedores
    const unsubscribe = onSnapshot(collection(db, 'platos'), (snapshot) => {
      const platosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPlatos(platosData);

      // Generar alertas automáticas si el stock es 2 o menor (o está agotado)
      const alertasNuevas = platosData
        .filter(p => p.stock <= 2)
        .map(p => `El plato "${p.nombre}" de ${p.proveedor || 'La Vega Central'} ${p.stock === 0 ? 'está agotado' : `está a ${p.stock} unidades de agotarse`}.`);
      
      setAlertasStock(alertasNuevas);
    });

    return () => unsubscribe();
  }, []);

  // --- CÁLCULO DE MÉTRICAS (Basado en la cantidad real de platos y simulando ventas) ---
  const montoPromedio = platos.length > 0 
    ? Math.round(platos.reduce((acc, curr) => acc + Number(curr.precio), 0) / platos.length) 
    : 8000;
  
  // Simulo que hoy se han vendido el 70% de la capacidad de stock registrada + una base
  const ventasTotalesHoy = platos.length > 0 
    ? 120 + platos.filter(p => p.estado === 'Agotado' || p.estado === 'Crítico').length * 15
    : 142;

  const transacciones = [
    { id: 'TX-9921', hora: '14:45', usuario: 'trabajador@sabores.cl', monto: montoPromedio, estado: 'Aprobado' },
    { id: 'TX-9920', hora: '14:42', usuario: 'trabajador@falabella.cl', monto: montoPromedio + 2500, estado: 'Aprobado' },
    { id: 'TX-9919', hora: '14:38', usuario: 'trabajador@sabores.cl', monto: 35000, estado: 'Rechazado (Saldo)' },
    { id: 'TX-9918', hora: '14:30', usuario: 'trabajador@constructora.cl', monto: 5500, estado: 'Aprobado' },
  ];

  // --- Datos para el modal de historial ---
  const historialCompleto = [
    ...transacciones,
    { id: 'TX-9917', hora: '14:15', usuario: 'gerente@bancoestado.cl', monto: 8500, estado: 'Aprobado' },
    { id: 'TX-9916', hora: '14:05', usuario: 'soporte@sabores.cl', monto: 4000, estado: 'Aprobado' },
    { id: 'TX-9915', hora: '13:50', usuario: 'trabajador@falabella.cl', monto: 12000, estado: 'Aprobado' },
    { id: 'TX-9914', hora: '13:30', usuario: 'operario@constructora.cl', monto: 6500, estado: 'Rechazado (Sistema)' },
    { id: 'TX-9913', hora: '13:10', usuario: 'trabajador@sabores.cl', monto: 5500, estado: 'Aprobado' },
  ];

  // VISTA RESUMEN
  const renderVistaResumen = () => (
    <div className="animate-in fade-in duration-300 w-full">
      <div className="md:hidden mb-6 text-center">
         <h2 className="text-xl font-bold text-slate-800">Panel de Gestión</h2>
      </div>

      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-2">
        <Activity className="text-slate-600" size={24} />
        <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Métricas en Tiempo Real</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-orange-100 p-3 rounded-full text-orange-600">
            <DollarSign size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold">Monto Promedio</p>
            <p className="text-2xl font-bold text-blue-900">${montoPromedio.toLocaleString('es-CL')}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-slate-100 p-3 rounded-full text-slate-600">
            <Package size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold">Ventas Totales (Proyectado)</p>
            <p className="text-2xl font-bold text-slate-800">{ventasTotalesHoy} pedidos</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="bg-green-100 p-3 rounded-full text-green-600">
            <Truck size={28} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-bold">En Reparto Actual</p>
            <p className="text-2xl font-bold text-slate-800">45 pedidos</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-8">
        
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-slate-500" size={20} />
              <h3 className="font-bold text-slate-800">Trazabilidad de Saldos</h3>
            </div>
            <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">En Vivo</span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="p-4 font-bold">ID Transacción</th>
                  <th className="p-4 font-bold">Hora</th>
                  <th className="p-4 font-bold">Cuenta Corporativa</th>
                  <th className="p-4 font-bold">Monto</th>
                  <th className="p-4 font-bold">Estado</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-100">
                {transacciones.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-700">{tx.id}</td>
                    <td className="p-4 flex items-center gap-1 text-slate-500"><Clock size={14}/> {tx.hora}</td>
                    <td className="p-4 font-medium text-slate-600">{tx.usuario}</td>
                    <td className="p-4 font-bold text-blue-900">-${tx.monto.toLocaleString('es-CL')}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                        tx.estado === 'Aprobado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {tx.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <button 
            onClick={() => setMostrarHistorial(true)}
            className="w-full py-4 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors border-t border-slate-100 flex justify-center items-center gap-2"
          >
            <Clock size={16} /> Ver historial completo de transacciones
          </button>
        </div>

        <div className="flex flex-col gap-6">
          
          <div className="bg-[#fef3c7] border border-[#fde68a] p-5 rounded-2xl shadow-sm flex-1">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="text-yellow-600" size={24} />
              <h3 className="text-lg font-bold text-yellow-800">Alertas Críticas</h3>
            </div>
            <ul className="space-y-3 text-yellow-800 font-bold text-sm">
              {/* Alertas leídas directo desde Firebase */}
              {alertasStock.length > 0 ? (
                alertasStock.map((alerta, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-0.5">•</span> 
                    <span>{alerta}</span>
                  </li>
                ))
              ) : (
                <li className="flex items-start gap-2">
                  <span className="mt-0.5"><CheckCircle2 size={16}/></span> 
                  <span>Todos los proveedores tienen niveles de stock óptimos en la nube.</span>
                </li>
              )}
              {/* Alerta de ISO para mantener tu demo de negocio */}
              <li className="flex items-start gap-2 border-t border-[#fde68a] pt-3 mt-3">
                <span className="mt-0.5">•</span> 
                <span>Hay 2 nuevos proveedores pendientes de validación ISO 9001.</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-900 rounded-2xl shadow-sm p-5 text-slate-300">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Server size={18} /> Monitor Cloud SaaS
            </h3>
            <div className="space-y-3 text-sm font-medium">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2"><Database size={16} className="text-blue-400"/> Firebase Firestore</span>
                <span className="text-green-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Estable</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2"><Activity size={16} className="text-orange-400"/> Latencia de Red</span>
                <span className="text-white">12 ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2"><Package size={16} className="text-yellow-400"/> Catálogo Activo</span>
                <span className="text-white">{platos.length} platos</span>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-xs text-slate-400">Infraestructura escalando dinámicamente según tráfico (PaaS).</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      <button 
        onClick={() => setMostrarOpcionesReporte(true)}
        className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold shadow-sm hover:bg-orange-600 active:bg-orange-700 active:scale-[0.98] flex justify-center items-center gap-2 transition-all text-lg cursor-pointer"
      >
        Generar Reporte Financiero Completo <BarChart2 size={20} className="text-white" />
      </button>
    </div>
  );

  // VISTA CONVENIOS B2B
  const renderVistaConvenios = () => (
    <div className="animate-in fade-in duration-300 w-full">
      <div className="md:hidden mb-6 text-center">
         <h2 className="text-xl font-bold text-slate-800">Convenios B2B</h2>
      </div>

      <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <Briefcase className="text-slate-600" size={24} />
          <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Empresas Asociadas</h3>
        </div>
        <button className="bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-orange-600 transition-colors">
          + Nuevo Convenio
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Falabella */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-xl">F</div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Grupo Falabella</h3>
              <p className="text-xs text-slate-500 font-bold uppercase">Convenio Activo</p>
            </div>
            <div className="ml-auto">
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> Al día
              </span>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500 font-medium">Trabajadores Activos</span>
              <span className="font-bold text-slate-800">450</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500 font-medium">Saldo Asignado (Mensual)</span>
              <span className="font-bold text-slate-800">$13.500.000</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-slate-500 font-medium">Consumo Actual</span>
              <span className="font-bold text-blue-600">82%</span>
            </div>
          </div>
        </div>

        {/* BancoEstado */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xl">BE</div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">BancoEstado</h3>
              <p className="text-xs text-slate-500 font-bold uppercase">Convenio Activo</p>
            </div>
            <div className="ml-auto">
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> Al día
              </span>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500 font-medium">Trabajadores Activos</span>
              <span className="font-bold text-slate-800">120</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500 font-medium">Saldo Asignado (Mensual)</span>
              <span className="font-bold text-slate-800">$3.600.000</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-slate-500 font-medium">Consumo Actual</span>
              <span className="font-bold text-blue-600">45%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // VISTA AJUSTES DE PLATAFORMA
  const renderVistaAjustes = () => (
    <div className="animate-in fade-in duration-300 w-full max-w-4xl mx-auto">
      <div className="md:hidden mb-6 text-center border-b border-slate-200 pb-4">
         <h2 className="text-xl font-bold text-slate-800">Ajustes Generales</h2>
      </div>

      <div className="space-y-6">
        
        {/* Seguridad y Cumplimiento */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <ShieldCheck className="text-slate-600" size={20} />
            <h3 className="font-bold text-slate-800 uppercase tracking-wide text-sm">Seguridad y Cumplimiento</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Certificación ISO 27001</p>
                <p className="text-sm text-slate-500">Auditoría de manejo de saldos y datos corporativos.</p>
              </div>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Vigente 2026</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                <p className="font-bold text-slate-800">Autenticación de Dos Factores</p>
                <p className="text-sm text-slate-500">Requerido para gerencia y proveedores.</p>
              </div>
              <div className="w-12 h-6 bg-green-500 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Modelo de Negocio */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <DollarSign className="text-slate-600" size={20} />
            <h3 className="font-bold text-slate-800 uppercase tracking-wide text-sm">Parámetros de Negocio</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">Comisión por Venta (Proveedores)</p>
                <p className="text-sm text-slate-500">Porcentaje deducido de cada liquidación.</p>
              </div>
              <div className="bg-slate-100 px-4 py-2 rounded-lg font-bold text-slate-800">12%</div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <div>
                <p className="font-bold text-slate-800">Tarifa Mensual (Empresas)</p>
                <p className="text-sm text-slate-500">Costo de mantenimiento de plataforma B2B por trabajador.</p>
              </div>
              <div className="bg-slate-100 px-4 py-2 rounded-lg font-bold text-slate-800">$1.500 / mes</div>
            </div>
          </div>
        </div>

        <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-sm hover:bg-slate-800 transition-colors mt-8">
          Guardar Cambios de Configuración
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-light pb-20 md:pb-0 relative">
      
      <header className="bg-slate-900 text-white p-4 md:p-6 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Sabores</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold hidden md:block">Panel de Gestión</p>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => setVistaActual('resumen')} 
              className={`flex items-center gap-2 font-bold transition-colors ${vistaActual === 'resumen' ? 'text-yellow-500' : 'text-slate-300 hover:text-white'}`}
            >
              <Home size={20} /> Resumen
            </button>
            <button 
              onClick={() => setVistaActual('convenios')} 
              className={`flex items-center gap-2 font-bold transition-colors ${vistaActual === 'convenios' ? 'text-yellow-500' : 'text-slate-300 hover:text-white'}`}
            >
              <Users size={20} /> Convenios
            </button>
            <button 
              onClick={() => setVistaActual('ajustes')} 
              className={`flex items-center gap-2 font-bold transition-colors ${vistaActual === 'ajustes' ? 'text-yellow-500' : 'text-slate-300 hover:text-white'}`}
            >
              <Settings size={20} /> Ajustes
            </button>
            
            <div className="h-6 w-px bg-slate-700 mx-2"></div>
            
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg text-white border border-slate-700">
              <ShieldCheck size={16} className="text-green-400" />
              <span className="text-xs font-bold">Gerencia/ISO 27000</span>
            </div>
            
            <button onClick={onLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 font-bold ml-2">
              <LogOut size={20} /> Salir
            </button>
          </div>

          <button onClick={onLogout} className="md:hidden text-slate-400 hover:text-white">
            <LogOut size={24} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full p-4 md:p-8 mt-2">
        {vistaActual === 'resumen' && renderVistaResumen()}
        {vistaActual === 'convenios' && renderVistaConvenios()}
        {vistaActual === 'ajustes' && renderVistaAjustes()}
      </main>

      {/* HISTORIAL COMPLETO DE TRANSACCIONES */}
      {mostrarHistorial && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
            
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock className="text-blue-500" size={24} />
                <h3 className="font-bold text-slate-800 text-lg">Historial Completo de Transacciones</h3>
              </div>
              <button onClick={() => setMostrarHistorial(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="overflow-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white shadow-sm">
                  <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="p-4 font-bold">ID Transacción</th>
                    <th className="p-4 font-bold">Hora</th>
                    <th className="p-4 font-bold">Cuenta Corporativa</th>
                    <th className="p-4 font-bold">Monto</th>
                    <th className="p-4 font-bold">Estado</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100">
                  {historialCompleto.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-700">{tx.id}</td>
                      <td className="p-4 flex items-center gap-1 text-slate-500"><Clock size={14}/> {tx.hora}</td>
                      <td className="p-4 font-medium text-slate-600">{tx.usuario}</td>
                      <td className="p-4 font-bold text-blue-900">-${tx.monto.toLocaleString('es-CL')}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                          tx.estado === 'Aprobado' ? 'bg-green-100 text-green-700' : 
                          'bg-red-100 text-red-700'
                        }`}>
                          {tx.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setMostrarHistorial(false)}
                className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors"
              >
                Cerrar Historial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OPCIONES DE REPORTE */}
      {mostrarOpcionesReporte && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BarChart2 className="text-orange-500" size={24} />
                <h3 className="font-bold text-slate-800 text-lg">Tipo de Reporte</h3>
              </div>
              <button onClick={() => setMostrarOpcionesReporte(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-sm text-slate-500 mb-4">Selecciona el período para generar el reporte financiero y de trazabilidad:</p>
              
              {['Diario', 'Semanal', 'Mensual', 'Anual'].map((periodo) => (
                <button
                  key={periodo}
                  onClick={() => {
                    alert(`Generando reporte financiero ${periodo}... (Simulación completada)`);
                    setMostrarOpcionesReporte(false);
                  }}
                  className="w-full text-left px-5 py-4 rounded-xl border border-slate-200 hover:border-orange-500 hover:bg-orange-50 font-bold text-slate-700 transition-colors flex justify-between items-center group shadow-sm"
                >
                  {periodo}
                  <BarChart2 size={18} className="text-slate-300 group-hover:text-orange-500 transition-colors" />
                </button>
              ))}

            </div>
          </div>
        </div>
      )}

      {/* NAVEGACIÓN INFERIOR PARA MÓVIL */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-slate-900 text-slate-400 flex justify-around py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50 pb-safe">
        <button 
          onClick={() => setVistaActual('resumen')} 
          className={`flex flex-col items-center transition-colors ${vistaActual === 'resumen' ? 'text-yellow-500' : 'hover:text-white'}`}
        >
          <Home size={24} />
          <span className="text-[10px] font-bold mt-1">Resumen</span>
        </button>
        <button 
          onClick={() => setVistaActual('convenios')} 
          className={`flex flex-col items-center transition-colors ${vistaActual === 'convenios' ? 'text-yellow-500' : 'hover:text-white'}`}
        >
          <Users size={24} />
          <span className="text-[10px] font-bold mt-1">Convenios</span>
        </button>
        <button 
          onClick={() => setVistaActual('ajustes')} 
          className={`flex flex-col items-center transition-colors ${vistaActual === 'ajustes' ? 'text-yellow-500' : 'hover:text-white'}`}
        >
          <Settings size={24} />
          <span className="text-[10px] font-bold mt-1">Ajustes</span>
        </button>
      </div>

    </div>
  );
}
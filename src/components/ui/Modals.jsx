import React, { useState } from 'react';
import { X, Search, Package, Clock, Loader2, CheckCircle2, AlertCircle, ShoppingBag, Truck } from 'lucide-react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';

export function TrackOrderModal({ isOpen, onClose }) {
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const formatMXN = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);
  };

  const handlePhoneChange = (e) => {
    const onlyNums = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    setTelefono(onlyNums);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (telefono.length !== 10) {
      setError('Asegúrate de escribir tu WhatsApp a 10 dígitos.');
      return;
    }
    
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const pedidosRef = collection(db, "pedidos");
      const qPhone = query(pedidosRef, where("telefono", "==", telefono), orderBy("createdAt", "desc"), limit(1));
      
      const querySnapshot = await getDocs(qPhone);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        setResult({ id: doc.id, ...doc.data() });
      } else {
        setError('No encontramos ninguna orden activa. Verifica el número o contáctanos.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectar con el servidor. Intenta de nuevo.');
    }
    
    setLoading(false);
  };

  // === RENDERIZADO DEL TIMELINE TOP-TIER ===
  const renderTimeline = (status) => {
    const steps = [
      { id: 'nuevo', label: 'Recibida', icon: ShoppingBag },
      { id: 'preparando', label: 'En Proceso', icon: Package },
      { id: 'listo', label: 'Lista', icon: CheckCircle2 }
    ];

    let currentStepIndex = 0;
    if (status === 'preparando') currentStepIndex = 1;
    if (status === 'listo' || status === 'entregado') currentStepIndex = 2;

    return (
      <div className="relative mt-10 mb-8 px-2">
        {/* Barra de fondo apagada */}
        <div className="absolute top-[1.15rem] left-10 right-10 h-1.5 bg-slate-100 rounded-full shadow-inner"></div>
        
        {/* Barra de progreso animada (Brillante) */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(currentStepIndex / 2) * 100}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="absolute top-[1.15rem] left-10 h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.6)]"
        ></motion.div>

        <div className="flex justify-between relative z-10">
          {steps.map((step, index) => {
            const isActive = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const Icon = step.icon;
            
            return (
              <div key={step.id} className="flex flex-col items-center gap-3 relative">
                {/* Aureola pulsante para el paso actual */}
                {isCurrent && (
                  <motion.div 
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-0 w-10 h-10 bg-emerald-400 rounded-full -z-10"
                  />
                )}
                
                <motion.div 
                  initial={{ scale: 0, rotate: -45 }} 
                  animate={{ scale: 1, rotate: 0 }} 
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: index * 0.15 }}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    isActive 
                      ? 'bg-emerald-500 text-white shadow-[0_10px_20px_rgba(16,185,129,0.4)] border border-emerald-400/50' 
                      : 'bg-white border border-slate-200 text-slate-300 shadow-sm'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>
                
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="track-order-modal"
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
        >
          {/* === BACKDROP (Fondo oscuro difuminado) === */}
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={onClose}></div>
          
          {/* === CONTENEDOR DEL MODAL === */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 30 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="bg-white w-full max-w-lg rounded-[3rem] relative z-10 shadow-[0_40px_80px_rgba(0,0,0,0.5)] overflow-hidden border border-white/20 flex flex-col max-h-[90vh]"
          >
            {/* === HEADER DEL MODAL (Glassmorphism Azul Profundo) === */}
            <div className="bg-gradient-to-br from-[#0866bd] to-blue-900 p-8 sm:p-10 pb-12 relative overflow-hidden text-white shrink-0">
              
              {/* Elementos decorativos de fondo */}
              <div className="absolute top-[-20%] right-[-10%] w-60 h-60 bg-blue-400/20 rounded-full blur-[80px] pointer-events-none"></div>
              <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 bg-yellow-400/10 rounded-full blur-[60px] pointer-events-none"></div>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

              {/* Botón de Cierre */}
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={onClose} 
                className="absolute top-6 right-6 text-blue-200 hover:text-white bg-white/10 border border-white/20 hover:bg-white/20 p-2.5 rounded-full transition-all backdrop-blur-md z-50 shadow-lg"
              >
                <X size={20} strokeWidth={2.5} />
              </motion.button>
              
              {/* Título Principal */}
              <div className="flex items-center gap-5 relative z-10">
                <motion.div 
                  initial={{ rotate: -15, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-16 h-16 bg-gradient-to-tr from-yellow-500 via-yellow-400 to-amber-300 text-slate-900 rounded-[1.5rem] flex items-center justify-center shadow-[0_15px_30px_rgba(250,204,21,0.4)] shrink-0 border border-yellow-200 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent"></div>
                  <Truck size={32} strokeWidth={2} className="relative z-10 drop-shadow-sm" />
                </motion.div>
                <div>
                  <h3 className="font-black text-3xl sm:text-4xl uppercase tracking-tighter leading-none mb-1.5 drop-shadow-lg">Rastrear Orden</h3>
                  <p className="text-[10px] sm:text-xs font-bold text-blue-200 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
                    Consulta en tiempo real
                  </p>
                </div>
              </div>
            </div>

            {/* === CUERPO INTERNO (Buscador y Resultados) === */}
            <div className="p-8 sm:p-10 relative -mt-8 bg-[#f8fafc] rounded-t-[3rem] flex-1 overflow-y-auto custom-scrollbar border-t border-white/50">
              
              {/* Buscador de WhatsApp */}
              <form onSubmit={handleSearch} className="mb-8">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3 ml-3 flex items-center gap-2">
                  <Search size={14} className="text-[#0866bd]" /> Ingresa tu WhatsApp
                </label>
                <div className="flex bg-white border-2 border-slate-100 rounded-[1.5rem] overflow-hidden focus-within:border-[#0866bd] focus-within:shadow-[0_15px_30px_rgba(8,102,189,0.1)] transition-all duration-300 group shadow-sm">
                  <input 
                    type="tel" 
                    value={telefono}
                    onChange={handlePhoneChange}
                    placeholder="Ej: 3312345678" 
                    className="w-full px-6 py-4 sm:py-5 outline-none bg-transparent font-black text-slate-800 text-sm sm:text-base placeholder:font-bold placeholder:text-slate-300 tracking-wider" 
                  />
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    type="submit" 
                    disabled={loading || telefono.length !== 10} 
                    className="px-8 bg-gradient-to-r from-[#0866bd] to-blue-600 text-white transition-all duration-300 disabled:opacity-50 disabled:grayscale disabled:bg-slate-300 flex items-center justify-center border-l border-slate-100"
                  >
                    {loading ? <Loader2 size={24} className="animate-spin text-white drop-shadow-md" /> : <Search size={24} className="drop-shadow-md" />}
                  </motion.button>
                </div>
              </form>

              {/* Contenedor Animado de Estados */}
              <AnimatePresence mode="wait">
                
                {/* Mensaje de Error */}
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-red-50 text-red-600 p-5 rounded-[1.5rem] text-[11px] sm:text-xs font-bold border border-red-100 flex items-center gap-4 shadow-sm mb-6">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                    {error}
                  </motion.div>
                )}

                {/* RESULTADO DE LA BÚSQUEDA */}
                {result && (
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -20 }} 
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="bg-white border border-slate-100 rounded-[2.5rem] p-6 sm:p-8 mt-4 shadow-[0_20px_50px_rgba(0,0,0,0.03)] relative overflow-hidden"
                  >
                    {/* Sutil resplandor de fondo en la tarjeta de resultados */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none"></div>
                    
                    {/* Encabezado del resultado (Cliente y Hora) */}
                    <div className="flex justify-between items-start mb-4 relative z-10 border-b border-slate-100 pb-4">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Cliente</p>
                        <p className="font-black text-slate-800 text-lg sm:text-xl uppercase tracking-tight">{result.cliente}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Hora Local</p>
                        <span className="font-black text-slate-600 text-xs sm:text-sm flex items-center justify-end gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100"><Clock size={14} className="text-[#0866bd]"/> {result.time || "Reciente"}</span>
                      </div>
                    </div>

                    {/* Timeline de Seguimiento */}
                    {renderTimeline(result.status)}

                    {/* Detalles de las Piezas (Staggered Animation) */}
                    <div className="mt-10 bg-slate-50 rounded-[1.5rem] p-5 sm:p-6 border border-slate-100 relative z-10">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5 flex items-center justify-between">
                        <span className="flex items-center gap-2"><ShoppingBag size={16} className="text-[#0866bd]"/> Contenido del Paquete</span>
                        <span className="bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm text-slate-600">{result.items} Piezas</span>
                      </p>
                      
                      <div className="max-h-40 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                        <AnimatePresence>
                          {result.detalle?.map((item, idx) => (
                            <motion.div 
                              key={idx} 
                              initial={{ opacity: 0, x: -20 }} 
                              animate={{ opacity: 1, x: 0 }} 
                              transition={{ delay: 0.5 + (idx * 0.1), type: "spring" }}
                              className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group"
                            >
                              <div className="flex items-center gap-4">
                                <div className="bg-gradient-to-br from-blue-50 to-white text-[#0866bd] font-black text-xs w-8 h-8 flex items-center justify-center rounded-xl border border-blue-100/50 shadow-inner group-hover:scale-110 transition-transform">
                                  {item.qty}x
                                </div>
                                <span className="font-bold text-[11px] sm:text-xs text-slate-700 uppercase line-clamp-1">{item.name}</span>
                              </div>
                              <span className="font-black text-[#0866bd] text-sm tracking-tighter">{formatMXN(item.price * item.qty)}</span>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                      
                      <div className="flex justify-between items-end mt-6 pt-6 border-t border-slate-200/60">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Total a Pagar</span>
                        <span className="font-black text-3xl text-slate-900 tracking-tighter drop-shadow-sm">{formatMXN(result.total)}</span>
                      </div>
                    </div>

                    {/* Alerta de "Pedido Listo" */}
                    {result.status === 'listo' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
                        className="mt-6 bg-gradient-to-r from-yellow-50 to-amber-50/30 border border-yellow-200/60 p-5 rounded-[1.5rem] flex items-start gap-4 shadow-sm relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-yellow-100">
                          <CheckCircle2 size={20} className="text-yellow-500" />
                        </div>
                        <div className="pt-0.5">
                          <h4 className="text-[11px] font-black uppercase tracking-widest text-yellow-800 mb-1">Tu paquete te espera</h4>
                          <p className="text-xs font-bold text-yellow-700/80 leading-relaxed">Pasa directo a la caja y menciona el número que registraste para una entrega inmediata.</p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
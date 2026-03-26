import React, { useState, useEffect } from 'react';
import { 
  X, Search, Package, Clock, Loader2, CheckCircle2, AlertCircle, 
  ShoppingBag, Store, MapPin, QrCode, ExternalLink, ShieldCheck, ChevronRight
} from 'lucide-react';
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
      
      // Simulamos un poco de tiempo extra de carga para mostrar el hermoso Skeleton Loader
      setTimeout(() => {
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          setResult({ id: doc.id, ...doc.data() });
        } else {
          setError('No encontramos ninguna orden activa. Verifica el número o contáctanos.');
        }
        setLoading(false);
      }, 1200);

    } catch (err) {
      console.error(err);
      setError('Error al conectar con el servidor. Intenta de nuevo.');
      setLoading(false);
    }
  };

  // === RENDERIZADO DEL TIMELINE TOP-TIER ===
  const renderTimeline = (status) => {
    const steps = [
      { id: 'nuevo', label: 'Recibida', icon: ShoppingBag },
      { id: 'preparando', label: 'En Proceso', icon: Package },
      { id: 'listo', label: 'Lista en Tienda', icon: CheckCircle2 }
    ];

    let currentStepIndex = 0;
    if (status === 'preparando') currentStepIndex = 1;
    if (status === 'listo' || status === 'entregado') currentStepIndex = 2;

    return (
      <div className="relative mt-10 mb-8 px-2">
        <div className="absolute top-[1.15rem] left-10 right-10 h-1.5 bg-slate-100 rounded-full shadow-inner"></div>
        
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(currentStepIndex / 2) * 100}%` }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="absolute top-[1.15rem] left-10 h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.6)]"
        ></motion.div>

        <div className="flex justify-between relative z-10">
          {steps.map((step, index) => {
            const isActive = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const Icon = step.icon;
            
            return (
              <div key={step.id} className="flex flex-col items-center gap-3 relative">
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
          {/* === BACKDROP CON BLUR PROFUNDO === */}
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={onClose}></div>
          
          {/* === CONTENEDOR DEL MODAL === */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 30 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="bg-white w-full max-w-lg rounded-[3rem] relative z-10 shadow-[0_40px_80px_rgba(0,0,0,0.5)] overflow-hidden border border-white/20 flex flex-col max-h-[90vh]"
          >
            {/* === HEADER DEL MODAL === */}
            <div className="bg-gradient-to-br from-[#0866bd] to-blue-900 p-8 sm:p-10 pb-12 relative overflow-hidden text-white shrink-0">
              
              <div className="absolute top-[-20%] right-[-10%] w-60 h-60 bg-blue-400/20 rounded-full blur-[80px] pointer-events-none"></div>
              <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 bg-yellow-400/10 rounded-full blur-[60px] pointer-events-none"></div>
              
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={onClose} 
                className="absolute top-6 right-6 text-blue-200 hover:text-white bg-white/10 border border-white/20 hover:bg-white/20 p-2.5 rounded-full transition-all backdrop-blur-md z-50 shadow-lg"
              >
                <X size={20} strokeWidth={2.5} />
              </motion.button>
              
              <div className="flex items-center gap-5 relative z-10">
                <motion.div 
                  initial={{ rotate: -15, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-16 h-16 bg-gradient-to-tr from-emerald-400 via-emerald-500 to-teal-400 text-white rounded-[1.5rem] flex items-center justify-center shadow-[0_15px_30px_rgba(16,185,129,0.4)] shrink-0 border border-emerald-300 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent"></div>
                  <Store size={32} strokeWidth={2} className="relative z-10 drop-shadow-sm" />
                </motion.div>
                <div>
                  <h3 className="font-black text-3xl sm:text-4xl uppercase tracking-tighter leading-none mb-1.5 drop-shadow-lg">Rastrear Orden</h3>
                  <p className="text-[10px] sm:text-xs font-bold text-blue-200 uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
                    Recolección en Mostrador
                  </p>
                </div>
              </div>
            </div>

            {/* === CUERPO INTERNO === */}
            <div className="p-8 sm:p-10 relative -mt-8 bg-[#f8fafc] rounded-t-[3rem] flex-1 overflow-y-auto custom-scrollbar border-t border-white/50">
              
              {/* Buscador de WhatsApp */}
              <form onSubmit={handleSearch} className="mb-8 relative z-20">
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
                     <Search size={24} className="drop-shadow-md" />
                  </motion.button>
                </div>
              </form>

              <AnimatePresence mode="wait">
                
                {/* === SKELETON LOADER PREMIUM === */}
                {loading && (
                  <motion.div 
                    key="skeleton"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="bg-white border border-slate-100 rounded-[2.5rem] p-6 sm:p-8 shadow-sm space-y-6"
                  >
                    <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                      <div className="space-y-2">
                        <div className="h-2 w-16 bg-slate-200 rounded animate-pulse"></div>
                        <div className="h-4 w-32 bg-slate-200 rounded animate-pulse"></div>
                      </div>
                      <div className="space-y-2 items-end flex flex-col">
                        <div className="h-2 w-16 bg-slate-200 rounded animate-pulse"></div>
                        <div className="h-5 w-20 bg-slate-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    
                    <div className="h-16 w-full bg-slate-100 rounded-2xl animate-pulse"></div>
                    
                    <div className="space-y-3 pt-4">
                      <div className="h-12 w-full bg-slate-100 rounded-2xl animate-pulse"></div>
                      <div className="h-12 w-full bg-slate-100 rounded-2xl animate-pulse"></div>
                    </div>
                  </motion.div>
                )}

                {/* Mensaje de Error */}
                {error && !loading && (
                  <motion.div key="error" initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-red-50 text-red-600 p-5 rounded-[1.5rem] text-[11px] sm:text-xs font-bold border border-red-100 flex items-center gap-4 shadow-sm mb-6">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <AlertCircle size={18} className="text-red-500" />
                    </div>
                    {error}
                  </motion.div>
                )}

                {/* RESULTADO DE LA BÚSQUEDA */}
                {result && !loading && (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} 
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="bg-white border border-slate-100 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none"></div>
                    
                    {/* Encabezado */}
                    <div className="flex justify-between items-start mb-4 relative z-10 border-b border-slate-100 pb-4">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">A nombre de</p>
                        <p className="font-black text-slate-800 text-lg sm:text-xl uppercase tracking-tight">{result.cliente}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Orden Generada</p>
                        <span className="font-black text-slate-600 text-xs sm:text-sm flex items-center justify-end gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100"><Clock size={14} className="text-[#0866bd]"/> {result.time || "Hoy"}</span>
                      </div>
                    </div>

                    {/* Timeline */}
                    {renderTimeline(result.status)}

                    {/* === PASE VIP DIGITAL (Solo si está listo) === */}
                    <AnimatePresence>
                      {result.status === 'listo' && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          className="mt-8 mb-4 bg-gradient-to-br from-slate-900 to-black text-white p-6 rounded-[1.5rem] shadow-[0_20px_40px_rgba(0,0,0,0.3)] relative overflow-hidden flex flex-col items-center border border-slate-700"
                        >
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                          
                          <div className="w-16 h-1 bg-slate-800 rounded-full mb-4"></div>
                          
                          <div className="bg-white p-3 rounded-2xl shadow-[0_0_20px_rgba(52,211,153,0.3)] mb-4 relative z-10 group cursor-pointer">
                             {/* Simulamos un QR futurista usando el icono y animación */}
                             <QrCode size={64} className="text-slate-900" strokeWidth={1.5} />
                             <motion.div 
                               animate={{ top: ['0%', '100%', '0%'] }}
                               transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                               className="absolute left-0 w-full h-1 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] opacity-70"
                             />
                          </div>

                          <h4 className="text-emerald-400 font-black uppercase tracking-[0.3em] text-[10px] mb-1 flex items-center gap-2">
                            <ShieldCheck size={12} /> Pase de Recolección
                          </h4>
                          <p className="text-center text-sm font-medium text-slate-300 leading-relaxed px-4">
                            Muestra esta pantalla en mostrador o menciona tu número <span className="text-white font-bold">{telefono}</span> para entrega inmediata.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Info de Sucursal */}
                    <div className="mt-6 bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex items-center gap-4 group hover:bg-blue-50 transition-colors cursor-pointer">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#0866bd] shadow-sm border border-blue-100/50 group-hover:scale-105 transition-transform shrink-0">
                        <MapPin size={20} />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-black text-slate-800 text-xs uppercase tracking-tight">Sucursal Tonalá</h5>
                        <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Te esperamos hasta las 7:00 PM</p>
                      </div>
                      <ChevronRight size={16} className="text-blue-300 group-hover:text-[#0866bd] transition-colors" />
                    </div>

                    {/* Resumen de Piezas */}
                    <div className="mt-8 border-t border-slate-200/60 pt-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <ShoppingBag size={14} className="text-[#0866bd]"/> Por entregar ({result.items} pz)
                      </p>
                      
                      <div className="max-h-32 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                        {result.detalle?.map((item, idx) => (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + (idx * 0.1) }}
                            key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100"
                          >
                            <div className="flex items-center gap-3">
                              <span className="bg-white text-[#0866bd] font-black text-[10px] w-6 h-6 flex items-center justify-center rounded-lg border border-slate-200 shadow-sm">{item.qty}x</span>
                              <span className="font-bold text-[11px] text-slate-700 uppercase line-clamp-1">{item.name}</span>
                            </div>
                            <span className="font-black text-slate-800 text-xs">{formatMXN(item.price * item.qty)}</span>
                          </motion.div>
                        ))}
                      </div>
                      
                      <div className="flex justify-between items-end mt-6 pt-4 border-t border-slate-200/60">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Pagar en Caja</span>
                        <span className="font-black text-3xl text-[#0866bd] tracking-tighter drop-shadow-sm">{formatMXN(result.total)}</span>
                      </div>
                    </div>
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
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
      
      // Simulamos un poco de tiempo extra de carga para mostrar la animación premium
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

  // === RENDERIZADO DEL TIMELINE NEO-CLÁSICO ===
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
        {/* Línea Base Oscura */}
        <div className="absolute top-[1.15rem] left-10 right-10 h-1.5 bg-slate-800 rounded-full shadow-inner border border-white/5"></div>
        
        {/* Línea de Progreso Holográfica */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(currentStepIndex / 2) * 100}%` }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className="absolute top-[1.15rem] left-10 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.8)]"
        ></motion.div>

        <div className="flex justify-between relative z-10">
          {steps.map((step, index) => {
            const isActive = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const Icon = step.icon;
            
            return (
              <div key={step.id} className="flex flex-col items-center gap-3 relative group">
                {isCurrent && (
                  <motion.div 
                    animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-0 w-10 h-10 bg-emerald-500 rounded-[1.2rem] -z-10"
                  />
                )}
                
                <motion.div 
                  initial={{ scale: 0, rotate: -45 }} 
                  animate={{ scale: 1, rotate: 0 }} 
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: index * 0.15 }}
                  className={`w-10 h-10 rounded-[1.2rem] flex items-center justify-center transition-all duration-500 shadow-md ${
                    isActive 
                      ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-900 shadow-[0_10px_20px_rgba(52,211,153,0.4)] border border-emerald-200' 
                      : 'bg-slate-900 border border-slate-700 text-slate-500 shadow-inner'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>
                
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-500 ${isActive ? 'text-white drop-shadow-sm' : 'text-slate-600'}`}>
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
          <div className="absolute inset-0 bg-[#020817]/80 backdrop-blur-2xl" onClick={onClose}></div>
          
          {/* === CONTENEDOR DEL MODAL (Zafiro Glassmorphism) === */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 30 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="bg-[#0b1120] w-full max-w-lg rounded-[3rem] relative z-10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden border border-white/10 flex flex-col max-h-[90vh]"
          >
            {/* === HEADER DEL MODAL === */}
            <div className="bg-gradient-to-br from-[#042f56] to-[#021830] p-8 sm:p-10 pb-12 relative overflow-hidden text-white shrink-0 border-b border-white/5">
              
              {/* Luces Ambientales (Zafiro y Oro) */}
              <div className="absolute top-[-20%] right-[-10%] w-60 h-60 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none"></div>
              <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 bg-[#0866bd]/20 rounded-full blur-[60px] pointer-events-none"></div>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
              
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={onClose} 
                className="absolute top-6 right-6 text-slate-400 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 p-2.5 rounded-full transition-all backdrop-blur-md z-50 shadow-md"
              >
                <X size={20} strokeWidth={2.5} />
              </motion.button>
              
              <div className="flex items-center gap-5 relative z-10">
                <motion.div 
                  initial={{ rotate: -15, scale: 0.8 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-16 h-16 bg-gradient-to-tr from-[#0866bd] to-blue-400 text-white rounded-[1.5rem] flex items-center justify-center shadow-[0_15px_30px_rgba(8,102,189,0.3)] shrink-0 border border-blue-300/50 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                  <Package size={32} strokeWidth={2} className="relative z-10 drop-shadow-sm" />
                </motion.div>
                <div>
                  <h3 className="font-black text-3xl sm:text-4xl uppercase tracking-tighter leading-none mb-1.5 drop-shadow-md text-white">Estado del <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-blue-100">Pedido</span></h3>
                  <p className="text-[10px] sm:text-xs font-bold text-amber-400 uppercase tracking-[0.2em] flex items-center gap-2 drop-shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                    Recolección Local
                  </p>
                </div>
              </div>
            </div>

            {/* === CUERPO INTERNO === */}
            <div className="p-8 sm:p-10 relative -mt-8 bg-[#0b1120] rounded-t-[3rem] flex-1 overflow-y-auto custom-scrollbar border-t border-white/10">
              
              {/* Patrón de Fondo Técnico */}
              <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none"></div>

              {/* Buscador de WhatsApp (Frost Glass Oscuro) */}
              <form onSubmit={handleSearch} className="mb-8 relative z-20">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-3 ml-3 flex items-center gap-2">
                  <Search size={14} className="text-amber-400" /> Ingresa tu WhatsApp
                </label>
                <div className="flex bg-[#021830] border border-white/10 rounded-[1.5rem] overflow-hidden focus-within:border-amber-400 focus-within:shadow-[0_0_20px_rgba(250,204,21,0.15)] transition-all duration-300 group shadow-inner">
                  <input 
                    type="tel" 
                    value={telefono}
                    onChange={handlePhoneChange}
                    placeholder="Ej: 3312345678" 
                    className="w-full px-6 py-4 outline-none bg-transparent font-black text-white text-sm sm:text-base placeholder:font-bold placeholder:text-slate-600 tracking-wider" 
                  />
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    type="submit" 
                    disabled={loading || telefono.length !== 10} 
                    className="px-8 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-900 transition-all duration-300 disabled:opacity-50 disabled:grayscale flex items-center justify-center border-l border-white/10 shadow-[0_0_15px_rgba(250,204,21,0.3)]"
                  >
                     <Search size={22} className="drop-shadow-sm" strokeWidth={2.5} />
                  </motion.button>
                </div>
              </form>

              <AnimatePresence mode="wait">
                
                {/* === SKELETON LOADER HIGH-TECH === */}
                {loading && (
                  <motion.div 
                    key="skeleton"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[150%] animate-[shimmer_1.5s_infinite]"></div>
                    <div className="flex justify-between items-start border-b border-white/5 pb-4">
                      <div className="space-y-2">
                        <div className="h-2 w-16 bg-slate-800 rounded"></div>
                        <div className="h-4 w-32 bg-slate-700 rounded"></div>
                      </div>
                      <div className="space-y-2 items-end flex flex-col">
                        <div className="h-2 w-16 bg-slate-800 rounded"></div>
                        <div className="h-5 w-20 bg-slate-700 rounded"></div>
                      </div>
                    </div>
                    
                    <div className="h-16 w-full bg-slate-800 rounded-2xl"></div>
                    
                    <div className="space-y-3 pt-4">
                      <div className="h-12 w-full bg-slate-800 rounded-2xl"></div>
                      <div className="h-12 w-full bg-slate-800 rounded-2xl"></div>
                    </div>
                  </motion.div>
                )}

                {/* Mensaje de Error */}
                {error && !loading && (
                  <motion.div key="error" initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-red-500/10 text-red-400 p-5 rounded-[1.5rem] text-[11px] sm:text-xs font-bold border border-red-500/30 flex items-center gap-4 shadow-sm mb-6">
                    <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/30">
                      <AlertCircle size={18} className="text-red-400" />
                    </div>
                    {error}
                  </motion.div>
                )}

                {/* === RESULTADO DE LA BÚSQUEDA === */}
                {result && !loading && (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} 
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-[#0866bd]/10 to-transparent pointer-events-none"></div>
                    
                    {/* Encabezado */}
                    <div className="flex justify-between items-start mb-4 relative z-10 border-b border-white/10 pb-4">
                      <div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">A nombre de</p>
                        <p className="font-black text-white text-lg sm:text-xl uppercase tracking-tight drop-shadow-sm">{result.cliente}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Orden Generada</p>
                        <span className="font-black text-blue-200 text-xs sm:text-sm flex items-center justify-end gap-1.5 bg-[#03254c] px-3 py-1 rounded-lg border border-white/10 shadow-inner">
                          <Clock size={14} className="text-amber-400"/> {result.time || "Hoy"}
                        </span>
                      </div>
                    </div>

                    {/* Timeline */}
                    {renderTimeline(result.status)}

                    {/* === PASE VIP DIGITAL (Holograma de Seguridad) === */}
                    <AnimatePresence>
                      {result.status === 'listo' && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          className="mt-8 mb-4 bg-gradient-to-br from-[#03254c] to-[#021830] text-white p-6 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col items-center border border-blue-400/30"
                        >
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05] mix-blend-overlay"></div>
                          
                          <div className="w-16 h-1 bg-blue-500/50 rounded-full mb-6 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                          
                          <div className="bg-white p-3.5 rounded-[1.5rem] shadow-[0_0_25px_rgba(52,211,153,0.4)] mb-5 relative z-10 group cursor-pointer border-2 border-emerald-400/50 overflow-hidden">
                             {/* Código QR Futurista */}
                             <QrCode size={72} className="text-slate-900 relative z-10" strokeWidth={1.5} />
                             
                             {/* Escáner Láser del QR */}
                             <motion.div 
                               animate={{ top: ['-10%', '110%', '-10%'] }}
                               transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                               className="absolute left-0 w-full h-[2px] bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,1)] opacity-80 z-20"
                             />
                          </div>

                          <h4 className="text-emerald-400 font-black uppercase tracking-[0.3em] text-[10px] mb-2 flex items-center gap-2 drop-shadow-sm">
                            <ShieldCheck size={14} className="text-emerald-400" /> Pase de Recolección Seguro
                          </h4>
                          <p className="text-center text-xs font-medium text-slate-400 leading-relaxed px-4">
                            Muestra esta pantalla en mostrador o menciona tu número <span className="text-white font-bold bg-white/10 px-1.5 py-0.5 rounded">{telefono}</span> para entrega inmediata.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Info de Sucursal (Dark Mode) */}
                    <div className="mt-8 bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center gap-4 group hover:bg-white/10 transition-colors cursor-pointer shadow-inner">
                      <div className="w-12 h-12 bg-[#042f56] rounded-[1rem] flex items-center justify-center text-amber-400 shadow-sm border border-amber-400/30 group-hover:scale-105 transition-transform shrink-0">
                        <MapPin size={20} />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-black text-white text-xs uppercase tracking-tight">Sucursal Tonalá</h5>
                        <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Te esperamos hasta las 7:00 PM</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-600 group-hover:text-amber-400 transition-colors" />
                    </div>

                    {/* Resumen de Piezas */}
                    <div className="mt-8 border-t border-white/10 pt-6 relative z-10">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <ShoppingBag size={14} className="text-[#0866bd]"/> Por entregar ({result.items} pz)
                      </p>
                      
                      <div className="max-h-36 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                        {result.detalle?.map((item, idx) => (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + (idx * 0.1) }}
                            key={idx} className="flex justify-between items-center bg-[#021830] p-3.5 rounded-[1.2rem] border border-white/5 shadow-inner"
                          >
                            <div className="flex items-center gap-3">
                              <span className="bg-amber-400/10 text-amber-400 font-black text-[10px] w-7 h-7 flex items-center justify-center rounded-[0.6rem] border border-amber-400/30 shadow-sm">{item.qty}x</span>
                              <span className="font-bold text-[11px] text-white uppercase line-clamp-1">{item.name}</span>
                            </div>
                            <span className="font-black text-blue-200 text-xs">{formatMXN(item.price * item.qty)}</span>
                          </motion.div>
                        ))}
                      </div>
                      
                      <div className="flex justify-between items-end mt-6 pt-5 border-t border-white/10">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Pagar en Caja</span>
                        <span className="font-black text-3xl sm:text-4xl text-amber-400 tracking-tighter drop-shadow-sm">{formatMXN(result.total)}</span>
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
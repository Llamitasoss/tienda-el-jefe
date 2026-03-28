import React, { useState } from 'react';
import { 
  X, Search, Package, Clock, Loader2, CheckCircle2, AlertCircle, 
  ShoppingBag, MapPin, QrCode, ShieldCheck
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

  // === RENDERIZADO DEL TIMELINE LIGHT PREMIUM ===
  const renderTimeline = (status) => {
    const steps = [
      { id: 'nuevo', label: 'Recibida', icon: ShoppingBag },
      { id: 'preparando', label: 'En Proceso', icon: Package },
      { id: 'listo', label: 'En Tienda', icon: CheckCircle2 }
    ];

    let currentStepIndex = 0;
    if (status === 'preparando') currentStepIndex = 1;
    if (status === 'listo' || status === 'entregado') currentStepIndex = 2;

    const isReady = currentStepIndex === 2;

    return (
      <div className="relative mt-10 mb-10 px-2">
        {/* Línea Base Gris Clara */}
        <div className="absolute top-[1.15rem] left-10 right-10 h-1.5 bg-slate-200 rounded-full shadow-inner border border-slate-300/50"></div>
        
        {/* Línea de Progreso Dinámica */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(currentStepIndex / 2) * 100}%` }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          className={`absolute top-[1.15rem] left-10 h-1.5 rounded-full shadow-sm ${isReady ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-[#0866bd] shadow-[#0866bd]/40'}`}
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
                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className={`absolute top-0 w-10 h-10 rounded-xl -z-10 ${isReady ? 'bg-emerald-500' : 'bg-[#0866bd]'}`}
                  />
                )}
                
                <motion.div 
                  initial={{ scale: 0, rotate: -45 }} 
                  animate={{ scale: 1, rotate: 0 }} 
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: index * 0.15 }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 shadow-sm ${
                    isActive 
                      ? isReady 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                        : 'bg-blue-50 text-[#0866bd] border border-blue-200'
                      : 'bg-white border border-slate-200 text-slate-400'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>
                
                <span className={`text-[9px] font-black uppercase tracking-widest transition-colors duration-500 ${isActive ? (isReady ? 'text-emerald-600' : 'text-[#0866bd]') : 'text-slate-400'}`}>
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
          {/* === BACKDROP CON BLUR LIGHT PREMIUM === */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
          
          {/* === CONTENEDOR DEL MODAL (Blanco Premium) === */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 30 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="bg-white w-full max-w-lg rounded-[2.5rem] relative z-10 shadow-[0_30px_80px_rgba(0,0,0,0.15)] overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
          >
            {/* === HEADER DEL MODAL (Azul Brand) === */}
            <div className="bg-gradient-to-br from-[#0866bd] to-[#042f56] p-8 sm:p-10 pb-12 relative overflow-hidden text-white shrink-0 border-b border-blue-900">
              
              {/* Luces Ambientales */}
              <div className="absolute top-[-20%] right-[-10%] w-60 h-60 bg-white/10 rounded-full blur-[60px] pointer-events-none"></div>
              <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 bg-blue-400/20 rounded-full blur-[50px] pointer-events-none"></div>
              
              <motion.button 
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={onClose} 
                className="absolute top-6 right-6 text-blue-100 hover:text-white bg-white/10 border border-white/20 hover:bg-white/20 p-2.5 rounded-full transition-all backdrop-blur-md z-50 shadow-sm"
              >
                <X size={18} strokeWidth={2.5} />
              </motion.button>
              
              <div className="flex items-center gap-5 relative z-10">
                <motion.div 
                  initial={{ rotate: -15, scale: 0.8 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-16 h-16 bg-white text-[#0866bd] rounded-2xl flex items-center justify-center shadow-[0_15px_30px_rgba(0,0,0,0.2)] shrink-0 border border-blue-100 relative overflow-hidden"
                >
                  <Package size={32} strokeWidth={2} className="relative z-10 drop-shadow-sm" />
                </motion.div>
                <div>
                  <h3 className="font-black text-3xl sm:text-4xl uppercase tracking-tighter leading-none mb-1.5 drop-shadow-md text-white">Estado del <span className="text-blue-200">Pedido</span></h3>
                  <p className="text-[10px] sm:text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center gap-2 drop-shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                    Recolección Local
                  </p>
                </div>
              </div>
            </div>

            {/* === CUERPO INTERNO === */}
            <div className="p-8 sm:p-10 relative -mt-8 bg-white rounded-t-[2.5rem] flex-1 overflow-y-auto custom-scrollbar border-t border-slate-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
              
              {/* Patrón de Fondo Técnico Muy Sutil */}
              <div className="absolute inset-0 bg-[radial-gradient(rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none"></div>

              {/* Buscador de WhatsApp (Clean SaaS Style) */}
              <form onSubmit={handleSearch} className="mb-8 relative z-20">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2 flex items-center gap-2">
                  <Search size={14} className="text-[#0866bd]" /> Ingresa tu WhatsApp
                </label>
                <div className="flex bg-slate-50 border border-slate-200 rounded-[1.2rem] overflow-hidden focus-within:border-[#0866bd] focus-within:bg-white focus-within:shadow-[0_0_20px_rgba(8,102,189,0.08)] transition-all duration-300 group shadow-inner">
                  <input 
                    type="tel" 
                    value={telefono}
                    onChange={handlePhoneChange}
                    placeholder="Ej: 3312345678" 
                    className="w-full px-5 py-4 outline-none bg-transparent font-black text-slate-800 text-sm sm:text-base placeholder:font-bold placeholder:text-slate-300 tracking-wider" 
                  />
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    type="submit" 
                    disabled={loading || telefono.length !== 10} 
                    className="px-8 bg-[#0866bd] text-white transition-all duration-300 disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center border-l border-slate-200 hover:bg-blue-700 shadow-sm"
                  >
                     <Search size={20} strokeWidth={2.5} />
                  </motion.button>
                </div>
              </form>

              <AnimatePresence mode="wait">
                
                {/* === SKELETON LOADER LIGHT PREMIUM === */}
                {loading && (
                  <motion.div 
                    key="skeleton"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="bg-slate-50 border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-[150%] animate-[shimmer_1.5s_infinite]"></div>
                    <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                      <div className="space-y-2">
                        <div className="h-2 w-16 bg-slate-200 rounded"></div>
                        <div className="h-4 w-32 bg-slate-200 rounded"></div>
                      </div>
                      <div className="space-y-2 items-end flex flex-col">
                        <div className="h-2 w-16 bg-slate-200 rounded"></div>
                        <div className="h-5 w-20 bg-slate-200 rounded"></div>
                      </div>
                    </div>
                    
                    <div className="h-16 w-full bg-slate-200 rounded-xl"></div>
                    
                    <div className="space-y-3 pt-4">
                      <div className="h-12 w-full bg-slate-200 rounded-xl"></div>
                      <div className="h-12 w-full bg-slate-200 rounded-xl"></div>
                    </div>
                  </motion.div>
                )}

                {/* Mensaje de Error (Limpio) */}
                {error && !loading && (
                  <motion.div key="error" initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-red-50 text-red-500 p-5 rounded-2xl text-[10px] sm:text-xs font-bold border border-red-100 flex items-center gap-4 shadow-sm mb-6">
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 border border-red-100 shadow-sm">
                      <AlertCircle size={16} className="text-red-500" strokeWidth={2.5}/>
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
                    className="bg-white border border-slate-200 rounded-[2rem] p-6 sm:p-8 shadow-[0_15px_40px_rgba(0,0,0,0.05)] relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none"></div>
                    
                    {/* Encabezado */}
                    <div className="flex justify-between items-start mb-4 relative z-10 border-b border-slate-100 pb-4">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">A nombre de</p>
                        <p className="font-black text-slate-800 text-base sm:text-lg uppercase tracking-tight">{result.cliente}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Orden Generada</p>
                        <span className="font-black text-[#0866bd] text-xs flex items-center justify-end gap-1.5 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 shadow-sm">
                          <Clock size={12} className="text-[#0866bd]"/> {result.time || "Hoy"}
                        </span>
                      </div>
                    </div>

                    {/* Timeline */}
                    {renderTimeline(result.status)}

                    {/* === PASE VIP DIGITAL (Clean Hologram) === */}
                    <AnimatePresence>
                      {result.status === 'listo' && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                          className="mt-8 mb-4 bg-emerald-50 text-emerald-900 p-6 rounded-[1.5rem] shadow-inner relative overflow-hidden flex flex-col items-center border border-emerald-200"
                        >
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-multiply"></div>
                          
                          <div className="w-16 h-1 bg-emerald-400 rounded-full mb-6 shadow-sm"></div>
                          
                          <div className="bg-white p-3.5 rounded-2xl shadow-sm mb-5 relative z-10 group cursor-pointer border border-emerald-200 overflow-hidden">
                             {/* Código QR */}
                             <QrCode size={64} className="text-slate-800 relative z-10" strokeWidth={1.5} />
                             
                             {/* Escáner Láser del QR */}
                             <motion.div 
                               animate={{ top: ['-10%', '110%', '-10%'] }}
                               transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                               className="absolute left-0 w-full h-[2px] bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] opacity-80 z-20"
                             />
                          </div>

                          <h4 className="text-emerald-600 font-black uppercase tracking-widest text-[9px] mb-2 flex items-center gap-1.5">
                            <ShieldCheck size={14} className="text-emerald-500" /> Pase de Recolección Seguro
                          </h4>
                          <p className="text-center text-[10px] font-bold text-emerald-700/80 leading-relaxed px-4">
                            Muestra esta pantalla en mostrador o menciona tu número <span className="bg-white px-1.5 py-0.5 rounded border border-emerald-100">{telefono}</span> para entrega inmediata.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Info de Sucursal */}
                    <div className="mt-8 bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center gap-4 group hover:bg-white hover:shadow-sm transition-all cursor-pointer">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#0866bd] shadow-sm border border-slate-100 group-hover:scale-105 transition-transform shrink-0">
                        <MapPin size={18} strokeWidth={2.5}/>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-black text-slate-800 text-[11px] uppercase tracking-tight">Sucursal Tonalá</h5>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Te esperamos hasta las 7:00 PM</p>
                      </div>
                    </div>

                    {/* Resumen de Piezas */}
                    <div className="mt-8 border-t border-slate-100 pt-6 relative z-10">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                        <ShoppingBag size={12} className="text-[#0866bd]"/> Por entregar ({result.items} pz)
                      </p>
                      
                      <div className="max-h-36 overflow-y-auto custom-scrollbar pr-2 space-y-2.5">
                        {result.detalle?.map((item, idx) => (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + (idx * 0.1) }}
                            key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <span className="bg-slate-50 text-slate-500 font-black text-[9px] w-6 h-6 flex items-center justify-center rounded-md border border-slate-200 shadow-inner">{item.qty}x</span>
                              <span className="font-bold text-[10px] text-slate-700 uppercase line-clamp-1">{item.name}</span>
                            </div>
                            <span className="font-black text-[#0866bd] text-xs">{formatMXN(item.price * item.qty)}</span>
                          </motion.div>
                        ))}
                      </div>
                      
                      <div className="flex justify-between items-end mt-6 pt-5 border-t border-slate-100">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pagar en Caja</span>
                        <span className="font-black text-3xl text-slate-900 tracking-tighter drop-shadow-sm leading-none">{formatMXN(result.total)}</span>
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
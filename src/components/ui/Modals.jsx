import React, { useState } from 'react';
import { X, Search, Package, Clock, Loader2, CheckCircle2, AlertCircle, ShoppingBag } from 'lucide-react';
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
      <div className="relative mt-8 mb-6">
        <div className="absolute top-5 left-8 right-8 h-1 bg-slate-100 rounded-full"></div>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(currentStepIndex / 2) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute top-5 left-8 h-1 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"
        ></motion.div>

        <div className="flex justify-between relative z-10">
          {steps.map((step, index) => {
            const isActive = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const Icon = step.icon;
            
            return (
              <div key={step.id} className="flex flex-col items-center gap-2">
                <motion.div 
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: index * 0.2 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isActive 
                      ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] border-2 border-emerald-400' 
                      : 'bg-white border-2 border-slate-200 text-slate-300'
                  } ${isCurrent ? 'ring-4 ring-emerald-500/20' : ''}`}
                >
                  <Icon size={18} />
                </motion.div>
                <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>
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
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        >
          {/* Fondo oscuro (backdrop) */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose}></div>
          
          {/* Contenedor del Modal (Corregido con motion.div y key) */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white w-full max-w-lg rounded-[2.5rem] relative z-10 shadow-[0_30px_60px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20 flex flex-col max-h-[90vh]"
          >
            {/* Header del Modal */}
            <div className="bg-[#0866bd] p-8 pb-10 relative overflow-hidden text-white shrink-0">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <button 
                type="button"
                onClick={onClose} 
                className="absolute top-6 right-6 text-blue-200 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors backdrop-blur-sm z-50"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-900 rounded-[1.2rem] flex items-center justify-center shadow-[0_10px_20px_rgba(250,204,21,0.3)] shrink-0 border border-yellow-300">
                  <Package size={28} />
                </div>
                <div>
                  <h3 className="font-black text-3xl uppercase tracking-tighter leading-none mb-1">Rastrear Orden</h3>
                  <p className="text-xs font-bold text-blue-200 tracking-wider">Consulta en tiempo real</p>
                </div>
              </div>
            </div>

            {/* Contenido (Scroll interno para evitar cortes en celulares) */}
            <div className="p-8 relative -mt-6 bg-white rounded-t-[2.5rem] flex-1 overflow-y-auto custom-scrollbar">
              <form onSubmit={handleSearch} className="mb-6">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">WhatsApp Registrado</label>
                <div className="flex bg-slate-50 border-2 border-slate-100 rounded-2xl overflow-hidden focus-within:border-[#0866bd] focus-within:shadow-[0_0_15px_rgba(8,102,189,0.1)] transition-all group">
                  <input 
                    type="tel" 
                    value={telefono}
                    onChange={handlePhoneChange}
                    placeholder="Ej: 3312345678" 
                    className="w-full px-5 py-4 outline-none bg-transparent font-black text-slate-700 text-sm placeholder:font-medium placeholder:text-slate-400" 
                  />
                  <button type="submit" disabled={loading || telefono.length !== 10} className="px-8 bg-[#0866bd] text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:bg-slate-300 flex items-center justify-center">
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                  </button>
                </div>
              </form>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100 flex items-center gap-3 shadow-sm mb-4">
                    <AlertCircle size={18} className="shrink-0" /> {error}
                  </motion.div>
                )}

                {result && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 mt-6 shadow-inner">
                    
                    {/* Encabezado del resultado */}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cliente</p>
                        <p className="font-black text-slate-800 text-lg uppercase tracking-tight">{result.cliente}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hora Local</p>
                        <span className="font-black text-slate-600 text-sm flex items-center justify-end gap-1.5"><Clock size={14} className="text-[#0866bd]"/> {result.time || "Reciente"}</span>
                      </div>
                    </div>

                    {/* Timeline Animado */}
                    {renderTimeline(result.status)}

                    {/* Resumen de piezas */}
                    <div className="mt-8 border-t border-slate-200/60 pt-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <ShoppingBag size={14} className="text-[#0866bd]"/> Detalles de la Orden ({result.items} pz)
                      </p>
                      
                      <div className="max-h-32 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                        {result.detalle?.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3">
                              <span className="bg-blue-50 text-[#0866bd] font-black text-xs px-2 py-1 rounded-lg border border-blue-100/50">{item.qty}x</span>
                              <span className="font-bold text-xs text-slate-700 uppercase line-clamp-1">{item.name}</span>
                            </div>
                            <span className="font-black text-[#0866bd] text-xs">{formatMXN(item.price * item.qty)}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-200/60">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total a Pagar</span>
                        <span className="font-black text-2xl text-slate-900 tracking-tighter">{formatMXN(result.total)}</span>
                      </div>
                    </div>

                    {/* Aviso si ya está listo */}
                    {result.status === 'listo' && (
                       <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex items-start gap-3">
                         <AlertCircle size={20} className="text-yellow-600 shrink-0 mt-0.5"/>
                         <p className="text-xs font-bold text-yellow-800">Tu pedido ya está separado en mostrador. Menciona el número que registraste en caja para una entrega rápida.</p>
                       </div>
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
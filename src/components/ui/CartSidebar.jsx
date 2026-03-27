import React, { useContext, useState, useEffect, useMemo } from 'react';
import { X, Trash2, ShoppingBag, User, Loader2, CheckCircle2, AlertCircle, Sparkles, Plus, Zap, ShieldCheck } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIGURACIÓN DE LA BARRA GAMIFICADA ---
const GOAL_AMOUNT = 1500; 
const GOAL_MESSAGE_REACHED = "¡Ganaste lubricante GRATIS!";
const GOAL_MESSAGE_PENDING = "para un lubricante GRATIS";

export default function CartSidebar() {
  const { cartItems, isCartOpen, toggleCart, updateQty, removeFromCart, clearCart, addToCart } = useContext(CartContext);
  
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [stockErrors, setStockErrors] = useState({});
  const [realTimeStock, setRealTimeStock] = useState({});
  
  const [upsellItem, setUpsellItem] = useState(null);
  const [loadingUpsell, setLoadingUpsell] = useState(false);

  const total = useMemo(() => cartItems.reduce((acc, item) => acc + ((item.promoPrice || item.price) * item.qty), 0), [cartItems]);
  const progressPercent = Math.min((total / GOAL_AMOUNT) * 100, 100);
  const amountLeft = Math.max(GOAL_AMOUNT - total, 0);

  const formatMXN = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  // --- 1. VERIFICACIÓN DE STOCK EN TIEMPO REAL ---
  useEffect(() => {
    if (!isCartOpen || cartItems.length === 0) return;

    const checkStock = async () => {
      const stockData = {};
      const errors = {};

      for (const item of cartItems) {
        try {
          const docRef = doc(db, "productos", item.id);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const currentStock = parseInt(docSnap.data().stock) || 0;
            stockData[item.id] = currentStock;
            
            if (item.qty > currentStock) {
              errors[item.id] = `Solo quedan ${currentStock} piezas`;
            }
          } else {
            errors[item.id] = "Pieza no disponible";
          }
        } catch (error) {
          console.error("Error leyendo stock de", item.id, error);
        }
      }
      setRealTimeStock(stockData);
      setStockErrors(errors);
    };

    checkStock();
  }, [isCartOpen, cartItems]);

  // --- 2. MOTOR DE RECOMENDACIONES (UPSELL) ---
  useEffect(() => {
    if (!isCartOpen || cartItems.length === 0) return;

    const fetchUpsellItem = async () => {
      setLoadingUpsell(true);
      try {
        const q = query(collection(db, "productos"), limit(10)); 
        const querySnapshot = await getDocs(q);
        
        let foundItem = null;
        
        for (const document of querySnapshot.docs) {
          const data = document.data();
          const stock = parseInt(data.stock) || 0;
          const isAlreadyInCart = cartItems.some(cartItem => cartItem.id === document.id);
          
          if (stock > 0 && !isAlreadyInCart) {
            foundItem = {
              id: document.id,
              name: data.name || data.Nombre,
              price: data.promoPrice || data.price || data.Precio,
              sku: data.sku || data.Codigo || 'N/A',
              img: data.images?.[0] || data.image || data.ImagenURL || "https://placehold.co/100x100/FBFBF2/0866bd?text=Item",
              stock: stock
            };
            break;
          }
        }
        setUpsellItem(foundItem);

      } catch (error) {
        console.error("Error buscando recomendación:", error);
      } finally {
        setLoadingUpsell(false);
      }
    };

    fetchUpsellItem();
  }, [isCartOpen, cartItems]);

  const handlePhoneChange = (e) => {
    const onlyNums = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    setTelefono(onlyNums);
  };

  // --- 3. PROCESAMIENTO DEL PEDIDO (CHECKOUT) ---
  const handleConfirmOrder = async () => {
    if (!nombre.trim() || telefono.length !== 10) return;

    if (Object.keys(stockErrors).length > 0) {
      alert("Ajusta las cantidades marcadas en rojo antes de confirmar.");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        cliente: nombre.toUpperCase().trim(),
        telefono: telefono,
        items: cartItems.reduce((acc, item) => acc + item.qty, 0),
        total: total,
        status: 'nuevo',
        detalle: cartItems.map(item => ({ 
          id: item.id, 
          name: item.name, 
          qty: item.qty, 
          price: item.promoPrice || item.price,
          sku: item.sku || 'N/A'
        })),
        time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "pedidos"), orderData);
      
      setSuccessMsg('¡Pedido reservado con éxito!');
      
      setTimeout(() => {
        clearCart();
        setNombre('');
        setTelefono('');
        setSuccessMsg('');
        toggleCart();
      }, 4000);

    } catch (error) {
      console.error("Error al guardar pedido:", error);
      alert("Hubo un error de conexión. Intenta nuevamente.");
      setIsSubmitting(false);
    }
  };

  const handleQtyChange = (item, delta) => {
    const currentMaxStock = realTimeStock[item.id] !== undefined ? realTimeStock[item.id] : item.stock;
    if (delta > 0 && item.qty >= currentMaxStock) return;
    updateQty(item.id, delta);
  };

  return (
    <>
      {/* BACKDROP BLUR */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }} 
            animate={{ opacity: 1, backdropFilter: "blur(4px)" }} 
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }} 
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-slate-900/40 z-[110]" 
            onClick={!isSubmitting ? toggleCart : undefined} 
          />
        )}
      </AnimatePresence>
      
      {/* === CÁPSULA DEL CARRITO (Light Premium) === */}
      <div className={`fixed top-0 right-0 w-full sm:w-[420px] h-full bg-[#FBFBF2] shadow-[-30px_0_80px_rgba(0,0,0,0.1)] z-[120] flex flex-col transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] border-l border-slate-200 ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* OVERLAY DE PROCESAMIENTO */}
        <AnimatePresence>
          {isSubmitting && !successMsg && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-white/80 backdrop-blur-sm z-[200] flex flex-col items-center justify-center">
              <Loader2 size={48} className="animate-spin text-[#0866bd] mb-4" strokeWidth={2}/>
              <p className="text-[10px] font-black text-[#0866bd] uppercase tracking-widest animate-pulse">Asegurando Inventario...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- HEADER DEL CARRITO --- */}
        <div className="px-6 py-5 bg-white flex justify-between items-center border-b border-slate-100 z-10 shrink-0 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="relative">
              <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center text-[#0866bd] shadow-sm border border-slate-100">
                <ShoppingBag size={20} strokeWidth={2} />
              </div>
              <span className="absolute -top-1.5 -right-1.5 bg-[#EF4444] text-white text-[9px] font-black min-w-[20px] h-[20px] flex items-center justify-center rounded-full border-2 border-white shadow-sm px-1">
                {cartItems.length}
              </span>
            </div>
            <div>
              <h2 className="font-black text-slate-900 text-lg uppercase tracking-tight leading-none mb-1">Caja Rápida</h2>
              <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-500"/> Pago Seguro
              </p>
            </div>
          </div>
          <button onClick={!isSubmitting ? toggleCart : undefined} className="w-9 h-9 bg-slate-50 border border-slate-200 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-100 hover:text-slate-600 transition-all hover:rotate-90 active:scale-90 relative z-10">
            <X size={16} strokeWidth={2.5}/>
          </button>
        </div>

        {/* --- BARRA GAMIFICADA (Progreso a Recompensa) --- */}
        {!successMsg && cartItems.length > 0 && (
          <div className="bg-slate-50 px-6 py-4 shrink-0 relative overflow-hidden border-b border-slate-200 shadow-inner">
            <div className="flex justify-between items-end mb-2.5 relative z-10">
              <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${progressPercent === 100 ? 'text-[#0866bd]' : 'text-slate-600'}`}>
                <Sparkles size={12} className={progressPercent === 100 ? 'text-[#FACC15] animate-pulse' : 'text-slate-400'}/>
                {progressPercent === 100 ? GOAL_MESSAGE_REACHED : 'Recompensa VIP'}
              </span>
              {progressPercent < 100 && (
                <span className="text-[9px] font-black text-slate-700 bg-[#FACC15] px-2 py-0.5 rounded shadow-sm border border-yellow-200">
                  Faltan {formatMXN(amountLeft)} {GOAL_MESSAGE_PENDING}
                </span>
              )}
            </div>
            
            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden relative z-10 shadow-inner border border-slate-300/50">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full transition-all duration-500 ${progressPercent === 100 ? 'bg-gradient-to-r from-amber-400 to-[#FACC15] shadow-[0_0_10px_rgba(250,204,21,0.8)]' : 'bg-[#0866bd] shadow-[0_0_8px_rgba(8,102,189,0.5)]'}`}
              />
            </div>
          </div>
        )}
        
        {/* === ÁREA DE PRODUCTOS (Respirable y Limpia) === */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar relative z-0 bg-[#FBFBF2]">
          
          <AnimatePresence mode="popLayout">
            {successMsg ? (
              // PANTALLA DE ÉXITO TOP-TIER
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center py-10 relative z-10">
                <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mb-6 border border-emerald-100 shadow-sm">
                   <CheckCircle2 size={48} strokeWidth={2}/>
                </div>
                <h3 className="font-black text-2xl text-slate-900 uppercase tracking-tight mb-2">¡Orden Recibida!</h3>
                <p className="text-slate-500 font-medium px-6 text-xs max-w-[260px] mb-8 leading-relaxed">Las piezas han sido apartadas del inventario central. Te esperamos en mostrador para la entrega.</p>
                <div className="flex items-center gap-2 bg-white px-5 py-3 rounded-xl border border-slate-200 text-[10px] font-black text-[#0866bd] uppercase tracking-widest shadow-sm">
                  <Loader2 size={14} className="animate-spin text-[#0866bd]" /> Preparando paquete...
                </div>
              </motion.div>
            ) : cartItems.length === 0 ? (
              // CARRITO VACÍO ELEGANTE
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-32 text-center relative z-10 h-full">
                <div className="w-20 h-20 bg-white rounded-[1.5rem] flex items-center justify-center mb-5 border border-slate-200 shadow-sm">
                  <ShoppingBag size={32} className="text-slate-300" strokeWidth={1.5} />
                </div>
                <h3 className="font-black text-xl text-slate-800 uppercase tracking-tight mb-2">Tu caja está vacía</h3>
                <p className="text-xs font-medium text-slate-500 max-w-[200px] mb-8 leading-relaxed">No has agregado ninguna refacción a tu orden todavía.</p>
                <button onClick={toggleCart} className="bg-white border border-[#0866bd] text-[#0866bd] font-black px-8 py-3.5 rounded-xl uppercase tracking-widest text-[10px] hover:bg-[#0866bd] hover:text-white transition-all shadow-sm">Explorar Catálogo</button>
              </motion.div>
            ) : (
              <>
                {/* LISTA DE PRODUCTOS */}
                {cartItems.map((item) => {
                  const mainImg = item.images && item.images.length > 0 ? item.images[0] : (item.img || item.image || "https://placehold.co/100x100/FBFBF2/0866bd?text=Sin+Foto");
                  const error = stockErrors[item.id];
                  const isMaxReached = realTimeStock[item.id] !== undefined && item.qty >= realTimeStock[item.id];
                  
                  return (
                    <motion.div 
                      key={item.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                      className={`bg-white p-4 rounded-[1.5rem] shadow-sm transition-all relative z-10 flex gap-4 group border ${error ? 'border-[#EF4444]' : 'border-slate-200 hover:border-[#0866bd]/30 hover:shadow-md'}`}
                    >
                      {/* Imagen Compacta Blend */}
                      <div className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center shrink-0 relative transition-shadow overflow-hidden border border-slate-100">
                        {error && <div className="absolute inset-0 bg-[#EF4444]/10 z-10"></div>}
                        <img src={mainImg} alt={item.name} className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" />
                      </div>
                      
                      <div className="flex flex-col flex-1 py-0.5 justify-between">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{item.sku || 'Refacción'}</span>
                            <h4 className="font-black text-xs text-slate-800 leading-tight line-clamp-2 uppercase group-hover:text-[#0866bd] transition-colors">{item.name}</h4>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-[#EF4444] transition-colors p-1.5 rounded-lg hover:bg-[#EF4444]/10 shrink-0">
                            <Trash2 size={16} strokeWidth={2}/>
                          </button>
                        </div>

                        <AnimatePresence>
                          {error && (
                            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-[9px] font-bold text-[#EF4444] flex items-center gap-1 mb-1.5 mt-1">
                              <AlertCircle size={12} strokeWidth={2}/> {error}
                            </motion.p>
                          )}
                        </AnimatePresence>
                        
                        <div className="flex justify-between items-center mt-2">
                          {/* Controles de Cantidad (Estilo SaaS) */}
                          <div className={`flex items-center rounded-lg overflow-hidden border shadow-sm ${isMaxReached ? 'border-orange-200 bg-orange-50' : 'border-slate-200 bg-slate-50'}`}>
                            <button onClick={() => handleQtyChange(item, -1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-[#0866bd] hover:text-white font-black transition-colors active:bg-blue-700">-</button>
                            <span className="w-8 text-center font-bold text-xs text-slate-800 border-x border-slate-200 bg-white h-8 flex items-center justify-center">{item.qty}</span>
                            <button onClick={() => handleQtyChange(item, 1)} disabled={isMaxReached} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-[#0866bd] hover:text-white font-black transition-colors disabled:opacity-30 disabled:bg-slate-100 disabled:text-slate-400">+</button>
                          </div>
                          
                          <div className="flex flex-col items-end">
                            {(item.originalPrice || item.promoPrice) && (
                              <span className="text-[9px] text-slate-400 line-through font-bold">{formatMXN(item.originalPrice || item.price)}</span>
                            )}
                            <span className="font-black text-base text-[#0866bd] tracking-tighter leading-none">{formatMXN((item.promoPrice || item.price) * item.qty)}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                
                {/* === CROSS-SELLING COMPACTO (Sugerencia del Jefe) === */}
                <AnimatePresence>
                  {upsellItem && cartItems.length > 0 && cartItems.length < 4 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="mt-6 bg-blue-50/80 border border-blue-100 rounded-[1.2rem] p-3.5 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 bg-[#0866bd] text-white text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded-bl-lg z-10 shadow-sm">
                        Sugerencia del Jefe
                      </div>
                      <div className="flex items-center gap-4 relative z-10 pt-2">
                        <div className="w-12 h-12 rounded-lg bg-white border border-slate-100 flex items-center justify-center shrink-0 p-1 shadow-sm">
                          <img src={upsellItem.img} alt={upsellItem.name} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                        </div>
                        <div className="flex-1">
                          <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-tight leading-none line-clamp-1">{upsellItem.name}</h5>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[11px] font-black text-[#0866bd]">{formatMXN(upsellItem.price)}</span>
                            <button onClick={() => addToCart(upsellItem, 1)} className="bg-white border border-blue-200 text-[#0866bd] hover:bg-[#0866bd] hover:text-white px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors shadow-sm">
                              <Plus size={12} strokeWidth={2.5}/> Añadir
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </AnimatePresence>
        </div>
        
        {/* === FOOTER DEL CARRITO (CHECKOUT "LIGHT PREMIUM") === */}
        <AnimatePresence>
          {!successMsg && cartItems.length > 0 && (
            <motion.div 
              initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20 shrink-0 relative rounded-tl-[2rem]"
            >
              
              {/* Subtotal */}
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subtotal ({cartItems.length} items)</span>
                <span className="text-xs font-black text-slate-800">{formatMXN(total)}</span>
              </div>

              {/* Inputs (Estilo Clean) */}
              <div className="px-6 pt-5 pb-2 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-blue-50 text-[#0866bd] rounded-md border border-blue-100 flex items-center justify-center shadow-sm"><User size={12} strokeWidth={2.5}/></div>
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Detalles de Recolección</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-1">
                  <input 
                    type="text" placeholder="Tu Nombre" value={nombre} onChange={e => setNombre(e.target.value)} 
                    className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400 shadow-inner ${!nombre.trim() && isSubmitting ? 'border-[#EF4444]' : 'border-slate-200 focus:border-[#0866bd] focus:bg-white'}`} 
                  />
                  <input 
                    type="tel" placeholder="WhatsApp" value={telefono} onChange={handlePhoneChange} 
                    className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400 shadow-inner ${telefono.length !== 10 && isSubmitting ? 'border-[#EF4444]' : 'border-slate-200 focus:border-[#0866bd] focus:bg-white'}`} 
                  />
                </div>
              </div>

              {/* Botón Final (Azul Brand de Alto Impacto) */}
              <div className="px-6 pb-6 pt-3 relative bg-slate-50/50">
                <div className="flex justify-between items-end mb-4">
                  <span className="bg-slate-200 text-slate-600 font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded shadow-sm">Total a Pagar</span>
                  <span className="font-black text-3xl sm:text-4xl text-[#0866bd] tracking-tighter drop-shadow-sm leading-none">{formatMXN(total)}</span>
                </div>
                
                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmOrder}
                  disabled={isSubmitting || !nombre.trim() || telefono.length !== 10 || Object.keys(stockErrors).length > 0}
                  className="w-full bg-[#0866bd] text-white font-black py-4 rounded-[1.2rem] transition-all uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(8,102,189,0.3)] hover:shadow-[0_15px_30px_rgba(8,102,189,0.4)] text-[11px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale relative overflow-hidden group border border-[#0866bd]"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  {isSubmitting ? (
                    <><Loader2 size={18} className="animate-spin relative z-10" /> <span className="relative z-10 mt-0.5">Reservando...</span></>
                  ) : (
                    <><CheckCircle2 size={18} className="relative z-10 text-white" strokeWidth={2.5} /> <span className="relative z-10 mt-0.5">Confirmar Orden</span></>
                  )}
                </motion.button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
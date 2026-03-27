import React, { useContext, useState, useEffect, useMemo } from 'react';
import { X, Trash2, ShoppingBag, User, Loader2, CheckCircle2, AlertCircle, Sparkles, Plus, Zap } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIGURACIÓN DE LA BARRA GAMIFICADA ---
const GOAL_AMOUNT = 1500; 
const GOAL_MESSAGE_REACHED = "¡Ganaste lubricante GRATIS!";
const GOAL_MESSAGE_PENDING = "para llevarte un lubricante GRATIS";

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

  // Calcular totales
  const total = useMemo(() => cartItems.reduce((acc, item) => acc + ((item.promoPrice || item.price) * item.qty), 0), [cartItems]);
  const progressPercent = Math.min((total / GOAL_AMOUNT) * 100, 100);
  const amountLeft = Math.max(GOAL_AMOUNT - total, 0);

  const formatMXN = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  // === MAGIA TOP-TIER: VERIFICACIÓN DE STOCK EN TIEMPO REAL ===
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

  // === CROSS-SELLING DINÁMICO ===
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
              img: data.images?.[0] || data.image || "https://placehold.co/100x100/f8fafc/0866BD?text=Item",
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
      }, 3500);

    } catch (error) {
      console.error("Error al guardar pedido:", error);
      alert("Hubo un error de conexión. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQtyChange = (item, delta) => {
    const currentMaxStock = realTimeStock[item.id] !== undefined ? realTimeStock[item.id] : item.stock;
    
    if (delta > 0 && item.qty >= currentMaxStock) {
      return;
    }
    updateQty(item.id, delta);
  };

  return (
    <>
      <AnimatePresence>
        {isCartOpen && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }} 
            animate={{ opacity: 1, backdropFilter: "blur(8px)" }} 
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }} 
            transition={{ duration: 0.4 }}
            className="fixed inset-0 bg-[#020817]/70 z-[110]" 
            onClick={toggleCart} 
          />
        )}
      </AnimatePresence>
      
      {/* CÁPSULA DEL CARRITO (Sapphire Glassmorphism) */}
      <div className={`fixed top-0 right-0 w-full sm:w-[480px] h-full bg-[#042f56]/95 backdrop-blur-3xl shadow-[-30px_0_80px_rgba(0,0,0,0.6)] z-[120] flex flex-col transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] border-l border-white/10 ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* HEADER DEL CARRITO */}
        <div className="px-6 py-5 bg-[#03254c] flex justify-between items-center border-b border-white/5 z-10 shrink-0 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 rounded-[1.2rem] flex items-center justify-center text-slate-900 shadow-[0_5px_20px_rgba(250,204,21,0.4)] border border-yellow-200">
                <ShoppingBag size={24} className="mb-0.5 ml-0.5" strokeWidth={2.5}/>
              </div>
              <span className="absolute -bottom-1 -right-1 bg-white text-[#0866bd] text-[9px] font-black w-[22px] h-[22px] flex items-center justify-center rounded-full border-2 border-[#042f56] shadow-sm">
                {cartItems.length}
              </span>
            </div>
            <div>
              <h2 className="font-black text-white text-xl uppercase tracking-tighter leading-none mb-1 drop-shadow-sm">Caja Rápida</h2>
              <p className="text-[10px] font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-400 drop-shadow-sm"/> Pago Seguro
              </p>
            </div>
          </div>
          <button onClick={toggleCart} className="w-10 h-10 bg-white/5 border border-white/10 text-slate-300 rounded-full flex items-center justify-center hover:bg-white/10 hover:text-white transition-all hover:rotate-90 active:scale-90 shadow-sm backdrop-blur-md">
            <X size={18} strokeWidth={2.5}/>
          </button>
        </div>

        {/* === BARRA GAMIFICADA (PROGRESS BAR NEO-CLÁSICA) === */}
        {!successMsg && cartItems.length > 0 && (
          <div className="bg-[#021830] px-6 py-5 shrink-0 relative overflow-hidden border-b border-white/5 shadow-inner">
            <div className="absolute top-[-50%] right-[-10%] w-40 h-40 bg-emerald-500/10 rounded-full blur-[40px] mix-blend-screen pointer-events-none"></div>
            
            <div className="flex justify-between items-end mb-3 relative z-10">
              <span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5 drop-shadow-sm">
                <Sparkles size={14} className={progressPercent === 100 ? 'text-amber-400 animate-pulse' : 'text-[#0866bd]'}/>
                {progressPercent === 100 ? GOAL_MESSAGE_REACHED : 'Recompensa VIP'}
              </span>
              {progressPercent < 100 && (
                <span className="text-[10px] font-black text-slate-900 bg-amber-400 px-2.5 py-0.5 rounded-lg border border-yellow-200 shadow-[0_0_10px_rgba(250,204,21,0.5)]">
                  Faltan {formatMXN(amountLeft)}
                </span>
              )}
            </div>
            
            <div className="h-2 w-full bg-[#042f56] rounded-full overflow-hidden relative z-10 shadow-inner border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full transition-all duration-500 ${progressPercent === 100 ? 'bg-gradient-to-r from-amber-500 to-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.8)]' : 'bg-gradient-to-r from-emerald-500 to-teal-300 shadow-[0_0_10px_rgba(52,211,153,0.5)]'}`}
              />
            </div>
            {progressPercent < 100 && <p className="text-[9px] text-blue-200 mt-2 text-center uppercase tracking-[0.2em] relative z-10 font-bold opacity-80">{GOAL_MESSAGE_PENDING}</p>}
          </div>
        )}
        
        {/* LISTA DE PRODUCTOS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar relative z-0">
          
          {/* Fondo Técnico */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none"></div>

          <AnimatePresence mode="popLayout">
            {successMsg ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center py-10 relative z-10">
                <div className="w-28 h-28 bg-emerald-500/20 text-emerald-400 rounded-[2rem] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(52,211,153,0.2)] border border-emerald-500/40 backdrop-blur-md">
                   <CheckCircle2 size={56} strokeWidth={2.5}/>
                </div>
                <h3 className="font-black text-3xl text-white uppercase tracking-tight mb-3 drop-shadow-md">¡Orden Recibida!</h3>
                <p className="text-blue-100 font-medium px-8 leading-relaxed max-w-sm mb-8">Tu pedido ha sido apartado del inventario central. Pasa a recogerlo a mostrador cuando gustes.</p>
                <div className="flex items-center gap-3 bg-[#03254c] px-6 py-3.5 rounded-2xl border border-white/10 shadow-inner text-xs font-bold text-white uppercase tracking-widest">
                  <Loader2 size={16} className="animate-spin text-amber-400" /> Preparando tu paquete...
                </div>
              </motion.div>
            ) : cartItems.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-32 text-center relative z-10 h-full">
                <div className="w-24 h-24 bg-white/5 rounded-3xl flex items-center justify-center mb-6 shadow-inner border border-white/10 backdrop-blur-sm">
                  <ShoppingBag size={40} className="text-blue-200/50" />
                </div>
                <h3 className="font-black text-2xl text-white uppercase tracking-tight mb-2 drop-shadow-md">Caja Vacía</h3>
                <p className="text-sm font-medium text-blue-200 max-w-[200px] mb-8 leading-relaxed">No has agregado ninguna refacción a tu orden todavía.</p>
                <button onClick={toggleCart} className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-900 font-black px-8 py-4 rounded-[1.5rem] uppercase tracking-[0.2em] text-[10px] hover:shadow-[0_10px_30px_rgba(250,204,21,0.4)] transition-all border border-yellow-200">Volver a la tienda</button>
              </motion.div>
            ) : (
              <>
                {cartItems.map((item) => {
                  const mainImg = item.images && item.images.length > 0 ? item.images[0] : (item.img || item.image || "https://placehold.co/100x100/f8fafc/0866BD?text=Sin+Foto");
                  const error = stockErrors[item.id];
                  const isMaxReached = realTimeStock[item.id] !== undefined && item.qty >= realTimeStock[item.id];
                  
                  return (
                    <motion.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, x: -20, transition: { duration: 0.2 } }}
                      className={`bg-white p-4 rounded-[1.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all relative z-10 flex gap-4 sm:gap-5 group ${error ? 'border-2 border-red-500' : 'border border-white hover:border-amber-300/50'}`}
                    >
                      <div className="w-24 h-24 bg-white rounded-xl border border-slate-100 p-2 flex items-center justify-center overflow-hidden shrink-0 relative group-hover:shadow-inner transition-shadow">
                        {error && <div className="absolute inset-0 bg-red-500/10 z-10 pointer-events-none"></div>}
                        <img src={mainImg} alt={item.name} className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      
                      <div className="flex flex-col flex-1 py-0.5">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1 bg-amber-50 w-max px-2 py-0.5 rounded-md border border-amber-100">{item.sku || 'Refacción'}</span>
                            <h4 className="font-black text-xs text-slate-800 leading-snug line-clamp-2 uppercase tracking-tight">{item.name}</h4>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-white transition-colors bg-white hover:bg-red-500 p-2 rounded-xl border border-slate-100 hover:border-red-400 shrink-0 shadow-sm active:scale-90">
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <AnimatePresence>
                          {error && (
                            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-[10px] font-black text-red-500 flex items-center gap-1 mt-1 bg-red-50 p-1.5 rounded-lg border border-red-200">
                              <AlertCircle size={12} strokeWidth={3}/> {error}
                            </motion.p>
                          )}
                        </AnimatePresence>
                        
                        <div className="flex justify-between items-end mt-auto pt-3">
                          <div className="flex items-start flex-col gap-1">
                            <div className={`flex items-center rounded-xl overflow-hidden border transition-colors shadow-inner ${isMaxReached ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-slate-50'}`}>
                              <button onClick={() => handleQtyChange(item, -1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-[#0866bd] hover:text-white font-black transition-colors active:bg-blue-700">-</button>
                              <span className="w-8 text-center font-black text-xs text-slate-800 bg-white border-x border-slate-200 h-8 flex items-center justify-center">{item.qty}</span>
                              <button onClick={() => handleQtyChange(item, 1)} disabled={isMaxReached} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-[#0866bd] hover:text-white font-black transition-colors disabled:opacity-30 disabled:hover:bg-transparent active:bg-blue-700">+</button>
                            </div>
                            {isMaxReached && <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest px-1">Límite Max</span>}
                          </div>
                          
                          <div className="flex flex-col items-end">
                            {(item.originalPrice || item.promoPrice) && (
                              <span className="text-[9px] text-slate-400 line-through font-bold">{formatMXN(item.originalPrice || item.price)}</span>
                            )}
                            <span className="font-black text-lg text-slate-900 tracking-tighter leading-none">{formatMXN((item.promoPrice || item.price) * item.qty)}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                
                {/* === CROSS-SELLING DINÁMICO (Frost Glass) === */}
                <AnimatePresence>
                  {upsellItem && cartItems.length > 0 && cartItems.length < 4 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mt-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[1.5rem] p-4 relative overflow-hidden shadow-[0_15px_30px_rgba(0,0,0,0.2)]"
                    >
                      {loadingUpsell && <div className="absolute inset-0 bg-[#042f56]/50 backdrop-blur-sm z-20 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-amber-400" /></div>}
                      
                      <div className="absolute top-0 right-0 bg-amber-400 text-slate-900 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl z-10 shadow-sm border-b border-l border-yellow-200">
                        Sugerencia del Jefe
                      </div>
                      <div className="flex items-center gap-4 relative z-10 pt-2">
                        <img src={upsellItem.img} alt={upsellItem.name} className="w-16 h-16 rounded-xl object-contain bg-white border border-slate-200 p-1.5 shadow-inner" />
                        <div className="flex-1">
                          <h5 className="text-[11px] font-black text-white uppercase tracking-tight leading-snug line-clamp-1 drop-shadow-sm">{upsellItem.name}</h5>
                          <p className="text-[10px] text-blue-200 font-bold mt-0.5 uppercase tracking-widest">SKU: {upsellItem.sku}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-black text-amber-400 tracking-tighter drop-shadow-sm">{formatMXN(upsellItem.price)}</span>
                            <button 
                              onClick={() => addToCart(upsellItem, 1)}
                              className="bg-white/10 border border-white/20 text-white hover:bg-amber-400 hover:text-slate-900 hover:border-yellow-200 p-1.5 rounded-lg transition-all shadow-sm active:scale-95 flex items-center gap-1 backdrop-blur-sm"
                            >
                              <Plus size={16} strokeWidth={3}/> <span className="text-[10px] font-black pr-1 uppercase tracking-wider">Añadir</span>
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
        
        {/* === FOOTER DEL CARRITO (CHECKOUT DE ORO) === */}
        <AnimatePresence>
          {!successMsg && cartItems.length > 0 && (
            <motion.div 
              initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-[#03254c] border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.5)] z-20 shrink-0 relative rounded-tl-[2.5rem]"
            >
              
              <div className="px-8 py-5 border-b border-white/5 flex flex-col gap-2 bg-gradient-to-b from-white/5 to-transparent">
                <div className="flex justify-between items-center text-[11px] font-black text-slate-300 uppercase tracking-widest">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span className="text-white drop-shadow-sm">{formatMXN(total)}</span>
                </div>
                {progressPercent === 100 && (
                  <div className="flex justify-between items-center text-[11px] font-black text-emerald-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1.5 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]"><Zap size={14} className="fill-current"/> Recompensa Activa</span>
                    <span>GRATIS</span>
                  </div>
                )}
              </div>

              <div className="p-8 pb-4">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-7 h-7 bg-white/10 text-amber-300 rounded-[0.6rem] flex items-center justify-center border border-white/20 shadow-inner"><User size={14} strokeWidth={2.5}/></div>
                  <span className="text-[10px] font-black text-blue-100 uppercase tracking-[0.2em] drop-shadow-sm">Detalles de Recolección</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div className="relative group">
                    <input 
                      type="text" 
                      placeholder="Tu Nombre" 
                      value={nombre} 
                      onChange={e => setNombre(e.target.value)} 
                      className={`w-full bg-[#021830] border rounded-[1.2rem] px-5 py-4 text-xs font-bold text-white outline-none transition-all shadow-inner placeholder:text-slate-500 ${!nombre.trim() && isSubmitting ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-white/10 focus:border-amber-400 focus:bg-[#042f56] focus:shadow-[0_0_20px_rgba(250,204,21,0.15)]'}`} 
                    />
                  </div>
                  <div className="relative group">
                    <input 
                      type="tel" 
                      placeholder="WhatsApp" 
                      value={telefono} 
                      onChange={handlePhoneChange} 
                      className={`w-full bg-[#021830] border rounded-[1.2rem] px-5 py-4 text-xs font-bold text-white outline-none transition-all shadow-inner placeholder:text-slate-500 ${telefono.length !== 10 && isSubmitting ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-white/10 focus:border-amber-400 focus:bg-[#042f56] focus:shadow-[0_0_20px_rgba(250,204,21,0.15)]'}`} 
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 pt-4 relative">
                
                <div className="flex justify-between items-end mb-6 relative z-10">
                  <span className="text-slate-900 font-black text-[11px] uppercase tracking-[0.25em] bg-white px-3.5 py-1.5 rounded-lg shadow-sm border border-slate-200">Total a Pagar</span>
                  <span className="font-black text-4xl sm:text-5xl text-white tracking-tighter drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] leading-none">{formatMXN(total)}</span>
                </div>
                
                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmOrder}
                  disabled={isSubmitting || !nombre.trim() || telefono.length !== 10 || Object.keys(stockErrors).length > 0}
                  className="w-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-slate-900 font-black py-6 rounded-[1.5rem] transition-all uppercase tracking-[0.2em] shadow-[0_15px_30px_rgba(250,204,21,0.3)] text-[11px] sm:text-xs flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale relative overflow-hidden group z-10 border border-yellow-200 hover:shadow-[0_20px_40px_rgba(250,204,21,0.5)] hover:border-white"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  {isSubmitting ? (
                    <><Loader2 size={20} className="animate-spin relative z-10" /> <span className="relative z-10 mt-0.5">Reservando en Mostrador...</span></>
                  ) : (
                    <><CheckCircle2 size={20} className="relative z-10 text-slate-900 group-hover:scale-110 transition-transform" /> <span className="relative z-10 mt-0.5">Confirmar Orden</span></>
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
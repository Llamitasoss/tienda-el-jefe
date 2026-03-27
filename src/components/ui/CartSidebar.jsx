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

  const total = useMemo(() => cartItems.reduce((acc, item) => acc + ((item.promoPrice || item.price) * item.qty), 0), [cartItems]);
  const progressPercent = Math.min((total / GOAL_AMOUNT) * 100, 100);
  const amountLeft = Math.max(GOAL_AMOUNT - total, 0);

  const formatMXN = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

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
              img: data.images?.[0] || data.image || "https://placehold.co/100x100/FBFBF2/0866bd?text=Item",
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
            animate={{ opacity: 1, backdropFilter: "blur(4px)" }} 
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }} 
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-[#021830]/70 z-[110]" 
            onClick={toggleCart} 
          />
        )}
      </AnimatePresence>
      
      {/* CÁPSULA DEL CARRITO (Zafiro Elegante) */}
      <div className={`fixed top-0 right-0 w-full sm:w-[420px] h-full bg-[#042f56] shadow-[-30px_0_80px_rgba(0,0,0,0.6)] z-[120] flex flex-col transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] border-l border-white/10 ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* HEADER DEL CARRITO (Limpieza y elegancia) */}
        <div className="px-5 py-4 bg-[#03254c] flex justify-between items-center border-b border-white/5 z-10 shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-[#FBFBF2] shadow-inner border border-white/10 backdrop-blur-md">
                <ShoppingBag size={20} className="mb-0.5 ml-0.5" strokeWidth={1.5}/>
              </div>
              <span className="absolute -bottom-1 -right-1 bg-[#EF4444] text-[#FBFBF2] text-[8px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#042f56] shadow-sm">
                {cartItems.length}
              </span>
            </div>
            <div>
              <h2 className="font-black text-[#FBFBF2] text-base uppercase tracking-tighter leading-none mb-1 drop-shadow-sm">Caja Rápida</h2>
              <p className="text-[8px] font-bold text-[#FACC15] uppercase tracking-widest flex items-center gap-1">
                <CheckCircle2 size={10} className="text-emerald-400 drop-shadow-sm"/> Pago Seguro
              </p>
            </div>
          </div>
          <button onClick={toggleCart} className="w-8 h-8 bg-white/5 border border-white/10 text-slate-300 rounded-full flex items-center justify-center hover:bg-white/10 hover:text-white transition-all hover:rotate-90 active:scale-90">
            <X size={16} strokeWidth={2}/>
          </button>
        </div>

        {/* BARRA GAMIFICADA (Progreso en Azul Brand) */}
        {!successMsg && cartItems.length > 0 && (
          <div className="bg-[#021830] px-5 py-4 shrink-0 relative overflow-hidden border-b border-white/5 shadow-inner">
            <div className="absolute top-[-50%] right-[-10%] w-32 h-32 bg-[#0866bd]/20 rounded-full blur-[30px] mix-blend-screen pointer-events-none"></div>
            
            <div className="flex justify-between items-end mb-2 relative z-10">
              <span className="text-[8px] font-black text-[#FBFBF2] uppercase tracking-widest flex items-center gap-1.5 drop-shadow-sm">
                <Sparkles size={10} className={progressPercent === 100 ? 'text-[#FACC15] animate-pulse' : 'text-[#0866bd]'}/>
                {progressPercent === 100 ? GOAL_MESSAGE_REACHED : 'Recompensa VIP'}
              </span>
              {progressPercent < 100 && (
                <span className="text-[8px] font-black text-[#021830] bg-[#FACC15] px-2 py-0.5 rounded border border-yellow-200 shadow-sm">
                  Faltan {formatMXN(amountLeft)}
                </span>
              )}
            </div>
            
            <div className="h-1.5 w-full bg-[#042f56] rounded-full overflow-hidden relative z-10 shadow-inner border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full transition-all duration-500 ${progressPercent === 100 ? 'bg-gradient-to-r from-amber-500 to-yellow-300 shadow-[0_0_10px_rgba(250,204,21,0.8)]' : 'bg-[#0866bd] shadow-[0_0_8px_rgba(8,102,189,0.8)]'}`}
              />
            </div>
          </div>
        )}
        
        {/* === ÁREA DE PRODUCTOS (Respirable) === */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar relative z-0">
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none"></div>

          <AnimatePresence mode="popLayout">
            {successMsg ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center py-10 relative z-10">
                <div className="w-20 h-20 bg-[#0866bd]/20 text-[#0866bd] rounded-full flex items-center justify-center mb-4 border border-[#0866bd]/40 backdrop-blur-md">
                   <CheckCircle2 size={40} strokeWidth={2}/>
                </div>
                <h3 className="font-black text-xl text-[#FBFBF2] uppercase tracking-tight mb-2">¡Orden Recibida!</h3>
                <p className="text-[#FBFBF2]/60 font-medium px-6 text-[11px] max-w-[220px] mb-5 leading-relaxed">Tu pedido ha sido apartado del inventario. Pasa a recogerlo a mostrador.</p>
                <div className="flex items-center gap-2 bg-[#03254c] px-4 py-2.5 rounded-lg border border-white/10 text-[9px] font-bold text-[#FBFBF2] uppercase tracking-widest shadow-inner">
                  <Loader2 size={12} className="animate-spin text-[#FACC15]" /> Preparando paquete...
                </div>
              </motion.div>
            ) : cartItems.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-32 text-center relative z-10 h-full">
                <div className="w-16 h-16 bg-white/5 rounded-[1.2rem] flex items-center justify-center mb-4 border border-white/10 backdrop-blur-sm shadow-inner">
                  <ShoppingBag size={28} className="text-[#FBFBF2]/30" strokeWidth={1.5} />
                </div>
                <h3 className="font-black text-lg text-[#FBFBF2] uppercase tracking-tight mb-2">Caja Vacía</h3>
                <p className="text-[10px] font-medium text-[#FBFBF2]/50 max-w-[180px] mb-6 leading-relaxed">No has agregado ninguna refacción a tu orden todavía.</p>
                <button onClick={toggleCart} className="bg-transparent border border-[#0866bd] text-[#0866bd] font-bold px-6 py-2.5 rounded-lg uppercase tracking-widest text-[9px] hover:bg-[#0866bd] hover:text-[#FBFBF2] transition-colors shadow-sm">Volver a la tienda</button>
              </motion.div>
            ) : (
              <>
                {cartItems.map((item) => {
                  const mainImg = item.images && item.images.length > 0 ? item.images[0] : (item.img || item.image || "https://placehold.co/100x100/FBFBF2/0866bd?text=Sin+Foto");
                  const error = stockErrors[item.id];
                  const isMaxReached = realTimeStock[item.id] !== undefined && item.qty >= realTimeStock[item.id];
                  
                  return (
                    <motion.div 
                      key={item.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                      className={`bg-[#021830] p-3 rounded-2xl shadow-md transition-all relative z-10 flex gap-3 group border ${error ? 'border-[#EF4444]' : 'border-white/5 hover:border-[#0866bd]/40'}`}
                    >
                      {/* Imagen compacta Premium */}
                      <div className="w-16 h-16 bg-[#FBFBF2] rounded-xl flex items-center justify-center shrink-0 relative group-hover:shadow-inner transition-shadow overflow-hidden">
                        {error && <div className="absolute inset-0 bg-[#EF4444]/20 z-10"></div>}
                        <img src={mainImg} alt={item.name} className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" />
                      </div>
                      
                      <div className="flex flex-col flex-1 py-0.5 justify-between">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <div className="flex flex-col">
                            <span className="text-[7px] font-black text-[#0866bd] uppercase tracking-widest mb-0.5 bg-[#0866bd]/10 w-max px-1.5 py-0.5 rounded border border-[#0866bd]/20">{item.sku || 'Refacción'}</span>
                            <h4 className="font-bold text-[10px] text-[#FBFBF2] leading-tight line-clamp-2 uppercase group-hover:text-[#0866bd] transition-colors">{item.name}</h4>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="text-[#FBFBF2]/30 hover:text-[#EF4444] transition-colors p-1 rounded-md hover:bg-[#EF4444]/10 shrink-0">
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <AnimatePresence>
                          {error && (
                            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-[8px] font-bold text-[#EF4444] flex items-center gap-1 mb-1">
                              <AlertCircle size={10} strokeWidth={2}/> {error}
                            </motion.p>
                          )}
                        </AnimatePresence>
                        
                        <div className="flex justify-between items-center mt-1">
                          <div className="flex flex-col gap-0.5">
                            {/* Ajuste de cantidad Zafiro Elegante */}
                            <div className={`flex items-center rounded-md overflow-hidden border shadow-inner ${isMaxReached ? 'border-orange-400/50 bg-orange-400/10' : 'border-white/10 bg-[#03254c]'}`}>
                              <button onClick={() => handleQtyChange(item, -1)} className="w-6 h-6 flex items-center justify-center text-[#FBFBF2]/60 hover:bg-[#0866bd] hover:text-[#FBFBF2] font-black transition-colors active:bg-blue-700">-</button>
                              <span className="w-6 text-center font-bold text-[10px] text-[#FBFBF2] border-x border-white/5 h-6 flex items-center justify-center">{item.qty}</span>
                              <button onClick={() => handleQtyChange(item, 1)} disabled={isMaxReached} className="w-6 h-6 flex items-center justify-center text-[#FBFBF2]/60 hover:bg-[#0866bd] hover:text-[#FBFBF2] font-black transition-colors disabled:opacity-30 disabled:bg-transparent">+</button>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end">
                            {(item.originalPrice || item.promoPrice) && (
                              <span className="text-[8px] text-[#EF4444]/80 line-through font-bold">{formatMXN(item.originalPrice || item.price)}</span>
                            )}
                            <span className="font-black text-sm text-[#FBFBF2] tracking-tighter leading-none">{formatMXN((item.promoPrice || item.price) * item.qty)}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                
                {/* === CROSS-SELLING COMPACTO (Acento Azul Brand) === */}
                <AnimatePresence>
                  {upsellItem && cartItems.length > 0 && cartItems.length < 4 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="mt-6 bg-[#0866bd]/10 border border-[#0866bd]/30 rounded-xl p-3 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 bg-[#0866bd] text-[#FBFBF2] text-[6px] font-black uppercase tracking-widest px-2 py-0.5 rounded-bl-md z-10 shadow-sm">
                        Sugerencia del Jefe
                      </div>
                      <div className="flex items-center gap-3 relative z-10 pt-1.5">
                        <img src={upsellItem.img} alt={upsellItem.name} className="w-10 h-10 rounded-lg object-contain bg-[#FBFBF2] p-1 shadow-inner" />
                        <div className="flex-1">
                          <h5 className="text-[9px] font-bold text-[#FBFBF2] uppercase tracking-tight leading-none line-clamp-1">{upsellItem.name}</h5>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[11px] font-black text-[#FACC15]">{formatMXN(upsellItem.price)}</span>
                            <button onClick={() => addToCart(upsellItem, 1)} className="bg-[#0866bd] text-[#FBFBF2] hover:bg-blue-600 px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1 transition-colors shadow-sm">
                              <Plus size={10} strokeWidth={3}/> Añadir
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
        
        {/* === FOOTER DEL CARRITO (CHECKOUT "GOLD STANDARD") === */}
        <AnimatePresence>
          {!successMsg && cartItems.length > 0 && (
            <motion.div 
              initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-[#03254c] border-t border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-20 shrink-0 relative rounded-tl-[2rem]"
            >
              
              {/* Subtotal Ligero */}
              <div className="px-5 py-3 border-b border-white/5 flex flex-col gap-1">
                <div className="flex justify-between items-center text-[9px] font-bold text-[#FBFBF2]/60 uppercase tracking-widest">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span className="text-[#FBFBF2]">{formatMXN(total)}</span>
                </div>
              </div>

              {/* Inputs (Zafiro Oscuro) */}
              <div className="p-5 pb-2">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 bg-white/5 text-[#0866bd] rounded border border-white/10 flex items-center justify-center shadow-inner"><User size={10} strokeWidth={2}/></div>
                  <span className="text-[8px] font-bold text-[#FBFBF2]/80 uppercase tracking-widest">Detalles de Recolección</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-1">
                  <input 
                    type="text" placeholder="Tu Nombre" value={nombre} onChange={e => setNombre(e.target.value)} 
                    className={`w-full bg-[#021830] border rounded-lg px-3 py-2.5 text-[11px] font-bold text-[#FBFBF2] outline-none transition-all placeholder:text-[#FBFBF2]/30 shadow-inner ${!nombre.trim() && isSubmitting ? 'border-[#EF4444]' : 'border-white/5 focus:border-[#0866bd]'}`} 
                  />
                  <input 
                    type="tel" placeholder="WhatsApp" value={telefono} onChange={handlePhoneChange} 
                    className={`w-full bg-[#021830] border rounded-lg px-3 py-2.5 text-[11px] font-bold text-[#FBFBF2] outline-none transition-all placeholder:text-[#FBFBF2]/30 shadow-inner ${telefono.length !== 10 && isSubmitting ? 'border-[#EF4444]' : 'border-white/5 focus:border-[#0866bd]'}`} 
                  />
                </div>
              </div>

              {/* Botón Final Gold Standard */}
              <div className="px-5 pb-5 pt-2 relative">
                <div className="flex justify-between items-end mb-3">
                  <span className="bg-[#FACC15] text-[#021830] font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded shadow-sm">Total a Pagar</span>
                  <span className="font-black text-3xl text-[#FBFBF2] tracking-tighter drop-shadow-md leading-none">{formatMXN(total)}</span>
                </div>
                
                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmOrder}
                  disabled={isSubmitting || !nombre.trim() || telefono.length !== 10 || Object.keys(stockErrors).length > 0}
                  className="w-full bg-gradient-to-r from-amber-500 via-[#FACC15] to-amber-500 text-[#021830] font-black py-3.5 rounded-xl transition-all uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(250,204,21,0.2)] text-[10px] flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale relative overflow-hidden group border border-yellow-200 hover:shadow-[0_15px_30px_rgba(250,204,21,0.3)]"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  {isSubmitting ? (
                    <><Loader2 size={16} className="animate-spin relative z-10" /> <span className="relative z-10 mt-0.5">Reservando...</span></>
                  ) : (
                    <><CheckCircle2 size={16} className="relative z-10 text-[#021830]" /> <span className="relative z-10 mt-0.5">Confirmar Orden</span></>
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
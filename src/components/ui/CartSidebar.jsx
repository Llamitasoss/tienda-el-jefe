import React, { useContext, useState, useEffect, useMemo } from 'react';
import { X, Trash2, ShoppingBag, User, Loader2, CheckCircle2, AlertCircle, Sparkles, Plus, Zap } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query, limit, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIGURACIÓN DE LA BARRA GAMIFICADA ---
const GOAL_AMOUNT = 1500; 
const GOAL_MESSAGE_REACHED = "¡Ganaste un lubricante de cadena GRATIS!";
const GOAL_MESSAGE_PENDING = "para llevarte un lubricante GRATIS";

export default function CartSidebar() {
  const { cartItems, isCartOpen, toggleCart, updateQty, removeFromCart, clearCart, addToCart } = useContext(CartContext);
  
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [stockErrors, setStockErrors] = useState({});
  const [realTimeStock, setRealTimeStock] = useState({});
  
  // NUEVO: Estado para el producto recomendado dinámico
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
  // Busca un producto real en Firebase para recomendar
  useEffect(() => {
    if (!isCartOpen || cartItems.length === 0) return;

    const fetchUpsellItem = async () => {
      setLoadingUpsell(true);
      try {
        // Buscamos productos que tengan stock (para no recomendar algo agotado)
        // Nota: Firestore requiere un índice compuesto si usas > y limit juntos, 
        // así que traemos algunos y filtramos en cliente para mantenerlo simple.
        const q = query(collection(db, "productos"), limit(10)); 
        const querySnapshot = await getDocs(q);
        
        let foundItem = null;
        
        for (const document of querySnapshot.docs) {
          const data = document.data();
          const stock = parseInt(data.stock) || 0;
          const isAlreadyInCart = cartItems.some(cartItem => cartItem.id === document.id);
          
          // Condición: Que tenga stock y no esté ya en el carrito
          if (stock > 0 && !isAlreadyInCart) {
            foundItem = {
              id: document.id,
              name: data.name || data.Nombre,
              price: data.promoPrice || data.price || data.Precio,
              sku: data.sku || data.Codigo || 'N/A',
              img: data.images?.[0] || data.image || "https://placehold.co/100x100/f8fafc/0866BD?text=Item",
              stock: stock
            };
            break; // Encontramos uno válido, nos detenemos
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
            className="fixed inset-0 bg-slate-900/70 z-[110]" 
            onClick={toggleCart} 
          />
        )}
      </AnimatePresence>
      
      <div className={`fixed top-0 right-0 w-full sm:w-[480px] h-full bg-[#f8fafc] shadow-[-20px_0_50px_rgba(0,0,0,0.3)] z-[120] flex flex-col transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* HEADER DEL CARRITO */}
        <div className="px-6 py-5 bg-white flex justify-between items-center border-b border-slate-100 z-10 shrink-0 shadow-[0_5px_15px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-tr from-yellow-500 to-yellow-300 rounded-[1.2rem] flex items-center justify-center text-slate-900 shadow-[0_5px_15px_rgba(250,204,21,0.4)] border border-yellow-200">
                <ShoppingBag size={24} className="mb-0.5 ml-0.5" strokeWidth={2.5}/>
              </div>
              <span className="absolute -bottom-1 -right-1 bg-slate-900 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {cartItems.length}
              </span>
            </div>
            <div>
              <h2 className="font-black text-slate-900 text-xl uppercase tracking-tighter leading-none mb-1">Caja Rápida</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <CheckCircle2 size={10} className="text-emerald-500"/> Pago Seguro
              </p>
            </div>
          </div>
          <button onClick={toggleCart} className="w-10 h-10 bg-slate-50 border border-slate-100 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all hover:rotate-90 active:scale-90 shadow-sm">
            <X size={18} strokeWidth={2.5}/>
          </button>
        </div>

        {/* === BARRA GAMIFICADA (PROGRESS BAR) === */}
        {!successMsg && cartItems.length > 0 && (
          <div className="bg-slate-900 px-6 py-4 shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-[40px]"></div>
            
            <div className="flex justify-between items-end mb-2 relative z-10">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles size={12} className={progressPercent === 100 ? 'text-yellow-400 animate-pulse' : 'text-blue-400'}/>
                {progressPercent === 100 ? GOAL_MESSAGE_REACHED : 'Recompensa Exclusiva'}
              </span>
              {progressPercent < 100 && (
                <span className="text-[10px] font-black text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-lg border border-yellow-400/20">
                  Faltan {formatMXN(amountLeft)}
                </span>
              )}
            </div>
            
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden relative z-10 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full transition-all duration-500 ${progressPercent === 100 ? 'bg-gradient-to-r from-yellow-500 to-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.8)]' : 'bg-gradient-to-r from-[#0866bd] to-cyan-400 shadow-[0_0_10px_rgba(8,102,189,0.5)]'}`}
              />
            </div>
            {progressPercent < 100 && <p className="text-[9px] text-slate-400 mt-2 text-center uppercase tracking-widest relative z-10">{GOAL_MESSAGE_PENDING}</p>}
          </div>
        )}
        
        {/* LISTA DE PRODUCTOS */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 space-y-4 custom-scrollbar relative">
          
          <div className="absolute top-20 left-[-10%] w-[120%] h-[50%] bg-[linear-gradient(rgba(8,102,189,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(8,102,189,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

          <AnimatePresence mode="popLayout">
            {successMsg ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center py-10 relative z-10">
                <div className="w-28 h-28 bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner border border-emerald-200">
                   <CheckCircle2 size={56} strokeWidth={2.5}/>
                </div>
                <h3 className="font-black text-3xl text-slate-800 uppercase tracking-tight mb-3">¡Orden Recibida!</h3>
                <p className="text-slate-500 font-medium px-8 leading-relaxed max-w-sm mb-6">Tu pedido ha sido apartado de inventario. Pasa a recogerlo cuando gustes.</p>
                <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl border border-slate-100 shadow-sm text-xs font-bold text-slate-400">
                  <Loader2 size={16} className="animate-spin text-[#0866bd]" /> Preparando tu paquete...
                </div>
              </motion.div>
            ) : cartItems.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-32 text-center relative z-10 h-full">
                <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                  <ShoppingBag size={40} className="text-slate-200" />
                </div>
                <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight mb-2">Caja Vacía</h3>
                <p className="text-sm font-medium text-slate-500 max-w-[200px] mb-8">No has agregado ninguna refacción a tu orden todavía.</p>
                <button onClick={toggleCart} className="bg-slate-900 text-white font-black px-8 py-4 rounded-2xl uppercase tracking-[0.2em] text-[10px] hover:bg-[#0866bd] transition-colors shadow-lg">Volver a la tienda</button>
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
                      className={`bg-white p-4 rounded-[1.5rem] shadow-[0_10px_20px_rgba(0,0,0,0.02)] border transition-all relative z-10 flex gap-4 sm:gap-5 group hover:shadow-[0_15px_30px_rgba(8,102,189,0.06)] hover:border-blue-100 ${error ? 'border-red-300 bg-red-50/30' : 'border-slate-100'}`}
                    >
                      <div className="w-24 h-24 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-100 p-2 flex items-center justify-center overflow-hidden shrink-0 relative group-hover:bg-blue-50/50 transition-colors">
                        {error && <div className="absolute inset-0 bg-red-500/10 z-10 pointer-events-none"></div>}
                        <img src={mainImg} alt={item.name} className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500" />
                      </div>
                      
                      <div className="flex flex-col flex-1 py-0.5">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-[#0866bd] uppercase tracking-[0.2em] mb-0.5 bg-blue-50 w-max px-2 py-0.5 rounded-md border border-blue-100">{item.sku || 'Refacción'}</span>
                            <h4 className="font-black text-xs text-slate-800 leading-snug line-clamp-2 uppercase tracking-tight">{item.name}</h4>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors bg-white hover:bg-red-50 p-2 rounded-xl border border-slate-100 hover:border-red-100 shrink-0 shadow-sm active:scale-90">
                            <Trash2 size={16} />
                          </button>
                        </div>

                        <AnimatePresence>
                          {error && (
                            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-[10px] font-bold text-red-500 flex items-center gap-1 mt-1 bg-red-50 p-1.5 rounded-lg border border-red-100">
                              <AlertCircle size={12} /> {error}
                            </motion.p>
                          )}
                        </AnimatePresence>
                        
                        <div className="flex justify-between items-end mt-auto pt-3">
                          <div className="flex items-start flex-col gap-1">
                            <div className={`flex items-center rounded-xl overflow-hidden border transition-colors shadow-sm ${isMaxReached ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-slate-50'}`}>
                              <button onClick={() => handleQtyChange(item, -1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 font-medium transition-colors active:bg-slate-300">-</button>
                              <span className="w-8 text-center font-black text-xs text-slate-800 bg-white border-x border-slate-200 h-8 flex items-center justify-center">{item.qty}</span>
                              <button onClick={() => handleQtyChange(item, 1)} disabled={isMaxReached} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 font-medium transition-colors disabled:opacity-30 disabled:hover:bg-transparent active:bg-slate-300">+</button>
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
                
                {/* === CROSS-SELLING DINÁMICO DESDE FIREBASE === */}
                <AnimatePresence>
                  {upsellItem && cartItems.length > 0 && cartItems.length < 4 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ delay: 0.3 }}
                      className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-[1.5rem] p-4 relative overflow-hidden"
                    >
                      {loadingUpsell && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-[#0866bd]" /></div>}
                      
                      <div className="absolute top-0 right-0 bg-blue-500 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl z-10">
                        Sugerencia del Jefe
                      </div>
                      <div className="flex items-center gap-4 relative z-10 pt-2">
                        <img src={upsellItem.img} alt={upsellItem.name} className="w-16 h-16 rounded-xl object-contain bg-white border border-blue-100 p-1.5 shadow-sm mix-blend-multiply" />
                        <div className="flex-1">
                          <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-tight leading-snug line-clamp-1">{upsellItem.name}</h5>
                          <p className="text-[10px] text-slate-500 font-bold mt-0.5 uppercase tracking-widest">SKU: {upsellItem.sku}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-black text-[#0866bd] tracking-tighter">{formatMXN(upsellItem.price)}</span>
                            <button 
                              onClick={() => addToCart(upsellItem, 1)}
                              className="bg-white border border-blue-200 text-[#0866bd] hover:bg-[#0866bd] hover:text-white hover:border-[#0866bd] p-1.5 rounded-lg transition-all shadow-sm active:scale-95 flex items-center gap-1"
                            >
                              <Plus size={16} strokeWidth={3}/> <span className="text-[10px] font-black pr-1">Agregar</span>
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
        
        {/* === FOOTER DEL CARRITO (CHECKOUT TOP-TIER) === */}
        <AnimatePresence>
          {!successMsg && cartItems.length > 0 && (
            <motion.div 
              initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white border-t border-slate-100 shadow-[0_-20px_50px_rgba(0,0,0,0.06)] z-20 shrink-0 relative"
            >
              
              <div className="px-6 py-4 border-b border-slate-50 flex flex-col gap-2 bg-slate-50/50">
                <div className="flex justify-between items-center text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span>{formatMXN(total)}</span>
                </div>
                {progressPercent === 100 && (
                  <div className="flex justify-between items-center text-[11px] font-black text-emerald-500 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><Zap size={12}/> Recompensa Aplicada</span>
                    <span>GRATIS</span>
                  </div>
                )}
              </div>

              <div className="p-6 pb-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-blue-50 text-[#0866bd] rounded-lg flex items-center justify-center border border-blue-100"><User size={12} strokeWidth={3}/></div>
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Detalles de Recolección</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div className="relative group">
                    <input 
                      type="text" 
                      placeholder="Tu Nombre" 
                      value={nombre} 
                      onChange={e => setNombre(e.target.value)} 
                      className={`w-full bg-slate-50 border-2 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-800 outline-none transition-all shadow-inner ${!nombre.trim() && isSubmitting ? 'border-red-300 bg-red-50' : 'border-slate-100 focus:border-[#0866bd] focus:bg-white focus:shadow-[0_0_15px_rgba(8,102,189,0.1)]'}`} 
                    />
                  </div>
                  <div className="relative group">
                    <input 
                      type="tel" 
                      placeholder="WhatsApp" 
                      value={telefono} 
                      onChange={handlePhoneChange} 
                      className={`w-full bg-slate-50 border-2 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-800 outline-none transition-all shadow-inner ${telefono.length !== 10 && isSubmitting ? 'border-red-300 bg-red-50' : 'border-slate-100 focus:border-[#0866bd] focus:bg-white focus:shadow-[0_0_15px_rgba(8,102,189,0.1)]'}`} 
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 pt-4 bg-white relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-full blur-[40px] pointer-events-none"></div>
                
                <div className="flex justify-between items-end mb-5 relative z-10">
                  <span className="text-slate-400 font-black text-[11px] uppercase tracking-[0.2em] bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">Total</span>
                  <span className="font-black text-4xl sm:text-5xl text-slate-900 tracking-tighter drop-shadow-sm leading-none">{formatMXN(total)}</span>
                </div>
                
                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmOrder}
                  disabled={isSubmitting || !nombre.trim() || telefono.length !== 10 || Object.keys(stockErrors).length > 0}
                  className="w-full bg-gradient-to-tr from-slate-900 via-slate-800 to-black text-yellow-400 font-black py-5 rounded-[1.5rem] transition-all uppercase tracking-[0.2em] shadow-[0_15px_30px_rgba(0,0,0,0.2)] text-[11px] flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale relative overflow-hidden group z-10"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out"></div>
                  {isSubmitting ? (
                    <><Loader2 size={20} className="animate-spin relative z-10" /> <span className="relative z-10 mt-0.5">Reservando en Mostrador...</span></>
                  ) : (
                    <><CheckCircle2 size={20} className="relative z-10 text-yellow-400 group-hover:scale-110 transition-transform" /> <span className="relative z-10 mt-0.5">Confirmar Orden</span></>
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
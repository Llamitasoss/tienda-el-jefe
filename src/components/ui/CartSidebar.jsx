import React, { useContext, useState, useEffect } from 'react';
import { X, Trash2, ShoppingBag, User, Phone, Loader2, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartSidebar() {
  const { cartItems, isCartOpen, toggleCart, updateQty, removeFromCart, clearCart } = useContext(CartContext);
  
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [stockErrors, setStockErrors] = useState({});
  const [realTimeStock, setRealTimeStock] = useState({});

  // Calcular totales
  const total = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

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
            const currentStock = docSnap.data().stock;
            stockData[item.id] = currentStock;
            
            // Si el cliente pide más de lo que hay, marcamos error
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

  const handlePhoneChange = (e) => {
    // Solo permitir números y máximo 10 dígitos para WhatsApp México
    const onlyNums = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    setTelefono(onlyNums);
  };

  const handleConfirmOrder = async () => {
    if (!nombre.trim() || telefono.length !== 10) return;

    // Verificar si hay errores de stock antes de enviar
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
          price: item.price,
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
    
    // Si intenta agregar más del stock disponible, lo bloqueamos
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110]" 
            onClick={toggleCart} 
          />
        )}
      </AnimatePresence>
      
      <div className={`fixed top-0 right-0 w-full sm:w-[480px] h-full bg-[#f8fafc] shadow-[0_0_50px_rgba(0,0,0,0.3)] z-[120] flex flex-col transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* HEADER DEL CARRITO */}
        <div className="px-6 py-5 bg-white flex justify-between items-center border-b border-slate-100 z-10 shrink-0 shadow-[0_10px_20px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-slate-900 shadow-sm">
              <ShoppingBag size={20} className="mb-0.5 ml-0.5" />
            </div>
            <div>
              <h2 className="font-black text-slate-800 text-lg uppercase tracking-widest leading-none">Tu Caja</h2>
              <p className="text-[10px] font-bold text-[#0866bd] uppercase tracking-widest mt-1">
                {cartItems.length} {cartItems.length === 1 ? 'Pieza' : 'Piezas'}
              </p>
            </div>
          </div>
          <button onClick={toggleCart} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all hover:rotate-90">
            <X size={20} />
          </button>
        </div>
        
        {/* LISTA DE PRODUCTOS */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-4 custom-scrollbar relative">
          
          {/* Fondo Decorativo Sutil */}
          <div className="absolute top-20 right-10 w-64 h-64 bg-[#0866bd]/5 rounded-full blur-[80px] pointer-events-none"></div>

          <AnimatePresence mode="popLayout">
            {successMsg ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center py-10 relative z-10">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner border border-emerald-200">
                   <CheckCircle2 size={48} />
                </div>
                <h3 className="font-black text-3xl text-slate-800 uppercase tracking-tight mb-3">¡Orden Recibida!</h3>
                <p className="text-slate-500 font-medium px-8 leading-relaxed max-w-sm">Tu pedido ha sido apartado de inventario. {successMsg}</p>
                <Loader2 size={24} className="animate-spin text-slate-300 mt-10" />
              </motion.div>
            ) : cartItems.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-32 text-center relative z-10">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                  <ShoppingBag size={40} className="text-slate-200" />
                </div>
                <h3 className="font-black text-xl text-slate-800 uppercase tracking-tight mb-2">Caja Vacía</h3>
                <p className="text-sm font-medium text-slate-500 max-w-[200px]">Explora el catálogo y agrega refacciones a tu orden.</p>
              </motion.div>
            ) : (
              cartItems.map((item) => {
                const mainImg = item.images && item.images.length > 0 ? item.images[0] : (item.img || item.image || "https://placehold.co/100x100/f8fafc/0866BD?text=Sin+Foto");
                const error = stockErrors[item.id];
                const isMaxReached = realTimeStock[item.id] !== undefined && item.qty >= realTimeStock[item.id];
                
                return (
                  <motion.div 
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    className={`bg-white p-4 rounded-[1.5rem] shadow-[0_5px_15px_rgba(0,0,0,0.02)] border transition-all relative z-10 flex gap-5 group hover:shadow-md ${error ? 'border-red-300 bg-red-50/30' : 'border-slate-100'}`}
                  >
                    {/* Imagen */}
                    <div className="w-24 h-24 bg-slate-50/50 rounded-xl border border-slate-100 p-2 flex items-center justify-center overflow-hidden shrink-0 relative">
                      {error && <div className="absolute inset-0 bg-red-500/10 z-10 pointer-events-none"></div>}
                      <img src={mainImg} alt={item.name} className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    
                    {/* Info */}
                    <div className="flex flex-col flex-1 py-1">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.sku || 'Refacción'}</span>
                          <h4 className="font-bold text-xs text-slate-800 leading-snug line-clamp-2">{item.name}</h4>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors bg-white hover:bg-red-50 p-2 rounded-lg border border-slate-100 hover:border-red-100 shrink-0">
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Mensaje de Error de Stock */}
                      <AnimatePresence>
                        {error && (
                          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-[10px] font-bold text-red-500 flex items-center gap-1 mt-2">
                            <AlertCircle size={10} /> {error}
                          </motion.p>
                        )}
                      </AnimatePresence>
                      
                      <div className="flex justify-between items-end mt-auto pt-4">
                        {/* Selector Numérico Compacto */}
                        <div className="flex items-center flex-col items-start gap-1">
                          <div className={`flex items-center rounded-xl overflow-hidden border transition-colors ${isMaxReached ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-slate-50'}`}>
                            <button onClick={() => handleQtyChange(item, -1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 font-medium transition-colors">-</button>
                            <span className="w-8 text-center font-black text-xs text-[#0866bd] bg-white border-x border-slate-200 h-8 flex items-center justify-center">{item.qty}</span>
                            {/* Corregido el signo de más aquí */}
                            <button onClick={() => handleQtyChange(item, 1)} disabled={isMaxReached} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 font-medium transition-colors disabled:opacity-30 disabled:hover:bg-transparent">+</button>
                          </div>
                          {isMaxReached && <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest pl-1">Límite Máximo</span>}
                        </div>
                        
                        <span className="font-black text-lg text-slate-900 tracking-tight">{formatMXN(item.price * item.qty)}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
        
        {/* === FOOTER DEL CARRITO (CHECKOUT STICKY) === */}
        <AnimatePresence>
          {!successMsg && cartItems.length > 0 && (
            <motion.div 
              initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white border-t border-slate-100 shadow-[0_-20px_40px_rgba(0,0,0,0.04)] z-20 shrink-0"
            >
              
              {/* Formulario de Contacto Compacto */}
              <div className="p-6 pb-4 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-3">
                  <User size={14} className="text-[#0866bd]"/>
                  <span className="text-[10px] font-black text-[#0866bd] uppercase tracking-widest">Datos para Envío/Recolección</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative group">
                    <input 
                      type="text" 
                      placeholder="Tu Nombre o Taller" 
                      value={nombre} 
                      onChange={e => setNombre(e.target.value)} 
                      className={`w-full bg-white border-2 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-800 outline-none transition-all shadow-sm ${!nombre.trim() && isSubmitting ? 'border-red-300' : 'border-slate-200 focus:border-[#0866bd]'}`} 
                    />
                  </div>
                  <div className="relative group">
                    <input 
                      type="tel" 
                      placeholder="WhatsApp (10 díg.)" 
                      value={telefono} 
                      onChange={handlePhoneChange} 
                      className={`w-full bg-white border-2 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-800 outline-none transition-all shadow-sm ${telefono.length !== 10 && isSubmitting ? 'border-red-300' : 'border-slate-200 focus:border-[#0866bd]'}`} 
                    />
                  </div>
                </div>
              </div>

              {/* Totales y Botón de Pago */}
              <div className="p-6 pt-4 bg-white">
                <div className="flex justify-between items-end mb-6">
                  <div className="flex flex-col">
                    <span className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1">Total a pagar</span>
                    <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded w-max">IVA Incluido</span>
                  </div>
                  <span className="font-black text-4xl text-[#0866bd] tracking-tighter drop-shadow-sm">{formatMXN(total)}</span>
                </div>
                
                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmOrder}
                  disabled={isSubmitting || !nombre.trim() || telefono.length !== 10 || Object.keys(stockErrors).length > 0}
                  className="w-full bg-gradient-to-r from-slate-800 to-slate-900 hover:from-black hover:to-black text-yellow-400 font-black py-5 rounded-2xl transition-all uppercase tracking-widest shadow-[0_10px_20px_rgba(0,0,0,0.1)] text-xs flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                  {isSubmitting ? (
                    <><Loader2 size={18} className="animate-spin relative z-10" /> <span className="relative z-10">Procesando...</span></>
                  ) : (
                    <span className="relative z-10 flex items-center gap-2">Confirmar Pedido <ChevronRight size={16} /></span>
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
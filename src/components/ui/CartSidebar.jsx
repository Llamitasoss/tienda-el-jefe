import React, { useContext, useState } from 'react';
import { X, Trash2, ShoppingBag, User, Phone, Loader2, CheckCircle2 } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function CartSidebar() {
  const { cartItems, isCartOpen, toggleCart, updateQty, removeFromCart } = useContext(CartContext);
  
  // Estados para el formulario del cliente
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Calcula el total sumando el precio * cantidad de cada item
  const total = cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0);

  const formatMXN = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  const handleConfirmOrder = async () => {
    if (!nombre.trim() || !telefono.trim()) {
      alert("Por favor, ingresa tu nombre y WhatsApp para contactarte.");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        cliente: nombre.toUpperCase(),
        telefono: telefono,
        items: cartItems.reduce((acc, item) => acc + item.qty, 0), // Cantidad total de piezas
        total: total, // Enviamos el número para cálculos en el panel
        status: 'nuevo',
        detalle: cartItems.map(item => ({ 
          id: item.id, 
          name: item.name, 
          qty: item.qty, 
          price: item.price 
        })),
        time: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        createdAt: serverTimestamp()
      };

      // Guardar en la colección "pedidos" de tu Firebase
      await addDoc(collection(db, "pedidos"), orderData);
      
      setSuccessMsg('¡Pedido enviado! Te contactaremos por WhatsApp.');
      
      // Limpiar y cerrar después de 3 segundos
      setTimeout(() => {
        cartItems.forEach(item => removeFromCart(item.id)); // Vaciamos el carrito
        setNombre('');
        setTelefono('');
        setSuccessMsg('');
        toggleCart();
      }, 3000);

    } catch (error) {
      console.error("Error al guardar el pedido:", error);
      alert("Hubo un error al procesar tu pedido. Intenta nuevamente.");
    }
    
    setIsSubmitting(false);
  };

  return (
    <>
      {isCartOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110]" 
          onClick={toggleCart} 
        />
      )}
      
      <div className={`fixed top-0 right-0 w-full sm:w-[450px] h-full bg-white shadow-2xl z-[120] flex flex-col transform transition-transform duration-300 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="p-5 bg-[#0866bd] text-white flex justify-between items-center shadow-md z-10">
          <h2 className="font-bold text-xl uppercase tracking-widest flex items-center">
            <ShoppingBag className="text-yellow-400 mr-3" /> Tu Caja
          </h2>
          <button onClick={toggleCart} className="hover:text-red-300 transition-colors p-1">
            <X size={24} className="hover:rotate-90 transition-transform" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50 space-y-4 custom-scrollbar">
          {successMsg ? (
            <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                 <CheckCircle2 size={40} />
              </div>
              <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight mb-2">¡Orden Recibida!</h3>
              <p className="text-slate-500 font-medium px-4">{successMsg}</p>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
              <ShoppingBag size={64} className="text-slate-200 mb-4" />
              <h3 className="font-black text-xl text-slate-600 uppercase tracking-widest mb-1">Caja Vacía</h3>
              <p className="text-sm font-medium text-slate-400">¡Agrega piezas a tu orden!</p>
            </div>
          ) : (
            cartItems.map((item) => {
              // Leer la primera imagen de la galería, si existe
              const mainImg = item.images && item.images.length > 0 ? item.images[0] : (item.img || item.image || "[https://placehold.co/100x100/f8fafc/0866BD?text=Sin+Foto](https://placehold.co/100x100/f8fafc/0866BD?text=Sin+Foto)");
              
              return (
                <div key={item.id} className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex gap-4 animate-fade-in group">
                  <div className="w-20 h-20 bg-slate-50 rounded-xl border border-slate-100 p-2 flex items-center justify-center overflow-hidden shrink-0">
                    <img src={mainImg} alt={item.name} className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-xs text-slate-800 leading-tight line-clamp-2 pr-2">{item.name}</h4>
                      <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors bg-slate-50 hover:bg-red-50 p-1.5 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex justify-between items-center mt-auto pt-2">
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                        <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 text-slate-500 hover:bg-slate-200 font-black transition-colors">-</button>
                        <span className="w-8 text-center font-bold text-xs text-[#0866bd] bg-white border-x border-slate-200 h-8 flex items-center justify-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 text-slate-500 hover:bg-slate-200 font-black transition-colors">+</button>
                      </div>
                      <span className="font-black text-sm text-slate-800">{formatMXN(item.price * item.qty)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* Footer del Carrito con Formulario Integrado */}
        {!successMsg && cartItems.length > 0 && (
          <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-10px_20px_rgba(0,0,0,0.02)] z-10">
            
            <div className="space-y-3 mb-5 border-b border-slate-100 pb-5">
              <p className="text-[10px] font-black text-[#0866bd] uppercase tracking-widest flex items-center gap-2 mb-2">
                <User size={14}/> Datos de Contacto
              </p>
              <div className="flex bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#0866bd] transition-colors">
                <div className="w-10 flex items-center justify-center text-slate-400 bg-white border-r border-slate-200"><User size={16}/></div>
                <input type="text" placeholder="Tu Nombre o Taller..." value={nombre} onChange={e => setNombre(e.target.value)} className="w-full px-3 py-2.5 text-sm outline-none bg-transparent font-medium" />
              </div>
              <div className="flex bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#0866bd] transition-colors">
                <div className="w-10 flex items-center justify-center text-slate-400 bg-white border-r border-slate-200"><Phone size={16}/></div>
                <input type="tel" placeholder="WhatsApp (10 dígitos)" value={telefono} onChange={e => setTelefono(e.target.value)} className="w-full px-3 py-2.5 text-sm outline-none bg-transparent font-medium" />
              </div>
            </div>

            <div className="flex justify-between items-end mb-4">
              <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Total a pagar</span>
              <span className="font-black text-3xl text-[#0866bd] tracking-tighter">{formatMXN(total)}</span>
            </div>
            
            <button 
              onClick={handleConfirmOrder}
              disabled={isSubmitting || !nombre.trim() || !telefono.trim()}
              className="w-full bg-[#111827] text-yellow-400 hover:text-slate-900 hover:bg-yellow-400 font-black py-4 rounded-xl transition-all uppercase tracking-widest shadow-xl active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Confirmar Pedido'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

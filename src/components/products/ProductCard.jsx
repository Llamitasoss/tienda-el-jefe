import React, { useContext } from 'react';
import { ShoppingCart, Zap } from 'lucide-react'; // <-- Agregamos el icono Zap
import { CartContext } from '../../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useContext(CartContext);
  
  const mainImg = product.images && product.images.length > 0 
    ? product.images[0] 
    : (product.img || product.image || "https://placehold.co/300x300/f8fafc/0866BD?text=Sin+Foto");

  const formatMXN = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  // --- MAGIA 3: LIMPIEZA DE NOMBRE PARA PIEZAS UNIVERSALES ---
  const isUniversal = product.isUniversal === true || (product.name || "").toLowerCase().includes('universal');
  const cleanName = isUniversal ? product.name.replace(/universal/gi, '').trim() : product.name;

  return (
    <div className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 hover:border-[#bae6fd] transition-all duration-300 group flex flex-col h-full cursor-pointer">
      <div className="relative aspect-square bg-slate-50 rounded-xl mb-4 p-4 flex items-center justify-center overflow-hidden mix-blend-multiply">
        
        {/* Contenedor de Etiquetas (Hot / Universal) */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {(product.isHot || product.promoPrice) && (
            <span className="bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest animate-pulse shadow-sm w-max">
              HOT
            </span>
          )}
          
          {/* ETIQUETA VISUAL PREMIUM PARA UNIVERSALES */}
          {isUniversal && (
            <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-widest shadow-sm flex items-center gap-1 w-max">
              <Zap size={10} /> Plug & Play
            </span>
          )}
        </div>
        
        <img 
          src={mainImg} 
          alt={cleanName} 
          className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-500" 
        />
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product);
          }}
          className="absolute -bottom-12 right-2 group-hover:bottom-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-400 hover:scale-110 active:scale-95"
          title="Agregar al Carrito"
        >
          <ShoppingCart size={18} />
        </button>
      </div>
      
      <div className="flex flex-col flex-grow px-1">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 line-clamp-1">{product.category}</p>
        <h3 className="font-bold text-[#0866bd] text-sm leading-tight mb-2 line-clamp-2 group-hover:text-blue-800 transition-colors" title={cleanName}>
          {cleanName}
        </h3>
        
        <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
          <div className="flex flex-col">
            {(product.originalPrice || product.promoPrice) && (
              <span className="text-[10px] text-red-400 line-through font-bold mb-0.5">
                {formatMXN(product.originalPrice || product.price)}
              </span>
            )}
            <span className="text-xl sm:text-2xl font-black text-[#0866bd] tracking-tighter">
              {formatMXN(product.promoPrice || product.price)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
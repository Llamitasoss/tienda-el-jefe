import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Zap, Flame } from 'lucide-react';
import { CartContext } from '../../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();
  
  const mainImg = product.images && product.images.length > 0 
    ? product.images[0] 
    : (product.img || product.image || "https://placehold.co/300x300/f8fafc/0866BD?text=Sin+Foto");

  const formatMXN = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  // Limpieza de nombre para piezas universales
  const isUniversal = product.isUniversal === true || (product.name || "").toLowerCase().includes('universal');
  const cleanName = isUniversal ? product.name.replace(/universal/gi, '').trim() : product.name;
  
  // Validamos si tiene descuento/promo
  const isHot = product.isHot || product.promoPrice;

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={() => navigate(`/producto/${product.id}`)}
     className="w-full bg-white rounded-[1.5rem] sm:rounded-[2rem] p-3 sm:p-4 border border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(8,102,189,0.08)] hover:border-blue-100 transition-colors duration-300 group flex flex-col h-full cursor-pointer relative overflow-hidden"
    >
      {/* === CONTENEDOR DE IMAGEN === */}
      <div className="relative aspect-square bg-gradient-to-tr from-slate-50 to-slate-100/50 group-hover:from-blue-50/50 group-hover:to-blue-100/30 rounded-xl sm:rounded-[1.5rem] mb-4 p-4 sm:p-6 flex items-center justify-center overflow-hidden transition-colors duration-500">
        
        {/* ETIQUETAS FLOTANTES */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1.5 z-20">
          {isHot && (
            <span className="bg-red-500/90 backdrop-blur-md text-white text-[8px] sm:text-[9px] font-black px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg uppercase tracking-widest flex items-center gap-1 shadow-[0_5px_10px_rgba(239,68,68,0.3)] w-max">
              <Flame size={10} className="animate-pulse" /> HOT
            </span>
          )}
          
          {isUniversal && (
            <span className="bg-emerald-500/90 backdrop-blur-md text-white text-[8px] sm:text-[9px] font-black px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg uppercase tracking-widest flex items-center gap-1 shadow-[0_5px_10px_rgba(16,185,129,0.3)] w-max">
              <Zap size={10} /> Plug & Play
            </span>
          )}
        </div>
        
        {/* IMAGEN DEL PRODUCTO */}
        <div className="w-full h-full relative z-10 flex items-center justify-center">
          <img 
            src={mainImg} 
            alt={cleanName} 
            className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700 ease-out drop-shadow-sm" 
          />
        </div>
        
        {/* BOTÓN DE CARRITO (Siempre visible en Móvil, Hover en Desktop) */}
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation(); // Evita que al dar clic al carrito, te lleve a la página del producto
            addToCart(product);
          }}
          className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 translate-y-0 opacity-100 lg:translate-y-12 lg:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-[0_10px_20px_rgba(250,204,21,0.4)] transition-all duration-300 z-20 hover:shadow-[0_10px_25px_rgba(250,204,21,0.6)] border border-yellow-300/50"
          title="Agregar al Carrito"
        >
          <ShoppingCart size={18} className="sm:w-5 sm:h-5 ml-[-2px]" />
        </motion.button>
      </div>
      
      {/* === INFORMACIÓN DEL PRODUCTO === */}
      <div className="flex flex-col flex-grow px-1 sm:px-2 pb-1 sm:pb-2">
        <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5 line-clamp-1 group-hover:text-[#0866bd]/70 transition-colors">
          {product.category}
        </p>
        
        <h3 className="font-black text-slate-800 text-xs sm:text-sm leading-snug mb-3 line-clamp-2 group-hover:text-[#0866bd] transition-colors" title={cleanName}>
          {cleanName}
        </h3>
        
        <div className="mt-auto pt-3 border-t border-slate-100/80 flex items-end justify-between">
          <div className="flex flex-col">
            {(product.originalPrice || product.promoPrice) ? (
              <>
                <span className="text-[9px] sm:text-[10px] text-red-400/80 line-through font-bold mb-0.5 tracking-wide">
                  {formatMXN(product.originalPrice || product.price)}
                </span>
                <span className="text-lg sm:text-xl font-black text-[#0866bd] tracking-tighter">
                  {formatMXN(product.promoPrice || product.price)}
                </span>
              </>
            ) : (
              <span className="text-lg sm:text-xl font-black text-[#0866bd] tracking-tighter mt-4">
                {formatMXN(product.price)}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
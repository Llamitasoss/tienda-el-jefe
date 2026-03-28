import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Zap, Flame, Star, ArrowUpRight } from 'lucide-react';
import { CartContext } from '../../context/CartContext';

export default function ProductCard({ product }) {
  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();
  
  const mainImg = product.images && product.images.length > 0 
    ? product.images[0] 
    : (product.img || product.image || "https://placehold.co/300x300/FBFBF2/0866bd?text=Sin+Foto");

  const formatMXN = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  const isUniversal = product.isUniversal === true || (product.name || "").toLowerCase().includes('universal');
  const cleanName = isUniversal ? product.name.replace(/universal/gi, '').trim() : product.name;
  const isHot = product.isHot || product.promoPrice;

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={() => navigate(`/producto/${product.id}`)}
      className="w-full bg-white/90 backdrop-blur-xl rounded-[2rem] p-3 sm:p-4 border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(8,102,189,0.08)] hover:border-[#0866bd]/20 hover:bg-white transition-all duration-500 group/card flex flex-col h-full cursor-pointer relative overflow-hidden"
    >
      {/* === RESPLANDOR DE FONDO (Azul Brand Hover) === */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[#0866bd]/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

      {/* === CONTENEDOR DE IMAGEN (VITRINA LIGHT PREMIUM) === */}
      <div className="relative aspect-square bg-slate-50 group-hover/card:bg-blue-50/30 rounded-[1.5rem] mb-4 p-5 flex items-center justify-center transition-colors duration-700 overflow-hidden border border-slate-100 group-hover/card:border-[#0866bd]/10">
        
        {/* Orbe de luz interior que se expande */}
        <div className="absolute inset-0 bg-[#0866bd]/0 group-hover/card:bg-[#0866bd]/5 rounded-full blur-2xl transition-all duration-700 scale-50 group-hover/card:scale-150 pointer-events-none"></div>

        {/* ETIQUETAS FLOTANTES (Neon Glow Elegante) */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-20">
          {isHot && (
            <span className="bg-red-50 backdrop-blur-md border border-red-200 text-[#EF4444] text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-[0.2em] flex items-center gap-1 shadow-sm w-max">
              <Flame size={10} className="animate-pulse" /> Oferta
            </span>
          )}
          {isUniversal && (
            <span className="bg-blue-50 backdrop-blur-md border border-blue-200 text-[#0866bd] text-[8px] font-black px-2.5 py-1 rounded-lg uppercase tracking-[0.2em] flex items-center gap-1 shadow-sm w-max">
              <Zap size={10} className="fill-current" /> Universal
            </span>
          )}
        </div>
        
        {/* IMAGEN DEL PRODUCTO CON FÍSICA LEVITANTE */}
        <div className="w-full h-full relative z-10 flex items-center justify-center p-2">
          <img 
            src={mainImg} 
            alt={cleanName} 
            className="max-w-full max-h-full object-contain mix-blend-multiply group-hover/card:scale-110 group-hover/card:-translate-y-2 group-hover/card:rotate-2 transition-all duration-700 ease-out" 
          />
        </div>
        
        {/* === BOTÓN DE CARRITO (ORO MACIZO FINO) === */}
        <div className="absolute bottom-2.5 right-2.5 translate-y-0 opacity-100 lg:translate-y-12 lg:opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-20">
          <motion.button 
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation(); 
              addToCart(product);
            }}
            className="bg-gradient-to-tr from-[#FACC15] to-yellow-300 text-[#021830] w-10 h-10 rounded-xl flex items-center justify-center shadow-[0_5px_15px_rgba(250,204,21,0.3)] hover:shadow-[0_10px_25px_rgba(250,204,21,0.5)] border border-yellow-200 transition-all duration-300 relative overflow-hidden group/btn"
            title="Añadir a mi orden"
          >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] group-hover/btn:bg-[position:200%_0,0_0] transition-[background-position] duration-[1s]"></div>
            <ShoppingCart size={16} strokeWidth={2.5} className="relative z-10 group-hover/btn:scale-110 transition-transform" />
          </motion.button>
        </div>
      </div>
      
      {/* === INFORMACIÓN DEL PRODUCTO === */}
      <div className="flex flex-col flex-grow px-2 pb-1 z-10 bg-transparent">
        
        {/* Categoría y Rating */}
        <div className="flex justify-between items-center mb-2.5">
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.25em] line-clamp-1 group-hover/card:text-[#0866bd] transition-colors">
            {product.category}
          </p>
          <div className="flex items-center gap-1 text-[#FACC15] bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-100/50">
            <Star size={8} className="fill-current" />
            <span className="text-[9px] font-black text-yellow-700 pt-0.5">{product.rating ? product.rating.toFixed(1) : "5.0"}</span>
          </div>
        </div>
        
        {/* Título Elegante */}
        <h3 className="font-black text-slate-800 text-[11px] sm:text-xs leading-snug mb-3 line-clamp-2 group-hover/card:text-[#0866bd] transition-colors uppercase tracking-tight" title={cleanName}>
          {cleanName}
        </h3>
        
        {/* Footer de la Tarjeta (Precios y Flecha) */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-end justify-between group-hover/card:border-[#0866bd]/20 transition-colors">
          <div className="flex flex-col">
            {(product.originalPrice || product.promoPrice) ? (
              <>
                <span className="text-[9px] text-[#EF4444] line-through font-bold mb-0.5 tracking-wide">
                  {formatMXN(product.originalPrice || product.price)}
                </span>
                <span className="text-lg font-black text-slate-900 tracking-tighter drop-shadow-sm group-hover/card:text-[#0866bd] transition-colors">
                  {formatMXN(product.promoPrice || product.price)}
                </span>
              </>
            ) : (
              <span className="text-lg font-black text-slate-900 group-hover/card:text-[#0866bd] transition-colors tracking-tighter mt-3 drop-shadow-sm">
                {formatMXN(product.price)}
              </span>
            )}
          </div>
          
          {/* Flecha de "Ver Detalles" que aparece sutilmente */}
          <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 opacity-0 -translate-x-4 group-hover/card:opacity-100 group-hover/card:translate-x-0 group-hover/card:bg-blue-50 group-hover/card:text-[#0866bd] transition-all duration-500 border border-slate-200 group-hover/card:border-[#0866bd]/30">
            <ArrowUpRight size={14} strokeWidth={2.5} />
          </div>
        </div>
        
      </div>
    </motion.div>
  );
}
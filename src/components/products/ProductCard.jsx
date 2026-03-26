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
    : (product.img || product.image || "https://placehold.co/300x300/f8fafc/0866BD?text=Sin+Foto");

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
      className="w-full bg-white/80 backdrop-blur-2xl rounded-[2rem] p-3 sm:p-4 border border-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_60px_rgba(8,102,189,0.15)] hover:border-blue-100 transition-all duration-500 group/card flex flex-col h-full cursor-pointer relative overflow-hidden"
    >
      {/* === RESPLANDOR DE FONDO (Hover) === */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-blue-50/50 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

      {/* === CONTENEDOR DE IMAGEN (VITRINA 3D) === */}
      <div className="relative aspect-square bg-slate-50/50 group-hover/card:bg-transparent rounded-[1.5rem] mb-5 p-6 flex items-center justify-center transition-colors duration-700 overflow-hidden border border-slate-100 group-hover/card:border-transparent">
        
        {/* Orbe de luz interior que se expande */}
        <div className="absolute inset-0 bg-[#0866bd]/0 group-hover/card:bg-[#0866bd]/5 rounded-full blur-2xl transition-all duration-700 scale-50 group-hover/card:scale-150 pointer-events-none"></div>

        {/* ETIQUETAS FLOTANTES (Neon Glow) */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
          {isHot && (
            <span className="bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-600 text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest flex items-center gap-1.5 shadow-[0_5px_15px_rgba(239,68,68,0.2)] w-max">
              <Flame size={12} className="animate-pulse" /> Oferta
            </span>
          )}
          {isUniversal && (
            <span className="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 text-emerald-600 text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest flex items-center gap-1.5 shadow-[0_5px_15px_rgba(16,185,129,0.2)] w-max">
              <Zap size={12} className="fill-current" /> Universal
            </span>
          )}
        </div>
        
        {/* IMAGEN DEL PRODUCTO CON FÍSICA LEVITANTE */}
        <div className="w-full h-full relative z-10 flex items-center justify-center">
          <img 
            src={mainImg} 
            alt={cleanName} 
            className="max-w-full max-h-full object-contain mix-blend-multiply group-hover/card:scale-110 group-hover/card:-translate-y-2 group-hover/card:rotate-3 transition-all duration-700 ease-out group-hover/card:drop-shadow-[0_20px_30px_rgba(0,0,0,0.15)]" 
          />
        </div>
        
        {/* === BOTÓN DE CARRITO "TITANIO & NEÓN" === */}
        <div className="absolute bottom-3 right-3 translate-y-0 opacity-100 lg:translate-y-12 lg:opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-20">
          <motion.button 
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation(); 
              addToCart(product);
            }}
            className="bg-gradient-to-tr from-slate-900 to-slate-800 text-yellow-400 w-12 h-12 rounded-[1rem] flex items-center justify-center shadow-[0_10px_25px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_35px_rgba(250,204,21,0.3)] border border-slate-700 hover:border-yellow-400/50 transition-all duration-300 relative overflow-hidden group/btn"
            title="Añadir a mi orden"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 rounded-[1rem]"></div>
            <ShoppingCart size={18} strokeWidth={2.5} className="relative z-10 group-hover/btn:scale-110 transition-transform" />
          </motion.button>
        </div>
      </div>
      
      {/* === INFORMACIÓN DEL PRODUCTO === */}
      <div className="flex flex-col flex-grow px-3 pb-2 z-10 bg-transparent">
        
        {/* Categoría y Rating */}
        <div className="flex justify-between items-center mb-3">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] line-clamp-1 group-hover/card:text-[#0866bd] transition-colors">
            {product.category}
          </p>
          <div className="flex items-center gap-1 text-yellow-500 bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-100/50">
            <Star size={10} className="fill-current" />
            <span className="text-[10px] font-black text-yellow-700 pt-0.5">{product.rating ? product.rating.toFixed(1) : "5.0"}</span>
          </div>
        </div>
        
        {/* Título Dinámico */}
        <h3 className="font-black text-slate-800 text-sm leading-snug mb-4 line-clamp-2 group-hover/card:text-[#0866bd] transition-colors" title={cleanName}>
          {cleanName}
        </h3>
        
        {/* Footer de la Tarjeta (Precios y Flecha) */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-end justify-between group-hover/card:border-blue-100 transition-colors">
          <div className="flex flex-col">
            {(product.originalPrice || product.promoPrice) ? (
              <>
                <span className="text-[10px] text-slate-400 line-through font-bold mb-0.5 tracking-wide">
                  {formatMXN(product.originalPrice || product.price)}
                </span>
                <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0866bd] to-blue-600 tracking-tighter drop-shadow-sm">
                  {formatMXN(product.promoPrice || product.price)}
                </span>
              </>
            ) : (
              <span className="text-xl font-black text-slate-900 group-hover/card:text-[#0866bd] transition-colors tracking-tighter mt-4 drop-shadow-sm">
                {formatMXN(product.price)}
              </span>
            )}
          </div>
          
          {/* Flecha de "Ver Detalles" que aparece sutilmente */}
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 opacity-0 -translate-x-4 group-hover/card:opacity-100 group-hover/card:translate-x-0 group-hover/card:bg-blue-50 group-hover/card:text-[#0866bd] transition-all duration-500">
            <ArrowUpRight size={16} strokeWidth={2.5} />
          </div>
        </div>
        
      </div>
    </motion.div>
  );
}
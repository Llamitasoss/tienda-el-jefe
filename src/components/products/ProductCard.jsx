import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Zap, Flame, Sparkles } from 'lucide-react';
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
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={() => navigate(`/producto/${product.id}`)}
      className="w-full bg-white/90 backdrop-blur-xl rounded-[2rem] p-3 sm:p-4 border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(8,102,189,0.12)] hover:border-[#0866bd]/20 transition-all duration-500 group flex flex-col h-full cursor-pointer relative overflow-hidden"
    >
      {/* Efecto Futurista: Brillo de barrido al hacer hover */}
      <div className="absolute top-0 -inset-full h-full w-1/2 z-0 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-40 group-hover:animate-shine" />

      {/* === CONTENEDOR DE IMAGEN === */}
      <div className="relative aspect-square bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100/80 group-hover:from-blue-50/50 group-hover:to-blue-100/40 rounded-[1.5rem] mb-5 p-5 flex items-center justify-center transition-colors duration-700 overflow-hidden">
        
        {/* ETIQUETAS FLOTANTES (Glassmorphism) */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
          {isHot && (
            <span className="bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-600 text-[9px] font-black px-2.5 py-1.5 rounded-xl uppercase tracking-widest flex items-center gap-1.5 shadow-[0_8px_16px_rgba(239,68,68,0.15)] w-max">
              <Flame size={12} className="animate-pulse" /> Oferta
            </span>
          )}
          {isUniversal && (
            <span className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-emerald-600 text-[9px] font-black px-2.5 py-1.5 rounded-xl uppercase tracking-widest flex items-center gap-1.5 shadow-[0_8px_16px_rgba(16,185,129,0.15)] w-max">
              <Zap size={12} /> Universal
            </span>
          )}
        </div>
        
        {/* IMAGEN DEL PRODUCTO CON ZOOM SUAVE */}
        <div className="w-full h-full relative z-10 flex items-center justify-center">
          <img 
            src={mainImg} 
            alt={cleanName} 
            className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-110 group-hover:rotate-2 transition-transform duration-700 ease-out drop-shadow-sm" 
          />
        </div>
        
        {/* === BOTÓN DE CARRITO (Oculto en PC, sube en Hover) === */}
        <div className="absolute bottom-3 right-3 translate-y-0 opacity-100 md:translate-y-10 md:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out z-20">
          <motion.button 
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation(); 
              addToCart(product);
            }}
            className="bg-gradient-to-br from-[#0866bd] to-blue-700 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-[0_10px_20px_rgba(8,102,189,0.4)] hover:shadow-[0_15px_30px_rgba(8,102,189,0.6)] border border-blue-400/30 transition-all duration-300 relative overflow-hidden"
            title="Agregar al Carrito"
          >
            {/* Destello interno del botón */}
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded-2xl"></div>
            <ShoppingCart size={20} className="relative z-10" />
          </motion.button>
        </div>
      </div>
      
      {/* === INFORMACIÓN DEL PRODUCTO === */}
      <div className="flex flex-col flex-grow px-2 pb-2 z-10 bg-transparent">
        <div className="flex justify-between items-center mb-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] line-clamp-1 group-hover:text-blue-500/70 transition-colors">
            {product.category}
          </p>
          <div className="flex items-center gap-1 text-yellow-400">
            <Star size={10} className="fill-current" />
            <span className="text-[10px] font-bold text-slate-600">{product.rating ? product.rating.toFixed(1) : "5.0"}</span>
          </div>
        </div>
        
        <h3 className="font-black text-slate-800 text-sm leading-snug mb-4 line-clamp-2 group-hover:text-[#0866bd] transition-colors" title={cleanName}>
          {cleanName}
        </h3>
        
        <div className="mt-auto pt-4 border-t border-slate-100/80 flex items-end justify-between">
          <div className="flex flex-col">
            {(product.originalPrice || product.promoPrice) ? (
              <>
                <span className="text-[10px] text-slate-400 line-through font-bold mb-0.5 tracking-wide">
                  {formatMXN(product.originalPrice || product.price)}
                </span>
                <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#0866bd] to-blue-600 tracking-tighter">
                  {formatMXN(product.promoPrice || product.price)}
                </span>
              </>
            ) : (
              <span className="text-xl font-black text-slate-900 group-hover:text-[#0866bd] transition-colors tracking-tighter mt-4">
                {formatMXN(product.price)}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
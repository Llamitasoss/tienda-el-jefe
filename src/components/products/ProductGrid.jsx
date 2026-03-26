import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

// Animaciones Top-Tier para la entrada en cascada
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

export default function ProductGrid({ products, title, isInteractiveCarrousel = false }) {
  const carouselRef = useRef(null);

  const scroll = (direction) => {
    if (carouselRef.current) {
      const { clientWidth } = carouselRef.current;
      const scrollAmount = direction === 'left' ? -(clientWidth * 0.8) : (clientWidth * 0.8);
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!products || products.length === 0) return null;

  // === MODO CARRUSEL (NETFLIX STYLE PREMIUM) ===
  if (isInteractiveCarrousel) {
    return (
      <div className="w-full py-8 relative group/carrusel">
        {title && <div className="mb-10 px-2">{title}</div>}
        
        {/* Botones de navegación Glassmorphism */}
        <div className="absolute top-[55%] -translate-y-1/2 left-0 z-30 hidden md:block opacity-0 group-hover/carrusel:opacity-100 transition-all duration-500 -ml-6">
          <motion.button 
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => scroll('left')} 
            className="bg-white/70 backdrop-blur-xl p-4 rounded-full shadow-[0_10px_30px_rgba(8,102,189,0.2)] text-slate-800 hover:text-[#0866bd] hover:bg-white transition-all border border-white/50"
          >
            <ChevronLeft size={28} strokeWidth={2.5} />
          </motion.button>
        </div>
        
        <div className="absolute top-[55%] -translate-y-1/2 right-0 z-30 hidden md:block opacity-0 group-hover/carrusel:opacity-100 transition-all duration-500 -mr-6">
          <motion.button 
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => scroll('right')} 
            className="bg-white/70 backdrop-blur-xl p-4 rounded-full shadow-[0_10px_30px_rgba(8,102,189,0.2)] text-slate-800 hover:text-[#0866bd] hover:bg-white transition-all border border-white/50"
          >
            <ChevronRight size={28} strokeWidth={2.5} />
          </motion.button>
        </div>

        {/* Contenedor del Carrusel Animado */}
        <div 
          ref={carouselRef}
          className="flex gap-5 sm:gap-8 overflow-x-auto snap-x snap-mandatory px-6 pb-16 pt-6 -mx-6 cursor-grab active:cursor-grabbing"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} 
        >
          <style>{`.custom-hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="flex gap-5 sm:gap-8"
          >
            {products.map((product) => (
              <motion.div 
                key={product.id}
                variants={itemVariants}
                className="w-[260px] sm:w-[300px] h-auto snap-center shrink-0 custom-hide-scrollbar flex flex-col"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
          
          <div className="min-w-[40px] shrink-0"></div>
        </div>
      </div>
    );
  }

  // === MODO CUADRÍCULA ESTÁNDAR (CATÁLOGO GENERAL PREMIUM) ===
  return (
    <div className="w-full">
      {title && <div className="mb-10">{title}</div>}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-8"
      >
        {products.map((product) => (
          <motion.div
            key={product.id}
            variants={itemVariants}
            className="h-full"
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
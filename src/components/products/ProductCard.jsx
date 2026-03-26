import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard'; 

export default function ProductGrid({ products, title, isInteractiveCarrousel = false }) {
  const carouselRef = useRef(null);

  // Función para mover el carrusel con los botones en PC
  const scroll = (direction) => {
    if (carouselRef.current) {
      const { clientWidth } = carouselRef.current;
      const scrollAmount = direction === 'left' ? -(clientWidth * 0.8) : (clientWidth * 0.8);
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!products || products.length === 0) return null;

  // === MODO CARRUSEL (NETFLIX STYLE) ===
  if (isInteractiveCarrousel) {
    return (
      <div className="w-full py-8 relative group/carrusel">
        {title && <div className="mb-8 px-2">{title}</div>}
        
        {/* Botones de navegación con group-hover nombrado para no interferir con las tarjetas */}
        <div className="absolute top-[60%] -translate-y-1/2 left-0 z-20 hidden md:block opacity-0 group-hover/carrusel:opacity-100 transition-opacity duration-300 -ml-4">
          <button onClick={() => scroll('left')} className="bg-white/90 backdrop-blur-md p-4 rounded-r-3xl shadow-[5px_0_20px_rgba(0,0,0,0.1)] hover:bg-[#0866bd] hover:text-white transition-all border border-slate-100 border-l-0 active:scale-95">
            <ChevronLeft size={28} />
          </button>
        </div>
        <div className="absolute top-[60%] -translate-y-1/2 right-0 z-20 hidden md:block opacity-0 group-hover/carrusel:opacity-100 transition-opacity duration-300 -mr-4">
          <button onClick={() => scroll('right')} className="bg-white/90 backdrop-blur-md p-4 rounded-l-3xl shadow-[-5px_0_20px_rgba(0,0,0,0.1)] hover:bg-[#0866bd] hover:text-white transition-all border border-slate-100 border-r-0 active:scale-95">
            <ChevronRight size={28} />
          </button>
        </div>

        {/* Contenedor del Carrusel (Swipeable en Móvil) */}
        <div 
          ref={carouselRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory px-4 pb-12 pt-4 -mx-4 cursor-grab active:cursor-grabbing"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} 
        >
          <style>{`.custom-hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
          
          {products.map((product, idx) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              className="w-[240px] sm:w-[280px] h-auto snap-center shrink-0 custom-hide-scrollbar flex flex-col"
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
          <div className="min-w-[20px] sm:min-w-[40px] shrink-0"></div>
        </div>
      </div>
    );
  }

  // === MODO CUADRÍCULA ESTÁNDAR (CATÁLOGO GENERAL) ===
  return (
    <div className="w-full">
      {title && <div className="mb-8">{title}</div>}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.map((product, idx) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: idx * 0.05, type: "spring", stiffness: 300, damping: 24 }}
            className="h-full"
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
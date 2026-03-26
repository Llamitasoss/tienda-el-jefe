// src/components/products/ProductGridAdvanced.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2, Zap, LayoutGrid } from 'lucide-react';
import ProductCard from './ProductCard'; // Asegúrate de que la ruta a tu ProductCard sea correcta

// Configuración de animación para la entrada física y escalonada
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.08, // Efecto físico de escalonado
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
    },
  },
};

// Sub-componente para los puntos de paginación interactivos y animados
const PaginationDots = ({ items, currentIndex, onDotClick }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute bottom-[-1rem] left-1/2 -translate-x-1/2 flex gap-2.5 z-20 pointer-events-auto"
    >
      {items.map((_, index) => {
        const isActive = index === currentIndex;
        return (
          <motion.button
            key={index}
            onClick={() => onDotClick(index)}
            whileHover={{ scale: isActive ? 1.05 : 1.15 }}
            whileTap={{ scale: 0.9 }}
            className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 pointer-events-auto cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0866bd] ${isActive ? 'bg-[#0866bd] scale-105' : 'bg-slate-300 hover:bg-slate-400'}`}
          />
        );
      })}
    </motion.div>
  );
};

export default function ProductGridAdvanced({ products, title, isInteractiveCarrousel = false }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const carouselRef = useRef(null);

  // Lógica para actualizar el índice actual y los estados de los botones al scrollear
  const handleScroll = useCallback(() => {
    if (carouselRef.current) {
      const { scrollLeft, clientWidth, scrollWidth } = carouselRef.current;
      const index = Math.round(scrollLeft / clientWidth);
      setCurrentIndex(index);
      setCanScrollLeft(scrollLeft > 10); // Margen de error pequeño
      setCanScrollRight(scrollWidth - (scrollLeft + clientWidth) > 10);
    }
  }, []);

  useEffect(() => {
    const ref = carouselRef.current;
    if (ref) {
      ref.addEventListener('scroll', handleScroll, { passive: true });
      // Llamada inicial para establecer estados
      handleScroll(); 
    }
    return () => {
      if (ref) ref.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // Función de navegación por índice para los puntos de paginación
  const scrollTo = (index) => {
    if (carouselRef.current) {
      const { clientWidth } = carouselRef.current;
      carouselRef.current.scrollTo({ left: clientWidth * index, behavior: 'smooth' });
    }
  };

  // Función de navegación por distancia para los botones
  const scroll = (direction) => {
    if (carouselRef.current) {
      const { clientWidth } = carouselRef.current;
      const scrollAmount = direction === 'left' ? -(clientWidth * 0.9) : (clientWidth * 0.9);
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!products || products.length === 0) return null;

  // === MODO CARRUSEL AVANZADO "TOP TIER" (NETFLIX STYLE MEJORADO) ===
  if (isInteractiveCarrousel) {
    return (
      <div className="w-full py-12 relative group/carrusel bg-slate-50/50 rounded-2xl p-6 shadow-inner border border-slate-100">
        <AnimatePresence mode="wait">
          {title && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-10 px-2 text-3xl font-extrabold text-slate-900 uppercase tracking-tight"
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Controles Dinámicos (Botones) con Feedback Visual */}
        <div className={`absolute top-[60%] -translate-y-1/2 left-0 z-20 transition-opacity duration-300 hidden md:block -ml-5 ${canScrollLeft ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <button 
            onClick={() => scroll('left')} 
            className="bg-white/95 backdrop-blur-lg p-4 rounded-r-3xl shadow-[5px_0_25px_rgba(0,0,0,0.1)] hover:bg-[#0866bd] hover:text-white transition-all border border-slate-100 active:scale-90"
            disabled={!canScrollLeft}
          >
            <ChevronLeft size={30} />
          </button>
        </div>
        <div className={`absolute top-[60%] -translate-y-1/2 right-0 z-20 transition-opacity duration-300 hidden md:block -mr-5 ${canScrollRight ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <button 
            onClick={() => scroll('right')} 
            className="bg-white/95 backdrop-blur-lg p-4 rounded-l-3xl shadow-[-5px_0_25px_rgba(0,0,0,0.1)] hover:bg-[#0866bd] hover:text-white transition-all border border-slate-100 active:scale-90"
            disabled={!canScrollRight}
          >
            <ChevronRight size={30} />
          </button>
        </div>

        {/* Contenedor del Carrusel Advanced (Swipeable & Interactive) */}
        <motion.div 
          ref={carouselRef}
          className="flex gap-5 sm:gap-7 overflow-x-auto snap-x snap-mandatory px-5 pb-16 pt-5 -mx-5 cursor-grab active:cursor-grabbing custom-hide-scrollbar"
        >
          {/* Estilo para ocultar la barra de scroll de forma nativa */}
          <style>{`.custom-hide-scrollbar::-webkit-scrollbar { display: none; } .custom-hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
          
          {/* === AHORA CON ANIMACIONES DE ENTRADA "TOP TIER" FÍSICAS === */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex gap-5 sm:gap-7"
          >
            {products.map((product) => (
              <motion.div 
                key={product.id}
                variants={itemVariants}
                className="w-[260px] sm:w-[300px] h-auto snap-center shrink-0 flex flex-col"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
          {/* Espaciador final para que la última tarjeta no quede pegada al borde */}
          <div className="min-w-[30px] sm:min-w-[50px] shrink-0"></div>
        </motion.div>

        {/* === NUEVA PAGINACIÓN INTERACTIVA Y ANIMADA === */}
        <PaginationDots 
          items={products} 
          currentIndex={currentIndex} 
          onDotClick={scrollTo} 
        />
      </div>
    );
  }

  // === MODO CUADRÍCULA AVANZADO (CATÁLOGO GENERAL) ===
  return (
    <div className="w-full">
      {title && (
        <div className="mb-10 text-3xl font-extrabold text-slate-900 uppercase tracking-tight">
          {title}
        </div>
      )}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-7"
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
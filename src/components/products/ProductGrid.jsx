import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';

// === VARIANTES DE ANIMACIÓN TOP-TIER ===
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 30 }
  }
};

export default function ProductGrid({ products, title, isInteractiveCarrousel = false }) {
  const carouselRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Calcula el progreso del scroll para la barra indicadora neón
  const handleScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      const progress = scrollLeft / (scrollWidth - clientWidth);
      setScrollProgress(progress || 0);
    }
  };

  // Escucha cambios de tamaño de ventana para recalcular el progreso
  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [products]);

  const scroll = (direction) => {
    if (carouselRef.current) {
      const { clientWidth } = carouselRef.current;
      const scrollAmount = direction === 'left' ? -(clientWidth * 0.75) : (clientWidth * 0.75);
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!products || products.length === 0) return null;

  if (isInteractiveCarrousel) {
    return (
      <div 
        className="w-full py-8 relative group/carrusel"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Título animado si existe */}
        {title && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="mb-10 px-2 relative z-10"
          >
            {title}
          </motion.div>
        )}
        
        {/* === BOTÓN IZQUIERDO (GLASSMORPHISM) === */}
        <AnimatePresence>
          {isHovered && scrollProgress > 0.01 && (
            <motion.div 
              initial={{ opacity: 0, x: 20, scale: 0.8 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 10, scale: 0.8 }} transition={{ type: "spring" }}
              className="absolute top-[50%] -translate-y-1/2 left-0 z-30 hidden lg:block -ml-5"
            >
              <motion.button 
                whileHover={{ scale: 1.15, backgroundColor: "#0866bd", color: "#ffffff" }} whileTap={{ scale: 0.9 }} onClick={() => scroll('left')} 
                className="bg-white/80 backdrop-blur-xl p-4 rounded-full shadow-[0_15px_30px_rgba(0,0,0,0.15)] text-[#0866bd] transition-colors border border-white flex items-center justify-center group"
              >
                <ChevronLeft size={28} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* === BOTÓN DERECHO (GLASSMORPHISM) === */}
        <AnimatePresence>
          {isHovered && scrollProgress < 0.99 && (
            <motion.div 
              initial={{ opacity: 0, x: -20, scale: 0.8 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -10, scale: 0.8 }} transition={{ type: "spring" }}
              className="absolute top-[50%] -translate-y-1/2 right-0 z-30 hidden lg:block -mr-5"
            >
              <motion.button 
                whileHover={{ scale: 1.15, backgroundColor: "#0866bd", color: "#ffffff" }} whileTap={{ scale: 0.9 }} onClick={() => scroll('right')} 
                className="bg-white/80 backdrop-blur-xl p-4 rounded-full shadow-[0_15px_30px_rgba(0,0,0,0.15)] text-[#0866bd] transition-colors border border-white flex items-center justify-center group"
              >
                <ChevronRight size={28} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* === CONTENEDOR DEL CARRUSEL CON FADE-OUT MASK === */}
        <div 
          className="relative w-full overflow-hidden"
          // Esta máscara hace que las orillas se difuminen suavemente dando un look muy pro
          style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 3%, black 97%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 3%, black 97%, transparent)' }}
        >
          <div 
            ref={carouselRef}
            onScroll={handleScroll}
            className="flex gap-5 sm:gap-8 overflow-x-auto snap-x snap-mandatory px-6 sm:px-10 pb-16 pt-6 -mx-6 sm:-mx-10 cursor-grab active:cursor-grabbing"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} 
          >
            <style>{`.custom-hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
            
            <motion.div 
              variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
              className="flex gap-5 sm:gap-8 w-max"
            >
              {products.map((product) => (
                <motion.div 
                  key={product.id} variants={itemVariants}
                  className="w-[280px] sm:w-[300px] h-auto snap-center shrink-0 custom-hide-scrollbar flex flex-col"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
            
            {/* Espaciador final para que la última tarjeta no quede pegada al borde */}
            <div className="min-w-[5vw] shrink-0"></div>
          </div>
        </div>

        {/* === BARRA DE PROGRESO INTELIGENTE (SCROLL TRACKER) === */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-slate-200/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/50 shadow-inner">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#0866bd] to-cyan-400 rounded-full shadow-[0_0_10px_rgba(8,102,189,0.8)]"
            animate={{ width: `${Math.max(15, scrollProgress * 100)}%` }} // Mínimo 15% para que siempre se vea el pill
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>

      </div>
    );
  }

  // === MODO GRID (CUADRÍCULA ESTÁNDAR) ===
  return (
    <div className="w-full relative z-10">
      {title && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mb-10"
        >
          {title}
        </motion.div>
      )}
      <motion.div 
        variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8"
      >
        {products.map((product) => (
          <motion.div key={product.id} variants={itemVariants} className="h-full">
            <ProductCard product={product} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
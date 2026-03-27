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
  hidden: { opacity: 0, y: 30, scale: 0.98 },
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

  // Calcula el progreso del scroll para la barra indicadora
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
        className="w-full py-6 relative group/carrusel"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Título animado si existe */}
        {title && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="mb-8 px-2 relative z-10"
          >
            {title}
          </motion.div>
        )}
        
        {/* === BOTÓN IZQUIERDO (Zafiro Glassmorphism) === */}
        <AnimatePresence>
          {isHovered && scrollProgress > 0.01 && (
            <motion.div 
              initial={{ opacity: 0, x: 20, scale: 0.8 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 10, scale: 0.8 }} transition={{ type: "spring" }}
              className="absolute top-[50%] -translate-y-1/2 left-0 z-30 hidden lg:block ml-2"
            >
              <motion.button 
                whileHover={{ scale: 1.1, backgroundColor: "#0866bd", borderColor: "#0866bd" }} whileTap={{ scale: 0.9 }} onClick={() => scroll('left')} 
                className="bg-[#021830]/80 backdrop-blur-xl w-14 h-14 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.5)] text-[#FBFBF2] transition-colors border border-white/10 flex items-center justify-center group"
              >
                <ChevronLeft size={24} strokeWidth={2.5} className="group-hover:-translate-x-0.5 transition-transform" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* === BOTÓN DERECHO (Zafiro Glassmorphism) === */}
        <AnimatePresence>
          {isHovered && scrollProgress < 0.99 && (
            <motion.div 
              initial={{ opacity: 0, x: -20, scale: 0.8 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -10, scale: 0.8 }} transition={{ type: "spring" }}
              className="absolute top-[50%] -translate-y-1/2 right-0 z-30 hidden lg:block mr-2"
            >
              <motion.button 
                whileHover={{ scale: 1.1, backgroundColor: "#0866bd", borderColor: "#0866bd" }} whileTap={{ scale: 0.9 }} onClick={() => scroll('right')} 
                className="bg-[#021830]/80 backdrop-blur-xl w-14 h-14 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.5)] text-[#FBFBF2] transition-colors border border-white/10 flex items-center justify-center group"
              >
                <ChevronRight size={24} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* === CONTENEDOR DEL CARRUSEL CON FADE-OUT MASK === */}
        <div 
          className="relative w-full overflow-hidden"
          style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 3%, black 97%, transparent)', maskImage: 'linear-gradient(to right, transparent, black 3%, black 97%, transparent)' }}
        >
          <div 
            ref={carouselRef}
            onScroll={handleScroll}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory px-6 sm:px-10 pb-12 pt-4 -mx-6 sm:-mx-10 cursor-grab active:cursor-grabbing"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} 
          >
            <style>{`.custom-hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
            
            <motion.div 
              variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
              className="flex gap-6 w-max"
            >
              {products.map((product) => (
                <motion.div 
                  key={product.id} variants={itemVariants}
                  // Reducido sutilmente el ancho de las tarjetas para que no se empalmen y respiren
                  className="w-[260px] sm:w-[280px] h-auto snap-center shrink-0 custom-hide-scrollbar flex flex-col"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
            
            {/* Espaciador final para que la última tarjeta no quede pegada al borde */}
            <div className="min-w-[5vw] shrink-0"></div>
          </div>
        </div>

        {/* === BARRA DE PROGRESO INTELIGENTE (Azul Brand) === */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/5 shadow-inner">
          <motion.div 
            className="h-full bg-[#0866bd] rounded-full shadow-[0_0_8px_rgba(8,102,189,0.8)]"
            animate={{ width: `${Math.max(15, scrollProgress * 100)}%` }} // Mínimo 15% para que siempre se vea
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>

      </div>
    );
  }

  // === MODO GRID (CUADRÍCULA ESTÁNDAR) ===
  return (
    <div className="w-full relative z-10 py-6">
      {title && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="mb-8"
        >
          {title}
        </motion.div>
      )}
      <motion.div 
        variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
        // Gap equilibrado para que no se vea ni vacío ni saturado
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
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
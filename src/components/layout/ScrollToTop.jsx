import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useSpring, useMotionValueEvent } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  // === MOTOR DE SCROLL DE ALTO RENDIMIENTO (Framer Motion) ===
  const { scrollY, scrollYProgress } = useScroll();
  
  // Física de resorte para que el anillo de progreso sea suave y fluido
  const scaleProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // === 1. RESTABLECIMIENTO DE RUTA (INSTANTÁNEO) ===
  useEffect(() => {
    // Al cambiar de ruta, el salto debe ser instantáneo simulando un navegador nativo.
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' 
    });
  }, [pathname]);

  // === 2. LÓGICA DEL BOTÓN INTELIGENTE (Sin lag en el DOM) ===
  useMotionValueEvent(scrollY, "change", (latest) => {
    // Mostramos el botón si bajamos más de 400px
    if (latest > 400) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  });

  // === 3. FUNCIÓN DE REGRESO SUAVE ===
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 30, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.5, y: 30, filter: "blur(10px)" }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-8 right-6 sm:right-8 z-[90]"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="relative flex h-14 w-14 items-center justify-center rounded-full bg-slate-900/80 text-yellow-400 shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl border border-white/10 hover:border-yellow-400/50 transition-colors group overflow-hidden"
            aria-label="Volver arriba"
          >
            {/* === ANILLO DE PROGRESO SVG (Orbital Tracker) === */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none" viewBox="0 0 100 100">
              {/* Círculo de fondo oscuro */}
              <circle cx="50" cy="50" r="48" stroke="rgba(255,255,255,0.05)" strokeWidth="4" fill="none" />
              {/* Círculo de luz Neón vinculado al Scroll */}
              <motion.circle
                cx="50" cy="50" r="48"
                stroke="#facc15" /* yellow-400 */
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                className="drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]"
                style={{ pathLength: scaleProgress }}
              />
            </svg>

            {/* Brillo interno dinámico que se enciende al pasar el mouse */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0866bd]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full"></div>
            
            {/* Ícono de Flecha con levitación suave */}
            <ChevronUp size={24} strokeWidth={3} className="relative z-10 group-hover:-translate-y-1 transition-transform duration-300" />
            
            {/* Destello trasero sutil */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-yellow-400/20 rounded-full blur-[10px] group-hover:scale-150 transition-transform duration-500"></div>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
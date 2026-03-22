import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  // === 1. RESTABLECIMIENTO DE RUTA (INSTANTÁNEO) ===
  useEffect(() => {
    // Al cambiar de ruta, el salto debe ser instantáneo simulando un navegador nativo.
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' 
    });
  }, [pathname]);

  // === 2. LÓGICA DEL BOTÓN INTELIGENTE ===
  useEffect(() => {
    const toggleVisibility = () => {
      // Si el usuario baja más de 400px, mostramos el botón
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Usamos 'passive: true' para optimizar el rendimiento del navegador al hacer scroll
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

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
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          whileHover={{ scale: 1.1, y: -4 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-[90] flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900/80 p-3 text-yellow-400 shadow-[0_10px_25px_rgba(0,0,0,0.3)] backdrop-blur-xl border border-white/10 hover:border-yellow-400/50 transition-colors group overflow-hidden"
          aria-label="Volver arriba"
        >
          {/* Brillo interno dinámico */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0866bd]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <ChevronUp size={28} strokeWidth={3} className="relative z-10 group-hover:-translate-y-1 transition-transform duration-300" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
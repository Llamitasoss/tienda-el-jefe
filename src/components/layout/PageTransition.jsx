import React from 'react';
import { motion } from 'framer-motion';

// Curva de animación personalizada tipo "Apple/Futurista" 
// (Arranca con energía y aterriza suave como mantequilla)
const premiumEase = [0.22, 1, 0.36, 1];

export default function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        y: 20, 
        scale: 0.98, // Inicia ligeramente más pequeño (profundidad)
        filter: "blur(12px)" // Blur un poco más dramático al inicio
      }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        filter: "blur(0px)" 
      }}
      exit={{ 
        opacity: 0, 
        y: -20, 
        scale: 0.98, // Al salir, parece que se hunde en el fondo
        filter: "blur(12px)" 
      }}
      transition={{ 
        duration: 0.7, // Un poco más de tiempo para apreciar la curva fluida
        ease: premiumEase 
      }}
      // OPTIMIZACIÓN TOP-TIER: Forza al navegador a usar la Tarjeta Gráfica (GPU) 
      // para evitar que la animación se trabe mientras React carga la nueva página.
      style={{ 
        willChange: "transform, opacity, filter", 
        transformOrigin: "top center" 
      }}
      className="w-full min-h-screen flex flex-col"
    >
      {children}
    </motion.div>
  );
}
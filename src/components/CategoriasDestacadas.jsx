import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { 
  Wrench, Package, Settings, Cog, 
  Activity, Zap, CircleDashed, Star, ArrowRight 
} from 'lucide-react';

const MAIN_CATEGORIES = [
  { id: 'MANTENIMIENTO', nombre: 'Mantenimiento', icon: Wrench },
  { id: 'KITS', nombre: 'Kits Completos', icon: Package },
  { id: 'MOTOR', nombre: 'Motor', icon: Settings },
  { id: 'TRANSMISIÓN', nombre: 'Transmisión', icon: Cog },
  { id: 'SUSPENSIÓN', nombre: 'Suspensión', icon: Activity },
  { id: 'ELÉCTRICO', nombre: 'Sistema Eléctrico', icon: Zap },
  { id: 'LLANTAS', nombre: 'Llantas', icon: CircleDashed },
  { id: 'ACCESORIOS', nombre: 'Accesorios', icon: Star }
];

// === ANIMACIONES DE ENTRADA ESCALONADA ===
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 20 }
  }
};

const TiltCard = ({ cat }) => {
  // --- Valores para el efecto 3D interactivo ---
  const mouseX = useMotionValue(0.5); // Empezamos en el centro (0 a 1)
  const mouseY = useMotionValue(0.5);

  // Físicas de resorte para suavizar el seguimiento del mouse
  const springConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // Mapeamos las coordenadas (0 a 1) a grados de inclinación (-12deg a 12deg)
  const rotateX = useTransform(smoothMouseY, [0, 1], [12, -12]);
  const rotateY = useTransform(smoothMouseX, [0, 1], [-12, 12]);

  // --- Valores para el resplandor (Spotlight) ---
  const spotX = useMotionValue(0);
  const spotY = useMotionValue(0);

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Posición exacta del mouse en px
    const xPx = e.clientX - rect.left;
    const yPx = e.clientY - rect.top;

    // Actualizamos valores para el spotlight
    spotX.set(xPx);
    spotY.set(yPx);

    // Actualizamos valores normalizados (0 a 1) para el 3D
    mouseX.set(xPx / width);
    mouseY.set(yPx / height);
  }

  function handleMouseLeave() {
    // Retorno suave al centro
    mouseX.set(0.5);
    mouseY.set(0.5);
  }

  const IconComponent = cat.icon;

  return (
    // El contenedor padre provee la perspectiva para el 3D
    <motion.div variants={cardVariants} style={{ perspective: 1200 }} className="w-full h-64">
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="group relative h-full w-full rounded-[2rem] bg-[#0f172a]/90 backdrop-blur-sm border border-slate-800/80 shadow-[0_20px_40px_rgba(0,0,0,0.3)] cursor-pointer transition-colors duration-500 hover:border-[#0866bd]/50 hover:shadow-[0_20px_50px_rgba(8,102,189,0.15)] overflow-hidden"
      >
        <Link to={`/catalogo?categoria=${cat.id}`} className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6">
          
          {/* Capa de contenido elevada en el eje Z */}
          <motion.div 
            style={{ transform: "translateZ(60px)" }} 
            className="flex flex-col items-center pointer-events-none"
          >
            {/* Contenedor del ícono */}
            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-5 transition-all duration-500 group-hover:bg-[#0866bd] group-hover:shadow-[0_0_30px_rgba(8,102,189,0.6)] group-hover:-translate-y-2 border border-slate-700/50 group-hover:border-blue-400/50">
              <IconComponent strokeWidth={2} className="w-8 h-8 text-slate-400 transition-colors duration-500 group-hover:text-white" />
            </div>
            
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-300 transition-colors duration-500 group-hover:text-yellow-400 mb-2">
              {cat.nombre}
            </h3>
            
            {/* Flecha indicadora que entra suavemente en hover */}
            <div className="flex items-center text-xs font-bold text-[#0866bd] opacity-0 translate-y-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
              Explorar <ArrowRight size={14} className="ml-1" />
            </div>
            
          </motion.div>
        </Link>

        {/* --- SPOTLIGHT DINÁMICO --- */}
        {/* Usamos un background con máscara para que el brillo se vea sofisticado y no "pinte" el texto */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-[2rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-10"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                400px circle at ${spotX}px ${spotY}px,
                rgba(8, 102, 189, 0.15),
                transparent 60%
              )
            `,
          }}
        />
        {/* Segundo spotlight más pequeño para el centro del cursor */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-[2rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-10 mix-blend-overlay"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                150px circle at ${spotX}px ${spotY}px,
                rgba(250, 204, 21, 0.1),
                transparent 80%
              )
            `,
          }}
        />
      </motion.div>
    </motion.div>
  );
};

export default function CategoriasDestacadas() {
  return (
    <div className="mx-auto w-full max-w-[85rem] px-4 sm:px-6 lg:px-8 mb-32 relative z-10">
      
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, type: "spring" }}
        className="mb-16 flex flex-col items-center text-center"
      >
        <span className="inline-block py-1.5 px-4 rounded-full bg-blue-50 border border-blue-100 text-[#0866bd] font-black text-[10px] uppercase tracking-[0.25em] mb-4">
          Catálogo Principal
        </span>
        <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none">
          Encuentra por <br className="sm:hidden" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0866bd] to-blue-500">Categoría</span>
        </h2>
        <div className="mt-6 h-1.5 w-24 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500 shadow-[0_0_15px_rgba(250,204,21,0.5)]"></div>
      </motion.div>
      
      {/* Contenedor principal que lanza la animación en cascada a los hijos */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
      >
        {MAIN_CATEGORIES.map((cat, i) => (
          <TiltCard key={cat.id} cat={cat} />
        ))}
      </motion.div>
      
    </div>
  );
}
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
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 25 }
  }
};

// === TARJETA 3D MAGNÉTICA (ESTILO ZAFIRO Y ORO) ===
const TiltCard = ({ cat }) => {
  // --- Valores para el efecto 3D interactivo ---
  const mouseX = useMotionValue(0.5); 
  const mouseY = useMotionValue(0.5);

  // Físicas de resorte optimizadas para sentirse "líquidas" y pesadas (Premium)
  const springConfig = { damping: 30, stiffness: 300, mass: 0.5 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // Mapeamos las coordenadas a grados de inclinación sutiles (-8deg a 8deg)
  const rotateX = useTransform(smoothMouseY, [0, 1], [8, -8]);
  const rotateY = useTransform(smoothMouseX, [0, 1], [-8, 8]);

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
    // Retorno suave y elástico al centro
    mouseX.set(0.5);
    mouseY.set(0.5);
  }

  const IconComponent = cat.icon;

  return (
    <motion.div variants={cardVariants} style={{ perspective: 1200 }} className="w-full h-64">
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="group relative h-full w-full rounded-[2.5rem] bg-gradient-to-b from-[#042f56] to-[#021830] border border-white/10 shadow-[0_20px_40px_rgba(4,47,86,0.15)] cursor-pointer transition-colors duration-500 hover:border-amber-400/50 hover:shadow-[0_25px_60px_rgba(250,204,21,0.25)] overflow-hidden"
      >
        {/* Textura sutil para dar aspecto de material físico */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
        
        {/* Glow interno cálido que se enciende al hover */}
        <div className="absolute inset-0 bg-amber-400/0 group-hover:bg-amber-400/10 transition-colors duration-700 blur-[20px] pointer-events-none"></div>

        <Link to={`/catalogo?categoria=${cat.id}`} className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6">
          
          {/* === NÚCLEO DE ENERGÍA (Capa elevada en 3D) === */}
          <motion.div 
            style={{ transform: "translateZ(50px)" }} 
            className="flex flex-col items-center pointer-events-none w-full"
          >
            {/* Contenedor del ícono con transformación a Oro */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] bg-white/5 backdrop-blur-md flex items-center justify-center mb-6 transition-all duration-500 group-hover:bg-gradient-to-br group-hover:from-yellow-400 group-hover:to-amber-500 group-hover:shadow-[0_10px_30px_rgba(250,204,21,0.4)] border border-white/10 group-hover:border-yellow-200 relative z-10">
              <IconComponent strokeWidth={2} className="w-8 h-8 sm:w-10 sm:h-10 text-blue-200 transition-colors duration-500 group-hover:text-slate-900 drop-shadow-sm" />
            </div>
            
            {/* Título HUD Clásico */}
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-[0.25em] text-blue-50 transition-all duration-500 group-hover:text-white drop-shadow-sm text-center w-full truncate px-4">
              {cat.nombre}
            </h3>
            
            {/* Flecha indicadora Táctica Dorada */}
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-400 opacity-0 translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-2 mt-2">
              Explorar <div className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center"><ArrowRight size={12} strokeWidth={3} className="text-amber-400" /></div>
            </div>
            
          </motion.div>
        </Link>

        {/* --- LÁSER DE SEGUIMIENTO (Spotlight Principal Suave) --- */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-[2.5rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-10 mix-blend-screen"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                400px circle at ${spotX}px ${spotY}px,
                rgba(255, 255, 255, 0.1),
                transparent 70%
              )
            `,
          }}
        />
        {/* --- NÚCLEO MAGNÉTICO DORADO (Segundo spotlight intenso en el cursor) --- */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-[2.5rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-10 mix-blend-overlay"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                150px circle at ${spotX}px ${spotY}px,
                rgba(250, 204, 21, 0.4),
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
      
      {/* === ENCABEZADO DE LA SECCIÓN (NEO-CLÁSICO) === */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
        className="mb-16 flex flex-col items-center text-center relative"
      >
        <span className="inline-flex items-center gap-2 py-2 px-6 rounded-full bg-[#042f56] border border-[#0866bd]/50 text-amber-400 font-black text-[10px] uppercase tracking-[0.25em] mb-6 shadow-[0_5px_15px_rgba(4,47,86,0.2)]">
          <Activity size={14} className="animate-pulse"/> Catálogo Estructural
        </span>
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-slate-900 leading-none drop-shadow-sm">
          Encuentra por <br className="sm:hidden" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#042f56] to-[#0866bd]">Categoría</span>
        </h2>
        {/* Acento clásico de oro */}
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
        {MAIN_CATEGORIES.map((cat) => (
          <TiltCard key={cat.id} cat={cat} />
        ))}
      </motion.div>
      
    </div>
  );
}
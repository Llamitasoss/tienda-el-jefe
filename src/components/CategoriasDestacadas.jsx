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
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 25 }
  }
};

// === TARJETA 3D MAGNÉTICA (ESTILO BOUTIQUE PREMIUM) ===
const TiltCard = ({ cat }) => {
  const mouseX = useMotionValue(0.5); 
  const mouseY = useMotionValue(0.5);

  // Físicas de resorte ultra-suaves
  const springConfig = { damping: 30, stiffness: 300, mass: 0.5 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothMouseY, [0, 1], [6, -6]);
  const rotateY = useTransform(smoothMouseX, [0, 1], [-6, 6]);

  const spotX = useMotionValue(0);
  const spotY = useMotionValue(0);

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const xPx = e.clientX - rect.left;
    const yPx = e.clientY - rect.top;

    spotX.set(xPx);
    spotY.set(yPx);

    mouseX.set(xPx / width);
    mouseY.set(yPx / height);
  }

  function handleMouseLeave() {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }

  const IconComponent = cat.icon;

  return (
    <motion.div variants={cardVariants} style={{ perspective: 1200 }} className="w-full h-56">
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="group relative h-full w-full rounded-[2rem] bg-[#03254c]/40 backdrop-blur-xl border border-white/5 shadow-[0_15px_30px_rgba(0,0,0,0.3)] cursor-pointer transition-all duration-500 hover:border-[#0866bd]/50 hover:bg-[#03254c]/60 hover:shadow-[0_20px_40px_rgba(8,102,189,0.15)] overflow-hidden"
      >
        {/* Textura sutil estelar */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
        
        {/* Resplandor Azul Brand interno al hover */}
        <div className="absolute inset-0 bg-[#0866bd]/0 group-hover:bg-[#0866bd]/5 transition-colors duration-700 blur-[15px] pointer-events-none"></div>

        <Link to={`/catalogo?categoria=${cat.id}`} className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6">
          
          <motion.div 
            style={{ transform: "translateZ(40px)" }} 
            className="flex flex-col items-center pointer-events-none w-full"
          >
            {/* Contenedor del ícono: Transición a Azul Brand */}
            <div className="w-14 h-14 rounded-2xl bg-[#021830] flex items-center justify-center mb-5 transition-all duration-500 group-hover:bg-[#0866bd] group-hover:shadow-[0_10px_20px_rgba(8,102,189,0.4)] border border-white/5 group-hover:border-[#0866bd] relative z-10 shadow-inner">
              <IconComponent size={24} strokeWidth={1.5} className="text-[#0866bd] transition-colors duration-500 group-hover:text-[#FBFBF2] drop-shadow-sm" />
            </div>
            
            {/* Título HUD Elegante y Reducido */}
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#FBFBF2]/80 transition-all duration-500 group-hover:text-[#FBFBF2] drop-shadow-sm text-center w-full truncate px-4">
              {cat.nombre}
            </h3>
            
            {/* Flecha indicadora (Dorado Cálido para el CTA de lujo) */}
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#FACC15] opacity-0 translate-y-3 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-1 mt-3">
              Explorar <div className="w-5 h-5 rounded-full bg-[#FACC15]/10 flex items-center justify-center border border-[#FACC15]/20"><ArrowRight size={10} strokeWidth={2.5} className="text-[#FACC15]" /></div>
            </div>
            
          </motion.div>
        </Link>

        {/* --- LÁSER DE SEGUIMIENTO (Azul Brand) --- */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-[2rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-10 mix-blend-screen"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                350px circle at ${spotX}px ${spotY}px,
                rgba(8, 102, 189, 0.2),
                transparent 70%
              )
            `,
          }}
        />
        {/* --- NÚCLEO MAGNÉTICO (Blanco Premium suave) --- */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-[2rem] opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-10 mix-blend-overlay"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                100px circle at ${spotX}px ${spotY}px,
                rgba(251, 251, 242, 0.15),
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
    <div className="bg-[#021830] pt-12 pb-32 relative overflow-hidden">
      {/* Fondo Arquitectónico */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(255,255,255,0.02)_1.5px,transparent_1.5px)] bg-[size:30px_30px] pointer-events-none"></div>
      
      <div className="mx-auto w-full max-w-[75rem] px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* === ENCABEZADO DE LA SECCIÓN (Boutique) === */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
          className="mb-14 flex flex-col items-center text-center relative"
        >
          <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-lg bg-[#03254c] border border-white/5 text-[#FBFBF2]/60 font-bold text-[9px] uppercase tracking-[0.25em] mb-5 shadow-sm">
            <Activity size={12} className="text-[#0866bd] animate-pulse"/> Catálogo Estructural
          </span>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#FBFBF2] leading-tight drop-shadow-sm">
            Encuentra por <br className="sm:hidden" />
            <span className="text-[#0866bd]">Categoría</span>
          </h2>
          {/* Acento clásico Azul Brand */}
          <div className="mt-5 h-1 w-16 rounded-full bg-[#0866bd] shadow-[0_0_10px_rgba(8,102,189,0.5)]"></div>
        </motion.div>
        
        {/* Contenedor principal que lanza la animación en cascada */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {MAIN_CATEGORIES.map((cat) => (
            <TiltCard key={cat.id} cat={cat} />
          ))}
        </motion.div>
        
      </div>
    </div>
  );
}
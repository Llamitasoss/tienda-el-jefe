import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { 
  Wrench, Package, Settings, Cog, 
  Activity, Zap, CircleDashed, Star 
} from 'lucide-react';
import { cn } from '../utils/utils';

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

const TiltCard = ({ cat }) => {
  // --- Valores para el efecto 3D ---
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Física de resortes para que el movimiento sea suave y no brusco
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  // Transformar la posición del mouse en grados de inclinación (max 15 grados)
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  // --- Valores para el brillo (Spotlight) sutil ---
  const spotX = useMotionValue(0);
  const spotY = useMotionValue(0);

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    // Posición del mouse relativa a la tarjeta
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calcular porcentaje para el 3D (-0.5 a 0.5)
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);

    // Setear posición exacta para el brillo
    spotX.set(mouseX);
    spotY.set(mouseY);
  }

  function handleMouseLeave() {
    // Regresar la tarjeta a su estado original suavemente
    x.set(0);
    y.set(0);
  }

  const IconComponent = cat.icon;

  return (
    // El contenedor padre necesita 'perspective' para que el 3D funcione
    <div style={{ perspective: 1000 }} className="w-full h-56">
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="group relative h-full w-full rounded-3xl bg-[#0f172a] border border-slate-800 shadow-xl cursor-pointer transition-colors duration-500 hover:border-[#0866bd]/50"
      >
        <Link to={`/catalogo?categoria=${cat.id}`} className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6">
          {/* Contenido (elevado en el eje Z para dar profundidad) */}
          <div style={{ transform: "translateZ(50px)" }} className="flex flex-col items-center">
            
            {/* Contenedor del ícono con tus colores de marca */}
            <div className="w-16 h-16 rounded-2xl bg-[#1e293b] flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-[#0866bd] group-hover:border group-hover:border-yellow-400 group-hover:shadow-[0_0_20px_rgba(8,102,189,0.5)] group-hover:scale-110">
              <IconComponent size={32} className="text-slate-400 transition-colors group-hover:text-yellow-400" />
            </div>
            
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 transition-colors group-hover:text-white">
              {cat.nombre}
            </h3>
            
            {/* Pequeño acento decorativo que aparece en hover */}
            <div className="h-1 w-0 bg-yellow-400 mt-3 rounded-full transition-all duration-500 group-hover:w-8 shadow-[0_0_10px_rgba(250,204,21,0.5)]"></div>
          </div>
        </Link>

        {/* Brillo de dos tonos (Azul corporativo + Centro Amarillo) que sigue el mouse */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 transition duration-500 group-hover:opacity-100 z-10"
          style={{
            background: useMotionTemplate`
              radial-gradient(
                300px circle at ${spotX}px ${spotY}px,
                rgba(8, 102, 189, 0.2),
                transparent 80%
              ),
              radial-gradient(
                100px circle at ${spotX}px ${spotY}px,
                rgba(250, 204, 21, 0.08),
                transparent 80%
              )
            `,
          }}
        />
      </motion.div>
    </div>
  );
};

export default function CategoriasDestacadas() {
  return (
    <div className="mx-auto w-full max-w-[85rem] px-4 sm:px-6 lg:px-8 mb-32 animate-fade-in-up">
      <div className="mb-14 flex flex-col items-center text-center">
        <h2 className="text-3xl font-black uppercase tracking-tight text-slate-900 sm:text-4xl">
          Categorías <span className="bg-gradient-to-r from-blue-600 to-[#0866bd] bg-clip-text text-transparent">Destacadas</span>
        </h2>
        <div className="mt-4 h-1.5 w-20 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]"></div>
      </div>
      
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {MAIN_CATEGORIES.map((cat, i) => (
          <TiltCard key={i} cat={cat} />
        ))}
      </div>
    </div>
  );
}
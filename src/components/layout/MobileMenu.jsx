import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Store, Wrench, Star, Package, Facebook, Instagram, ChevronRight, MapPin, Search } from 'lucide-react';

const TikTok = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

// --- Configuraciones de Animación Top-Tier ---
const overlayVariants = {
  hidden: { opacity: 0, backdropFilter: "blur(0px)" },
  visible: { opacity: 1, backdropFilter: "blur(8px)", transition: { duration: 0.4 } }
};

// Física de resorte (spring) para una entrada natural y con peso
const menuVariants = {
  hidden: { x: "-100%" },
  visible: { 
    x: 0, 
    transition: { type: "spring", stiffness: 350, damping: 30, mass: 0.8 }
  },
  exit: { 
    x: "-100%", 
    transition: { type: "tween", ease: "easeInOut", duration: 0.3 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -30, filter: "blur(5px)" },
  visible: { opacity: 1, x: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 400, damping: 25 } }
};

export default function MobileMenu({ isOpen, onClose, onOpenTrackModal }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  // Función para determinar si la ruta actual coincide con el link
  const isActive = (path) => location.pathname === path;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex">
          
          {/* Fondo oscuro desenfocado */}
          <motion.div 
            variants={overlayVariants} initial="hidden" animate="visible" exit="hidden"
            className="absolute inset-0 bg-slate-900/70" 
            onClick={onClose} 
          />
          
          {/* Panel Lateral Izquierdo (Con Drag para Swipe-to-Close) */}
          <motion.div 
            variants={menuVariants} initial="hidden" animate="visible" exit="exit"
            drag="x" // Permite arrastrar en el eje X
            dragConstraints={{ left: 0, right: 0 }} // Limita el arrastre para que solo se cierre hacia la izquierda
            dragElastic={0.2} // Un poco de resistencia
            onDragEnd={(e, { offset, velocity }) => {
              // Si arrastra suficiente hacia la izquierda, cerramos el menú
              if (offset.x < -100 || velocity.x < -500) {
                onClose();
              }
            }}
            className="relative w-[85%] max-w-[320px] bg-[#f8fafc] h-full shadow-[30px_0_60px_rgba(0,0,0,0.5)] flex flex-col rounded-r-[2.5rem] overflow-hidden border-r border-white/50"
          >
            {/* Header del Menú */}
            <div className="bg-gradient-to-br from-[#0866bd] to-blue-900 p-8 pb-10 relative overflow-hidden shrink-0 shadow-md z-20">
              <div className="absolute top-[-20%] left-[-20%] w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-3">
                  <motion.div 
                    initial={{ rotate: -15, scale: 0.8 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
                    className="bg-white p-1 rounded-xl shadow-[0_5px_15px_rgba(255,255,255,0.2)] flex items-center justify-center w-12 h-12 border border-blue-200"
                  >
                    <img src="/logo.ico" alt="Logo El Jefe" className="w-full h-full object-contain" />
                  </motion.div>
                  <div>
                    <span className="font-black text-xl tracking-tighter uppercase text-yellow-400 leading-none drop-shadow-md">El Jefe</span>
                    <p className="text-[9px] text-blue-200 uppercase tracking-[0.25em] font-bold mt-0.5">Moto Partes</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md border border-white/20 shadow-sm active:scale-90">
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>

              {/* Botón de Búsqueda Rápida */}
              <motion.button 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                onClick={() => handleNavigation('/catalogo')}
                className="mt-8 w-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 py-3 px-4 rounded-xl flex items-center gap-3 text-blue-100 transition-colors shadow-sm"
              >
                <Search size={18} className="text-white shrink-0"/>
                <span className="text-xs font-medium truncate">Buscar refacción, modelo...</span>
              </motion.button>
            </div>

            {/* Opciones de Navegación en Cascada */}
            <motion.div 
              variants={staggerContainer} initial="hidden" animate="visible" exit="hidden"
              className="p-5 flex-1 overflow-y-auto space-y-3 custom-scrollbar relative z-10 -mt-4 bg-[#f8fafc] rounded-tl-[2.5rem]"
            >
              
              <motion.button variants={itemVariants} onClick={() => handleNavigation('/')} className={`w-full text-left p-4 rounded-2xl font-black flex items-center justify-between transition-all group relative overflow-hidden ${isActive('/') ? 'bg-white shadow-[0_10px_25px_rgba(8,102,189,0.08)] border border-blue-100' : 'bg-white shadow-[0_5px_15px_rgba(0,0,0,0.02)] border border-transparent active:border-blue-100'}`}>
                {isActive('/') && <div className="absolute left-0 top-0 h-full w-1.5 bg-[#0866bd]"></div>}
                <div className="flex items-center gap-4 relative z-10 pl-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isActive('/') ? 'bg-[#0866bd] text-white shadow-md' : 'bg-blue-50 text-[#0866bd] group-active:bg-[#0866bd] group-active:text-white'}`}><Store size={18} /></div>
                  <span className={`text-sm tracking-wide ${isActive('/') ? 'text-[#0866bd]' : 'text-slate-800'}`}>Inicio</span>
                </div>
                <ChevronRight size={16} className={isActive('/') ? 'text-[#0866bd]' : 'text-slate-300'} />
              </motion.button>
              
              <motion.button variants={itemVariants} onClick={() => handleNavigation('/catalogo')} className={`w-full text-left p-4 rounded-2xl font-black flex items-center justify-between transition-all group relative overflow-hidden ${isActive('/catalogo') ? 'bg-white shadow-[0_10px_25px_rgba(8,102,189,0.08)] border border-blue-100' : 'bg-white shadow-[0_5px_15px_rgba(0,0,0,0.02)] border border-transparent active:border-blue-100'}`}>
                {isActive('/catalogo') && <div className="absolute left-0 top-0 h-full w-1.5 bg-[#0866bd]"></div>}
                <div className="flex items-center gap-4 relative z-10 pl-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isActive('/catalogo') ? 'bg-[#0866bd] text-white shadow-md' : 'bg-blue-50 text-[#0866bd] group-active:bg-[#0866bd] group-active:text-white'}`}><Wrench size={18} /></div>
                  <span className={`text-sm tracking-wide ${isActive('/catalogo') ? 'text-[#0866bd]' : 'text-slate-800'}`}>Catálogo General</span>
                </div>
                <ChevronRight size={16} className={isActive('/catalogo') ? 'text-[#0866bd]' : 'text-slate-300'} />
              </motion.button>
              
              {/* TALLERES VIP DESTAQUE (Siempre llamativo) */}
              <motion.button variants={itemVariants} onClick={() => handleNavigation('/talleres')} className="w-full text-left p-4 rounded-2xl font-black text-slate-900 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 shadow-[0_10px_20px_rgba(250,204,21,0.3)] flex items-center justify-between active:scale-95 transition-all group relative overflow-hidden mt-6">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/30 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                
                <div className="flex items-center gap-4 relative z-10 pl-2">
                  <div className="w-10 h-10 bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center text-slate-900 shadow-sm border border-white/20"><Star size={18} className="fill-current" /></div>
                  <span className="text-sm tracking-wide font-black drop-shadow-sm">Club Talleres VIP</span>
                </div>
                <div className="relative z-10 bg-slate-900 text-yellow-400 text-[9px] px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm flex items-center gap-1 group-hover:bg-black transition-colors">
                  Unirme <ChevronRight size={12}/>
                </div>
              </motion.button>

              <div className="my-6 border-t border-slate-200/60 w-3/4 mx-auto relative">
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-[#f8fafc] px-2 text-[8px] text-slate-300 font-black tracking-widest uppercase">Servicios</div>
              </div>
              
              <motion.button variants={itemVariants} onClick={() => { onOpenTrackModal(); onClose(); }} className="w-full text-left p-4 rounded-2xl font-bold text-slate-600 bg-slate-50 flex items-center justify-between active:scale-95 transition-all group border border-slate-200/50 hover:bg-white hover:shadow-sm">
                <div className="flex items-center gap-4 pl-2">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-500 shadow-sm border border-slate-100 group-hover:text-[#0866bd] transition-colors"><Package size={18} /></div>
                  <span className="text-sm font-black text-slate-700 group-hover:text-[#0866bd] transition-colors">Rastrear Orden</span>
                </div>
                <ChevronRight size={14} className="text-slate-300" />
              </motion.button>

              {/* Sección de Redes y Dirección */}
              <motion.div variants={itemVariants} className="mt-10 pt-6 flex flex-col items-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-4 flex items-center gap-2">
                  <div className="h-px w-4 bg-slate-300"></div> Síguenos <div className="h-px w-4 bg-slate-300"></div>
                </p>
                <div className="flex justify-center gap-3 w-full px-2">
                   <a href="https://www.facebook.com/profile.php?id=61582551320267" target="_blank" rel="noreferrer" className="flex-1 h-12 bg-white hover:bg-[#1877F2] hover:text-white text-[#0866bd] rounded-xl flex items-center justify-center transition-colors shadow-sm border border-slate-100 active:scale-95"><Facebook size={18} /></a>
                   <a href="https://www.instagram.com/el_jefe1949/" target="_blank" rel="noreferrer" className="flex-1 h-12 bg-white hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7] hover:text-white text-pink-600 rounded-xl flex items-center justify-center transition-colors shadow-sm border border-slate-100 active:scale-95"><Instagram size={18} /></a>
                   <a href="https://www.tiktok.com/@moto.partes.el.je" target="_blank" rel="noreferrer" className="flex-1 h-12 bg-white hover:bg-black hover:text-white text-slate-800 rounded-xl flex items-center justify-center transition-colors shadow-sm border border-slate-100 active:scale-95"><TikTok size={18} /></a>
                </div>
                
                <div className="mt-8 flex items-start gap-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 w-full mb-8">
                  <div className="bg-white p-1.5 rounded-lg shadow-sm border border-blue-100/50 shrink-0">
                    <MapPin size={16} className="text-[#0866bd]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Sucursal Física</span>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed">
                      Marcos Lara 60, Santa Paula, Tonalá, Jalisco, MX.
                    </p>
                  </div>
                </div>
              </motion.div>

            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
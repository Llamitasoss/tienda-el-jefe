import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Store, Wrench, Star, Package, Facebook, Instagram, ChevronRight, MapPin, Search } from 'lucide-react';

const TikTok = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

// --- Configuraciones de Animación Light Premium ---
const overlayVariants = {
  hidden: { opacity: 0, backdropFilter: "blur(0px)" },
  visible: { opacity: 1, backdropFilter: "blur(4px)", transition: { duration: 0.4, ease: "easeOut" } }
};

// Física de resorte (spring) ajustada para sentirse como una App Nativa
const menuVariants = {
  hidden: { x: "-100%" },
  visible: { 
    x: 0, 
    transition: { type: "spring", stiffness: 350, damping: 30, mass: 0.8 }
  },
  exit: { 
    x: "-100%", 
    transition: { type: "spring", stiffness: 350, damping: 30, mass: 0.8 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10, filter: "blur(2px)" },
  visible: { opacity: 1, x: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 400, damping: 25 } }
};

export default function MobileMenu({ isOpen, onClose, onOpenTrackModal }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  const isActive = (path) => location.pathname === path;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex">
          
          {/* Fondo oscuro desenfocado */}
          <motion.div 
            variants={overlayVariants} initial="hidden" animate="visible" exit="hidden"
            className="absolute inset-0 bg-slate-900/40" 
            onClick={onClose} 
          />
          
          {/* Panel Lateral Izquierdo (Con Drag para Swipe-to-Close) */}
          <motion.div 
            variants={menuVariants} initial="hidden" animate="visible" exit="exit"
            drag="x" 
            dragConstraints={{ left: 0, right: 0 }} 
            dragElastic={0.1} 
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.x < -80 || velocity.x < -400) onClose();
            }}
            className="relative w-[85%] max-w-[340px] bg-[#FBFBF2] h-full shadow-[20px_0_60px_rgba(0,0,0,0.15)] flex flex-col rounded-r-[2.5rem] overflow-hidden border-r border-slate-200 z-10"
          >
            {/* === HEADER DEL MENÚ (AZUL BRAND) === */}
            <div className="bg-[#0866bd] p-8 pb-10 relative overflow-hidden shrink-0 shadow-sm z-20">
              <div className="absolute top-[-50%] left-[-20%] w-40 h-40 bg-white/20 rounded-full blur-[30px] pointer-events-none"></div>
              
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3">
                  <motion.div 
                    initial={{ rotate: -15, scale: 0.8 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                    className="bg-white p-1 rounded-xl shadow-[0_5px_15px_rgba(0,0,0,0.2)] flex items-center justify-center w-12 h-12 border border-blue-100"
                  >
                    <img src="/logo.ico" alt="Logo El Jefe" className="w-full h-full object-contain" />
                  </motion.div>
                  <div className="flex flex-col">
                    <span className="font-black text-xl tracking-tighter uppercase text-white leading-none drop-shadow-sm">El Jefe</span>
                    <p className="text-[8px] text-blue-200 uppercase tracking-[0.3em] font-bold mt-1 drop-shadow-sm">Moto Partes</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md border border-white/20 active:scale-90 shadow-sm">
                  <X size={18} strokeWidth={2.5} />
                </button>
              </div>

              {/* Botón de Búsqueda Rápida */}
              <motion.button 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                onClick={() => handleNavigation('/catalogo')}
                className="mt-8 w-full bg-[#03254c]/40 hover:bg-[#03254c]/60 backdrop-blur-xl border border-white/10 py-3.5 px-4 rounded-xl flex items-center gap-3 text-blue-100 transition-colors shadow-inner"
              >
                <Search size={16} className="text-white shrink-0"/>
                <span className="text-[10px] font-bold truncate tracking-widest uppercase">Buscar pieza o modelo...</span>
              </motion.button>
            </div>

            {/* === OPCIONES DE NAVEGACIÓN EN CASCADA (LIGHT PREMIUM) === */}
            <motion.div 
              variants={staggerContainer} initial="hidden" animate="visible" exit="hidden"
              className="p-5 flex-1 overflow-y-auto space-y-3 custom-scrollbar relative z-10 -mt-4 bg-[#FBFBF2] rounded-tl-3xl"
            >
              
              <motion.button variants={itemVariants} onClick={() => handleNavigation('/')} className={`w-full text-left p-3.5 rounded-[1.2rem] font-black flex items-center justify-between transition-all group relative overflow-hidden ${isActive('/') ? 'bg-white shadow-[0_5px_15px_rgba(8,102,189,0.1)] border border-[#0866bd]/30' : 'bg-transparent hover:bg-white border border-transparent hover:border-slate-200'}`}>
                {isActive('/') && <div className="absolute left-0 top-0 h-full w-1.5 bg-[#0866bd] rounded-r-full shadow-[0_0_8px_rgba(8,102,189,0.5)]"></div>}
                <div className="flex items-center gap-3 relative z-10 pl-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm border ${isActive('/') ? 'bg-[#0866bd] text-white border-transparent' : 'bg-slate-50 text-slate-400 border-slate-200 group-active:bg-[#0866bd] group-active:text-white'}`}><Store size={18} strokeWidth={2} /></div>
                  <span className={`text-[11px] tracking-widest uppercase ${isActive('/') ? 'text-[#0866bd]' : 'text-slate-600'}`}>Inicio</span>
                </div>
                <ChevronRight size={16} strokeWidth={2.5} className={isActive('/') ? 'text-[#0866bd]' : 'text-slate-300 group-hover:text-[#0866bd]'} />
              </motion.button>
              
              <motion.button variants={itemVariants} onClick={() => handleNavigation('/catalogo')} className={`w-full text-left p-3.5 rounded-[1.2rem] font-black flex items-center justify-between transition-all group relative overflow-hidden ${isActive('/catalogo') ? 'bg-white shadow-[0_5px_15px_rgba(8,102,189,0.1)] border border-[#0866bd]/30' : 'bg-transparent hover:bg-white border border-transparent hover:border-slate-200'}`}>
                {isActive('/catalogo') && <div className="absolute left-0 top-0 h-full w-1.5 bg-[#0866bd] rounded-r-full shadow-[0_0_8px_rgba(8,102,189,0.5)]"></div>}
                <div className="flex items-center gap-3 relative z-10 pl-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm border ${isActive('/catalogo') ? 'bg-[#0866bd] text-white border-transparent' : 'bg-slate-50 text-slate-400 border-slate-200 group-active:bg-[#0866bd] group-active:text-white'}`}><Wrench size={18} strokeWidth={2} /></div>
                  <span className={`text-[11px] tracking-widest uppercase ${isActive('/catalogo') ? 'text-[#0866bd]' : 'text-slate-600'}`}>Catálogo</span>
                </div>
                <ChevronRight size={16} strokeWidth={2.5} className={isActive('/catalogo') ? 'text-[#0866bd]' : 'text-slate-300 group-hover:text-[#0866bd]'} />
              </motion.button>
              
              {/* TALLERES VIP DESTAQUE (Oro Ligero) */}
              <motion.button variants={itemVariants} onClick={() => handleNavigation('/talleres')} className="w-full text-left p-4 rounded-[1.2rem] font-black text-slate-900 bg-gradient-to-r from-yellow-50 to-amber-50 shadow-sm border border-yellow-200 flex items-center justify-between active:scale-95 transition-all group relative overflow-hidden mt-4">
                <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-400/10 rounded-full blur-[15px] group-hover:scale-150 transition-transform duration-700"></div>
                
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-yellow-500 shadow-sm border border-yellow-100"><Star size={18} className="fill-current" /></div>
                  <span className="text-[11px] tracking-widest uppercase drop-shadow-sm text-yellow-700">Club VIP</span>
                </div>
                <div className="relative z-10 bg-yellow-400 text-[#021830] text-[9px] px-2.5 py-1.5 rounded-md uppercase tracking-widest shadow-sm flex items-center gap-1 group-hover:bg-yellow-500 transition-colors">
                  Info <ChevronRight size={12} strokeWidth={3}/>
                </div>
              </motion.button>

              <div className="my-6 flex items-center justify-center relative">
                <div className="absolute w-full h-px bg-slate-200"></div>
                <span className="bg-[#FBFBF2] px-3 text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] relative z-10">Servicios</span>
              </div>
              
              {/* Botón Rastrear */}
              <motion.button variants={itemVariants} onClick={() => { onOpenTrackModal(); onClose(); }} className="w-full text-left p-3.5 rounded-[1.2rem] font-bold text-slate-600 bg-white flex items-center justify-between active:scale-95 transition-all group border border-slate-200 shadow-[0_5px_15px_rgba(0,0,0,0.02)] hover:border-[#0866bd]/40 hover:shadow-md">
                <div className="flex items-center gap-3 pl-1">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 shadow-inner border border-slate-100 group-hover:text-[#0866bd] group-hover:bg-blue-50 transition-colors"><Package size={18} strokeWidth={2} /></div>
                  <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest group-hover:text-[#0866bd] transition-colors">Rastrear Orden</span>
                </div>
                <ChevronRight size={16} strokeWidth={2.5} className="text-slate-300 group-hover:text-[#0866bd]" />
              </motion.button>

              {/* === SECCIÓN DE REDES Y DIRECCIÓN === */}
              <motion.div variants={itemVariants} className="mt-8 pt-4 flex flex-col items-center pb-4">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.25em] text-center mb-4 flex items-center gap-2">
                  <div className="h-px w-4 bg-slate-300"></div> Redes Oficiales <div className="h-px w-4 bg-slate-300"></div>
                </p>
                <div className="flex justify-center gap-3 w-full">
                   <a href="https://www.facebook.com/profile.php?id=61582551320267" target="_blank" rel="noreferrer" className="w-12 h-12 bg-white hover:bg-[#1877F2] hover:text-white text-[#0866bd] rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm border border-slate-200 hover:border-transparent hover:shadow-[0_10px_20px_rgba(24,119,242,0.2)] hover:-translate-y-1"><Facebook size={18} /></a>
                   <a href="https://www.instagram.com/el_jefe1949/" target="_blank" rel="noreferrer" className="w-12 h-12 bg-white hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7] hover:text-white text-pink-600 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm border border-slate-200 hover:border-transparent hover:shadow-[0_10px_20px_rgba(225,48,108,0.2)] hover:-translate-y-1"><Instagram size={18} /></a>
                   <a href="https://www.tiktok.com/@moto.partes.el.je" target="_blank" rel="noreferrer" className="w-12 h-12 bg-white hover:bg-black hover:text-white text-slate-800 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm border border-slate-200 hover:border-transparent hover:shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:-translate-y-1"><TikTok size={18} /></a>
                </div>
                
                <div className="mt-8 flex items-start gap-3 bg-white p-4 rounded-2xl border border-slate-200 w-full shadow-sm">
                  <div className="bg-slate-50 p-2 rounded-lg shadow-inner border border-slate-100 shrink-0">
                    <MapPin size={16} className="text-[#0866bd]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-[#0866bd] uppercase tracking-[0.2em] mb-0.5">Sucursal Física</span>
                    <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
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
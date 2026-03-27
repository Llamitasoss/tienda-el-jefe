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
  visible: { opacity: 1, backdropFilter: "blur(12px)", transition: { duration: 0.5, ease: "easeOut" } }
};

// Física de resorte (spring) ajustada para sentirse como una App Nativa (iOS/Android)
const menuVariants = {
  hidden: { x: "-100%" },
  visible: { 
    x: 0, 
    transition: { type: "spring", stiffness: 350, damping: 35, mass: 0.8 }
  },
  exit: { 
    x: "-100%", 
    transition: { type: "spring", stiffness: 350, damping: 35, mass: 0.8 }
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
  hidden: { opacity: 0, x: -20, filter: "blur(4px)" },
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
          
          {/* Fondo oscuro desenfocado (Glassmorphism profundo) */}
          <motion.div 
            variants={overlayVariants} initial="hidden" animate="visible" exit="hidden"
            className="absolute inset-0 bg-slate-900/60" 
            onClick={onClose} 
          />
          
          {/* Panel Lateral Izquierdo (Con Drag para Swipe-to-Close) */}
          <motion.div 
            variants={menuVariants} initial="hidden" animate="visible" exit="exit"
            drag="x" // Permite arrastrar en el eje X
            dragConstraints={{ left: 0, right: 0 }} // Limita el arrastre
            dragElastic={0.1} // Poca elasticidad para que se sienta firme
            onDragEnd={(e, { offset, velocity }) => {
              if (offset.x < -80 || velocity.x < -400) onClose();
            }}
            className="relative w-[85%] max-w-[340px] bg-[#f4f7f9] h-full shadow-[20px_0_60px_rgba(0,0,0,0.6)] flex flex-col rounded-r-[2.5rem] overflow-hidden border-r border-white/40 z-10"
          >
            {/* === HEADER DEL MENÚ === */}
            <div className="bg-slate-900 p-8 pb-12 relative overflow-hidden shrink-0 shadow-[0_10px_30px_rgba(0,0,0,0.3)] z-20">
              <div className="absolute top-[-50%] left-[-20%] w-48 h-48 bg-[#0866bd]/40 rounded-full blur-[40px] pointer-events-none"></div>
              <div className="absolute bottom-[-20%] right-[-10%] w-32 h-32 bg-yellow-500/20 rounded-full blur-[30px] pointer-events-none"></div>
              
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-4">
                  <motion.div 
                    initial={{ rotate: -15, scale: 0.8 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                    className="bg-gradient-to-br from-white to-slate-200 p-1.5 rounded-[1.2rem] shadow-[0_10px_25px_rgba(0,0,0,0.5)] flex items-center justify-center w-14 h-14 border border-white/10"
                  >
                    <img src="/logo.ico" alt="Logo El Jefe" className="w-full h-full object-contain" />
                  </motion.div>
                  <div className="flex flex-col">
                    <span className="font-black text-2xl tracking-tighter uppercase text-white leading-none drop-shadow-md">El Jefe</span>
                    <p className="text-[9px] text-blue-400 uppercase tracking-[0.3em] font-bold mt-1">Moto Partes</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-10 h-10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md border border-white/10 active:scale-90">
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>

              {/* Botón de Búsqueda Rápida (Falso Input para llamar a la acción) */}
              <motion.button 
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                onClick={() => handleNavigation('/catalogo')}
                className="mt-8 w-full bg-white/10 hover:bg-white/15 backdrop-blur-xl border border-white/20 py-3.5 px-5 rounded-[1.2rem] flex items-center gap-3 text-slate-300 transition-colors shadow-inner"
              >
                <Search size={18} className="text-blue-400 shrink-0"/>
                <span className="text-xs font-bold truncate">Buscar pieza o modelo...</span>
              </motion.button>
            </div>

            {/* === OPCIONES DE NAVEGACIÓN EN CASCADA === */}
            <motion.div 
              variants={staggerContainer} initial="hidden" animate="visible" exit="hidden"
              className="p-6 flex-1 overflow-y-auto space-y-4 custom-scrollbar relative z-10 -mt-6 bg-[#f4f7f9] rounded-tl-[2.5rem]"
            >
              
              <motion.button variants={itemVariants} onClick={() => handleNavigation('/')} className={`w-full text-left p-4 rounded-[1.5rem] font-black flex items-center justify-between transition-all group relative overflow-hidden ${isActive('/') ? 'bg-white shadow-[0_15px_30px_rgba(8,102,189,0.1)] border border-blue-100' : 'bg-transparent hover:bg-white/50 border border-transparent hover:border-slate-200'}`}>
                {isActive('/') && <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-[#0866bd] to-blue-400 rounded-r-full shadow-[0_0_10px_rgba(8,102,189,0.5)]"></div>}
                <div className="flex items-center gap-4 relative z-10 pl-2">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm ${isActive('/') ? 'bg-[#0866bd] text-white' : 'bg-white text-[#0866bd] border border-slate-100 group-active:bg-[#0866bd] group-active:text-white'}`}><Store size={20} strokeWidth={2.5} /></div>
                  <span className={`text-sm tracking-widest uppercase ${isActive('/') ? 'text-[#0866bd]' : 'text-slate-700'}`}>Inicio</span>
                </div>
                <ChevronRight size={18} className={isActive('/') ? 'text-[#0866bd]' : 'text-slate-300 group-hover:text-slate-400'} />
              </motion.button>
              
              <motion.button variants={itemVariants} onClick={() => handleNavigation('/catalogo')} className={`w-full text-left p-4 rounded-[1.5rem] font-black flex items-center justify-between transition-all group relative overflow-hidden ${isActive('/catalogo') ? 'bg-white shadow-[0_15px_30px_rgba(8,102,189,0.1)] border border-blue-100' : 'bg-transparent hover:bg-white/50 border border-transparent hover:border-slate-200'}`}>
                {isActive('/catalogo') && <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-[#0866bd] to-blue-400 rounded-r-full shadow-[0_0_10px_rgba(8,102,189,0.5)]"></div>}
                <div className="flex items-center gap-4 relative z-10 pl-2">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm ${isActive('/catalogo') ? 'bg-[#0866bd] text-white' : 'bg-white text-[#0866bd] border border-slate-100 group-active:bg-[#0866bd] group-active:text-white'}`}><Wrench size={20} strokeWidth={2.5} /></div>
                  <span className={`text-sm tracking-widest uppercase ${isActive('/catalogo') ? 'text-[#0866bd]' : 'text-slate-700'}`}>Catálogo</span>
                </div>
                <ChevronRight size={18} className={isActive('/catalogo') ? 'text-[#0866bd]' : 'text-slate-300 group-hover:text-slate-400'} />
              </motion.button>
              
              {/* TALLERES VIP DESTAQUE (Hardware Premium) */}
              <motion.button variants={itemVariants} onClick={() => handleNavigation('/talleres')} className="w-full text-left p-5 rounded-[1.5rem] font-black text-white bg-slate-900 shadow-[0_15px_30px_rgba(0,0,0,0.3)] flex items-center justify-between active:scale-95 transition-all group relative overflow-hidden mt-6 border border-slate-800">
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/20 rounded-full blur-[20px] group-hover:scale-150 transition-transform duration-700"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-[1.2rem] flex items-center justify-center text-slate-900 shadow-[0_5px_15px_rgba(250,204,21,0.4)] border border-yellow-200"><Star size={20} className="fill-current" /></div>
                  <span className="text-sm tracking-widest uppercase drop-shadow-sm">Club VIP</span>
                </div>
                <div className="relative z-10 bg-white/10 text-yellow-400 text-[10px] px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-inner border border-white/10 flex items-center gap-1 group-hover:bg-yellow-400 group-hover:text-slate-900 transition-colors">
                  Info <ChevronRight size={14}/>
                </div>
              </motion.button>

              <div className="my-8 flex items-center justify-center relative">
                <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
                <span className="bg-[#f4f7f9] px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] relative z-10">Servicios</span>
              </div>
              
              {/* Botón Rastrear */}
              <motion.button variants={itemVariants} onClick={() => { onOpenTrackModal(); onClose(); }} className="w-full text-left p-4 rounded-[1.5rem] font-bold text-slate-600 bg-white flex items-center justify-between active:scale-95 transition-all group border border-slate-200 shadow-[0_5px_15px_rgba(0,0,0,0.02)] hover:border-blue-200 hover:shadow-md">
                <div className="flex items-center gap-4 pl-2">
                  <div className="w-12 h-12 bg-slate-50 rounded-[1.2rem] flex items-center justify-center text-slate-500 shadow-inner border border-slate-100 group-hover:text-[#0866bd] group-hover:bg-blue-50 transition-colors"><Package size={20} strokeWidth={2.5} /></div>
                  <span className="text-sm font-black text-slate-700 uppercase tracking-widest group-hover:text-[#0866bd] transition-colors">Rastrear Orden</span>
                </div>
                <ChevronRight size={16} className="text-slate-300 group-hover:text-[#0866bd]" />
              </motion.button>

              {/* === SECCIÓN DE REDES Y DIRECCIÓN === */}
              <motion.div variants={itemVariants} className="mt-12 pt-6 flex flex-col items-center pb-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] text-center mb-5 flex items-center gap-3">
                  <div className="h-[2px] w-4 bg-slate-300 rounded-full"></div> Redes Oficiales <div className="h-[2px] w-4 bg-slate-300 rounded-full"></div>
                </p>
                <div className="flex justify-center gap-4 w-full">
                   <a href="https://www.facebook.com/profile.php?id=61582551320267" target="_blank" rel="noreferrer" className="w-14 h-14 bg-white hover:bg-[#1877F2] hover:text-white text-[#0866bd] rounded-[1.2rem] flex items-center justify-center transition-all duration-300 shadow-sm border border-slate-200 hover:border-transparent hover:shadow-[0_10px_20px_rgba(24,119,242,0.3)] hover:-translate-y-1"><Facebook size={22} /></a>
                   <a href="https://www.instagram.com/el_jefe1949/" target="_blank" rel="noreferrer" className="w-14 h-14 bg-white hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7] hover:text-white text-pink-600 rounded-[1.2rem] flex items-center justify-center transition-all duration-300 shadow-sm border border-slate-200 hover:border-transparent hover:shadow-[0_10px_20px_rgba(225,48,108,0.3)] hover:-translate-y-1"><Instagram size={22} /></a>
                   <a href="https://www.tiktok.com/@moto.partes.el.je" target="_blank" rel="noreferrer" className="w-14 h-14 bg-white hover:bg-black hover:text-white text-slate-800 rounded-[1.2rem] flex items-center justify-center transition-all duration-300 shadow-sm border border-slate-200 hover:border-transparent hover:shadow-[0_10px_20px_rgba(0,0,0,0.3)] hover:-translate-y-1"><TikTok size={22} /></a>
                </div>
                
                <div className="mt-10 flex items-start gap-4 bg-blue-50/50 p-5 rounded-[1.5rem] border border-blue-100/50 w-full shadow-inner">
                  <div className="bg-white p-2.5 rounded-xl shadow-sm border border-blue-100 shrink-0">
                    <MapPin size={20} className="text-[#0866bd]" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-[#0866bd] uppercase tracking-[0.2em] mb-1">Sucursal Física</span>
                    <p className="text-xs font-bold text-slate-600 leading-relaxed">
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
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Store, Wrench, Star, Package, Facebook, Instagram, ChevronRight, MapPin } from 'lucide-react';

const TikTok = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

// Configuraciones de Animación
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
};

const menuVariants = {
  hidden: { x: "-100%" },
  visible: { 
    x: 0, 
    transition: { type: "tween", ease: [0.25, 0.1, 0.25, 1], duration: 0.4 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function MobileMenu({ isOpen, onClose, onOpenTrackModal }) {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex">
          
          {/* Fondo oscuro desenfocado */}
          <motion.div 
            variants={overlayVariants} initial="hidden" animate="visible" exit="hidden"
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
            onClick={onClose} 
          />
          
          {/* Panel Lateral Izquierdo */}
          <motion.div 
            variants={menuVariants} initial="hidden" animate="visible" exit="hidden"
            className="relative w-[85%] max-w-sm bg-[#f8fafc] h-full shadow-[30px_0_60px_rgba(0,0,0,0.4)] flex flex-col rounded-r-[2.5rem] overflow-hidden border-r border-white/50"
          >
            {/* Header del Menú */}
            <div className="bg-[#0866bd] p-8 pb-10 relative overflow-hidden shrink-0">
              <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-1 rounded-xl shadow-sm flex items-center justify-center w-12 h-12">
                    <img src="/logo.ico" alt="Logo El Jefe" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <span className="font-black text-xl tracking-tighter uppercase text-yellow-400 leading-none">El Jefe</span>
                    <p className="text-[9px] text-blue-200 uppercase tracking-[0.25em] font-bold mt-0.5">Moto Partes</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm border border-white/10">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Opciones de Navegación en Cascada */}
            <motion.div 
              variants={staggerContainer} initial="hidden" animate="visible" exit="hidden"
              className="p-6 flex-1 overflow-y-auto space-y-3 custom-scrollbar relative z-10 -mt-4 bg-[#f8fafc] rounded-tl-[2.5rem]"
            >
              
              <motion.button variants={itemVariants} onClick={() => handleNavigation('/')} className="w-full text-left p-4 rounded-2xl font-black text-slate-800 bg-white shadow-[0_5px_15px_rgba(0,0,0,0.02)] flex items-center justify-between border border-transparent active:border-blue-100 active:scale-95 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#0866bd] group-active:bg-[#0866bd] group-active:text-white transition-colors"><Store size={18} /></div>
                  <span className="text-sm tracking-wide">Inicio</span>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </motion.button>
              
              <motion.button variants={itemVariants} onClick={() => handleNavigation('/catalogo')} className="w-full text-left p-4 rounded-2xl font-black text-slate-800 bg-white shadow-[0_5px_15px_rgba(0,0,0,0.02)] flex items-center justify-between border border-transparent active:border-blue-100 active:scale-95 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#0866bd] group-active:bg-[#0866bd] group-active:text-white transition-colors"><Wrench size={18} /></div>
                  <span className="text-sm tracking-wide">Catálogo General</span>
                </div>
                <ChevronRight size={16} className="text-slate-300" />
              </motion.button>
              
              {/* TALLERES VIP DESTAQUE */}
              <motion.button variants={itemVariants} onClick={() => handleNavigation('/talleres')} className="w-full text-left p-4 rounded-2xl font-black text-slate-900 bg-gradient-to-r from-yellow-400 to-amber-500 shadow-[0_10px_20px_rgba(250,204,21,0.2)] flex items-center justify-between active:scale-95 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/20 rounded-full blur-xl"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-10 h-10 bg-white/30 rounded-xl flex items-center justify-center text-slate-900"><Star size={18} className="fill-current" /></div>
                  <span className="text-sm tracking-wide">Club Talleres VIP</span>
                </div>
                <div className="relative z-10 bg-slate-900 text-yellow-400 text-[9px] px-3 py-1 rounded-lg uppercase tracking-widest shadow-sm">
                  Unirme
                </div>
              </motion.button>

              <div className="my-6 border-t border-slate-200/60 w-3/4 mx-auto"></div>
              
              <motion.button variants={itemVariants} onClick={() => { onOpenTrackModal(); onClose(); }} className="w-full text-left p-4 rounded-2xl font-bold text-slate-600 bg-slate-100 flex items-center justify-between active:scale-95 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-500 shadow-sm"><Package size={18} /></div>
                  <span className="text-sm">Rastrear Orden</span>
                </div>
              </motion.button>

              {/* Sección de Redes y Dirección */}
              <motion.div variants={itemVariants} className="mt-10 pt-6 border-t border-slate-200/60 flex flex-col items-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-5">Síguenos en Redes</p>
                <div className="flex justify-center gap-4 w-full">
                   <a href="https://www.facebook.com/profile.php?id=61582551320267" target="_blank" rel="noreferrer" className="flex-1 h-14 bg-white hover:bg-[#1877F2] hover:text-white text-[#0866bd] rounded-2xl flex items-center justify-center transition-colors shadow-sm border border-slate-100"><Facebook size={20} /></a>
                   <a href="https://www.instagram.com/el_jefe1949/" target="_blank" rel="noreferrer" className="flex-1 h-14 bg-white hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7] hover:text-white text-pink-600 rounded-2xl flex items-center justify-center transition-colors shadow-sm border border-slate-100"><Instagram size={20} /></a>
                   <a href="https://www.tiktok.com/@moto.partes.el.je" target="_blank" rel="noreferrer" className="flex-1 h-14 bg-white hover:bg-black hover:text-white text-slate-800 rounded-2xl flex items-center justify-center transition-colors shadow-sm border border-slate-100"><TikTok size={20} /></a>
                </div>
                
                <div className="mt-8 flex items-start gap-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                  <MapPin size={16} className="text-[#0866bd] shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-slate-600 leading-relaxed">
                    Marcos Lara 60, Santa Paula, Tonalá, Jalisco, MX.
                  </p>
                </div>
              </motion.div>

            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion';
import { MapPin, Clock, MessageCircle, ShieldCheck, Globe, Navigation, Sparkles, ChevronRight } from 'lucide-react';

// === VARIANTES DE ANIMACIÓN STAGGER ===
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// === COMPONENTE PREMIUM: TARJETA CON LUZ MAGNÉTICA QUE SIGUE EL CURSOR ===
const GlowCard = ({ children, className = "" }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      variants={itemVariants}
      className={`relative group rounded-[2rem] bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
    >
      {/* Luz que sigue al cursor */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[2rem] opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              600px circle at ${mouseX}px ${mouseY}px,
              rgba(8, 102, 189, 0.15),
              transparent 80%
            )
          `,
        }}
      />
      {/* Borde iluminado que sigue al cursor */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[2rem] opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              300px circle at ${mouseX}px ${mouseY}px,
              rgba(255, 255, 255, 0.1),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative z-10 h-full w-full">{children}</div>
    </motion.div>
  );
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // Coordenadas actualizadas a: Marcos Lara 60, Santa Paula, Tonalá, Jalisco
  const mapUrl = "https://maps.google.com/maps?q=Marcos+Lara+60,+Santa+Paula,+Tonal%C3%A1,+Jalisco&t=&z=15&ie=UTF8&iwloc=&output=embed";
  // Enlace directo a Google Maps para dispositivos móviles (Iniciar Ruta)
  const navigationUrl = "https://www.google.com/maps/search/?api=1&query=Marcos+Lara+60,+Santa+Paula,+Tonalá,+Jalisco";

  return (
    <footer className="relative bg-[#020817] text-white pt-24 pb-8 border-t-[4px] border-[#0866bd] overflow-hidden z-10 mt-auto">
      
      {/* === DECORACIÓN DE FONDO FUTURISTA VIVA === */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Fondo de red neuronal (Grid) */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(255,255,255,0.03)_1.5px,transparent_1.5px)] bg-[size:50px_50px]"></div>
        
        {/* Orbes de luz ambientales animados */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
            x: [0, 50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#0866bd] rounded-full blur-[150px]"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.05, 0.15, 0.05],
            y: [0, -50, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-30%] right-[-10%] w-[800px] h-[800px] bg-yellow-500 rounded-full blur-[180px]"
        />
      </div>

      {/* Gradiente superior para fusionarse con la página */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#0866bd]/20 to-transparent pointer-events-none"></div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="max-w-[85rem] mx-auto px-6 relative z-10 w-full"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-16">
          
          {/* === COLUMNA 1: BRANDING Y CONTACTO === */}
          <div className="lg:col-span-5 flex flex-col items-start relative">
            <motion.div variants={itemVariants} className="flex items-center gap-5 mb-8 group cursor-default relative">
              {/* Resplandor del logo */}
              <div className="absolute top-1/2 left-8 -translate-y-1/2 -translate-x-1/2 w-20 h-20 bg-white/20 rounded-full blur-2xl group-hover:bg-yellow-400/20 transition-colors duration-500"></div>
              
              <div className="bg-gradient-to-br from-white to-slate-200 p-2.5 rounded-[1.5rem] flex items-center justify-center w-20 h-20 overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_30px_rgba(250,204,21,0.4)] transition-all duration-500 relative z-10 border border-white/20">
                <img src="/logo.ico" alt="Logo El Jefe" className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="relative z-10">
                <h4 className="text-4xl lg:text-5xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 to-amber-500 leading-[0.9] tracking-tighter drop-shadow-[0_2px_10px_rgba(250,204,21,0.2)]">
                  MOTO PARTES<br/>
                  <span className="text-white">EL JEFE</span>
                </h4>
                <div className="h-1.5 w-20 bg-gradient-to-r from-yellow-400 to-amber-500 mt-3 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.6)]"></div>
              </div>
            </motion.div>

            <motion.p variants={itemVariants} className="text-slate-300 text-sm mb-10 max-w-md leading-relaxed font-medium">
              Calidad y confianza premium en Tonalá. Expertos en refacciones para mantener tu pasión en movimiento con el inventario más especializado de la zona. <br/><strong className="text-emerald-400 font-black uppercase tracking-widest text-[10px] mt-2 inline-flex items-center gap-1"><Sparkles size={12}/> Venta Exclusiva en Mostrador.</strong>
            </motion.p>

            <motion.a 
              variants={itemVariants}
              href="https://wa.me/523332406334" 
              target="_blank" 
              rel="noreferrer" 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative inline-flex items-center gap-4 bg-slate-900 text-white px-8 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-[0_20px_40px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_40px_rgba(16,185,129,0.25)] border border-slate-700/50 hover:border-emerald-500/50 backdrop-blur-xl overflow-hidden"
            >
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] group-hover:animate-[shimmer_1.5s_infinite]"></div>
              
              <div className="relative flex items-center justify-center w-10 h-10 bg-emerald-500/10 rounded-xl border border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-slate-900 transition-colors duration-300">
                <div className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </div>
                <MessageCircle size={20} strokeWidth={2.5} className="text-emerald-400 group-hover:text-slate-900 transition-colors" /> 
              </div>
              <span className="relative z-10">WhatsApp Directo</span>
              <ChevronRight size={16} className="text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </motion.a>
          </div>

          {/* === COLUMNA 2: INFORMACIÓN OPERATIVA === */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            
            {/* HORARIOS (CON COMPONENTE GLOWCARD PREMIUM) */}
            <GlowCard className="p-8 group/card hover:border-[#0866bd]/50">
              <h5 className="font-black text-xs uppercase text-yellow-400 tracking-[0.2em] mb-8 flex items-center gap-3 drop-shadow-sm">
                <div className="bg-yellow-400/10 text-yellow-400 p-2 rounded-xl border border-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.2)] group-hover/card:bg-yellow-400 group-hover/card:text-slate-900 transition-colors"><Clock size={16}/></div> Horario en Mostrador
              </h5>
              <div className="space-y-5 relative z-10">
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-4">
                  <span className="text-slate-300 text-sm font-bold tracking-wide">Lun - Vie</span>
                  <span className="bg-[#0866bd]/20 text-blue-300 px-4 py-1.5 rounded-xl text-sm font-black border border-[#0866bd]/30 shadow-inner">11:00 - 19:00</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-700/50 pb-4">
                  <span className="text-slate-300 text-sm font-bold tracking-wide">Sábados</span>
                  <span className="bg-[#0866bd]/20 text-blue-300 px-4 py-1.5 rounded-xl text-sm font-black border border-[#0866bd]/30 shadow-inner">11:00 - 16:00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-400 text-sm font-black uppercase tracking-wider">Domingos</span>
                  <span className="text-red-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 bg-red-500/10 rounded-xl border border-red-500/20 shadow-inner">Cerrado</span>
                </div>
              </div>
              <div className="mt-8 pt-5 border-t border-slate-700/50 flex items-center gap-3 text-emerald-400">
                <ShieldCheck size={18} strokeWidth={2.5}/>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80 mt-0.5">Garantía Exacta en Local</span>
              </div>
            </GlowCard>

            {/* UBICACIÓN Y MAPA HUD (CON COMPONENTE GLOWCARD PREMIUM) */}
            <GlowCard className="flex flex-col h-full p-8 group/map hover:border-[#0866bd]/50">
              <h5 className="font-black text-xs uppercase text-yellow-400 tracking-[0.2em] mb-4 flex items-center gap-3 drop-shadow-sm">
                <div className="bg-red-500/10 text-red-400 p-2 rounded-xl border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)] group-hover/map:bg-red-500 group-hover/map:text-white transition-colors"><MapPin size={16} className="animate-pulse"/></div> Encuéntranos
              </h5>
              <p className="text-xs sm:text-sm font-bold text-white mb-6 leading-relaxed relative z-10">
                Marcos Lara 60, Santa Paula,<br/>
                <span className="text-slate-400">Tonalá, Jalisco, México.</span>
              </p>
              
              {/* Contenedor del Mapa HUD de Alta Tecnología */}
              <motion.a 
                href={navigationUrl}
                target="_blank"
                rel="noreferrer"
                whileHover={{ y: -5 }}
                className="flex-1 min-h-[160px] bg-slate-950 rounded-[1.5rem] border border-slate-700 overflow-hidden relative shadow-[0_10px_30px_rgba(0,0,0,0.5)] group/link block cursor-pointer z-10"
                title="Abrir en Google Maps"
              >
                {/* Iframe con filtro Sci-Fi */}
                <iframe 
                  src={mapUrl}
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen="" 
                  loading="lazy" 
                  className="grayscale opacity-50 group-hover/link:grayscale-0 group-hover/link:opacity-90 transition-all duration-700 scale-110 group-hover/link:scale-100 pointer-events-none mix-blend-lighten" 
                ></iframe>
                
                {/* Overlay Grid Táctico */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(8,102,189,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(8,102,189,0.2)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-30 group-hover/link:opacity-0 transition-opacity"></div>
                
                {/* Escáner animado sobre el mapa */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-[#0866bd] shadow-[0_0_10px_#0866bd] opacity-0 group-hover/link:opacity-100 group-hover/link:animate-[scan_2s_ease-in-out_infinite] pointer-events-none"></div>

                {/* Botón de Iniciar Ruta */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-transparent to-transparent opacity-90 group-hover/link:opacity-60 transition-opacity flex items-end justify-center p-4">
                  <div className="w-full bg-[#0866bd]/80 backdrop-blur-xl text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl border border-blue-400/50 flex items-center justify-center gap-2 translate-y-8 opacity-0 group-hover/link:translate-y-0 group-hover/link:opacity-100 transition-all duration-500 shadow-[0_0_20px_rgba(8,102,189,0.6)]">
                    <Navigation size={14} className="fill-current"/> Iniciar Navegación
                  </div>
                </div>
              </motion.a>
            </GlowCard>

          </div>
        </div>

        {/* === BARRA INFERIOR DE COPYRIGHT === */}
        <motion.div variants={itemVariants} className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 mt-auto relative z-10">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 bg-slate-900/50 backdrop-blur-md px-5 py-2.5 rounded-full border border-slate-800 shadow-inner">
            <Globe size={14} className="text-[#0866bd]" />
            <span className="mt-0.5">Tonalá, Jalisco, MX</span>
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-center flex flex-wrap justify-center items-center gap-3">
            <span>© {currentYear} Moto Partes El Jefe</span>
            <span className="hidden sm:inline text-slate-700">|</span> 
            <span className="text-yellow-500/80 bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/20 flex items-center gap-1.5"><ShieldCheck size={12}/> Venta en Mostrador</span>
          </p>

          {/* Indicadores de Sistema (Animación secuencial) */}
          <div className="flex gap-2 items-center bg-slate-900/50 px-4 py-2.5 rounded-full border border-slate-800">
             <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mr-2">SYS_OK</span>
             <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-[#0866bd] shadow-[0_0_8px_#0866bd]"></motion.div>
             <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }} className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15]"></motion.div>
             <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 1 }} className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]"></motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* CSS extra para la animación del escáner del mapa */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
    </footer>
  );
}
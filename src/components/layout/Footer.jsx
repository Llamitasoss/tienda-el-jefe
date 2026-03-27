import React from 'react';
import { motion, useMotionValue, useMotionTemplate } from 'framer-motion';
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

// === COMPONENTE PREMIUM: TARJETA FROST GLASS CON MAGNÉTISMO DORADO ===
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
      className={`relative group rounded-[2.5rem] bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.2)] overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
    >
      {/* Luz dorada/blanca que sigue al cursor */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[2.5rem] opacity-0 transition duration-500 group-hover:opacity-100 mix-blend-overlay"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              500px circle at ${mouseX}px ${mouseY}px,
              rgba(255, 255, 255, 0.4),
              transparent 80%
            )
          `,
        }}
      />
      {/* Borde sutil iluminado */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-[2.5rem] opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              300px circle at ${mouseX}px ${mouseY}px,
              rgba(250, 204, 21, 0.15),
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
    <footer className="relative bg-gradient-to-b from-[#0866bd] to-[#042f56] text-white pt-24 pb-8 overflow-hidden z-10 mt-auto border-t-4 border-amber-400 shadow-[0_-10px_30px_rgba(8,102,189,0.3)]">
      
      {/* === DECORACIÓN DE FONDO CLÁSICA/FUTURISTA === */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Patrón de puntos (Elegante y técnico) */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.15)_1.5px,transparent_1.5px)] bg-[size:30px_30px]"></div>
        
        {/* Orbes de luz ambientales animados (Tonos Dorados y Celestes) */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-400 rounded-full blur-[150px] mix-blend-overlay"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.2, 0.1],
            y: [0, -50, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-30%] right-[-10%] w-[800px] h-[800px] bg-amber-300 rounded-full blur-[180px] mix-blend-overlay"
        />
      </div>

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
            <motion.div variants={itemVariants} className="flex items-center gap-6 mb-10 group cursor-default relative">
              {/* Resplandor trasero dorado del logo */}
              <div className="absolute top-1/2 left-10 -translate-y-1/2 -translate-x-1/2 w-24 h-24 bg-amber-400/30 rounded-full blur-[30px] group-hover:bg-white/40 transition-colors duration-700"></div>
              
              <div className="bg-white p-3 rounded-[1.8rem] flex items-center justify-center w-20 h-20 overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.3)] group-hover:shadow-[0_0_40px_rgba(250,204,21,0.5)] transition-all duration-500 relative z-10 border border-white">
                <img src="/logo.ico" alt="Logo El Jefe" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="relative z-10">
                <h4 className="text-4xl lg:text-5xl font-black uppercase text-white leading-[0.9] tracking-tighter drop-shadow-md">
                  MOTO PARTES<br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500 drop-shadow-sm">EL JEFE</span>
                </h4>
                {/* Línea dorada clásica */}
                <div className="h-1.5 w-24 bg-gradient-to-r from-yellow-400 to-amber-500 mt-4 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.6)]"></div>
              </div>
            </motion.div>

            <motion.p variants={itemVariants} className="text-blue-50 text-sm mb-12 max-w-md leading-relaxed font-medium drop-shadow-sm border-l-4 border-amber-400 pl-5">
              Calidad, herencia y confianza premium en Tonalá. Expertos en refacciones para mantener tu pasión en movimiento con el inventario más especializado. <br/><strong className="text-amber-300 font-black uppercase tracking-widest text-[10px] mt-3 inline-flex items-center gap-1.5"><Sparkles size={12}/> Venta Exclusiva en Mostrador.</strong>
            </motion.p>

            {/* BOTÓN CONTACTO CLÁSICO/MODERNO */}
            <motion.a 
              variants={itemVariants}
              href="https://wa.me/523332406334" 
              target="_blank" 
              rel="noreferrer" 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative inline-flex items-center gap-4 bg-white text-[#0866bd] px-8 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_40px_rgba(255,255,255,0.25)] border border-transparent overflow-hidden"
            >
              {/* Shimmer de luz dorada */}
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(250,204,21,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] group-hover:bg-[position:200%_0,0_0] transition-[background-position] duration-[1.5s]"></div>
              
              <div className="relative flex items-center justify-center w-10 h-10 bg-blue-50 rounded-xl border border-blue-100 group-hover:bg-[#0866bd] group-hover:text-white transition-colors duration-300 shadow-inner">
                <MessageCircle size={20} strokeWidth={2.5} className="text-[#0866bd] group-hover:text-white transition-colors" /> 
              </div>
              <span className="relative z-10 group-hover:text-[#064e94] transition-colors">WhatsApp Directo</span>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-[#0866bd] group-hover:translate-x-1 transition-all" />
            </motion.a>
          </div>

          {/* === COLUMNA 2: INFORMACIÓN OPERATIVA === */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            
            {/* HORARIOS (FROST GLASS) */}
            <GlowCard className="p-8 sm:p-10 group/card hover:border-amber-400/50">
              <h5 className="font-black text-xs uppercase text-amber-300 tracking-[0.2em] mb-8 flex items-center gap-3 drop-shadow-sm">
                <div className="bg-amber-400/20 text-amber-300 p-2.5 rounded-xl border border-amber-400/30 shadow-inner group-hover/card:bg-amber-400 group-hover/card:text-slate-900 transition-colors"><Clock size={18}/></div> Horario en Mostrador
              </h5>
              <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-center border-b border-white/20 pb-4">
                  <span className="text-white font-bold tracking-wide">Lun - Vie</span>
                  <span className="bg-white/10 text-white px-4 py-1.5 rounded-xl text-sm font-black border border-white/20 shadow-inner">11:00 - 19:00</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/20 pb-4">
                  <span className="text-white font-bold tracking-wide">Sábados</span>
                  <span className="bg-white/10 text-white px-4 py-1.5 rounded-xl text-sm font-black border border-white/20 shadow-inner">11:00 - 16:00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-200 font-black uppercase tracking-wider">Domingos</span>
                  <span className="text-red-100 text-xs font-black uppercase tracking-widest px-4 py-1.5 bg-red-500/30 rounded-xl border border-red-400/40 shadow-inner">Cerrado</span>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-white/20 flex items-center gap-3 text-amber-300">
                <ShieldCheck size={20} strokeWidth={2.5}/>
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-100 mt-0.5">Garantía Exacta en Local</span>
              </div>
            </GlowCard>

            {/* UBICACIÓN Y MAPA HUD (FROST GLASS) */}
            <GlowCard className="flex flex-col h-full p-8 sm:p-10 group/map hover:border-amber-400/50">
              <h5 className="font-black text-xs uppercase text-amber-300 tracking-[0.2em] mb-5 flex items-center gap-3 drop-shadow-sm">
                <div className="bg-red-500/20 text-red-200 p-2.5 rounded-xl border border-red-400/30 shadow-inner group-hover/map:bg-red-500 group-hover/map:text-white transition-colors"><MapPin size={18} className="animate-pulse"/></div> Encuéntranos
              </h5>
              <p className="text-xs sm:text-sm font-bold text-white mb-6 leading-relaxed relative z-10 drop-shadow-sm">
                Marcos Lara 60, Santa Paula,<br/>
                <span className="text-blue-200 font-medium">Tonalá, Jalisco, México.</span>
              </p>
              
              {/* Contenedor del Mapa HUD (Clásico / Tecnológico) */}
              <motion.a 
                href={navigationUrl}
                target="_blank"
                rel="noreferrer"
                whileHover={{ y: -5 }}
                className="flex-1 min-h-[160px] bg-[#03254c] rounded-[1.5rem] border border-white/20 overflow-hidden relative shadow-[0_10px_30px_rgba(0,0,0,0.3)] group/link block cursor-pointer z-10"
                title="Abrir en Google Maps"
              >
                {/* Iframe del mapa (En azul clásico, recupera el color real al hover) */}
                <iframe 
                  src={mapUrl}
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen="" 
                  loading="lazy" 
                  className="grayscale opacity-60 mix-blend-screen group-hover/link:grayscale-0 group-hover/link:opacity-100 transition-all duration-700 scale-110 group-hover/link:scale-100 pointer-events-none" 
                ></iframe>
                
                {/* Overlay Retícula Dorada */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(250,204,21,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(250,204,21,0.2)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-30 group-hover/link:opacity-0 transition-opacity mix-blend-overlay"></div>
                
                {/* Botón de Iniciar Ruta Clásico */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#042f56] via-transparent to-transparent opacity-90 group-hover/link:opacity-50 transition-opacity flex items-end justify-center p-4">
                  <div className="w-full bg-white text-[#0866bd] text-[10px] font-black uppercase tracking-widest py-3 rounded-xl border border-transparent flex items-center justify-center gap-2 translate-y-8 opacity-0 group-hover/link:translate-y-0 group-hover/link:opacity-100 transition-all duration-500 shadow-[0_10px_20px_rgba(0,0,0,0.3)]">
                    <Navigation size={14} className="fill-current text-[#0866bd]"/> Iniciar Navegación
                  </div>
                </div>
              </motion.a>
            </GlowCard>

          </div>
        </div>

        {/* === BARRA INFERIOR DE COPYRIGHT (Elegante y Limpia) === */}
        <motion.div variants={itemVariants} className="pt-8 border-t border-white/20 flex flex-col md:flex-row justify-between items-center gap-6 mt-auto relative z-10">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-white bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20 shadow-inner">
            <Globe size={14} className="text-amber-300" />
            <span className="mt-0.5 drop-shadow-sm">Tonalá, Jalisco, MX</span>
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100 text-center flex flex-wrap justify-center items-center gap-3">
            <span>© {currentYear} Moto Partes El Jefe</span>
            <span className="hidden sm:inline text-white/30">|</span> 
            <span className="text-slate-900 bg-amber-400 px-3 py-1.5 rounded-lg border border-amber-300 shadow-sm flex items-center gap-1.5 drop-shadow-sm"><ShieldCheck size={12}/> Venta en Mostrador</span>
          </p>

          {/* Indicadores de Sistema Dorados */}
          <div className="flex gap-2 items-center bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/20 shadow-inner">
             <span className="text-[8px] font-black text-white uppercase tracking-widest mr-2 opacity-80">SYS_OK</span>
             <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_#fcd34d]"></motion.div>
             <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }} className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#ffffff]"></motion.div>
             <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 1 }} className="w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_#fcd34d]"></motion.div>
          </div>
        </motion.div>
      </motion.div>

    </footer>
  );
}
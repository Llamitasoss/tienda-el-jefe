import React from 'react';
import { motion, useMotionValue, useMotionTemplate } from 'framer-motion';
import { MapPin, Clock, MessageCircle, ShieldCheck, Globe, Navigation, Sparkles, ChevronRight } from 'lucide-react';

// === VARIANTES DE ANIMACIÓN STAGGER ===
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(5px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// === COMPONENTE PREMIUM: TARJETA BLANCA CON RESPLANDOR AZUL BRAND ===
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
      className={`relative group rounded-[2rem] bg-white border border-slate-200 shadow-sm hover:shadow-[0_20px_50px_rgba(8,102,189,0.06)] transition-all duration-500 overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
    >
      {/* Luz Azul Brand que sigue al cursor */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[2rem] opacity-0 transition duration-500 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              400px circle at ${mouseX}px ${mouseY}px,
              rgba(8, 102, 189, 0.04),
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
  // Enlace directo a Google Maps para dispositivos móviles
  const navigationUrl = "https://www.google.com/maps/search/?api=1&query=Marcos+Lara+60,+Santa+Paula,+Tonalá,+Jalisco";

  return (
    <footer className="relative bg-slate-50 text-slate-800 pt-20 pb-8 overflow-hidden z-10 mt-auto border-t border-slate-200">
      
      {/* === DECORACIÓN DE FONDO LIGHT PREMIUM === */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Patrón de puntos (Elegante y limpio) */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(0,0,0,0.03)_1.5px,transparent_1.5px)] bg-[size:30px_30px]"></div>
        
        {/* Orbes de luz ambientales animados (Tonos Azul Brand y Oro muy suaves) */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 30, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#0866bd]/10 rounded-full blur-[120px] mix-blend-multiply"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
            y: [0, -30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-30%] right-[-10%] w-[600px] h-[600px] bg-[#FACC15]/10 rounded-full blur-[150px] mix-blend-multiply"
        />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="max-w-[75rem] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 mb-12">
          
          {/* === COLUMNA 1: BRANDING Y CONTACTO === */}
          <div className="lg:col-span-5 flex flex-col items-start relative">
            <motion.div variants={itemVariants} className="flex items-center gap-5 mb-8 group cursor-default relative">
              <div className="bg-white p-2.5 rounded-2xl flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 overflow-hidden shadow-sm border border-slate-100 group-hover:border-[#0866bd]/30 transition-all duration-500 relative z-10">
                <img src="/logo.ico" alt="Logo El Jefe" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="relative z-10">
                <h4 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-black uppercase text-slate-900 leading-[0.95] tracking-tighter">
                  MOTO PARTES<br/>
                  <span className="text-[#0866bd]">EL JEFE</span>
                </h4>
                {/* Línea Azul Brand */}
                <div className="h-1.5 w-16 bg-[#0866bd] mt-3 rounded-full shadow-[0_2px_8px_rgba(8,102,189,0.4)]"></div>
              </div>
            </motion.div>

            <motion.p variants={itemVariants} className="text-slate-500 text-xs sm:text-sm mb-10 max-w-md leading-relaxed font-medium border-l-4 border-[#0866bd] pl-4">
              Calidad, herencia y confianza premium en Tonalá. Expertos en refacciones para mantener tu pasión en movimiento con el inventario más especializado. <br/><strong className="text-[#0866bd] font-black uppercase tracking-widest text-[9px] mt-2 inline-flex items-center gap-1.5"><Sparkles size={10}/> Venta Exclusiva en Mostrador.</strong>
            </motion.p>

            {/* BOTÓN CONTACTO AZUL BRAND */}
            <motion.a 
              variants={itemVariants}
              href="https://wa.me/523332406334" 
              target="_blank" 
              rel="noreferrer" 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative inline-flex items-center gap-3 bg-[#0866bd] text-white px-6 py-4 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] transition-all shadow-[0_10px_20px_rgba(8,102,189,0.3)] hover:shadow-[0_15px_30px_rgba(8,102,189,0.4)] border border-[#0866bd] overflow-hidden"
            >
              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] group-hover:bg-[position:200%_0,0_0] transition-[background-position] duration-[1.5s]"></div>
              
              <div className="relative flex items-center justify-center w-8 h-8 bg-white rounded-lg group-hover:bg-blue-50 transition-colors shadow-inner">
                <MessageCircle size={16} strokeWidth={2.5} className="text-[#0866bd]" /> 
              </div>
              <span className="relative z-10">WhatsApp Directo</span>
              <ChevronRight size={14} className="text-blue-200 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </motion.a>
          </div>

          {/* === COLUMNA 2: INFORMACIÓN OPERATIVA === */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
            
            {/* HORARIOS */}
            <GlowCard className="p-6 sm:p-8">
              <h5 className="font-black text-[10px] uppercase text-slate-800 tracking-[0.2em] mb-6 flex items-center gap-2.5">
                <div className="bg-blue-50 text-[#0866bd] p-2 rounded-lg border border-blue-100"><Clock size={16} strokeWidth={2.5}/></div> Horario en Mostrador
              </h5>
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-slate-600 font-bold text-xs uppercase tracking-wider">Lun - Vie</span>
                  <span className="bg-slate-50 text-slate-700 px-3 py-1 rounded-md text-[10px] font-black border border-slate-200 shadow-sm">11:00 - 19:00</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="text-slate-600 font-bold text-xs uppercase tracking-wider">Sábados</span>
                  <span className="bg-slate-50 text-slate-700 px-3 py-1 rounded-md text-[10px] font-black border border-slate-200 shadow-sm">11:00 - 16:00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Domingos</span>
                  <span className="text-red-500 text-[10px] font-black uppercase px-3 py-1 bg-red-50 rounded-md border border-red-100 shadow-sm">Cerrado</span>
                </div>
              </div>
              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-2 text-[#0866bd]">
                <ShieldCheck size={16} strokeWidth={2.5}/>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-0.5">Garantía Exacta en Local</span>
              </div>
            </GlowCard>

            {/* UBICACIÓN Y MAPA */}
            <GlowCard className="flex flex-col h-full p-6 sm:p-8 group/map">
              <h5 className="font-black text-[10px] uppercase text-slate-800 tracking-[0.2em] mb-4 flex items-center gap-2.5">
                <div className="bg-blue-50 text-[#0866bd] p-2 rounded-lg border border-blue-100"><MapPin size={16} className="animate-pulse" strokeWidth={2.5}/></div> Encuéntranos
              </h5>
              <p className="text-[11px] sm:text-xs font-bold text-slate-500 mb-5 leading-relaxed relative z-10">
                Marcos Lara 60, Santa Paula,<br/>
                <span className="text-slate-800">Tonalá, Jalisco, México.</span>
              </p>
              
              {/* Contenedor del Mapa HUD (Clean Tech) */}
              <motion.a 
                href={navigationUrl}
                target="_blank"
                rel="noreferrer"
                whileHover={{ y: -3 }}
                className="flex-1 min-h-[140px] bg-slate-100 rounded-xl border border-slate-200 overflow-hidden relative shadow-inner group/link block cursor-pointer z-10"
                title="Abrir en Google Maps"
              >
                <iframe 
                  src={mapUrl}
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen="" 
                  loading="lazy" 
                  className="grayscale opacity-60 mix-blend-multiply group-hover/link:grayscale-0 group-hover/link:opacity-100 transition-all duration-700 scale-110 group-hover/link:scale-100 pointer-events-none" 
                ></iframe>
                
                {/* Botón de Iniciar Ruta */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover/link:opacity-100 transition-opacity flex items-end justify-center p-3">
                  <div className="w-full bg-[#0866bd] text-white text-[9px] font-black uppercase tracking-widest py-2.5 rounded-lg flex items-center justify-center gap-2 translate-y-4 opacity-0 group-hover/link:translate-y-0 group-hover/link:opacity-100 transition-all duration-300 shadow-md">
                    <Navigation size={12} className="fill-current"/> Iniciar Ruta
                  </div>
                </div>
              </motion.a>
            </GlowCard>

          </div>
        </div>

        {/* === BARRA INFERIOR DE COPYRIGHT (Minimalista) === */}
        <motion.div variants={itemVariants} className="pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-5 mt-auto relative z-10">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
            <Globe size={12} className="text-[#0866bd]" />
            <span className="mt-0.5">Tonalá, Jalisco, MX</span>
          </div>

          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-center flex flex-wrap justify-center items-center gap-3">
            <span>© {currentYear} Moto Partes El Jefe</span>
            <span className="hidden sm:inline text-slate-300">|</span> 
            <span className="text-[#0866bd] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 flex items-center gap-1.5"><ShieldCheck size={12}/> Mostrador</span>
          </p>

          {/* Indicadores de Sistema */}
          <div className="flex gap-1.5 items-center bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
             <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest mr-1">SYS_OK</span>
             <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-[#0866bd]"></motion.div>
             <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }} className="w-1.5 h-1.5 rounded-full bg-[#FACC15]"></motion.div>
             <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, delay: 1 }} className="w-1.5 h-1.5 rounded-full bg-[#0866bd]"></motion.div>
          </div>
        </motion.div>
      </motion.div>

    </footer>
  );
}
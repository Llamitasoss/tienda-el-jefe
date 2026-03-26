import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, MessageCircle, ShieldCheck, Globe, Navigation } from 'lucide-react';

// === VARIANTES DE ANIMACIÓN STAGGER ===
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // Coordenadas actualizadas a: Marcos Lara 60, Santa Paula, Tonalá, Jalisco
  const mapUrl = "https://maps.google.com/maps?q=Marcos+Lara+60,+Santa+Paula,+Tonal%C3%A1,+Jalisco&t=&z=15&ie=UTF8&iwloc=&output=embed";
  
  // Enlace directo a Google Maps para dispositivos móviles (Iniciar Ruta)
  const navigationUrl = "https://www.google.com/maps/search/?api=1&query=Marcos+Lara+60,+Santa+Paula,+Tonalá,+Jalisco";

  return (
    <footer className="relative bg-gradient-to-b from-[#0866bd] to-[#043e75] text-white pt-20 pb-8 border-t-[8px] border-[#facc15] overflow-hidden z-10 mt-auto">
      
      {/* === DECORACIÓN DE FONDO FUTURISTA === */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        {/* Blueprint Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(255,255,255,0.1)_1.5px,transparent_1.5px)] bg-[size:40px_40px]"></div>
        {/* Luces Ambientales */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-white rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-yellow-400 rounded-full blur-[150px]"></div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }} // Dispara la animación justo al entrar en pantalla
        className="max-w-7xl mx-auto px-6 relative z-10 w-full"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-12">
          
          {/* === COLUMNA 1: BRANDING Y CONTACTO === */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <motion.div variants={itemVariants} className="flex items-center gap-4 mb-8 group cursor-default">
              <div className="bg-white p-2 rounded-[1.2rem] flex items-center justify-center w-16 h-16 overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.4)] group-hover:shadow-[0_15px_40px_rgba(250,204,21,0.3)] transition-shadow duration-500 relative border border-white/20">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/50"></div>
                <img src="/logo.ico" alt="Logo El Jefe" className="w-full h-full object-contain relative z-10" />
              </div>
              <div>
                <h4 className="text-3xl lg:text-4xl font-black uppercase text-[#facc15] leading-[0.9] tracking-tighter drop-shadow-md">
                  MOTO PARTES<br/>
                  <span className="text-white">EL JEFE</span>
                </h4>
                <div className="h-1.5 w-16 bg-gradient-to-r from-yellow-400 to-amber-500 mt-2 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]"></div>
              </div>
            </motion.div>

            <motion.p variants={itemVariants} className="text-blue-100/90 text-sm mb-8 max-w-md leading-relaxed font-medium">
              Calidad y confianza premium en Tonalá. Expertos en refacciones para mantener tu pasión en movimiento con el mejor inventario de la zona. <strong className="text-white font-black uppercase tracking-widest text-[10px] ml-1">Venta solo en Mostrador.</strong>
            </motion.p>

            <motion.a 
              variants={itemVariants}
              href="https://wa.me/523332406334" 
              target="_blank" 
              rel="noreferrer" 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative inline-flex items-center gap-4 bg-slate-900/80 hover:bg-black text-white px-8 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] transition-all shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_40px_rgba(74,222,128,0.2)] border border-white/10 backdrop-blur-md overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000"></div>
              
              <div className="relative">
                <div className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </div>
                <MessageCircle className="text-emerald-400 group-hover:rotate-12 group-hover:scale-110 transition-all" size={24} strokeWidth={2.5}/> 
              </div>
              <span className="relative z-10 mt-0.5">WhatsApp Directo</span>
            </motion.a>
          </div>

          {/* === COLUMNA 2: INFORMACIÓN OPERATIVA === */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            
            {/* HORARIOS (GLASSMORPHISM CARD) */}
            <motion.div variants={itemVariants} className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.2)] relative overflow-hidden group hover:border-white/20 transition-colors">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600 opacity-50 group-hover:opacity-100 transition-opacity"></div>
              
              <h5 className="font-black text-xs uppercase text-yellow-400 tracking-[0.2em] mb-6 flex items-center gap-3 drop-shadow-sm">
                <div className="bg-white/10 p-1.5 rounded-lg border border-white/5"><Clock size={16}/></div> Horario en Mostrador
              </h5>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-blue-100 text-sm font-bold tracking-wide">Lun - Vie</span>
                  <span className="bg-blue-500/20 text-blue-100 px-3 py-1 rounded-lg text-sm font-black border border-blue-400/20">11:00 - 19:00</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-blue-100 text-sm font-bold tracking-wide">Sábados</span>
                  <span className="bg-blue-500/20 text-blue-100 px-3 py-1 rounded-lg text-sm font-black border border-blue-400/20">11:00 - 16:00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-400 text-sm font-black uppercase tracking-wider">Domingos</span>
                  <span className="text-red-400/80 text-xs font-bold uppercase tracking-widest px-3 py-1 bg-red-500/10 rounded-lg border border-red-500/20">Cerrado</span>
                </div>
              </div>
              <div className="mt-8 pt-5 border-t border-white/10 flex items-center gap-3 text-emerald-400">
                <ShieldCheck size={16} strokeWidth={2.5}/>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100 mt-0.5">Garantía Exacta en Local</span>
              </div>
            </motion.div>

            {/* UBICACIÓN Y MAPA INTERACTIVO */}
            <motion.div variants={itemVariants} className="flex flex-col h-full">
              <h5 className="font-black text-xs uppercase text-yellow-400 tracking-[0.2em] mb-4 flex items-center gap-3 drop-shadow-sm">
                <div className="bg-white/10 p-1.5 rounded-lg border border-white/5"><MapPin size={16} className="text-red-400 animate-pulse"/></div> Encuéntranos
              </h5>
              <p className="text-xs sm:text-sm font-bold text-white mb-4 leading-relaxed">
                Marcos Lara 60, Santa Paula,<br/>
                <span className="text-blue-200">Tonalá, Jalisco, México.</span>
              </p>
              
              {/* Contenedor del Mapa con Efecto Premium */}
              <motion.a 
                href={navigationUrl}
                target="_blank"
                rel="noreferrer"
                whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
                className="flex-1 min-h-[140px] bg-slate-900 rounded-[1.5rem] border-2 border-white/10 overflow-hidden relative shadow-[0_10px_30px_rgba(0,0,0,0.2)] group block cursor-pointer"
                title="Abrir en Google Maps"
              >
                <iframe 
                  src={mapUrl}
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen="" 
                  loading="lazy" 
                  className="grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 scale-110 group-hover:scale-100 pointer-events-none" // Desactivamos puntero para que el clic vaya al link
                ></iframe>
                
                {/* Overlay interactivo */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity flex items-end p-4">
                  <div className="w-full bg-[#0866bd]/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-xl border border-blue-400 flex items-center justify-center gap-2 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <Navigation size={14} className="fill-current"/> Iniciar Ruta
                  </div>
                </div>
              </motion.a>
            </motion.div>

          </div>
        </div>

        {/* === BARRA INFERIOR DE COPYRIGHT === */}
        <motion.div variants={itemVariants} className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 mt-auto">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-blue-300/80 bg-blue-900/30 px-4 py-2 rounded-full border border-blue-400/10">
            <Globe size={12} />
            <span className="mt-0.5">Tonalá, Jalisco, MX</span>
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 text-center flex flex-wrap justify-center items-center gap-2">
            <span>© {currentYear} Moto Partes El Jefe</span>
            <span className="hidden sm:inline text-blue-500/50">|</span> 
            <span className="text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-md border border-yellow-400/20 shadow-inner">Venta Exclusiva en Mostrador</span>
          </p>

          <div className="flex gap-2">
             <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_10px_#facc15] animate-pulse"></div>
             <div className="w-2 h-2 rounded-full bg-white/20"></div>
             <div className="w-2 h-2 rounded-full bg-white/20"></div>
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
}
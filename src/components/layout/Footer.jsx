import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, MessageCircle, ShieldCheck, ChevronRight, Globe } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-[#0866bd] text-white pt-20 pb-10 border-t-[8px] border-[#facc15] overflow-hidden">
      {/* Decoración de fondo sutil */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-yellow-400 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          
          {/* COLUMNA 1: BRANDING Y CONTACTO */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <div className="flex items-center gap-4 mb-8 group">
              <motion.div 
                whileHover={{ rotate: -5, scale: 1.1 }}
                className="bg-white p-1.5 rounded-2xl flex items-center justify-center w-14 h-14 overflow-hidden shadow-[0_10px_20px_rgba(0,0,0,0.2)]"
              >
                <img src="/logo.ico" alt="Logo El Jefe" className="w-full h-full object-contain" />
              </motion.div>
              <div>
                <h4 className="text-3xl font-black uppercase text-[#facc15] leading-[0.9] tracking-tighter">
                  MOTO PARTES<br/>
                  <span className="text-white">EL JEFE</span>
                </h4>
                <div className="h-1 w-12 bg-yellow-400 mt-2 rounded-full"></div>
              </div>
            </div>

            <p className="text-blue-100 text-base mb-8 max-w-md leading-relaxed font-medium">
              Calidad y confianza premium en Tonalá. Expertos en refacciones para mantener tu pasión en movimiento con el mejor inventario de la zona.
            </p>

            <motion.a 
              href="https://wa.me/523332406334" 
              target="_blank" 
              rel="noreferrer" 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative inline-flex items-center gap-4 bg-[#0f172a] hover:bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl border border-white/10"
            >
              <div className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
              </div>
              <MessageCircle className="text-green-400 group-hover:rotate-12 transition-transform" size={24} /> 
              <span>WhatsApp Directo</span>
            </motion.a>
          </div>

          {/* COLUMNA 2: INFORMACIÓN OPERATIVA */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* HORARIOS CON ESTILO CARD */}
            <div className="bg-[#0f172a]/50 backdrop-blur-sm p-8 rounded-[2rem] border border-white/5 shadow-inner">
              <h5 className="font-black text-xs uppercase text-yellow-400 tracking-[0.2em] mb-6 flex items-center">
                <Clock size={18} className="mr-3"/> Horario de Atención
              </h5>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-blue-200 text-sm font-bold">Lun - Vie</span>
                  <span className="bg-blue-600/30 px-3 py-1 rounded-lg text-sm font-black">11:00 - 19:00</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <span className="text-blue-200 text-sm font-bold">Sábados</span>
                  <span className="bg-blue-600/30 px-3 py-1 rounded-lg text-sm font-black">11:00 - 16:00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-400 text-sm font-black uppercase">Domingos</span>
                  <span className="text-red-400/70 text-xs font-bold italic">Cerrado</span>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-3 text-blue-200/60">
                <ShieldCheck size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Compra Segura en Local</span>
              </div>
            </div>

            {/* UBICACIÓN Y MAPA */}
            <div className="flex flex-col">
              <h5 className="font-black text-xs uppercase text-yellow-400 tracking-[0.2em] mb-4 flex items-center">
                <MapPin size={18} className="mr-3 text-red-500 animate-bounce"/> Encuéntranos
              </h5>
              <p className="text-sm font-bold text-white mb-4 leading-snug">
                Marcos Lara 60, Santa Paula,<br/>
                <span className="text-blue-200">Tonalá, Jalisco, México.</span>
              </p>
              
              <motion.div 
                whileHover={{ y: -5 }}
                className="flex-1 min-h-[160px] bg-slate-900 rounded-[2rem] border-2 border-white/10 overflow-hidden relative shadow-2xl group"
              >
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3734.123456789!2d-103.2661!3d20.5912!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjDCsDM1JzI4LjMiTiAxMDPCsDE1JzU4LjAiVw!5e0!3m2!1ses-419!2smx!4v1711000000000!5m2!1ses-419!2smx"
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen="" 
                  loading="lazy" 
                  className="grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100"
                ></iframe>
                <div className="absolute inset-0 pointer-events-none border-[6px] border-[#0f172a]/20 rounded-[2rem]"></div>
              </motion.div>
            </div>

          </div>
        </div>

        {/* BARRA INFERIOR DE COPYRIGHT */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-blue-300/80">
            <Globe size={12} />
            <span>Tonalá, Jalisco, MX</span>
          </div>

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200 text-center">
            © {currentYear} Moto Partes El Jefe <span className="mx-2 text-yellow-400">|</span> 
            <span className="text-red-400">Venta Solo en Local</span>
          </p>

          <div className="flex gap-4">
             {/* Un pequeño detalle visual de "Hecho con pasión" */}
             <div className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15]"></div>
             <div className="w-2 h-2 rounded-full bg-white/20"></div>
             <div className="w-2 h-2 rounded-full bg-white/20"></div>
          </div>
        </div>
      </div>
    </footer>
  );
}
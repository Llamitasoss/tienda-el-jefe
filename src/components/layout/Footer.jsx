import React from 'react';
import { MapPin, Clock, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0866bd] text-white pt-16 pb-8 border-t-[6px] border-[#facc15]">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
        <div>
          <div className="flex items-center gap-3 mb-6">
            
            {/* === AQUÍ ESTÁ TU NUEVO LOGO EN EL FOOTER === */}
            <div className="bg-white p-1 rounded-xl flex items-center justify-center w-12 h-12 overflow-hidden shadow-sm">
              <img src="/logo.ico" alt="Logo El Jefe" className="w-full h-full object-contain" />
            </div>

            <h4 className="text-2xl font-black uppercase text-[#facc15] leading-none tracking-widest">Moto Partes<br/>El Jefe</h4>
          </div>
          <p className="text-blue-100 text-sm mb-8 max-w-sm">Ofrecemos calidad y confianza premium. Somos una empresa comprometida en mantener tu pasión en movimiento.</p>
          <a href="https://wa.me/523332406334" target="_blank" rel="noreferrer" className="inline-flex bg-[#0f172a] hover:bg-slate-800 text-white px-6 py-3 rounded-xl items-center font-black text-sm uppercase tracking-widest transition-colors shadow-lg border border-slate-700 hover:-translate-y-1">
            <MessageCircle className="text-green-400 mr-3" /> +52 33 3240 6334
          </a>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <h5 className="font-black text-xs uppercase text-blue-200 tracking-widest mb-4 flex items-center"><Clock size={16} className="mr-2 text-[#facc15]"/> Horario de Atención</h5>
            <ul className="space-y-3 text-sm">
              <li className="flex justify-between border-b border-blue-800 pb-2"><span>Lunes - Viernes</span> <span className="font-bold">11:00 - 19:00</span></li>
              <li className="flex justify-between border-b border-blue-800 pb-2"><span>Sábados</span> <span className="font-bold">11:00 - 16:00</span></li>
              <li className="flex justify-between text-red-300 font-bold"><span>Domingos</span> <span>Cerrado</span></li>
            </ul>
          </div>
          <div>
            <h5 className="font-black text-xs uppercase text-blue-200 tracking-widest mb-4 flex items-center"><MapPin size={16} className="mr-2 text-red-400"/> Ubicación</h5>
            <p className="text-sm mb-4 leading-relaxed">Marcos Lara 60, Santa Paula, Tonalá, Jalisco.</p>
            <div className="w-full h-32 bg-blue-900 rounded-xl flex items-center justify-center border border-blue-400/30 overflow-hidden relative shadow-inner group">
              {/* Mapa de Google integrado correctamente */}
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3733.6841261352467!2d-103.250567!3d20.633469!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8428b4d1b8296315%3A0x6b6c2560e2dbed6!2sMarcos%20Lara%2060%2C%20Santa%20Paula%2C%2045420%20Tonal%C3%A1%2C%20Jal.!5e0!3m2!1ses-419!2smx!4v1715000000000!5m2!1ses-419!2smx"
                width="100%" 
                height="100%" 
                style={{border:0}} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="opacity-80 group-hover:opacity-100 transition-opacity"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
      <div className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300 border-t border-blue-800 pt-6">
        © 2026 Moto Partes El Jefe. Todos los derechos reservados. (Sin envíos a domicilio)
      </div>
    </footer>
  );
}
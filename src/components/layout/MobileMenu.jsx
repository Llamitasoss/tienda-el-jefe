import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Store, Wrench, Star, Package, Facebook, Instagram } from 'lucide-react';

const TikTok = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

export default function MobileMenu({ isOpen, onClose, onOpenTrackModal }) {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col animate-fade-in-right">
        <div className="bg-[#0866bd] p-5 flex justify-between items-center text-white border-b-4 border-yellow-400">
          <span className="font-black text-xl tracking-widest uppercase flex items-center gap-2">
             <div className="bg-white text-[#0866bd] p-1 rounded-md text-sm">EJ</div> MENÚ
          </span>
          <button onClick={onClose} className="hover:text-yellow-400 transition-colors"><X size={28} /></button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-2">
          <button onClick={() => handleNavigation('/')} className="w-full text-left p-4 rounded-xl font-bold text-slate-700 hover:bg-slate-50 flex items-center border border-transparent hover:border-slate-100 transition-colors">
            <Store size={20} className="mr-3 text-[#0866bd]" /> Inicio
          </button>
          
          <button onClick={() => handleNavigation('/catalogo')} className="w-full text-left p-4 rounded-xl font-bold text-slate-700 hover:bg-slate-50 flex items-center border border-transparent hover:border-slate-100 transition-colors">
            <Wrench size={20} className="mr-3 text-[#0866bd]" /> Catálogo General
          </button>
          
          {/* AQUI ESTÁ EL CAMBIO A TALLERES VIP */}
          <button onClick={() => handleNavigation('/talleres')} className="w-full text-left p-4 rounded-xl font-bold text-slate-700 hover:bg-slate-50 flex items-center border border-transparent hover:border-slate-100 transition-colors">
            <Star size={20} className="mr-3 text-yellow-500" /> Talleres
            <span className="ml-auto text-[9px] px-2 py-1 rounded text-white bg-[#0866bd] shadow-sm tracking-widest">VIP</span>
          </button>

          <div className="my-4 border-t border-slate-100"></div>
          
          <button onClick={() => { onOpenTrackModal(); onClose(); }} className="w-full text-left p-4 rounded-xl font-bold text-slate-700 hover:bg-slate-50 flex items-center border border-transparent hover:border-slate-100 transition-colors">
            <Package size={20} className="mr-3 text-slate-400" /> Rastrear mi Orden
          </button>
          
          <div className="mt-12">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-4">Síguenos en Redes</p>
            <div className="flex justify-center gap-6">
               <a href="https://www.facebook.com/profile.php?id=61582551320267" target="_blank" rel="noreferrer" className="w-12 h-12 bg-blue-50 hover:bg-[#0866bd] hover:text-white text-[#0866bd] rounded-full flex items-center justify-center text-xl transition-all duration-300 hover:-translate-y-1 shadow-sm"><Facebook size={22} /></a>
               <a href="https://www.instagram.com/el_jefe1949/" target="_blank" rel="noreferrer" className="w-12 h-12 bg-pink-50 hover:bg-pink-600 hover:text-white text-pink-600 rounded-full flex items-center justify-center text-xl transition-all duration-300 hover:-translate-y-1 shadow-sm"><Instagram size={22} /></a>
               <a href="https://www.tiktok.com/@moto.partes.el.je" target="_blank" rel="noreferrer" className="w-12 h-12 bg-slate-100 hover:bg-black hover:text-white text-slate-800 rounded-full flex items-center justify-center text-xl transition-all duration-300 hover:-translate-y-1 shadow-sm"><TikTok size={22} /></a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
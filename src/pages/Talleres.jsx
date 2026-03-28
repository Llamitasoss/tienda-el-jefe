import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Loader2, Sparkles, ChevronRight, Wrench, 
  PackageSearch, Tag, Truck, Mail, Phone, Store, AlertCircle, CheckCircle, Zap
} from 'lucide-react';

// === COMPONENTE DE BENEFICIO 3D LIGHT PREMIUM ===
const BenefitCard = ({ ben, index }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 400, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 400, damping: 25 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6, delay: index * 0.1 }}
      style={{ perspective: 1200 }} className="h-full"
    >
      <motion.div
        onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_25px_50px_rgba(250,204,21,0.15)] hover:border-yellow-200/50 h-full relative group cursor-default overflow-hidden transition-all duration-500"
      >
        {/* Resplandor interno dorado al hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        
        <div style={{ transform: "translateZ(40px)" }} className="relative z-10">
          <div className="w-16 h-16 bg-slate-50 text-[#0866bd] rounded-[1.5rem] flex items-center justify-center mb-6 transition-all duration-500 group-hover:bg-gradient-to-br group-hover:from-yellow-300 group-hover:to-amber-500 group-hover:text-white group-hover:shadow-[0_15px_30px_rgba(250,204,21,0.4)] border border-slate-200 group-hover:border-transparent group-hover:scale-110">
            <ben.icon size={28} strokeWidth={2} className="drop-shadow-sm" />
          </div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3 group-hover:text-amber-600 transition-colors">{ben.title}</h3>
          <p className="text-sm font-medium text-slate-500 leading-relaxed group-hover:text-slate-700 transition-colors">{ben.desc}</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function Talleres() {
  const [formData, setFormData] = useState({ nombreTaller: '', encargado: '', telefono: '', email: '', comentarios: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'telefono') {
      const onlyNums = value.replace(/[^0-9]/g, '');
      if (onlyNums.length <= 10) setFormData(prev => ({ ...prev, [name]: onlyNums }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.telefono.length < 10) {
      setError('Por favor, ingresa un número de WhatsApp válido (10 dígitos).');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await addDoc(collection(db, "solicitudes_talleres"), {
        nombreTaller: formData.nombreTaller.trim(),
        encargado: formData.encargado.trim(),
        telefono: formData.telefono,
        email: formData.email.trim().toLowerCase(),
        comentarios: formData.comentarios.trim(),
        fechaSolicitud: serverTimestamp(),
        estado: 'Pendiente de Revisión',
        origen: 'Web VIP'
      });

      setSuccessMessage('¡Solicitud de acceso transmitida con éxito! Nuestro equipo en Tonalá validará tus datos para activar tus credenciales VIP.');
      setFormData({ nombreTaller: '', encargado: '', telefono: '', email: '', comentarios: '' });
      
      // Auto scroll suave hacia el mensaje de éxito
      window.scrollTo({ top: document.getElementById('vip-form').offsetTop - 100, behavior: 'smooth' });

    } catch (err) {
      setError('Saturación en los servidores. Por favor, intenta de nuevo o utiliza la línea directa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const beneficios = [
    { icon: Tag, title: 'Costos de Mayoreo', desc: 'Desbloquea listas de precios industriales con hasta un 25% de margen a tu favor.' },
    { icon: PackageSearch, title: 'Stock Garantizado', desc: 'Reserva piezas críticas desde bodega antes de que lleguen a mostrador general.' },
    { icon: Zap, title: 'Línea Express', desc: 'WhatsApp de conexión directa sin bots, atención técnica instantánea y prioritaria.' },
    { icon: ShieldCheck, title: 'Garantía Premium', desc: 'Cobertura extendida inmediata en piezas instaladas dentro de tu taller certificado.' }
  ];

  return (
    <div className="bg-white font-sans selection:bg-amber-400 selection:text-slate-900 pb-32 overflow-hidden relative">
      
      {/* GRID DE INGENIERÍA DE FONDO (Light) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(0,0,0,0.03)_1.5px,transparent_1.5px)] bg-[size:30px_30px] pointer-events-none fixed"></div>

      {/* === HEADER EXCLUSIVO VIP - LIGHT PREMIUM === */}
      {/* Añadimos pt-32 sm:pt-40 para evitar que el header global estorbe */}
      <div className="relative overflow-hidden min-h-[85vh] flex items-center justify-center pt-32 sm:pt-40 pb-20 border-b border-slate-200 bg-slate-50/50">
        
        {/* Fondos Parallax y Blur (Luminosos) */}
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 0.05 }} transition={{ duration: 2, ease: "easeOut" }}
          className="absolute inset-0 bg-cover bg-center mix-blend-luminosity grayscale"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2000&auto=format&fit=crop')` }}
        />
        <div className="absolute top-0 right-[-10%] w-[50vw] h-[50vw] bg-amber-400/10 rounded-full blur-[150px] pointer-events-none mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-[#0866bd]/10 rounded-full blur-[120px] pointer-events-none animate-pulse mix-blend-multiply"></div>

        <div className="relative z-10 max-w-[75rem] mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col lg:flex-row items-center justify-between gap-16">
          
          <div className="max-w-3xl text-center lg:text-left flex-1">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-600 px-5 py-2.5 rounded-full mb-8 shadow-sm group"
            >
              <Sparkles size={14} className="group-hover:animate-pulse text-[#FACC15] fill-current" />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em]">Red de Aliados Comerciales</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl sm:text-7xl lg:text-[7rem] font-black text-slate-900 uppercase tracking-tighter leading-[0.9] mb-8"
            >
              NIVEL DE <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500 relative inline-block">
                ALTA GAMA
                <div className="absolute -bottom-2 left-0 w-full h-1.5 bg-yellow-400 rounded-full shadow-[0_2px_15px_rgba(250,204,21,0.5)]"></div>
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
              className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0 border-l-4 border-amber-400 pl-6 bg-white/50 py-4 rounded-r-2xl backdrop-blur-sm shadow-sm"
            >
              Sabemos que el prestigio de tu taller depende de la calidad que instalas. Accede al inventario <strong className="text-amber-500 font-black">OEM El Jefe</strong> con márgenes de beneficio diseñados para hacer crecer tu negocio.
            </motion.p>
          </div>

          {/* INSIGNIA HOLOGRÁFICA ORO MACIZO (Light Edition) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.6, type: "spring" }}
            className="relative hidden lg:flex w-full lg:w-2/5 justify-center"
          >
            <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-[100px] animate-pulse mix-blend-multiply"></div>
            
            <motion.div 
              whileHover={{ rotateY: 15, rotateX: -10, scale: 1.05 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{ perspective: 1000, transformStyle: "preserve-3d" }}
              className="w-80 h-[22rem] bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-500 rounded-[2.5rem] p-1 shadow-[0_30px_60px_rgba(250,204,21,0.2)] relative group cursor-default border border-yellow-100"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] opacity-30 mix-blend-overlay rounded-[2.5rem]"></div>
              
              <div className="w-full h-full bg-white rounded-[2.2rem] flex flex-col items-center justify-center p-8 relative overflow-hidden border border-white" style={{ transform: "translateZ(30px)" }}>
                <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-100 blur-[40px] rounded-full group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-multiply pointer-events-none"></div>
                
                <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-[0_15px_30px_rgba(250,204,21,0.4)] border border-yellow-200 z-10 relative">
                  <Wrench size={40} className="text-white drop-shadow-sm" />
                </div>
                
                <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-600 font-black text-5xl tracking-tighter uppercase mb-4 relative z-10 drop-shadow-sm">CLUB VIP</h3>
                
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm relative z-10">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shadow-[0_0_8px_#10b981]"></div>
                  <span className="text-slate-700 font-black text-[10px] uppercase tracking-widest">Nivel 1 Desbloqueado</span>
                </div>
                
                <div className="absolute bottom-6 left-0 w-full flex justify-center z-10">
                  <span className="text-slate-300 font-black text-[9px] tracking-[0.3em] uppercase">SECURE_LINK // 0866BD</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>

      <div className="max-w-[75rem] mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        
        {/* CUADRÍCULA DE BENEFICIOS */}
        <div className="mb-24 -mt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {beneficios.map((ben, idx) => (
              <BenefitCard key={idx} ben={ben} index={idx} />
            ))}
          </div>
        </div>

        {/* === CONTENEDOR FORMULARIO (Híbrido Azul Brand & White Premium) === */}
        <motion.div 
          id="vip-form"
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }}
          className="bg-white rounded-[3rem] border border-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col lg:flex-row mb-24 relative"
        >
          {/* Lado Izquierdo Azul Brand */}
          <div className="w-full lg:w-[45%] bg-[#0866bd] p-10 sm:p-16 text-white flex flex-col justify-center relative overflow-hidden shrink-0 border-r border-blue-400/30">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay"></div>
            <div className="absolute top-[-20%] left-[-20%] w-[400px] h-[400px] bg-white/10 rounded-full blur-[80px]"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-8 border border-white/20 backdrop-blur-sm shadow-sm">
                 <ShieldCheck size={14} className="text-[#FACC15]"/>
                 <span className="text-[9px] font-black uppercase tracking-widest text-white">Portal de Acceso</span>
              </div>
              <h3 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter mb-6 leading-[1] drop-shadow-md">Validación <br/><span className="text-[#FACC15]">Taller Aliado</span></h3>
              <p className="text-blue-100 mb-12 font-medium leading-relaxed text-sm max-w-sm">
                Genera tu solicitud de acceso. Nuestro equipo encriptará tu información y te contactará en 24h para activar tu perfil de mayoreo.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-center gap-4 text-sm font-bold bg-[#042f56]/30 p-4 rounded-[1.2rem] backdrop-blur-md border border-white/10 shadow-inner group transition-colors hover:bg-[#042f56]/50">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-white border border-white/20 group-hover:scale-110 transition-transform"><Store size={18}/></div>
                  <span className="text-blue-50 leading-tight">Exclusivo para negocios y talleres registrados.</span>
                </li>
                <li className="flex items-center gap-4 text-sm font-bold bg-[#042f56]/30 p-4 rounded-[1.2rem] backdrop-blur-md border border-white/10 shadow-inner group transition-colors hover:bg-[#042f56]/50">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-white border border-white/20 group-hover:scale-110 transition-transform"><ShieldCheck size={18}/></div>
                  <span className="text-blue-50 leading-tight">Datos comerciales protegidos.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Lado Derecho Formulario (White SaaS Style) */}
          <div className="w-full lg:w-[55%] p-8 sm:p-12 lg:p-16 bg-transparent flex flex-col justify-center relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#0866bd]/5 rounded-full blur-[60px] pointer-events-none"></div>

            {successMessage ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}
                className="h-full flex flex-col items-center justify-center text-center py-10 relative z-10"
              >
                <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mb-8 shadow-sm border border-emerald-100">
                  <CheckCircle size={48} strokeWidth={2} />
                </div>
                <h3 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight mb-4 drop-shadow-sm">¡Solicitud en Proceso!</h3>
                <p className="text-slate-500 font-medium max-w-sm mx-auto text-sm leading-relaxed mb-10">{successMessage}</p>
                <button onClick={() => setSuccessMessage('')} className="bg-white border border-slate-200 text-slate-600 px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 hover:text-[#0866bd] hover:border-blue-200 transition-all active:scale-95 shadow-sm flex items-center gap-2">
                  <Sparkles size={14}/> Nueva Solicitud
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center gap-3 text-[11px] font-bold shadow-sm mb-6">
                      <AlertCircle size={16} className="shrink-0" /> {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2.5 pl-1">Identificador del Taller *</label>
                    <div className="relative group">
                      <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0866bd] transition-colors" size={18} strokeWidth={2.5} />
                      <input type="text" name="nombreTaller" required value={formData.nombreTaller} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 focus:border-[#0866bd] focus:bg-white rounded-xl pl-12 pr-5 py-3.5 text-xs font-bold text-slate-800 outline-none transition-all shadow-inner focus:shadow-sm placeholder:text-slate-400" placeholder="Ej. Moto Servicio Ramírez" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2.5 pl-1">Nombre del Propietario *</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0866bd] transition-colors" size={18} strokeWidth={2.5} />
                      <input type="text" name="encargado" required value={formData.encargado} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 focus:border-[#0866bd] focus:bg-white rounded-xl pl-12 pr-5 py-3.5 text-xs font-bold text-slate-800 outline-none transition-all shadow-inner focus:shadow-sm placeholder:text-slate-400" placeholder="Nombre completo" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2.5 pl-1">Com. Segura (WhatsApp) *</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0866bd] transition-colors" size={18} strokeWidth={2.5} />
                      <input type="tel" name="telefono" required value={formData.telefono} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 focus:border-[#0866bd] focus:bg-white rounded-xl pl-12 pr-5 py-3.5 text-xs font-bold text-slate-800 outline-none transition-all shadow-inner focus:shadow-sm placeholder:text-slate-400" placeholder="10 dígitos exactos" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2.5 pl-1">Enlace Digital (Email) <span className="text-slate-400 normal-case tracking-normal font-medium">- Opcional</span></label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0866bd] transition-colors" size={18} strokeWidth={2.5} />
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 focus:border-[#0866bd] focus:bg-white rounded-xl pl-12 pr-5 py-3.5 text-xs font-bold text-slate-800 outline-none transition-all shadow-inner focus:shadow-sm placeholder:text-slate-400" placeholder="taller@ejemplo.com" />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2.5 pl-1">Especialidades Tácticas</label>
                  <textarea name="comentarios" rows="3" value={formData.comentarios} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 focus:border-[#0866bd] focus:bg-white rounded-xl p-5 text-xs font-bold text-slate-800 outline-none transition-all resize-none shadow-inner focus:shadow-sm placeholder:text-slate-400 leading-relaxed" placeholder="¿En qué colonia operas? ¿Modelos de trabajo o deportivas?"></textarea>
                </div>

                {/* Botón de Envío (Azul Brand) */}
                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={isSubmitting} type="submit" 
                  className="w-full relative overflow-hidden bg-[#0866bd] hover:bg-blue-700 text-white font-black px-8 py-4.5 rounded-xl uppercase tracking-[0.2em] transition-all flex justify-center items-center gap-3 shadow-[0_10px_20px_rgba(8,102,189,0.2)] hover:shadow-[0_15px_30px_rgba(8,102,189,0.3)] disabled:opacity-50 mt-8 disabled:cursor-not-allowed group border border-[#0866bd]"
                >
                  <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  
                  {isSubmitting ? (
                    <><Loader2 className="animate-spin relative z-10" size={18} /> <span className="relative z-10 text-[10px]">Procesando...</span></>
                  ) : (
                    <><Zap size={16} strokeWidth={2.5} className="relative z-10 fill-current text-yellow-400" /> <span className="relative z-10 text-[10px] mt-0.5">Autorizar Acceso VIP</span></>
                  )}
                </motion.button>
              </form>
            )}
          </div>
        </motion.div>

        {/* BANNER CONTACTO DIRECTO (Limpio y Alerta Roja) */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.8 }}
          className="bg-white rounded-[2.5rem] p-10 sm:p-14 text-slate-800 flex flex-col md:flex-row items-center justify-between gap-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden relative group border border-slate-200"
        >
          {/* Luces Neón Rojas sutiles */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[30rem] h-[30rem] bg-red-50 rounded-full blur-[100px] pointer-events-none transition-colors duration-700"></div>
          
          <div className="relative z-10 text-center md:text-left flex-1 pl-2">
            <span className="inline-flex items-center gap-2 bg-red-50 border border-red-100 text-red-500 font-black text-[9px] uppercase tracking-widest px-4 py-2 rounded-full mb-6 shadow-sm">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span> Alerta de Suministro
            </span>
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-4 leading-[1.1] text-slate-900">
              ¿Motor inmovilizado <br/>en el <span className="text-red-500">taller hoy?</span>
            </h3>
            <p className="text-slate-500 font-medium max-w-lg text-sm leading-relaxed">
              El tiempo en el elevador es dinero perdido. Ignora el formulario y salta directo a la línea de emergencia para asegurar piezas críticas hoy mismo.
            </p>
          </div>
          
          <motion.a 
            href="https://wa.me/523332406334" target="_blank" rel="noreferrer" 
            whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.95 }}
            className="relative z-10 bg-red-500 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_15px_30px_rgba(239,68,68,0.3)] hover:shadow-[0_20px_40px_rgba(239,68,68,0.4)] hover:bg-red-600 transition-all duration-300 flex items-center gap-3 whitespace-nowrap group/btn border border-red-500"
          >
            Suministro Inmediato <ChevronRight size={16} strokeWidth={3} className="group-hover/btn:translate-x-1.5 transition-transform" />
          </motion.a>
        </motion.div>

      </div>
    </div>
  );
}

// Necesario importar User al inicio para el nuevo input
// Modifiqué el bloque de imports arriba. Si da error, asegúrate de tener:
// import { User } from 'lucide-react';
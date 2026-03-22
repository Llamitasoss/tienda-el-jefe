import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { 
  ShieldCheck, Loader2, Sparkles, ChevronRight, Wrench, 
  PackageSearch, Tag, Truck, Mail, Phone, Store, AlertCircle, CheckCircle
} from 'lucide-react';

// === COMPONENTE DE BENEFICIO CON EFECTO 3D SUTIL ===
const BenefitCard = ({ ben, index }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

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
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      style={{ perspective: 1000 }}
      className="h-full"
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.03)] h-full relative group cursor-default"
      >
        <div style={{ transform: "translateZ(30px)" }}>
          <div className="w-16 h-16 bg-blue-50/50 text-[#0866bd] rounded-[1.2rem] flex items-center justify-center mb-6 transition-all duration-500 group-hover:bg-[#0866bd] group-hover:text-yellow-400 group-hover:shadow-[0_10px_20px_rgba(8,102,189,0.3)] group-hover:scale-110">
            <ben.icon size={28} />
          </div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-4 group-hover:text-[#0866bd] transition-colors">{ben.title}</h3>
          <p className="text-sm font-medium text-slate-500 leading-relaxed">{ben.desc}</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function Talleres() {
  const [formData, setFormData] = useState({
    nombreTaller: '',
    encargado: '',
    telefono: '',
    email: '',
    comentarios: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  // Efecto para limpiar mensajes después de un tiempo
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Si es teléfono, solo permitimos números para evitar errores de base de datos
    if (name === 'telefono') {
      const onlyNums = value.replace(/[^0-9]/g, '');
      if (onlyNums.length <= 10) {
        setFormData(prev => ({ ...prev, [name]: onlyNums }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica de teléfono
    if (formData.telefono.length < 10) {
      setError('Por favor, ingresa un número de WhatsApp válido (10 dígitos).');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Guardado en Firestore
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

      setSuccessMessage('¡Solicitud enviada con éxito! Nuestro equipo en Tonalá te contactará en breve para validar tu registro VIP.');
      setFormData({ nombreTaller: '', encargado: '', telefono: '', email: '', comentarios: '' });
      
      // Scroll suave hacia el mensaje de éxito
      window.scrollTo({ top: 400, behavior: 'smooth' });

    } catch (err) {
      console.error("Error Firebase:", err);
      setError('Hubo un problema de conexión. Por favor, intenta de nuevo o contáctanos por WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const beneficios = [
    { icon: Tag, title: 'Precios de Mayoreo', desc: 'Acceso a lista de precios especial con hasta un 25% de descuento en marcas seleccionadas.' },
    { icon: PackageSearch, title: 'Prioridad de Inventario', desc: 'Reserva de piezas de alta rotación antes de que lleguen al piso de venta general.' },
    { icon: Truck, title: 'Línea Directa', desc: 'Canal de WhatsApp exclusivo para pedidos rápidos y consultas técnicas prioritarias.' },
    { icon: ShieldCheck, title: 'Garantía Extendida', desc: 'Mayor flexibilidad de garantía en refacciones instaladas por tu taller certificado.' }
  ];

  return (
    <div className="bg-[#f8fafc] font-sans selection:bg-yellow-400 selection:text-slate-900 pb-20">
      
      {/* HEADER EXCLUSIVO VIP - CINE / PREMIUM */}
      <div className="relative overflow-hidden bg-[#0f172a] min-h-[85vh] flex items-center justify-center">
        {/* Fondos Parallax y Blur */}
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }} 
          animate={{ scale: 1, opacity: 0.2 }} 
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute inset-0 bg-cover bg-center mix-blend-luminosity"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2000&auto=format&fit=crop')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent"></div>
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-40 w-[40rem] h-[40rem] bg-[#0866bd]/30 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

        <div className="relative z-10 max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col lg:flex-row items-center justify-between gap-12 py-20">
          
          <div className="max-w-3xl text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 px-5 py-2.5 rounded-full mb-8 backdrop-blur-md shadow-[0_0_30px_rgba(250,204,21,0.15)] group"
            >
              <Sparkles size={14} className="group-hover:animate-pulse" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em]">Programa de Aliados Comerciales</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl sm:text-7xl lg:text-[6rem] font-black text-white uppercase tracking-tighter leading-[0.9] mb-8 drop-shadow-2xl"
            >
              EXCLUSIVO PARA <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 relative inline-block">
                TALLERES
                <span className="absolute -bottom-3 left-0 w-full h-2 bg-yellow-400 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.6)]"></span>
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
              className="text-slate-300 text-lg sm:text-xl font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0 border-l-4 border-yellow-400 pl-5 bg-gradient-to-r from-slate-900/80 to-transparent py-3 backdrop-blur-sm"
            >
              Sabemos que tu reputación depende de la calidad de las piezas que usas. Conviértete en un aliado VIP de <span className="text-white font-bold">Moto Partes El Jefe</span> y obtén precios preferenciales.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.8, delay: 0.6, type: "spring" }}
            className="relative hidden lg:block"
          >
            <div className="absolute inset-0 bg-yellow-400 rounded-full blur-[100px] opacity-20 animate-pulse"></div>
            <div className="bg-slate-800/40 backdrop-blur-2xl border border-white/10 p-12 rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] w-80 h-80 flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#0866bd]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Wrench size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)] group-hover:scale-110 transition-transform duration-500 relative z-10" />
              <span className="text-white font-black text-4xl block tracking-tighter mb-2 relative z-10">CLUB VIP</span>
              <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest relative z-10">Afiliación Gratuita</span>
            </div>
          </motion.div>

        </div>
      </div>

      <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-20">
        
        {/* CUADRÍCULA DE BENEFICIOS */}
        <div className="mb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {beneficios.map((ben, idx) => (
              <BenefitCard key={idx} ben={ben} index={idx} />
            ))}
          </div>
        </div>

        {/* CONTENEDOR FORMULARIO */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8 }}
          className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden flex flex-col lg:flex-row shadow-[0_20px_60px_rgba(0,0,0,0.05)] mb-32"
        >
          {/* Lado Izquierdo Azul */}
          <div className="w-full lg:w-2/5 bg-[#0866bd] p-12 sm:p-20 text-white flex flex-col justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center opacity-10 mix-blend-overlay scale-110" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1598257006458-087169a1f08d?q=80&w=1000&auto=format&fit=crop')` }}></div>
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-[#0866bd] to-[#064e94]"></div>
            
            <div className="relative z-10">
              <h3 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter mb-8 leading-[0.9]">Inicia tu <br/><span className="text-yellow-400">Registro</span></h3>
              <p className="text-blue-100 mb-12 font-medium leading-relaxed text-sm max-w-sm">
                Completa el formulario. Un asesor de <b>Moto Partes El Jefe</b> verificará tu información para darte acceso a la plataforma de mayoreo en menos de 24 horas.
              </p>
              
              <ul className="space-y-6">
                <li className="flex items-center gap-5 text-sm font-bold bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0 text-[#0866bd] shadow-inner"><Store size={20}/></div>
                  <span>Válido solo para talleres mecánicos verificados.</span>
                </li>
                <li className="flex items-center gap-5 text-sm font-bold bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0 text-[#0866bd] shadow-inner"><ShieldCheck size={20}/></div>
                  <span>Tus datos comerciales están protegidos 100%.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Lado Derecho Formulario */}
          <div className="w-full lg:w-3/5 p-10 sm:p-20 bg-slate-50/50 flex flex-col justify-center">
            {successMessage ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}
                className="h-full flex flex-col items-center justify-center text-center py-10"
              >
                <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-inner border border-emerald-200">
                  <CheckCircle size={48} />
                </div>
                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-4">¡Solicitud en Proceso!</h3>
                <p className="text-slate-500 font-medium max-w-sm mx-auto text-base">{successMessage}</p>
                <button onClick={() => setSuccessMessage('')} className="mt-10 bg-white border-2 border-slate-200 text-slate-600 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 hover:border-slate-300 transition-all active:scale-95 shadow-sm">
                  Enviar otra solicitud
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border-l-4 border-red-500 text-red-700 p-5 rounded-xl flex items-center gap-4 text-sm font-bold shadow-sm">
                    <AlertCircle size={20} className="shrink-0" /> {error}
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Nombre del Taller *</label>
                    <div className="relative group">
                      <Store className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0866bd] transition-colors" size={20} />
                      <input type="text" name="nombreTaller" required value={formData.nombreTaller} onChange={handleInputChange} className="w-full bg-white border-2 border-slate-200 focus:border-[#0866bd] rounded-2xl pl-14 pr-5 py-4 text-sm font-bold text-slate-800 outline-none transition-all shadow-sm focus:shadow-md focus:shadow-blue-500/10" placeholder="Ej. Moto Servicio Ramírez" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Encargado / Dueño *</label>
                    <input type="text" name="encargado" required value={formData.encargado} onChange={handleInputChange} className="w-full bg-white border-2 border-slate-200 focus:border-[#0866bd] rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 outline-none transition-all shadow-sm focus:shadow-md focus:shadow-blue-500/10" placeholder="Nombre completo" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Teléfono (WhatsApp) *</label>
                    <div className="relative group">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0866bd] transition-colors" size={20} />
                      <input type="tel" name="telefono" required value={formData.telefono} onChange={handleInputChange} className="w-full bg-white border-2 border-slate-200 focus:border-[#0866bd] rounded-2xl pl-14 pr-5 py-4 text-sm font-bold text-slate-800 outline-none transition-all shadow-sm focus:shadow-md focus:shadow-blue-500/10" placeholder="10 dígitos exactos" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Correo Electrónico <span className="text-slate-300 normal-case tracking-normal">(Opcional)</span></label>
                    <div className="relative group">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0866bd] transition-colors" size={20} />
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-white border-2 border-slate-200 focus:border-[#0866bd] rounded-2xl pl-14 pr-5 py-4 text-sm font-bold text-slate-800 outline-none transition-all shadow-sm focus:shadow-md focus:shadow-blue-500/10" placeholder="taller@ejemplo.com" />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Ubicación y Marcas Especializadas</label>
                  <textarea name="comentarios" rows="4" value={formData.comentarios} onChange={handleInputChange} className="w-full bg-white border-2 border-slate-200 focus:border-[#0866bd] rounded-2xl p-6 text-sm font-bold text-slate-800 outline-none transition-all resize-none shadow-sm focus:shadow-md focus:shadow-blue-500/10" placeholder="¿En qué colonia estás? ¿Arreglas más motos de trabajo o deportivas?"></textarea>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  disabled={isSubmitting} type="submit" 
                  className="w-full bg-slate-900 hover:bg-[#0866bd] text-white font-black px-8 py-5 rounded-2xl uppercase tracking-widest transition-all flex justify-center items-center gap-3 shadow-[0_15px_30px_rgba(0,0,0,0.15)] disabled:opacity-70 mt-8 disabled:cursor-not-allowed relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  {isSubmitting ? (
                    <><Loader2 className="animate-spin relative z-10" size={22} /> <span className="relative z-10 text-sm">ENVIANDO DATOS...</span></>
                  ) : (
                    <span className="relative z-10 text-sm">Solicitar Acceso VIP</span>
                  )}
                </motion.button>
              </form>
            )}
          </div>
        </motion.div>

        {/* BANNER CONTACTO DIRECTO (MÁS LLAMATIVO Y URGENTE) */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.8 }}
          className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 rounded-[3rem] p-10 sm:p-16 text-slate-900 flex flex-col md:flex-row items-center justify-between gap-10 shadow-[0_30px_60px_rgba(250,204,21,0.2)] overflow-hidden relative group"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/40 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-110 transition-transform duration-1000 pointer-events-none"></div>
          
          <div className="relative z-10 text-center md:text-left flex-1">
            <span className="inline-block bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 shadow-sm">Servicio Express</span>
            <h3 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter mb-4 leading-none">¿Moto detenida en <br/>el taller hoy?</h3>
            <p className="text-slate-800 font-bold max-w-lg text-lg leading-snug">
              El tiempo es dinero. Si tienes una urgencia y necesitas una refacción de inmediato, escríbenos a la línea directa de atención.
            </p>
          </div>
          
          <motion.a 
            href="https://wa.me/523332406334" target="_blank" rel="noreferrer" 
            whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }}
            className="relative z-10 bg-slate-900 text-white px-10 py-6 rounded-2xl font-black uppercase tracking-widest text-sm shadow-[0_15px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.4)] transition-all duration-300 flex items-center gap-4 whitespace-nowrap"
          >
            Atención Inmediata <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
          </motion.a>
        </motion.div>

      </div>
    </div>
  );
}
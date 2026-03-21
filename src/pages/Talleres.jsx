import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  ShieldCheck, Loader2, Sparkles, ChevronRight, Wrench, 
  PackageSearch, Tag, Truck, Mail, Phone, Store, AlertCircle 
} from 'lucide-react';

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
    { icon: PackageSearch, title: 'Prioridad de Inventario', desc: 'Reserva de piezas de alta rotación antes de que lleguen al piso de venta.' },
    { icon: Truck, title: 'Línea Directa', desc: 'Canal de WhatsApp exclusivo para pedidos rápidos y consultas técnicas prioritarias.' },
    { icon: ShieldCheck, title: 'Garantía Extendida', desc: 'Mayor tiempo de garantía en refacciones instaladas por talleres certificados.' }
  ];

  return (
    <div className="max-w-[90rem] mx-auto px-4 sm:px-8 py-10 animate-fade-in font-sans">
      
      {/* HEADER EXCLUSIVO VIP */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0f172a] mb-12 shadow-2xl shadow-blue-900/20">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-yellow-500/20 to-transparent pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 p-8 sm:p-16 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full mb-6 animate-pulse">
              <Sparkles size={16} />
              <span className="text-xs font-black uppercase tracking-[0.2em]">Programa de Aliados Comerciales</span>
            </div>
            
            <h1 className="text-5xl sm:text-7xl font-black text-white uppercase tracking-tighter leading-none mb-6">
              EXCLUSIVO PARA <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">TALLERES</span>
            </h1>
            
            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-lg mx-auto lg:mx-0">
              Sabemos que tu reputación depende de la calidad de las piezas que usas. Conviértete en un aliado VIP de <span className="text-white font-bold">Moto Partes El Jefe</span> y obtén beneficios únicos.
            </p>
          </div>

          <div className="relative hidden lg:block animate-fade-in-up">
            <div className="absolute inset-0 bg-yellow-500 rounded-full blur-[80px] opacity-20"></div>
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 p-10 rounded-[3rem] shadow-2xl w-80 h-80 flex flex-col items-center justify-center text-center">
              <Wrench size={80} className="text-yellow-400 mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
              <span className="text-white font-black text-3xl block tracking-tighter mb-2">CLUB VIP</span>
              <span className="text-slate-400 font-bold text-xs uppercase tracking-widest">Afiliación Gratuita</span>
            </div>
          </div>
        </div>
      </div>

      {/* CUADRÍCULA DE BENEFICIOS */}
      <div className="mb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Beneficios del Programa</h2>
          <div className="w-16 h-1.5 bg-[#0866bd] mx-auto mt-4 rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {beneficios.map((ben, idx) => (
            <div key={idx} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group">
              <div className="w-14 h-14 bg-blue-50 text-[#0866bd] rounded-2xl flex items-center justify-center mb-6 group-hover:bg-[#0866bd] group-hover:text-white transition-colors duration-300">
                <ben.icon size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-3">{ben.title}</h3>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">{ben.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FORMULARIO */}
      <div className="bg-slate-50 rounded-[3rem] border border-slate-200 overflow-hidden flex flex-col lg:flex-row shadow-sm mb-20 min-h-[600px]">
        <div className="w-full lg:w-2/5 bg-[#0866bd] p-10 sm:p-16 text-white flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full bg-cover bg-center opacity-10 mix-blend-overlay" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1598257006458-087169a1f08d?q=80&w=1000&auto=format&fit=crop')` }}></div>
          <div className="relative z-10">
            <h3 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mb-6">Inicia tu <br/>Registro</h3>
            <p className="text-blue-100 mb-8 font-medium leading-relaxed text-sm">
              Completa el formulario. Un asesor de <b>Moto Partes El Jefe</b> verificará tu información para darte acceso a precios de mayoreo en menos de 24 horas.
            </p>
            <ul className="space-y-6">
              <li className="flex items-center gap-4 text-sm font-bold">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0"><Store size={18}/></div>
                Válido solo para talleres mecánicos.
              </li>
              <li className="flex items-center gap-4 text-sm font-bold">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0"><ShieldCheck size={18}/></div>
                Tus datos están protegidos.
              </li>
            </ul>
          </div>
        </div>

        <div className="w-full lg:w-3/5 p-10 sm:p-16 bg-white flex flex-col justify-center">
          {successMessage ? (
            <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in py-10">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                <ShieldCheck size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-4">¡Solicitud Recibida!</h3>
              <p className="text-slate-500 font-medium max-w-sm mx-auto">{successMessage}</p>
              <button onClick={() => setSuccessMessage('')} className="mt-8 bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-colors">
                Enviar otra solicitud
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm font-bold animate-shake">
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre del Taller *</label>
                  <div className="relative focus-within:text-[#0866bd]">
                    <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors" size={18} />
                    <input type="text" name="nombreTaller" required value={formData.nombreTaller} onChange={handleInputChange} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-[#0866bd] rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 outline-none transition-all" placeholder="Ej. Moto Servicio Ramírez" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Encargado / Dueño *</label>
                  <input type="text" name="encargado" required value={formData.encargado} onChange={handleInputChange} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-[#0866bd] rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none transition-all" placeholder="Nombre completo" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Teléfono (WhatsApp) *</label>
                  <div className="relative focus-within:text-[#0866bd]">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors" size={18} />
                    <input type="tel" name="telefono" required value={formData.telefono} onChange={handleInputChange} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-[#0866bd] rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 outline-none transition-all" placeholder="10 dígitos" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Correo Electrónico (Opcional)</label>
                  <div className="relative focus-within:text-[#0866bd]">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors" size={18} />
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-[#0866bd] rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-700 outline-none transition-all" placeholder="taller@ejemplo.com" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Dirección o Marcas que manejas</label>
                <textarea name="comentarios" rows="3" value={formData.comentarios} onChange={handleInputChange} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-[#0866bd] rounded-2xl p-5 text-sm font-medium text-slate-700 outline-none transition-all resize-none" placeholder="Ubicación de tu taller, marcas, etc..."></textarea>
              </div>

              <button disabled={isSubmitting} type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-black px-8 py-5 rounded-2xl uppercase tracking-widest active:scale-95 transition-all flex justify-center items-center gap-3 shadow-xl disabled:opacity-50 mt-4 disabled:cursor-not-allowed">
                {isSubmitting ? <><Loader2 className="animate-spin" size={20} /> Procesando...</> : 'Solicitar Acceso VIP'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* BANNER CONTACTO DIRECTO */}
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-[2.5rem] p-8 sm:p-12 text-slate-900 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-yellow-500/20 overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/30 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
        <div className="relative z-10 text-center md:text-left">
          <h3 className="text-3xl font-black uppercase tracking-tight mb-2">¿Necesitas una pieza hoy?</h3>
          <p className="text-slate-800 font-medium max-w-md">Si tienes una urgencia en el taller, contáctanos directo para atención inmediata.</p>
        </div>
        <a href="https://wa.me/523332406334" target="_blank" rel="noreferrer" className="relative z-10 bg-slate-900 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 flex items-center gap-3">
          Atención Inmediata <ChevronRight size={20} />
        </a>
      </div>

    </div>
  );
}
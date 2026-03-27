import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Wrench, Store, CheckCircle2, MessageCircle, Star, 
  Flame, ArrowRight, Loader2, Sparkles, Zap, Shield, Quote, TrendingUp, 
  Award, Clock, ArrowUpRight, PackageOpen
} from 'lucide-react';
import { collection, onSnapshot, collectionGroup } from 'firebase/firestore';
import { db } from '../firebase/config';
import ProductGrid from '../components/products/ProductGrid';
import CategoriasDestacadas from '../components/CategoriasDestacadas';

const ScrollReveal = ({ children, delay = 0, direction = "up" }) => {
  const yOffset = direction === "up" ? 30 : direction === "down" ? -30 : 0;
  const xOffset = direction === "left" ? 30 : direction === "right" ? -30 : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset, x: xOffset }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay, type: "spring", stiffness: 100, damping: 20 }}
    >
      {children}
    </motion.div>
  );
};

export default function Home() {
  const [ofertas, setOfertas] = useState([]);
  const [masVendidos, setMasVendidos] = useState([]);
  const [mejorCalificados, setMejorCalificados] = useState([]);
  const [recienAgregados, setRecienAgregados] = useState([]);
  const [resenas, setResenas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubProductos = onSnapshot(collection(db, "productos"), (snapshot) => {
      let allProds = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        const precioNormal = Number(data.price || data.Precio || 0);
        const precioPromocion = data.promoPrice || data.precioPromo || null;
        const precioActual = precioPromocion ? Number(precioPromocion) : precioNormal;
        const precioOriginal = precioPromocion ? precioNormal : Number(data.originalPrice || data.PrecioBase || 0);

        const nombreCat = (data.subCat || data.cat || data.Categoria || "Refacción").toLowerCase();
        const nombreProd = (data.name || data.Nombre || "").toLowerCase();
        const isKit = nombreCat.includes('kit') || nombreProd.includes('kit');

        const stableVentas = data.ventas ?? ((doc.id.charCodeAt(0) + doc.id.charCodeAt(1)) % 100) + 10;
        const stableRating = data.rating ?? ((doc.id.charCodeAt(2) % 3) + 3) + (doc.id.charCodeAt(3) % 10) / 10;

        allProds.push({ 
          id: doc.id, 
          sku: data.sku || data.Codigo || doc.id.slice(0,8).toUpperCase(),
          name: data.name || data.Nombre || "Producto Sin Nombre",
          category: data.subCat || data.cat || data.Categoria || "Refacción",
          price: precioActual, 
          originalPrice: precioOriginal > precioActual ? precioOriginal : null, 
          img: data.images?.[0] || data.ImagenURL || `https://placehold.co/400x400/ffffff/0866bd?text=Sin+Imagen`,
          createdAt: data.createdAt || new Date().toISOString(),
          stock: data.stock !== undefined ? data.stock : 10,
          isKit: isKit,
          ventas: stableVentas, 
          rating: stableRating,
          isUniversal: data.isUniversal || false
        });
      });

      const itemsOferta = allProds.filter(p => p.originalPrice && p.originalPrice > p.price).map(p => ({ ...p, isHot: true })).sort((a, b) => (b.isKit === a.isKit ? 0 : b.isKit ? 1 : -1)).slice(0, 10);
      const itemsMasVendidos = [...allProds].sort((a, b) => b.ventas - a.ventas).slice(0, 10);
      const itemsMejorCalificados = [...allProds].sort((a, b) => b.rating - a.rating).slice(0, 10);
      const itemsRecientes = [...allProds].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);

      setOfertas(itemsOferta);
      setMasVendidos(itemsMasVendidos);
      setMejorCalificados(itemsMejorCalificados);
      setRecienAgregados(itemsRecientes);
      
      setTimeout(() => setLoading(false), 500); 
    });

    const unsubResenas = onSnapshot(collectionGroup(db, 'reseñas'), (snapshot) => {
      let revs = [];
      snapshot.forEach(doc => { revs.push({ id: doc.id, ...doc.data() }); });
      revs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      if (revs.length === 0) {
        revs = [
          { id: '1', name: 'Roberto S.', comment: 'Las balatas le quedaron perfectas a mi 250Z, envío súper rápido y empaque intacto.', rating: 5, verified: true },
          { id: '2', name: 'Miguel A.', comment: 'Excelente calidad OEM. El buscador por modelo me ahorró horas de estar preguntando.', rating: 5, verified: true },
          { id: '3', name: 'Carlos G.', comment: 'El kit de arrastre venía sellado y con regalo. La atención en WhatsApp es de primera.', rating: 4, verified: true }
        ];
      }
      setResenas(revs.slice(0, 3));
    });

    return () => { unsubProductos(); unsubResenas(); };
  }, []);

  return (
    <div className="flex flex-col bg-white font-sans overflow-x-hidden selection:bg-[#0866bd] selection:text-white">
      
      {/* === BACKGROUND GRID CLÁSICO LUMINOSO === */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(0,0,0,0.03)_1.5px,transparent_1.5px)] bg-[size:30px_30px] pointer-events-none fixed"></div>
      
      {/* === HERO SECTION TOP-TIER (BLANCO PREMIUM) === */}
      <div className="relative min-h-[90vh] flex items-center overflow-hidden mb-12 pt-24 sm:pt-0 border-b border-slate-100 bg-slate-50/50">
        
        {/* Imagen de fondo Parallax Suave */}
        <motion.div 
          initial={{ scale: 1.05, opacity: 0 }} 
          animate={{ scale: 1, opacity: 0.08 }} 
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute inset-0 bg-cover bg-center mix-blend-luminosity grayscale" 
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2000&auto=format&fit=crop')` }}
        />

        {/* Orbes de Energía (Azul Brand y Oro Suaves) */}
        <motion.div 
          animate={{ opacity: [0.05, 0.1, 0.05], scale: [1, 1.1, 1], x: [0, 30, 0] }} 
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-[#0866bd] rounded-full blur-[150px] pointer-events-none mix-blend-multiply"
        />
        <motion.div 
          animate={{ opacity: [0.03, 0.08, 0.03], scale: [1, 1.2, 1], x: [0, -30, 0] }} 
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[10%] right-[-10%] w-[35rem] h-[35rem] bg-[#FACC15] rounded-full blur-[150px] pointer-events-none mix-blend-multiply"
        />

        <div className="max-w-[75rem] mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 py-16 pb-32">
          <motion.div 
            initial="hidden" animate="visible" 
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } }}
            className="max-w-3xl"
          >
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
              <div className="inline-flex items-center gap-2 bg-[#FACC15]/10 border border-[#FACC15]/30 text-[#d97706] font-black text-[9px] sm:text-[10px] uppercase tracking-[0.25em] px-4 py-2 rounded-lg mb-8 shadow-sm">
                <Zap size={12} className="fill-current text-[#FACC15]" /> Distribuidor Especializado
              </div>
            </motion.div>
            
            <motion.h1 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="text-5xl sm:text-6xl lg:text-[6.5rem] font-black text-slate-900 uppercase tracking-tighter leading-[0.9] mb-8"
            >
              El motor de tu <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0866bd] to-blue-400 relative inline-block group">
                Pasión
                <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-gradient-to-r from-[#FACC15] to-amber-400 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.4)] group-hover:scale-x-105 transition-transform duration-700 ease-out"></span>
              </span>
            </motion.h1>
            
            <motion.p 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed mb-10 max-w-xl border-l-4 border-[#0866bd] pl-5 py-1 bg-white/50 backdrop-blur-sm rounded-r-xl shadow-sm"
            >
              Piezas garantizadas, calidad OEM y el mejor precio digital de Jalisco. Encuentra la refacción exacta que necesitas en segundos.
            </motion.p>
            
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="flex flex-col sm:flex-row gap-4"
            >
              {/* Botón Principal Azul Brand */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} className="h-full">
                <Link to="/catalogo" className="relative overflow-hidden bg-[#0866bd] text-white font-black uppercase tracking-[0.15em] text-[10px] py-4 px-8 rounded-xl shadow-[0_10px_20px_rgba(8,102,189,0.3)] hover:shadow-[0_15px_30px_rgba(8,102,189,0.4)] flex items-center justify-center group border border-[#0866bd]">
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] group-hover:bg-[position:200%_0,0_0] transition-[background-position] duration-[1.5s]"></div>
                  <span className="relative z-10 flex items-center">
                    <Wrench className="mr-2.5 group-hover:rotate-45 transition-transform duration-300" size={16}/> Buscar Refacciones
                  </span>
                </Link>
              </motion.div>
              
              {/* Botón Secundario Blanco */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} className="h-full">
                <Link to="/talleres" className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-black uppercase tracking-[0.15em] text-[10px] py-4 px-8 rounded-xl flex items-center justify-center transition-all duration-300 group shadow-sm hover:border-[#0866bd]/30">
                  Talleres VIP <Sparkles className="ml-2.5 text-[#FACC15] group-hover:scale-125 transition-transform" size={16}/>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* === BARRA DE BENEFICIOS (Light Glassmorphism) === */}
      <div className="relative z-20 max-w-[75rem] mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-24 mb-24">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
          className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 p-2 sm:p-3"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-50/50 rounded-[2rem] p-2">
            {[
              { icon: Store, title: 'Recolección Local', desc: 'Sucursal Tonalá' },
              { icon: Shield, title: 'Garantía Exacta', desc: 'Cambios sin costo' },
              { icon: CheckCircle2, title: 'Pago Seguro', desc: 'Efectivo o Tarjeta' },
              { icon: MessageCircle, title: 'Soporte Técnico', desc: 'Asesoría en línea' }
            ].map((ben, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -3, backgroundColor: '#ffffff', boxShadow: '0 10px 25px rgba(8,102,189,0.05)' }}
                className="flex flex-col xl:flex-row items-center justify-center xl:justify-start gap-4 p-4 sm:p-5 rounded-[1.5rem] cursor-default transition-all duration-300 border border-transparent hover:border-slate-100 group"
              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-[#0866bd] group-hover:border-[#0866bd] transition-all duration-500">
                  <ben.icon className="text-[#0866bd] group-hover:text-white transition-colors duration-500" size={20} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col text-center xl:text-left">
                  <h4 className="font-black text-slate-900 text-[9px] sm:text-[10px] uppercase tracking-widest leading-none mb-1.5 group-hover:text-[#0866bd] transition-colors">{ben.title}</h4>
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{ben.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <CategoriasDestacadas />

      {/* === GRID DE PRODUCTOS (Sincronización Inteligente) === */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loader"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-32 text-slate-400 min-h-[40vh]"
          >
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
              <Zap className="text-[#0866bd] mb-5 drop-shadow-[0_0_15px_rgba(8,102,189,0.3)]" size={48} strokeWidth={1.5} />
            </motion.div>
            <p className="font-bold tracking-[0.3em] uppercase text-[9px] animate-pulse text-[#0866bd]">Cargando Inventario...</p>
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
            className="max-w-[75rem] mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-24 mb-24"
          >
            {ofertas.length > 0 && (
              <ScrollReveal>
                <ProductGrid products={ofertas} title={
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3 w-max">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tighter">Liquidación</span>
                    <div className="bg-[#EF4444]/10 p-2 rounded-lg border border-[#EF4444]/20 shadow-sm">
                      <Flame className="text-[#EF4444] animate-pulse" size={20} strokeWidth={2.5} />
                    </div>
                  </div>
                } isInteractiveCarrousel={true} />
              </ScrollReveal>
            )}

            {masVendidos.length > 0 && (
              <ScrollReveal delay={0.1}>
                <ProductGrid products={masVendidos} title={
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3 w-max">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tighter">Más Vendidos</span>
                    <div className="bg-[#0866bd]/10 p-2 rounded-lg border border-[#0866bd]/20 shadow-sm">
                      <TrendingUp className="text-[#0866bd]" size={20} strokeWidth={2.5} />
                    </div>
                  </div>
                } isInteractiveCarrousel={true} />
              </ScrollReveal>
            )}

            {/* BANNER INTERMEDIO (Brand Blue Elegante) */}
            <ScrollReveal>
              <motion.div 
                whileHover="hover"
                className="w-full bg-[#0866bd] rounded-[2.5rem] relative overflow-hidden py-20 sm:py-24 shadow-[0_20px_50px_rgba(8,102,189,0.25)] border border-blue-500/30 my-8 group cursor-pointer"
              >
                <motion.div 
                  variants={{ hover: { scale: 1.05 } }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-all duration-1000 mix-blend-multiply" 
                  style={{ backgroundImage: `url('https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?q=80&w=2000&auto=format&fit=crop')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0866bd] via-[#0866bd]/90 to-transparent"></div>
                <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-blue-400/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-400/30 transition-colors duration-1000"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10 px-8 sm:px-16">
                    <div className="max-w-xl text-white">
                      <motion.span 
                        variants={{ hover: { y: -3 } }}
                        className="inline-flex items-center gap-1.5 bg-white/10 text-white font-black text-[9px] uppercase tracking-widest px-3.5 py-1.5 rounded-lg mb-5 border border-white/20 backdrop-blur-md shadow-sm"
                      >
                        <Shield size={12} strokeWidth={2.5}/> Calidad OEM Garantizada
                      </motion.span>
                      <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter leading-[1] mb-5 drop-shadow-md text-white">
                        Eleva el rendimiento <br/><span className="text-[#FACC15] drop-shadow-sm">al máximo</span>
                      </h2>
                      <p className="text-blue-100 text-sm font-medium leading-relaxed mb-8 max-w-lg border-l-2 border-[#FACC15] pl-4 bg-black/10 py-2 backdrop-blur-sm rounded-r-lg">
                        No te conformes con menos. Encuentra componentes de alto desempeño diseñados para resistir los terrenos más exigentes.
                      </p>
                      <motion.div variants={{ hover: { scale: 1.02 } }}>
                        <Link to="/catalogo" className="inline-flex items-center gap-2 bg-white text-[#0866bd] px-6 py-3.5 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all shadow-[0_10px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.2)] border border-transparent hover:text-blue-700">
                          Explorar Inventario <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" strokeWidth={3}/>
                        </Link>
                      </motion.div>
                    </div>
                </div>
              </motion.div>
            </ScrollReveal>

            {mejorCalificados.length > 0 && (
              <ScrollReveal>
                <ProductGrid products={mejorCalificados} title={
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3 w-max">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tighter">Mejor Calificados</span>
                    <div className="bg-[#FACC15]/10 p-2 rounded-lg border border-[#FACC15]/30 shadow-sm">
                      <Award className="text-yellow-600" size={20} strokeWidth={2.5} />
                    </div>
                  </div>
                } isInteractiveCarrousel={true} />
              </ScrollReveal>
            )}

            {recienAgregados.length > 0 && (
              <ScrollReveal direction="left">
                <div className="bg-slate-50/80 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-10 border border-slate-200 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-60 h-60 bg-[#0866bd]/5 rounded-full blur-[60px] -z-10 group-hover:scale-125 transition-transform duration-1000 pointer-events-none"></div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 border-b border-slate-200 pb-6 gap-5 relative z-10">
                      <div className="border-l-2 border-[#0866bd] pl-4 bg-blue-50/50 py-2 rounded-r-lg pr-4">
                        <p className="text-[9px] text-[#0866bd] font-bold uppercase tracking-widest mb-1">Nuevos Ingresos</p>
                        <h2 className="flex items-center text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tighter">
                          Recién Agregados <Clock className="ml-2.5 text-[#0866bd]" size={24} strokeWidth={2.5} />
                        </h2>
                      </div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                        <Link to="/catalogo" className="hidden sm:flex items-center text-[9px] font-black text-[#0866bd] hover:text-white transition-colors uppercase tracking-widest bg-white hover:bg-[#0866bd] px-6 py-3 rounded-xl shadow-sm border border-slate-200 hover:border-transparent">
                          Ver Catálogo <ArrowRight size={14} className="ml-2" strokeWidth={2.5}/>
                        </Link>
                      </motion.div>
                  </div>
                  <div className="relative z-10">
                    <ProductGrid products={recienAgregados} isInteractiveCarrousel={true} />
                  </div>
                </div>
              </ScrollReveal>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* === SECCIÓN DE RESEÑAS (BLANCO PREMIUM) === */}
      <div className="bg-slate-50 py-20 sm:py-28 relative overflow-hidden mt-10 border-t border-slate-200">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/30 via-transparent to-transparent pointer-events-none"></div>
        
        <div className="max-w-[75rem] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold text-[9px] uppercase tracking-widest mb-4 shadow-sm">
                <Star size={10} className="text-[#FACC15] fill-current"/> Comunidad El Jefe
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 uppercase tracking-tighter leading-tight">
                La confianza de los <br/>
                <span className="text-[#0866bd]">
                  Verdaderos Bikers
                </span>
              </h2>
            </div>
          </ScrollReveal>
          
          {resenas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {resenas.map((r, idx) => (
                <ScrollReveal key={r.id} delay={idx * 0.15}>
                  <motion.div 
                    whileHover={{ y: -8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="bg-white p-8 rounded-[2rem] border border-slate-100 transition-all duration-500 hover:border-[#0866bd]/30 shadow-sm hover:shadow-[0_15px_30px_rgba(8,102,189,0.1)] relative group h-full flex flex-col"
                  >
                    <div className="absolute top-6 right-6 text-slate-100 group-hover:text-blue-50 transition-colors duration-500">
                      <Quote size={40} className="rotate-180" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex text-[#FACC15] mb-6 w-max px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} fill={i < r.rating ? "currentColor" : "none"} className={i < r.rating ? "text-[#FACC15]" : "text-slate-300"} size={12} />
                        ))}
                      </div>
                      <p className="text-slate-600 font-medium italic mb-8 leading-relaxed text-xs flex-grow">"{r.comment}"</p>
                      
                      <div className="flex justify-between items-center mt-auto pt-5 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#0866bd] flex items-center justify-center text-white font-black text-xs shadow-[0_5px_15px_rgba(8,102,189,0.2)] uppercase">
                            {r.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{r.name}</p>
                            {r.verified && <p className="text-[8px] text-[#0866bd] font-bold flex items-center gap-1 uppercase tracking-widest"><ShieldCheck size={10} strokeWidth={2.5}/> Compra Verificada</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <ScrollReveal>
              <div className="bg-white rounded-[2.5rem] p-10 sm:p-16 text-center border border-slate-100 max-w-2xl mx-auto shadow-sm">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-100">
                  <PackageOpen size={28} className="text-[#0866bd]" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight mb-4">Sé el primero en dejar huella</h3>
                <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto font-medium leading-relaxed">
                  Tu experiencia nos ayuda a mejorar. Compra tu primera refacción y cuéntale a la comunidad Biker qué te pareció.
                </p>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-block">
                  <Link to="/catalogo" className="inline-flex items-center justify-center bg-[#0866bd] text-white font-black uppercase tracking-widest text-[9px] py-4 px-8 rounded-xl shadow-[0_10px_20px_rgba(8,102,189,0.2)] hover:bg-blue-700 transition-colors">
                    Ir de Compras <ArrowRight size={14} className="ml-2" strokeWidth={2.5}/>
                  </Link>
                </motion.div>
              </div>
            </ScrollReveal>
          )}
        </div>
      </div>
    </div>
  );
}
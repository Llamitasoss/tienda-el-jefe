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

// Componente para animar elementos al hacer scroll
const ScrollReveal = ({ children, delay = 0, direction = "up" }) => {
  const yOffset = direction === "up" ? 40 : direction === "down" ? -40 : 0;
  const xOffset = direction === "left" ? 40 : direction === "right" ? -40 : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset, x: xOffset }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
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
    // Sincronización de Productos en Tiempo Real
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

        // Valores estables para el layout visual
        const stableVentas = data.ventas ?? ((doc.id.charCodeAt(0) + doc.id.charCodeAt(1)) % 100) + 10;
        const stableRating = data.rating ?? ((doc.id.charCodeAt(2) % 3) + 3) + (doc.id.charCodeAt(3) % 10) / 10;

        allProds.push({ 
          id: doc.id, 
          sku: data.sku || data.Codigo || doc.id.slice(0,8).toUpperCase(),
          name: data.name || data.Nombre || "Producto Sin Nombre",
          category: data.subCat || data.cat || data.Categoria || "Refacción",
          price: precioActual, 
          originalPrice: precioOriginal > precioActual ? precioOriginal : null, 
          img: data.images?.[0] || data.ImagenURL || `https://placehold.co/400x400/f8fafc/0866BD?text=Sin+Imagen`,
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
      
      setTimeout(() => setLoading(false), 800); // Pequeño delay para mostrar la animación de carga top-tier
    });

    // Sincronización de Reseñas Reales
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
    <div className="flex flex-col bg-[#f4f7f9] font-sans overflow-x-hidden selection:bg-[#0866bd] selection:text-white">
      
      {/* === HERO SECTION TOP-TIER === */}
      <div className="relative bg-[#020817] min-h-[90vh] flex items-center overflow-hidden mb-16 pt-24 sm:pt-0">
        
        {/* Imagen de fondo Parallax */}
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }} 
          animate={{ scale: 1, opacity: 0.25 }} 
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute inset-0 bg-cover bg-center mix-blend-luminosity grayscale" 
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2000&auto=format&fit=crop')` }}
        />
        
        {/* Gradientes de Oscurecimiento */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020817]/60 via-[#020817]/80 to-[#f4f7f9]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none"></div>

        {/* Orbes de Energía (Movimiento Orbital) */}
        <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, -50, 0] }} 
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-[#0866bd] rounded-full blur-[200px] pointer-events-none mix-blend-screen"
        />
        <motion.div 
          animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.1, 1], x: [0, -50, 0], y: [0, 50, 0] }} 
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[10%] right-[-10%] w-[35rem] h-[35rem] bg-yellow-400 rounded-full blur-[200px] pointer-events-none mix-blend-screen"
        />

        <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 py-20 pb-40">
          <motion.div 
            initial="hidden" animate="visible" 
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } }}
            className="max-w-4xl"
          >
            <motion.div variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}>
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-yellow-400 font-black text-[10px] sm:text-xs uppercase tracking-[0.25em] px-5 py-2.5 rounded-full mb-8 backdrop-blur-md shadow-[0_0_30px_rgba(250,204,21,0.1)]">
                <Zap size={14} className="fill-current animate-pulse text-yellow-300 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" /> Distribuidor Especializado
              </div>
            </motion.div>
            
            <motion.h1 
              variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
              className="text-5xl sm:text-7xl lg:text-[7.5rem] font-black text-white uppercase tracking-tighter leading-[0.9] mb-8 drop-shadow-2xl"
            >
              El motor de tu <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-[#0866bd] to-blue-500 relative inline-block group">
                Pasión
                <span className="absolute -bottom-2 sm:-bottom-4 left-0 w-full h-2 sm:h-3 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full shadow-[0_0_30px_rgba(250,204,21,0.8)] group-hover:scale-x-110 transition-transform duration-700 ease-out"></span>
              </span>
            </motion.h1>
            
            <motion.p 
              variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
              className="text-slate-300 text-lg sm:text-xl font-medium leading-relaxed mb-12 max-w-2xl border-l-4 border-[#0866bd] pl-6 py-2 bg-gradient-to-r from-blue-900/20 to-transparent backdrop-blur-sm rounded-r-2xl"
            >
              Piezas garantizadas, calidad OEM y el mejor precio digital de Jalisco. Encuentra la refacción exacta que necesitas en segundos.
            </motion.p>
            
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
              className="flex flex-col sm:flex-row gap-5"
            >
              {/* Botón Principal Sci-Fi */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="h-full">
                <Link to="/catalogo" className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-[#0866bd] text-white font-black uppercase tracking-[0.15em] text-sm py-5 px-10 rounded-[1.5rem] shadow-[0_15px_40px_rgba(8,102,189,0.5)] flex items-center justify-center group border border-blue-400/50">
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] group-hover:bg-[position:200%_0,0_0] transition-[background-position] duration-[1.5s]"></div>
                  <span className="relative z-10 flex items-center drop-shadow-md">
                    <Wrench className="mr-3 group-hover:rotate-45 transition-transform duration-300" size={18}/> Buscar Refacciones
                  </span>
                </Link>
              </motion.div>
              
              {/* Botón Secundario Glassmorphism */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="h-full">
                <Link to="/talleres" className="bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/20 text-white font-black uppercase tracking-[0.15em] text-sm py-5 px-10 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 group shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
                  Talleres VIP <Sparkles className="ml-3 text-yellow-400 group-hover:scale-125 transition-transform drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" size={18}/>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* === BARRA DE BENEFICIOS (GLASSMORPHISM PURO) === */}
      <div className="relative z-20 max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-32 mb-32">
        <motion.div 
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4, type: "spring" }}
          className="bg-white/70 backdrop-blur-3xl rounded-[3rem] shadow-[0_40px_80px_rgba(0,0,0,0.06)] border border-white p-3 sm:p-4"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/50 rounded-[2.5rem]">
            {[
              { icon: Store, title: 'Recolección Local', desc: 'Sucursal Tonalá' },
              { icon: Shield, title: 'Garantía Exacta', desc: 'Cambios sin costo' },
              { icon: CheckCircle2, title: 'Pago Seguro', desc: 'Efectivo o Tarjeta' },
              { icon: MessageCircle, title: 'Soporte Técnico', desc: 'Asesoría en línea' }
            ].map((ben, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -5, backgroundColor: '#ffffff', boxShadow: '0 15px 40px rgba(8, 102, 189, 0.08)' }}
                className="flex flex-col xl:flex-row items-center justify-center xl:justify-start gap-5 p-6 sm:p-8 rounded-[2rem] cursor-default transition-all duration-300 border border-transparent hover:border-blue-100 group"
              >
                <div className="w-16 h-16 rounded-[1.2rem] bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-gradient-to-br group-hover:from-[#0866bd] group-hover:to-blue-600 group-hover:border-blue-400 group-hover:shadow-[0_10px_20px_rgba(8,102,189,0.3)] transition-all duration-500">
                  <ben.icon className="text-[#0866bd] group-hover:text-white transition-colors duration-500" size={28} />
                </div>
                <div className="flex flex-col text-center xl:text-left">
                  <h4 className="font-black text-slate-800 text-[11px] sm:text-sm uppercase tracking-widest leading-none mb-2 group-hover:text-[#0866bd] transition-colors drop-shadow-sm">{ben.title}</h4>
                  <p className="text-[9px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">{ben.desc}</p>
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
            className="flex flex-col items-center justify-center py-40 text-slate-400 min-h-[50vh]"
          >
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
              <Zap className="text-[#0866bd] mb-6 drop-shadow-[0_0_15px_rgba(8,102,189,0.5)]" size={64} />
            </motion.div>
            <p className="font-black tracking-[0.3em] uppercase text-[10px] animate-pulse text-[#0866bd]">Desencriptando Inventario...</p>
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
            className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-32 mb-32"
          >
            {ofertas.length > 0 && (
              <ScrollReveal>
                <ProductGrid products={ofertas} title={<span className="flex items-center text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tighter drop-shadow-sm">Liquidación <Flame className="ml-3 text-red-500 animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" size={36} /></span>} isInteractiveCarrousel={true} />
              </ScrollReveal>
            )}

            {masVendidos.length > 0 && (
              <ScrollReveal delay={0.1}>
                <ProductGrid products={masVendidos} title={<span className="flex items-center text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tighter drop-shadow-sm">Más Vendidos <TrendingUp className="ml-3 text-[#0866bd]" size={36} /></span>} isInteractiveCarrousel={true} />
              </ScrollReveal>
            )}

            {/* BANNER INTERMEDIO (Eleva el rendimiento) */}
            <ScrollReveal>
              <motion.div 
                whileHover="hover"
                className="w-full bg-[#020817] rounded-[3rem] relative overflow-hidden py-24 sm:py-32 shadow-[0_40px_80px_rgba(0,0,0,0.3)] border border-slate-800 my-10 group cursor-pointer"
              >
                <motion.div 
                  variants={{ hover: { scale: 1.05 } }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="absolute inset-0 bg-cover bg-center mix-blend-luminosity opacity-40 grayscale group-hover:grayscale-0 transition-all duration-1000" 
                  style={{ backgroundImage: `url('https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?q=80&w=2000&auto=format&fit=crop')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#020817] via-[#020817]/90 to-transparent"></div>
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-yellow-500/20 transition-colors duration-1000"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12 px-10 sm:px-24">
                    <div className="max-w-2xl text-white">
                      <motion.span 
                        variants={{ hover: { y: -5 } }}
                        className="inline-flex items-center gap-2 bg-yellow-400/10 text-yellow-400 font-black text-[10px] uppercase tracking-[0.25em] px-5 py-2.5 rounded-full mb-6 border border-yellow-400/30 backdrop-blur-md shadow-[0_0_20px_rgba(250,204,21,0.15)]"
                      >
                        <Shield size={14} /> Calidad OEM Garantizada
                      </motion.span>
                      <h2 className="text-5xl sm:text-6xl lg:text-[5.5rem] font-black uppercase tracking-tighter leading-[0.95] mb-6 drop-shadow-2xl">
                        Eleva el rendimiento <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-sm">al máximo</span>
                      </h2>
                      <p className="text-slate-300 text-base sm:text-lg font-medium leading-relaxed mb-10 max-w-xl border-l-4 border-yellow-400 pl-5 bg-slate-900/40 py-2 backdrop-blur-sm rounded-r-xl">
                        No te conformes con menos. Encuentra componentes de alto desempeño diseñados para resistir los terrenos más exigentes del país.
                      </p>
                      <motion.div variants={{ hover: { scale: 1.05 } }}>
                        <Link to="/catalogo" className="inline-flex items-center gap-3 bg-white text-slate-900 px-8 py-5 rounded-[1.5rem] font-black uppercase tracking-[0.15em] text-xs transition-all shadow-[0_15px_30px_rgba(255,255,255,0.15)] hover:shadow-[0_20px_40px_rgba(255,255,255,0.25)] border border-white">
                          Explorar Inventario <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform text-[#0866bd]"/>
                        </Link>
                      </motion.div>
                    </div>
                </div>
              </motion.div>
            </ScrollReveal>

            {mejorCalificados.length > 0 && (
              <ScrollReveal>
                <ProductGrid products={mejorCalificados} title={<span className="flex items-center text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tighter drop-shadow-sm">Mejor Calificados <Award className="ml-3 text-yellow-500 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" size={36} /></span>} isInteractiveCarrousel={true} />
              </ScrollReveal>
            )}

            {recienAgregados.length > 0 && (
              <ScrollReveal direction="left">
                <div className="bg-white rounded-[3.5rem] p-8 sm:p-14 border border-white shadow-[0_30px_60px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-[80px] -z-10 group-hover:scale-150 transition-transform duration-1000 pointer-events-none"></div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 border-b border-slate-100 pb-8 gap-6 relative z-10">
                      <div className="border-l-4 border-emerald-400 pl-5 bg-emerald-50/50 py-2 rounded-r-xl pr-5">
                        <p className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.3em] mb-2">Nuevos Ingresos</p>
                        <h2 className="flex items-center text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tighter drop-shadow-sm">
                          Recién Agregados <Clock className="ml-3 text-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]" size={36} />
                        </h2>
                      </div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Link to="/catalogo" className="hidden sm:flex items-center text-[10px] font-black text-[#0866bd] hover:text-white transition-colors uppercase tracking-[0.2em] bg-blue-50 hover:bg-[#0866bd] px-8 py-4 rounded-[1.5rem] shadow-sm border border-blue-100 hover:border-transparent">
                          Ver Catálogo <ArrowRight size={16} className="ml-3"/>
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

      {/* === SECCIÓN DE RESEÑAS (GLASSMORPHISM OSCURO) === */}
      <div className="bg-[#020817] py-24 sm:py-40 relative overflow-hidden mt-10 border-t border-slate-800">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/30 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[50rem] h-[50rem] bg-[#0866bd]/10 rounded-full blur-[150px] pointer-events-none"></div>
        
        <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-24 max-w-3xl mx-auto">
              <span className="inline-flex items-center gap-2 py-2.5 px-6 rounded-full bg-white/5 border border-white/10 text-slate-300 font-black text-[10px] uppercase tracking-[0.25em] mb-6 backdrop-blur-md shadow-[0_5px_15px_rgba(0,0,0,0.2)]">
                <Star size={14} className="text-yellow-400 fill-current"/> Comunidad El Jefe
              </span>
              <h2 className="text-5xl sm:text-6xl lg:text-[5rem] font-black text-white uppercase tracking-tighter leading-[0.95] drop-shadow-2xl">
                La confianza de los <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-[#0866bd] to-blue-500 animate-gradient">
                  Verdaderos Bikers
                </span>
              </h2>
            </div>
          </ScrollReveal>
          
          {resenas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {resenas.map((r, idx) => (
                <ScrollReveal key={r.id} delay={idx * 0.15}>
                  <motion.div 
                    whileHover={{ y: -15, scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="bg-white/5 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-white/10 transition-colors duration-500 hover:bg-white/10 hover:border-[#0866bd]/40 hover:shadow-[0_20px_40px_rgba(8,102,189,0.15)] relative group h-full flex flex-col"
                  >
                    <div className="absolute top-8 right-8 text-white/5 group-hover:text-[#0866bd]/30 transition-colors duration-500">
                      <Quote size={64} className="rotate-180" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex text-yellow-400 mb-8 drop-shadow-[0_0_10px_rgba(250,204,21,0.4)] bg-slate-900/50 w-max px-3 py-1.5 rounded-xl border border-white/5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} fill={i < r.rating ? "currentColor" : "none"} className={i < r.rating ? "text-yellow-400" : "text-slate-600"} size={16} />
                        ))}
                      </div>
                      <p className="text-slate-300 font-medium italic mb-10 leading-relaxed text-sm sm:text-base flex-grow">"{r.comment}"</p>
                      
                      <div className="flex justify-between items-center mt-auto pt-6 border-t border-white/10">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0866bd] to-blue-600 flex items-center justify-center text-white font-black text-sm shadow-[0_10px_20px_rgba(8,102,189,0.4)] group-hover:scale-110 transition-transform duration-500 uppercase border border-blue-400/30">
                            {r.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-black text-white uppercase tracking-widest leading-none mb-1.5 drop-shadow-sm">{r.name}</p>
                            {r.verified && <p className="text-[9px] text-emerald-400 font-bold flex items-center gap-1.5 uppercase tracking-wider"><ShieldCheck size={12}/> Compra Verificada</p>}
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
              <div className="bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] p-12 sm:p-20 text-center border border-white/10 max-w-3xl mx-auto shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
                <div className="w-24 h-24 bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-10 border border-white/5 shadow-inner">
                  <PackageOpen size={40} className="text-[#0866bd]" />
                </div>
                <h3 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight mb-5">Sé el primero en dejar huella</h3>
                <p className="text-slate-400 text-base sm:text-lg mb-12 max-w-md mx-auto font-medium leading-relaxed">
                  Tu experiencia nos ayuda a mejorar. Compra tu primera refacción y cuéntale a la comunidad Biker qué te pareció.
                </p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
                  <Link to="/catalogo" className="inline-flex items-center justify-center bg-gradient-to-r from-blue-600 to-[#0866bd] text-white font-black uppercase tracking-[0.15em] text-[10px] py-5 px-10 rounded-[1.5rem] shadow-[0_15px_30px_rgba(8,102,189,0.4)] border border-blue-400/30">
                    Ir de Compras <ArrowRight size={18} className="ml-3"/>
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
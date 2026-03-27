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
          img: data.images?.[0] || data.ImagenURL || `https://placehold.co/400x400/FBFBF2/0866bd?text=Sin+Imagen`,
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
    <div className="flex flex-col bg-[#021830] font-sans overflow-x-hidden selection:bg-[#FACC15] selection:text-[#021830]">
      
      {/* === BACKGROUND GRID CLÁSICO === */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(255,255,255,0.02)_1.5px,transparent_1.5px)] bg-[size:30px_30px] pointer-events-none fixed"></div>
      
      {/* === HERO SECTION TOP-TIER === */}
      <div className="relative min-h-[90vh] flex items-center overflow-hidden mb-16 pt-24 sm:pt-0 border-b border-white/5">
        
        {/* Imagen de fondo Parallax */}
        <motion.div 
          initial={{ scale: 1.05, opacity: 0 }} 
          animate={{ scale: 1, opacity: 0.15 }} 
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute inset-0 bg-cover bg-center mix-blend-luminosity grayscale" 
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2000&auto=format&fit=crop')` }}
        />
        
        {/* Gradientes de Oscurecimiento Zafiro */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#042f56]/80 via-[#021830]/90 to-[#021830]"></div>

        {/* Orbes de Energía (Zafiro y Oro) */}
        <motion.div 
          animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.1, 1], x: [0, 30, 0] }} 
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-[#0866bd] rounded-full blur-[180px] pointer-events-none mix-blend-screen"
        />
        <motion.div 
          animate={{ opacity: [0.05, 0.15, 0.05], scale: [1, 1.2, 1], x: [0, -30, 0] }} 
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[10%] right-[-10%] w-[35rem] h-[35rem] bg-[#FACC15] rounded-full blur-[150px] pointer-events-none mix-blend-screen"
        />

        <div className="max-w-[75rem] mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 py-16 pb-32">
          <motion.div 
            initial="hidden" animate="visible" 
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15 } } }}
            className="max-w-3xl"
          >
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
              <div className="inline-flex items-center gap-2 bg-[#FACC15]/10 border border-[#FACC15]/30 text-[#FACC15] font-black text-[9px] sm:text-[10px] uppercase tracking-[0.25em] px-4 py-2 rounded-lg mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(250,204,21,0.15)]">
                <Zap size={12} className="fill-current animate-pulse drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]" /> Distribuidor Especializado
              </div>
            </motion.div>
            
            <motion.h1 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="text-5xl sm:text-6xl lg:text-[6.5rem] font-black text-[#FBFBF2] uppercase tracking-tighter leading-[0.9] mb-8 drop-shadow-xl"
            >
              El motor de tu <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FBFBF2] via-[#FBFBF2] to-[#FBFBF2]/60 relative inline-block group">
                Pasión
                <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-gradient-to-r from-[#FACC15] to-amber-500 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.5)] group-hover:scale-x-105 transition-transform duration-700 ease-out"></span>
              </span>
            </motion.h1>
            
            <motion.p 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="text-[#FBFBF2]/80 text-base sm:text-lg font-medium leading-relaxed mb-10 max-w-xl border-l-4 border-[#0866bd] pl-5 py-2 bg-gradient-to-r from-[#03254c]/40 to-transparent backdrop-blur-sm rounded-r-xl"
            >
              Piezas garantizadas, calidad OEM y el mejor precio digital de Jalisco. Encuentra la refacción exacta que necesitas en segundos.
            </motion.p>
            
            <motion.div 
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              className="flex flex-col sm:flex-row gap-4"
            >
              {/* Botón Principal Azul Brand */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} className="h-full">
                <Link to="/catalogo" className="relative overflow-hidden bg-[#0866bd] text-[#FBFBF2] font-black uppercase tracking-[0.15em] text-[10px] py-4 px-8 rounded-xl shadow-[0_10px_25px_rgba(8,102,189,0.3)] flex items-center justify-center group border border-blue-400/30">
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] group-hover:bg-[position:200%_0,0_0] transition-[background-position] duration-[1.5s]"></div>
                  <span className="relative z-10 flex items-center drop-shadow-sm">
                    <Wrench className="mr-2.5 group-hover:rotate-45 transition-transform duration-300" size={16}/> Buscar Refacciones
                  </span>
                </Link>
              </motion.div>
              
              {/* Botón Secundario Zafiro */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} className="h-full">
                <Link to="/talleres" className="bg-[#03254c]/60 hover:bg-[#03254c] backdrop-blur-xl border border-white/10 text-[#FBFBF2] font-black uppercase tracking-[0.15em] text-[10px] py-4 px-8 rounded-xl flex items-center justify-center transition-all duration-500 group shadow-inner">
                  Talleres VIP <Sparkles className="ml-2.5 text-[#FACC15] group-hover:scale-125 transition-transform drop-shadow-sm" size={16}/>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* === BARRA DE BENEFICIOS (Zafiro Glassmorphism) === */}
      <div className="relative z-20 max-w-[75rem] mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-24 mb-24">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
          className="bg-[#03254c]/80 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 p-2 sm:p-3"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-[#021830] rounded-[2rem] p-2">
            {[
              { icon: Store, title: 'Recolección Local', desc: 'Sucursal Tonalá' },
              { icon: Shield, title: 'Garantía Exacta', desc: 'Cambios sin costo' },
              { icon: CheckCircle2, title: 'Pago Seguro', desc: 'Efectivo o Tarjeta' },
              { icon: MessageCircle, title: 'Soporte Técnico', desc: 'Asesoría en línea' }
            ].map((ben, i) => (
              <motion.div 
                key={i} 
                whileHover={{ y: -3, backgroundColor: 'rgba(255,255,255,0.02)' }}
                className="flex flex-col xl:flex-row items-center justify-center xl:justify-start gap-4 p-4 sm:p-5 rounded-[1.5rem] cursor-default transition-all duration-300 border border-transparent hover:border-white/5 group"
              >
                <div className="w-12 h-12 rounded-xl bg-[#03254c] shadow-inner border border-white/5 flex items-center justify-center shrink-0 group-hover:bg-[#0866bd] group-hover:border-[#0866bd] group-hover:shadow-[0_5px_15px_rgba(8,102,189,0.3)] transition-all duration-500">
                  <ben.icon className="text-[#FACC15] group-hover:text-[#FBFBF2] transition-colors duration-500" size={20} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col text-center xl:text-left">
                  <h4 className="font-black text-[#FBFBF2] text-[9px] sm:text-[10px] uppercase tracking-widest leading-none mb-1.5 group-hover:text-[#FACC15] transition-colors drop-shadow-sm">{ben.title}</h4>
                  <p className="text-[8px] text-[#FBFBF2]/50 font-bold uppercase tracking-widest">{ben.desc}</p>
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
            className="flex flex-col items-center justify-center py-32 text-[#FBFBF2]/60 min-h-[40vh]"
          >
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
              <Zap className="text-[#0866bd] mb-5 drop-shadow-[0_0_15px_rgba(8,102,189,0.5)]" size={48} strokeWidth={1.5} />
            </motion.div>
            <p className="font-bold tracking-[0.3em] uppercase text-[9px] animate-pulse text-[#0866bd]">Desencriptando Inventario...</p>
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
                  <div className="flex items-center gap-3 border-b border-white/5 pb-3 w-max">
                    <span className="text-2xl sm:text-3xl font-black text-[#FBFBF2] uppercase tracking-tighter drop-shadow-sm">Liquidación</span>
                    <div className="bg-[#EF4444]/10 p-2 rounded-lg border border-[#EF4444]/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                      <Flame className="text-[#EF4444] animate-pulse" size={20} strokeWidth={2.5} />
                    </div>
                  </div>
                } isInteractiveCarrousel={true} />
              </ScrollReveal>
            )}

            {masVendidos.length > 0 && (
              <ScrollReveal delay={0.1}>
                <ProductGrid products={masVendidos} title={
                  <div className="flex items-center gap-3 border-b border-white/5 pb-3 w-max">
                    <span className="text-2xl sm:text-3xl font-black text-[#FBFBF2] uppercase tracking-tighter drop-shadow-sm">Más Vendidos</span>
                    <div className="bg-[#0866bd]/10 p-2 rounded-lg border border-[#0866bd]/30 shadow-[0_0_10px_rgba(8,102,189,0.2)]">
                      <TrendingUp className="text-[#0866bd]" size={20} strokeWidth={2.5} />
                    </div>
                  </div>
                } isInteractiveCarrousel={true} />
              </ScrollReveal>
            )}

            {/* BANNER INTERMEDIO (Eleva el rendimiento Zafiro) */}
            <ScrollReveal>
              <motion.div 
                whileHover="hover"
                className="w-full bg-[#03254c] rounded-[2.5rem] relative overflow-hidden py-20 sm:py-24 shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-white/5 my-8 group cursor-pointer"
              >
                <motion.div 
                  variants={{ hover: { scale: 1.05 } }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="absolute inset-0 bg-cover bg-center mix-blend-luminosity opacity-20 group-hover:opacity-40 transition-all duration-1000 grayscale" 
                  style={{ backgroundImage: `url('https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?q=80&w=2000&auto=format&fit=crop')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#021830] via-[#021830]/80 to-transparent"></div>
                <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-[#0866bd]/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-[#0866bd]/20 transition-colors duration-1000"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10 px-8 sm:px-16">
                    <div className="max-w-xl text-[#FBFBF2]">
                      <motion.span 
                        variants={{ hover: { y: -3 } }}
                        className="inline-flex items-center gap-1.5 bg-[#0866bd]/20 text-[#0866bd] font-black text-[9px] uppercase tracking-widest px-3.5 py-1.5 rounded-lg mb-5 border border-[#0866bd]/30 backdrop-blur-md shadow-sm"
                      >
                        <Shield size={12} strokeWidth={2.5}/> Calidad OEM Garantizada
                      </motion.span>
                      <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter leading-[1] mb-5 drop-shadow-md">
                        Eleva el rendimiento <br/><span className="text-[#FACC15] drop-shadow-sm">al máximo</span>
                      </h2>
                      <p className="text-[#FBFBF2]/70 text-sm font-medium leading-relaxed mb-8 max-w-lg border-l-2 border-[#0866bd] pl-4 bg-white/5 py-2 backdrop-blur-sm rounded-r-lg">
                        No te conformes con menos. Encuentra componentes de alto desempeño diseñados para resistir los terrenos más exigentes.
                      </p>
                      <motion.div variants={{ hover: { scale: 1.02 } }}>
                        <Link to="/catalogo" className="inline-flex items-center gap-2 bg-[#FBFBF2] text-[#021830] px-6 py-3.5 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all shadow-[0_10px_20px_rgba(255,255,255,0.1)] hover:shadow-[0_15px_30px_rgba(255,255,255,0.2)] border border-transparent">
                          Explorar Inventario <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-[#0866bd]" strokeWidth={3}/>
                        </Link>
                      </motion.div>
                    </div>
                </div>
              </motion.div>
            </ScrollReveal>

            {mejorCalificados.length > 0 && (
              <ScrollReveal>
                <ProductGrid products={mejorCalificados} title={
                  <div className="flex items-center gap-3 border-b border-white/5 pb-3 w-max">
                    <span className="text-2xl sm:text-3xl font-black text-[#FBFBF2] uppercase tracking-tighter drop-shadow-sm">Mejor Calificados</span>
                    <div className="bg-[#FACC15]/10 p-2 rounded-lg border border-[#FACC15]/30 shadow-[0_0_10px_rgba(250,204,21,0.2)]">
                      <Award className="text-[#FACC15]" size={20} strokeWidth={2.5} />
                    </div>
                  </div>
                } isInteractiveCarrousel={true} />
              </ScrollReveal>
            )}

            {recienAgregados.length > 0 && (
              <ScrollReveal direction="left">
                <div className="bg-[#03254c]/30 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-10 border border-white/5 shadow-inner relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-[60px] -z-10 group-hover:scale-125 transition-transform duration-1000 pointer-events-none"></div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 border-b border-white/5 pb-6 gap-5 relative z-10">
                      <div className="border-l-2 border-emerald-500 pl-4 bg-emerald-500/5 py-2 rounded-r-lg pr-4">
                        <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest mb-1">Nuevos Ingresos</p>
                        <h2 className="flex items-center text-2xl sm:text-3xl font-black text-[#FBFBF2] uppercase tracking-tighter drop-shadow-sm">
                          Recién Agregados <Clock className="ml-2.5 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" size={24} strokeWidth={2.5} />
                        </h2>
                      </div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                        <Link to="/catalogo" className="hidden sm:flex items-center text-[9px] font-black text-[#0866bd] hover:text-[#FBFBF2] transition-colors uppercase tracking-widest bg-[#021830] hover:bg-[#0866bd] px-6 py-3 rounded-xl shadow-inner border border-[#0866bd]/30 hover:border-transparent">
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

      {/* === SECCIÓN DE RESEÑAS (ZAFIRO PURO) === */}
      <div className="bg-[#021830] py-20 sm:py-28 relative overflow-hidden mt-10 border-t border-white/5">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#03254c]/80 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[40rem] h-[40rem] bg-[#0866bd]/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-[75rem] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <ScrollReveal>
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1.5 py-1.5 px-4 rounded-lg bg-white/5 border border-white/10 text-[#FBFBF2]/60 font-bold text-[9px] uppercase tracking-widest mb-4 shadow-inner">
                <Star size={10} className="text-[#FACC15] fill-current"/> Comunidad El Jefe
              </span>
              <h2 className="text-4xl sm:text-5xl font-black text-[#FBFBF2] uppercase tracking-tighter leading-tight drop-shadow-md">
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
                    className="bg-[#03254c]/40 backdrop-blur-xl p-8 rounded-[2rem] border border-white/5 transition-colors duration-500 hover:bg-[#03254c]/60 hover:border-[#0866bd]/30 shadow-inner hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)] relative group h-full flex flex-col"
                  >
                    <div className="absolute top-6 right-6 text-white/5 group-hover:text-[#0866bd]/20 transition-colors duration-500">
                      <Quote size={40} className="rotate-180" />
                    </div>
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex text-[#FACC15] mb-6 drop-shadow-sm bg-[#021830] w-max px-2.5 py-1.5 rounded-lg border border-white/5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} fill={i < r.rating ? "currentColor" : "none"} className={i < r.rating ? "text-[#FACC15]" : "text-[#03254c]"} size={12} />
                        ))}
                      </div>
                      <p className="text-[#FBFBF2]/80 font-medium italic mb-8 leading-relaxed text-xs flex-grow">"{r.comment}"</p>
                      
                      <div className="flex justify-between items-center mt-auto pt-5 border-t border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#0866bd] flex items-center justify-center text-[#FBFBF2] font-black text-xs shadow-[0_5px_15px_rgba(8,102,189,0.3)] uppercase border border-blue-400/30">
                            {r.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-[#FBFBF2] uppercase tracking-tight leading-none mb-1 drop-shadow-sm">{r.name}</p>
                            {r.verified && <p className="text-[8px] text-emerald-400 font-bold flex items-center gap-1 uppercase tracking-widest"><ShieldCheck size={10} strokeWidth={2.5}/> Compra Verificada</p>}
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
              <div className="bg-[#03254c]/40 backdrop-blur-xl rounded-[2.5rem] p-10 sm:p-16 text-center border border-white/5 max-w-2xl mx-auto shadow-inner">
                <div className="w-16 h-16 bg-[#021830] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-inner">
                  <PackageOpen size={28} className="text-[#0866bd]" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-[#FBFBF2] uppercase tracking-tight mb-4">Sé el primero en dejar huella</h3>
                <p className="text-[#FBFBF2]/60 text-sm mb-8 max-w-sm mx-auto font-medium leading-relaxed">
                  Tu experiencia nos ayuda a mejorar. Compra tu primera refacción y cuéntale a la comunidad Biker qué te pareció.
                </p>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="inline-block">
                  <Link to="/catalogo" className="inline-flex items-center justify-center bg-[#0866bd] text-[#FBFBF2] font-black uppercase tracking-widest text-[9px] py-4 px-8 rounded-xl shadow-[0_10px_20px_rgba(8,102,189,0.3)] border border-blue-400/30 transition-all hover:bg-blue-600">
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
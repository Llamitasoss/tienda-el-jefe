import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Wrench, Store, CheckCircle2, MessageCircle, Star, 
  Flame, ArrowRight, Loader2, Sparkles, Zap, Shield, Quote, TrendingUp, Award, Clock
} from 'lucide-react';
import { collection, onSnapshot, collectionGroup } from 'firebase/firestore';
import { db } from '../firebase/config';
import ProductGrid from '../components/products/ProductGrid';

export default function Home() {
  // 1. LOS 4 ESTADOS PARA TUS CATEGORÍAS
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
        
        // --- NUEVA LÓGICA ROBUSTA DE PRECIOS PARA DETECTAR OFERTAS ---
        const precioNormal = Number(data.price || data.Precio || 0);
        const precioPromocion = data.promoPrice || data.precioPromo || null;

        // Si existe un precio de promoción, el "actual" es la promo y el "original" es el normal.
        const precioActual = precioPromocion ? Number(precioPromocion) : precioNormal;
        const precioOriginal = precioPromocion ? precioNormal : Number(data.originalPrice || data.PrecioBase || 0);

        // DETECTOR DE KITS
        const nombreCat = (data.subCat || data.cat || data.Categoria || "Refacción").toLowerCase();
        const nombreProd = (data.name || data.Nombre || "").toLowerCase();
        const isKit = nombreCat.includes('kit') || nombreProd.includes('kit');

        allProds.push({ 
          id: doc.id, 
          sku: data.sku || data.Codigo || doc.id.slice(0,8).toUpperCase(),
          name: data.name || data.Nombre,
          category: data.subCat || data.cat || data.Categoria || "Refacción",
          price: precioActual, // El precio que paga el cliente hoy
          originalPrice: precioOriginal > precioActual ? precioOriginal : null, // Solo si es mayor, hay oferta
          img: data.images?.[0] || data.ImagenURL || `https://placehold.co/400x400/f8fafc/0866BD?text=${encodeURIComponent(data.name || data.Nombre || 'Pieza')}`,
          createdAt: data.createdAt || new Date().toISOString(),
          stock: data.stock || 125,
          isKit: isKit,
          ventas: data.ventas || Math.floor(Math.random() * 100), 
          rating: data.rating || data.calificacion || (Math.random() * 2 + 3) 
        });
      });

      // --- FILTROS Y ORDENAMIENTO (DANDO PRIORIDAD A LOS KITS) ---

      // 1. OFERTAS: Que tengan precio original mayor al actual
      const itemsOferta = allProds
        .filter(p => p.originalPrice && p.originalPrice > p.price)
        .map(p => ({ ...p, isHot: true }))
        .sort((a, b) => (b.isKit === a.isKit ? 0 : b.isKit ? 1 : -1)) // Kits primero
        .slice(0, 10);

      // 2. MÁS VENDIDOS: Por número de ventas (Kits primero)
      const itemsMasVendidos = [...allProds]
        .sort((a, b) => {
          if (a.isKit && !b.isKit) return -1;
          if (!a.isKit && b.isKit) return 1;
          return b.ventas - a.ventas;
        })
        .slice(0, 10);

      // 3. MEJOR CALIFICADOS: Por rating (Kits primero)
      const itemsMejorCalificados = [...allProds]
        .sort((a, b) => {
          if (a.isKit && !b.isKit) return -1;
          if (!a.isKit && b.isKit) return 1;
          return b.rating - a.rating;
        })
        .slice(0, 10);

      // 4. RECIÉN AGREGADOS: Por fecha de creación (Kits primero)
      const itemsRecientes = [...allProds]
        .sort((a, b) => {
          if (a.isKit && !b.isKit) return -1;
          if (!a.isKit && b.isKit) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        })
        .slice(0, 10);

      setOfertas(itemsOferta);
      setMasVendidos(itemsMasVendidos);
      setMejorCalificados(itemsMejorCalificados);
      setRecienAgregados(itemsRecientes);
      setLoading(false);
    });

    const unsubResenas = onSnapshot(collectionGroup(db, 'reseñas'), (snapshot) => {
      let revs = [];
      snapshot.forEach(doc => {
        revs.push({ id: doc.id, ...doc.data() });
      });
      revs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setResenas(revs.slice(0, 3));
    });

    return () => {
      unsubProductos();
      unsubResenas();
    };
  }, []);

  const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };

  return (
    <div className="flex flex-col bg-slate-50 font-sans overflow-x-hidden">
      
      {/* HERO SECTION INTACTO */}
      <div className="relative bg-[#0f172a] min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-luminosity animate-[pulse_10s_ease-in-out_infinite] scale-105" 
             style={{ backgroundImage: `url('https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=2000&auto=format&fit=crop')` }}></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a] via-[#0f172a]/90 to-transparent"></div>
        <div className="absolute -top-40 -right-40 w-[30rem] h-[30rem] bg-[#0866bd] rounded-full blur-[150px] opacity-40 animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-yellow-500 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>

        <div className="max-w-[90rem] mx-auto px-4 sm:px-8 w-full relative z-10 pt-24 pb-36">
          <div className="max-w-3xl animate-fade-in-up">
            <div className="inline-flex items-center gap-3 bg-slate-800/80 border border-slate-700/50 text-yellow-400 font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] px-6 py-2.5 rounded-full mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(250,204,21,0.15)]">
              <Zap size={14} className="fill-current animate-pulse" /> Distribuidor Especializado
            </div>
            
            <h1 className="text-5xl sm:text-7xl lg:text-[6rem] font-black text-white uppercase tracking-tighter leading-[0.95] mb-6 drop-shadow-2xl">
              El motor de tu <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0866bd] to-blue-400 drop-shadow-none">Pasión</span>
            </h1>
            
            <p className="text-slate-300 text-lg sm:text-xl font-medium leading-relaxed mb-12 max-w-xl border-l-4 border-yellow-400 pl-6 bg-gradient-to-r from-slate-900/50 to-transparent py-2">
              Exelentes Precios, calidad OEM y disponibilidad inmediata.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5">
              <Link to="/catalogo" className="bg-[#0866bd] hover:bg-[#064e93] text-white font-black uppercase tracking-widest text-sm py-5 px-10 rounded-2xl shadow-[0_10px_40px_-10px_rgba(8,102,189,0.8)] flex items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_50px_-10px_rgba(8,102,189,0.9)] group">
                <Wrench className="mr-3 group-hover:rotate-45 transition-transform duration-300" size={20}/> Buscar Piezas
              </Link>
              <Link to="/talleres" className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-black uppercase tracking-widest text-sm py-5 px-10 rounded-2xl flex items-center justify-center transition-all duration-300 hover:-translate-y-1 group">
                TALLERES VIP <Sparkles className="ml-3 text-yellow-400 group-hover:scale-110 transition-transform" size={20}/>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE BENEFICIOS INTACTA */}
      <div className="relative z-20 max-w-[85rem] mx-auto px-4 sm:px-6 w-full -mt-16 sm:-mt-24 mb-16">
        <div className="bg-white rounded-2xl sm:rounded-[2rem] shadow-2xl shadow-slate-900/10 border border-slate-100 overflow-hidden backdrop-blur-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {[
              { icon: Store, title: 'Recolección', desc: 'Sucursal Tonalá' },
              { icon: Shield, title: 'Garantía Exacta', desc: 'Devolución sin costo' },
              { icon: CheckCircle2, title: 'Pago Seguro', desc: 'Efectivo o Tarjeta' },
              { icon: MessageCircle, title: 'Soporte', desc: 'Asesoría por WhatsApp' }
            ].map((ben, i) => (
              <div key={i} className="flex items-center gap-3 sm:gap-4 p-5 lg:p-6 hover:bg-slate-50 transition-colors duration-300 group justify-start sm:justify-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:bg-[#0866bd] transition-all duration-300">
                  <ben.icon className="text-[#0866bd] group-hover:text-white transition-colors" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-slate-800 text-[11px] sm:text-xs uppercase tracking-widest truncate">{ben.title}</h4>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold mt-0.5 uppercase tracking-wider truncate">{ben.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
          <div className="relative">
            <Loader2 className="animate-spin mb-6" size={60} />
            <div className="absolute inset-0 animate-ping rounded-full border-4 border-blue-100"></div>
          </div>
          <p className="font-black tracking-[0.3em] uppercase text-sm">Sincronizando Almacén...</p>
        </div>
      ) : (
        <>
          {/* 1. SECCIÓN: OFERTAS */}
          {ofertas.length > 0 && (
            <div className="max-w-[90rem] mx-auto px-4 sm:px-8 w-full mb-20 animate-fade-in-up">
              <ProductGrid 
                products={ofertas} 
                title={<span className="flex items-center text-3xl sm:text-4xl font-black text-[#0f172a] uppercase tracking-tight">Liquidación <Flame className="ml-3 text-red-500 animate-pulse" size={36} /></span>} 
                isInteractiveCarrousel={true}
              />
            </div>
          )}

          {/* 2. SECCIÓN: MÁS VENDIDOS */}
          {masVendidos.length > 0 && (
            <div className="max-w-[90rem] mx-auto px-4 sm:px-8 w-full mb-20 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <ProductGrid 
                products={masVendidos} 
                title={<span className="flex items-center text-3xl sm:text-4xl font-black text-[#0f172a] uppercase tracking-tight">Más Vendidos <TrendingUp className="ml-3 text-[#0866bd]" size={36} /></span>} 
                isInteractiveCarrousel={true}
              />
            </div>
          )}

          {/* BANNER PROMOCIONAL INTERMEDIO */}
          <div className="w-full bg-[#0866bd] relative overflow-hidden mb-20 py-20 sm:py-28">
             <div className="absolute inset-0 bg-cover bg-center mix-blend-multiply opacity-40 animate-[pulse_8s_ease-in-out_infinite]" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?q=80&w=2000&auto=format&fit=crop')` }}></div>
             <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-[#0f172a]/80 to-transparent"></div>
             
             <div className="max-w-[90rem] mx-auto px-4 sm:px-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="max-w-2xl text-white">
                  <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter leading-[1] mb-6">Eleva el rendimiento <br/><span className="text-yellow-400">al máximo</span></h2>
                  <p className="text-blue-100 text-lg font-medium leading-relaxed mb-8">No te conformes con menos. Encuentra componentes OEM y piezas de alto desempeño diseñadas para resistir los terrenos más exigentes.</p>
                  <Link to="/catalogo" className="inline-flex items-center gap-3 bg-white text-[#0866bd] px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-transform shadow-2xl">
                    Explorar Refacciones <ArrowRight size={18}/>
                  </Link>
                </div>
             </div>
          </div>

          {/* 3. SECCIÓN: MEJOR CALIFICADOS */}
          {mejorCalificados.length > 0 && (
            <div className="max-w-[90rem] mx-auto px-4 sm:px-8 w-full mb-20 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <ProductGrid 
                products={mejorCalificados} 
                title={<span className="flex items-center text-3xl sm:text-4xl font-black text-[#0f172a] uppercase tracking-tight">Mejor Calificados <Award className="ml-3 text-yellow-500" size={36} /></span>} 
                isInteractiveCarrousel={true}
              />
            </div>
          )}

          {/* 4. SECCIÓN: RECIÉN AGREGADOS */}
          {recienAgregados.length > 0 && (
            <div className="max-w-[90rem] mx-auto px-4 sm:px-8 w-full mb-28 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
               <div className="flex items-end justify-between mb-10 border-b-2 border-slate-200/60 pb-6">
                  <div className="border-l-4 border-yellow-400 pl-5">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mb-1">Nuevos Ingresos</p>
                    <h2 className="flex items-center text-3xl sm:text-4xl font-black text-[#0f172a] uppercase tracking-tight">
                      Recién Agregados <Clock className="ml-3 text-emerald-500" size={32} />
                    </h2>
                  </div>
                  <Link to="/catalogo" className="hidden sm:flex items-center text-sm font-bold text-[#0866bd] hover:text-blue-800 transition-colors uppercase tracking-widest bg-blue-50 px-6 py-3 rounded-xl">
                    Ver Catálogo Completo <ArrowRight size={16} className="ml-2"/>
                  </Link>
               </div>

               <ProductGrid products={recienAgregados} isInteractiveCarrousel={true} />
               
               <div className="sm:hidden mt-8 text-center">
                  <Link to="/catalogo" className="inline-flex items-center justify-center bg-white border-2 border-slate-200 text-slate-700 font-black uppercase tracking-widest text-xs py-4 px-8 rounded-xl w-full hover:bg-slate-50 transition-colors">
                    Ver Catálogo Completo
                  </Link>
               </div>
            </div>
          )}
        </>
      )}

      {/* RESEÑAS INTACTAS */}
      <div className="bg-slate-100 py-24 border-t border-slate-200 relative overflow-hidden">
        <div className="absolute -left-40 top-10 w-96 h-96 bg-blue-200/40 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-[90rem] mx-auto px-4 sm:px-8 relative z-10">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-2 py-2 px-6 rounded-full bg-white text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mb-6 shadow-sm">
              <Star size={14} className="text-yellow-400 fill-current"/> Comunidad El Jefe
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 uppercase tracking-tighter leading-[1.1]">
              La confianza de los <br/><span className="text-[#0866bd]">verdaderos Bikers</span>
            </h2>
          </div>
          
          {resenas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 animate-fade-in-up">
              {resenas.map((r, idx) => (
                <div key={r.id} className={`bg-white p-8 sm:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative [animation-delay:${idx*150}ms]`}>
                  <div className="absolute top-8 right-8 text-slate-100 group-hover:text-blue-50 transition-colors duration-500">
                    <Quote size={64} className="opacity-50 rotate-180" />
                  </div>
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex text-yellow-400 mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} fill={i < r.rating ? "currentColor" : "none"} className={i < r.rating ? "text-yellow-400" : "text-slate-200"} size={22} />
                      ))}
                    </div>
                    <p className="text-slate-600 font-medium italic mb-8 leading-relaxed text-sm sm:text-base flex-grow">"{r.comment}"</p>
                    <div className="flex justify-between items-end mt-auto pt-6 border-t border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0866bd] to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md group-hover:scale-110 transition-transform">
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 uppercase tracking-widest">{r.name}</p>
                          {r.verified && <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 mt-0.5"><ShieldCheck size={12}/> Cliente Verificado</p>}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold hidden sm:block">{new Date(r.createdAt).toLocaleDateString('es-MX', dateOptions)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[3rem] p-12 sm:p-20 text-center shadow-xl border border-slate-100 max-w-4xl mx-auto animate-fade-in-up relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-[#0866bd] to-yellow-400"></div>
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <MessageCircle size={48} className="text-slate-300" />
              </div>
              <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-4">Sé el primero en dejar huella</h3>
              <p className="text-slate-500 text-lg mb-10 max-w-lg mx-auto">
                Tu experiencia nos ayuda a mejorar. Compra tu primera refacción, pruébala en el asfalto y cuéntale a la comunidad qué te pareció.
              </p>
              <Link to="/catalogo" className="inline-flex items-center justify-center bg-[#0866bd] hover:bg-[#064e93] text-white font-black uppercase tracking-widest text-sm py-5 px-10 rounded-2xl shadow-lg hover:-translate-y-1 transition-all">
                Ir de Compras <ArrowRight size={18} className="ml-3"/>
              </Link>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
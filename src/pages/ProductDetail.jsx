import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, limit, query, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { motion, AnimatePresence, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion';
import { 
  ShieldCheck, Loader2, AlertCircle, Check, Star, StarHalf, Shield, Share2, Store, X, Search, CheckCircle, UserCircle2, Send, Zap, ShoppingCart, MessageCircle, ChevronRight, Package, ZoomIn,
  ScanSearch, RefreshCcw, MapPin, Flame, Activity
} from 'lucide-react';
import { CartContext } from '../context/CartContext';
import ProductGrid from '../components/products/ProductGrid';

const NAV_TABS = [
  { id: 'desc', label: 'Ingeniería', icon: Package },
  { id: 'compatibility', label: 'Compatibilidad', icon: Shield },
  { id: 'reviews', label: 'Comunidad', icon: MessageCircle }
];

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[300] px-6 py-4 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex items-center gap-3 backdrop-blur-xl border ${
        type === 'success' ? 'bg-emerald-500/90 border-emerald-300 text-white' : 'bg-red-500/90 border-red-300 text-white'
      }`}
    >
      {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
      <span className="text-xs font-black uppercase tracking-widest">{message}</span>
    </motion.div>
  );
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  
  const buySectionRef = useRef(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('desc');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const [tabSearchTerm, setTabSearchTerm] = useState('');
  
  // === LUPA OPTIMIZADA A 60FPS (SIN CRASHES) ===
  const [isZooming, setIsZooming] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false); 
  const imageContainerRef = useRef(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const bgX = useMotionValue(50); 
  const bgY = useMotionValue(50); 
  
  // ¡AQUÍ ESTABA EL ERROR #310! El Hook DEBE estar siempre en el nivel superior.
  const bgPositionTemplate = useMotionTemplate`${bgX}% ${bgY}%`;
  
  const springConfig = { damping: 30, stiffness: 400, mass: 0.1 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e) => {
    if (!imageContainerRef.current || isScannerActive) return; 
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    
    const x = e.clientX - left;
    const y = e.clientY - top;
    
    mouseX.set(x);
    mouseY.set(y);
    
    const xPercent = Math.max(0, Math.min(100, (x / width) * 100));
    const yPercent = Math.max(0, Math.min(100, (y / height) * 100));

    bgX.set(xPercent);
    bgY.set(yPercent);
  };

  const handleMouseEnter = () => { if(!isScannerActive) setIsZooming(true); };
  const handleMouseLeave = () => {
    setIsZooming(false);
    bgX.set(50);
    bgY.set(50);
  };
  // ====================================================

  const [addedAnimation, setAddedAnimation] = useState(false);
  const [shareText, setShareText] = useState('Compartir');

  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', rating: 5, comment: '' });
  
  const [toast, setToast] = useState(null);

  const dateOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  const formatMXN = (amount) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);

  useEffect(() => {
    const handleScroll = () => {
      if (buySectionRef.current) {
        const { bottom } = buySectionRef.current.getBoundingClientRect();
        setShowStickyBar(bottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchProductAndReviews = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "productos", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const productImages = data.images?.length > 0 ? data.images : [data.ImagenURL || data.image || "https://placehold.co/600x600/f8fafc/0866BD?text=Sin+Foto"];

          setProduct({
            id: docSnap.id,
            sku: data.sku || data.Codigo || data.id || docSnap.id.slice(0, 8).toUpperCase(),
            name: data.name || data.Nombre,
            category: data.subCat || data.cat || data.Categoria || "Refacción",
            price: data.promoPrice || data.price || data.Precio || 0,
            originalPrice: data.promoPrice ? data.price : (data.PrecioBase || null),
            images: productImages,
            features: data.caracteristicas || (data.Descripcion ? [data.Descripcion] : ["Pieza de alta calidad garantizada por El Jefe."]),
            compatibility: data.compatibilidad || [],
            stock: parseInt(data.stock) || 0,
            isUniversal: data.isUniversal || false
          });
        } else {
          setProduct({
            id: id, sku: "ERROR", name: "Refacción no encontrada", category: "General", price: 0,
            images: ["https://placehold.co/600x600/f8fafc/0866BD?text=Error"],
            features: ["El producto ya no existe."], compatibility: [], stock: 0, isUniversal: false
          });
        }

        try {
          const reviewsRef = collection(db, `productos/${id}/reseñas`);
          const reviewsSnap = await getDocs(reviewsRef);
          let fetchedReviews = [];
          let totalStars = 0;
          reviewsSnap.forEach(r => {
            const rData = r.data();
            fetchedReviews.push({ id: r.id, ...rData });
            totalStars += rData.rating;
          });
          fetchedReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setReviews(fetchedReviews);
          setAverageRating(fetchedReviews.length > 0 ? totalStars / fetchedReviews.length : 0);
        } catch (e) {
          console.warn("Permisos de reseñas insuficientes, omitiendo reseñas", e);
        }

        const relSnap = await getDocs(query(collection(db, "productos"), limit(4)));
        let relProds = [];
        relSnap.forEach(d => {
          if (d.id !== id) {
            const relData = d.data();
            relProds.push({ 
              id: d.id, name: relData.name || relData.Nombre, price: relData.promoPrice || relData.price || relData.Precio, 
              img: relData.images?.[0] || "https://placehold.co/300x300/f8fafc/0866BD", category: relData.subCat || relData.cat || relData.Categoria 
            });
          }
        });
        setRelatedProducts(relProds.slice(0, 4));

      } catch (error) { console.error("Error cargando datos:", error); }
      setLoading(false);
    };
    fetchProductAndReviews();
    window.scrollTo(0, 0);
  }, [id]);

  const handleAdd = () => {
    if (!product || product.stock === 0) return;
    addToCart(product, qty);
    setQty(1);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);
  };

  const handleShare = async () => {
    try {
      if (navigator.share && /mobile|android|iphone/i.test(navigator.userAgent)) {
        await navigator.share({ title: product?.name, text: `Mira esta refacción: ${product?.name}`, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShareText('¡Copiado!');
        setTimeout(() => setShareText('Compartir'), 2000);
      }
    } catch (err) { console.error('Error al compartir:', err); }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if(!newReview.name || !newReview.comment) return;
    setIsSubmittingReview(true);
    try {
      const reviewData = { name: newReview.name, rating: newReview.rating, comment: newReview.comment, createdAt: new Date().toISOString(), verified: true };
      const docRef = await addDoc(collection(db, `productos/${id}/reseñas`), reviewData);
      const updatedReviews = [{ id: docRef.id, ...reviewData }, ...reviews];
      setReviews(updatedReviews);
      setAverageRating(updatedReviews.reduce((acc, curr) => acc + curr.rating, 0) / updatedReviews.length);
      setShowReviewForm(false);
      setNewReview({ name: '', rating: 5, comment: '' });
      setToast({ message: "¡Reseña publicada con éxito!", type: 'success' });
    } catch (error) { 
      setToast({ message: "Error al publicar. Revisa tu conexión.", type: 'error' });
    }
    setIsSubmittingReview(false);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) stars.push(<Star key={i} size={16} fill="currentColor" className="text-[#ffc107] drop-shadow-[0_0_3px_rgba(255,193,7,0.6)]" />);
      else if (i - 0.5 <= rating) stars.push(<StarHalf key={i} size={16} fill="currentColor" className="text-[#ffc107] drop-shadow-[0_0_3px_rgba(255,193,7,0.6)]" />);
      else stars.push(<Star key={i} size={16} className="text-slate-200" />);
    }
    return stars;
  };

  const tabFilteredCompatibility = product?.compatibility.filter(c => {
    const searchString = typeof c === 'object' ? `${c.marca} ${c.modelo} ${c.cilindraje}`.toLowerCase() : c.toLowerCase();
    return searchString.includes(tabSearchTerm.toLowerCase());
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-400 bg-[#f8fafc]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Loader2 className="mb-6 text-[#0866bd]" size={48} />
        </motion.div>
        <p className="font-black tracking-[0.3em] uppercase text-[10px] animate-pulse text-slate-400">Sincronizando Inventario...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-400 bg-[#f8fafc]">
        <AlertCircle size={64} className="text-red-400 mb-6 drop-shadow-md" />
        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-4">Pieza no encontrada</h2>
        <button onClick={() => navigate('/catalogo')} className="bg-slate-900 text-white uppercase font-black text-xs tracking-widest px-8 py-4 rounded-full hover:bg-[#0866bd] transition-colors shadow-lg">Volver al catálogo</button>
      </div>
    );
  }

  const cleanName = product.isUniversal ? product.name.replace(/universal/gi, '').trim() : product.name;

  return (
    <div className="bg-[#f4f7f9] min-h-screen selection:bg-[#0866bd] selection:text-white pb-20 relative">
      
      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* STICKY ACTION BAR TOP-TIER */}
      <AnimatePresence>
        {showStickyBar && product.stock > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] sm:w-auto min-w-[350px] bg-slate-900/90 backdrop-blur-2xl border border-slate-700 p-3 pl-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-between gap-6"
          >
            <div className="flex flex-col hidden sm:flex">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{product.sku}</span>
              <span className="text-sm font-black text-white truncate max-w-[200px]">{cleanName}</span>
            </div>
            <div className="flex items-center gap-5 w-full sm:w-auto">
              <span className="text-xl font-black text-yellow-400 drop-shadow-sm">{formatMXN(product.price)}</span>
              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleAdd}
                className="flex-1 sm:flex-none bg-white text-[#0866bd] font-black uppercase tracking-[0.1em] rounded-2xl px-6 py-3 shadow-[0_5px_15px_rgba(255,255,255,0.2)] text-[10px] flex items-center justify-center gap-2 group hover:bg-yellow-400 hover:text-slate-900 transition-colors"
              >
                <ShoppingCart size={16} className="group-hover:animate-bounce" /> Añadir
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BACKGROUND FUTURISTA (Blueprint Grid) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(8,102,189,0.03)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(8,102,189,0.03)_1.5px,transparent_1.5px)] bg-[size:40px_40px] pointer-events-none"></div>

      {/* === ESTRUCTURA SPLIT-SCREEN PREMIUM === */}
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 relative z-10">
        
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 sm:mb-12 border-b border-slate-200/60 pb-4">
          <Link to="/" className="hover:text-[#0866bd] transition-colors">Inicio</Link> <ChevronRight size={12} />
          <Link to="/catalogo" className="hover:text-[#0866bd] transition-colors">Catálogo</Link> <ChevronRight size={12} />
          <span className="text-[#0866bd] truncate max-w-[150px] sm:max-w-none">{product.category}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          {/* === COLUMNA IZQUIERDA: GALERÍA STICKY & ESCÁNER === */}
          <div className="w-full lg:w-[55%] flex flex-col gap-6 relative lg:sticky lg:top-32 h-fit">
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, type: "spring" }}
              ref={imageContainerRef} onMouseMove={handleMouseMove} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
              className={`bg-white rounded-[2.5rem] flex items-center justify-center border border-slate-100 shadow-[0_30px_60px_rgba(0,0,0,0.04)] relative overflow-hidden group flex-1 min-h-[400px] lg:min-h-[600px] w-full aspect-square lg:aspect-auto ${isScannerActive ? 'cursor-default' : 'cursor-none'}`}
            >
               {/* Resplandor ambiental de la imagen */}
               <div className="absolute inset-0 bg-gradient-to-tr from-slate-50 to-blue-50/30 opacity-50"></div>

               <motion.img 
                 key={`normal-${currentImageIndex}`} src={product.images[currentImageIndex]} alt={cleanName} 
                 className={`relative z-10 w-auto h-auto max-w-[85%] max-h-[85%] mix-blend-multiply transition-all duration-300 ease-out object-contain drop-shadow-2xl ${isZooming && !isScannerActive ? 'opacity-0' : 'opacity-100 group-hover:scale-105'}`} 
                 onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/600x600/f8fafc/0866BD?text=${encodeURIComponent(product.category)}`; }}
               />
               
               {/* === LUPA FLOTANTE (ARREGLADA Y FLUIDA) === */}
               {isZooming && !isScannerActive && (
                 <motion.div
                   className="pointer-events-none absolute z-20 rounded-full border border-white/60 shadow-[0_20px_40px_rgba(0,0,0,0.15),inset_0_0_30px_rgba(8,102,189,0.1)] overflow-hidden bg-white/20 backdrop-blur-md"
                   style={{ x: smoothMouseX, y: smoothMouseY, translateX: "-50%", translateY: "-50%", width: 280, height: 280 }}
                 >
                   <motion.div 
                     className="w-full h-full"
                     style={{
                       backgroundImage: `url(${product.images[currentImageIndex]})`,
                       backgroundPosition: bgPositionTemplate, 
                       backgroundSize: '200%', 
                       backgroundRepeat: 'no-repeat',
                     }}
                   />
                   <div className="absolute inset-0 flex items-center justify-center opacity-20 mix-blend-overlay">
                     <div className="w-full h-[1px] bg-slate-900"></div><div className="absolute h-full w-[1px] bg-slate-900"></div>
                   </div>
                 </motion.div>
               )}

               {/* === HOLO-SCANNER FUTURISTA === */}
               <AnimatePresence>
                 {isScannerActive && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 bg-[#0866bd]/10 backdrop-blur-[2px] mix-blend-multiply pointer-events-none">
                     <div className="absolute inset-0 bg-[linear-gradient(rgba(8,102,189,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(8,102,189,0.4)_1px,transparent_1px)] bg-[size:30px_30px] opacity-40"></div>
                     <motion.div 
                       animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                       className="absolute left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,1)]"
                     >
                        <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-transparent to-cyan-400/30 -translate-y-full"></div>
                     </motion.div>
                     <div className="absolute top-6 left-6 text-cyan-400 font-mono text-[10px] uppercase tracking-widest flex flex-col gap-1.5 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]">
                       <span className="flex items-center gap-2"><Activity size={12} className="animate-pulse"/> SYS: ONLINE</span>
                       <span>SKU: {product.sku}</span>
                       <span>TGT: EL_JEFE_PART</span>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>

               <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-40">
                 <button 
                   onClick={() => setIsScannerActive(!isScannerActive)}
                   className={`p-3.5 rounded-2xl backdrop-blur-xl transition-all duration-300 shadow-lg border ${isScannerActive ? 'bg-[#0866bd] text-white border-blue-400' : 'bg-white/80 text-slate-500 border-white hover:text-[#0866bd] hover:bg-white'}`}
                   title="Modo Escáner"
                 >
                   <ScanSearch size={22} className={isScannerActive ? 'animate-pulse' : ''}/>
                 </button>
               </div>
               
               {product.isUniversal && (
                 <div className="absolute top-6 right-6 sm:left-6 sm:right-auto bg-slate-900 text-yellow-400 text-[10px] font-black px-5 py-2.5 rounded-xl uppercase tracking-[0.2em] shadow-xl flex items-center gap-2 z-30 border border-slate-700">
                   <Zap size={14} className="fill-current animate-pulse" /> Plug & Play
                 </div>
               )}
            </motion.div>

            {/* Miniaturas Premium */}
            {product.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2 px-1">
                {product.images.map((img, idx) => (
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} key={idx} onClick={() => setCurrentImageIndex(idx)}
                    className={`w-20 h-20 rounded-2xl border flex-shrink-0 overflow-hidden transition-all duration-300 p-2 bg-white relative ${currentImageIndex === idx ? 'border-[#0866bd] shadow-[0_10px_20px_rgba(8,102,189,0.15)] ring-2 ring-[#0866bd]/20' : 'border-slate-200 opacity-60 hover:opacity-100 hover:shadow-md'}`}
                  >
                    <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-contain mix-blend-multiply"/>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* === COLUMNA DERECHA: INFO Y COMPRA === */}
          <div className="w-full lg:w-[45%] flex flex-col h-fit relative">
            
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              
              {/* Título y Badges */}
              <h1 className="text-4xl lg:text-[3.2rem] font-black text-slate-900 uppercase tracking-tighter mb-4 leading-[1.05] drop-shadow-sm">
                {cleanName}
              </h1>

              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-1.5 bg-yellow-100 text-yellow-700 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest border border-yellow-200">
                  <Star size={14} className="fill-current" /> {averageRating > 0 ? averageRating.toFixed(1) : 'Nuevo'}
                </div>
                <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">Refacción OEM</span>
                <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">SKU: {product.sku}</span>
              </div>
              
              {/* === NUEVO: MÓDULO FOMO FUTURISTA === */}
              <AnimatePresence mode="wait">
                {product.stock > 0 && product.stock <= 10 && (
                   <motion.div 
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      className={`w-full mb-8 p-4 rounded-2xl flex items-center gap-4 relative overflow-hidden border shadow-sm ${product.stock <= 3 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}
                   >
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${product.stock <= 3 ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`}></div>
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-white/50">
                         {product.stock <= 3 ? <Flame className="text-red-500" size={20} /> : <Clock className="text-amber-500" size={20} />}
                      </div>
                      <div>
                         <p className={`font-black text-[10px] uppercase tracking-widest ${product.stock <= 3 ? 'text-red-600' : 'text-amber-600'}`}>
                           {product.stock <= 3 ? '¡ALERTA DE ALTA DEMANDA!' : 'INVENTARIO LIMITADO'}
                         </p>
                         <p className={`text-xs font-bold mt-0.5 ${product.stock <= 3 ? 'text-red-500' : 'text-amber-600/80'}`}>
                            Quedan exactamente <span className={`font-black text-sm px-1 ${product.stock <= 3 ? 'text-red-600' : 'text-amber-600'}`}>{product.stock}</span> piezas en mostrador.
                         </p>
                      </div>
                   </motion.div>
                )}
              </AnimatePresence>

              {/* Tarjeta de Compra (Glassmorphism Fuerte) */}
              <div ref={buySectionRef} className="mb-8 flex flex-col bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.03)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-slate-50 to-transparent opacity-60 pointer-events-none transform skew-x-12 translate-x-10"></div>
                
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={addedAnimation ? 'added' : 'price'}
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                    className="flex flex-col items-baseline gap-2 mb-8 relative z-10 w-full"
                  >
                    {addedAnimation ? (
                      <div className="flex items-center gap-3 bg-emerald-50 text-emerald-600 px-6 py-5 rounded-2xl border border-emerald-100 shadow-sm w-full">
                         <CheckCircle size={24} />
                         <span className="text-sm font-black uppercase tracking-widest mt-0.5">¡Asegurado en tu carrito!</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-4">
                         <span className="text-[3.5rem] font-black text-slate-900 tracking-tighter drop-shadow-sm leading-none">
                           {formatMXN(product.price)}
                         </span>
                         {product.originalPrice && (
                           <span className="text-xl text-slate-400 line-through font-bold tracking-tight decoration-red-400/50 decoration-2">
                             {formatMXN(product.originalPrice)}
                           </span>
                         )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full relative z-10">
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl h-16 sm:w-36 overflow-hidden focus-within:border-[#0866bd] transition-all shadow-inner shrink-0">
                     <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={product.stock === 0} className="w-12 h-full text-slate-500 hover:bg-white hover:text-[#0866bd] transition-colors text-xl font-bold disabled:opacity-50">-</button>
                     <span className="flex-1 text-center font-black text-slate-900 text-lg bg-white h-full flex items-center justify-center border-x border-slate-200 shadow-sm">{qty}</span>
                     <button onClick={() => setQty(Math.min(product.stock, qty + 1))} disabled={product.stock === 0} className="w-12 h-full text-slate-500 hover:bg-white hover:text-[#0866bd] transition-colors text-xl font-bold disabled:opacity-50">+</button>
                  </div>
                  
                  <motion.button 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} onClick={handleAdd} disabled={product.stock === 0}
                    className="relative flex-1 overflow-hidden bg-[#0866bd] text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_15px_30px_rgba(8,102,189,0.3)] hover:shadow-[0_20px_40px_rgba(8,102,189,0.4)] hover:bg-blue-700 transition-all duration-500 text-xs flex items-center justify-center h-16 group disabled:opacity-50 disabled:grayscale"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] group-hover:bg-[position:200%_0,0_0] transition-[background-position] duration-[1.5s]"></div>
                    <span className="relative z-10 flex items-center gap-3">
                      {product.stock === 0 ? 'AGOTADO' : <><ShoppingCart size={20} className="group-hover:animate-bounce" /> Añadir a mi orden</>}
                    </span>
                  </motion.button>
                </div>
              </div>

              {/* Logística Mostrador */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                 <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-start gap-4 shadow-sm hover:border-[#0866bd]/50 transition-colors">
                   <div className="bg-blue-50 text-[#0866bd] p-2.5 rounded-xl shrink-0"><Store size={20}/></div>
                   <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Logística</p>
                     <p className="text-sm font-bold text-slate-800">Recolección Local</p>
                     <p className="text-[10px] text-slate-500 mt-1 font-medium">Sucursal Tonalá, Jal.</p>
                   </div>
                 </div>

                 <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-start gap-4 shadow-sm hover:border-emerald-200 transition-colors">
                   <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl shrink-0"><RefreshCcw size={20}/></div>
                   <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Garantía</p>
                     <p className="text-sm font-bold text-slate-800">100% Compatibilidad</p>
                     <p className="text-[10px] text-slate-500 mt-1 font-medium">Cambios sin costo</p>
                   </div>
                 </div>
              </div>

            </motion.div>
          </div>
        </div>
      </div>

      {/* === NAVEGACIÓN DE PESTAÑAS (Estilo SaaS Premium) === */}
      <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-20 relative z-10">
        
        <div className="flex border-b border-slate-200 mb-10 overflow-x-auto custom-scrollbar">
          {NAV_TABS.map(tab => (
            <button 
              key={tab.id} onClick={() => setActiveTab(tab.id)} 
              className={`relative pb-5 px-6 sm:px-10 text-[11px] sm:text-xs font-black uppercase tracking-[0.2em] transition-colors duration-300 flex items-center gap-3 whitespace-nowrap ${activeTab === tab.id ? 'text-[#0866bd]' : 'text-slate-400 hover:text-slate-800'}`}
            >
              <tab.icon size={18} strokeWidth={2.5} className={activeTab === tab.id ? 'opacity-100' : 'opacity-50'} />
              <span>{tab.label}</span>
              {tab.id === 'reviews' && (
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black transition-colors duration-300 ${activeTab === 'reviews' ? 'bg-[#0866bd] text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {reviews.length}
                </span>
              )}
              {activeTab === tab.id && (
                <motion.div layoutId="active-tab-line" className="absolute bottom-0 left-0 right-0 h-1 bg-[#0866bd] rounded-t-full shadow-[0_-2px_10px_rgba(8,102,189,0.5)]" transition={{ type: "spring", stiffness: 500, damping: 30 }} />
              )}
            </button>
          ))}
        </div>
        
        <div className="min-h-[300px]">
           <AnimatePresence mode="wait">
             <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
               
               {/* TAB 1: CARACTERÍSTICAS */}
               {activeTab === 'desc' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
                   {product.features.map((feat, idx) => (
                      <motion.div 
                        key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-5 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group"
                      >
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                          <Check size={18} className="text-[#0866bd]"/>
                        </div>
                        <p className="text-slate-600 text-sm font-bold leading-relaxed mt-1 group-hover:text-slate-900 transition-colors">{feat}</p>
                      </motion.div>
                   ))}
                 </div>
               )}

               {/* TAB 2: COMPATIBILIDAD */}
               {activeTab === 'compatibility' && (
                 <div className="max-w-4xl">
                    {product.isUniversal ? (
                      <div className="p-10 bg-slate-900 text-white rounded-[2rem] flex flex-col sm:flex-row items-center gap-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] pointer-events-none"></div>
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/30 relative z-10"><Zap size={40} className="animate-pulse" /></div>
                        <div className="text-center sm:text-left relative z-10">
                          <h4 className="text-2xl font-black uppercase tracking-tight mb-2 text-emerald-400">Instalación Universal</h4>
                          <p className="text-sm text-slate-300 font-medium leading-relaxed max-w-xl">
                            Esta pieza está diseñada para adaptarse a la gran mayoría de motocicletas sin necesidad de modificaciones complejas. Estándar de calidad OEM.
                          </p>
                        </div>
                      </div>
                    ) : product.compatibility.length > 0 ? (
                      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
                           <Search size={20} className="text-slate-400" />
                           <input type="text" placeholder="Filtra por marca, modelo o CC..." value={tabSearchTerm} onChange={(e) => setTabSearchTerm(e.target.value)} className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-800 placeholder:text-slate-400" />
                        </div>
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-6 bg-white">
                           {tabFilteredCompatibility.length > 0 ? (
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                               {tabFilteredCompatibility.map((c, i) => (
                                 <div key={i} className="flex items-center justify-between p-5 rounded-xl border border-slate-100 bg-slate-50 hover:border-blue-200 hover:bg-white transition-all group">
                                   <span className="font-black text-slate-800 text-sm uppercase tracking-tight">{typeof c === 'object' ? `${c.marca} ${c.modelo}` : c}</span>
                                   <span className="text-[10px] font-black text-[#0866bd] uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100/50">
                                     {typeof c === 'object' ? (c.años.length > 1 ? `${c.años[0]} - ${c.años[c.años.length-1]}` : c.años[0]) : 'Varios'}
                                   </span>
                                 </div>
                               ))}
                             </div>
                           ) : (
                             <div className="text-center py-10"><p className="text-slate-400 font-bold uppercase text-sm tracking-wider">No se encontró ese modelo.</p></div>
                           )}
                        </div>
                      </div>
                    ) : (
                      <div className="px-8 py-10 bg-white rounded-2xl text-sm text-slate-500 font-bold text-center border border-slate-200 shadow-sm">Consulta con tu mecánico de confianza o en mostrador para confirmar la compatibilidad exacta.</div>
                    )}
                 </div>
               )}

               {/* TAB 3: RESEÑAS */}
               {activeTab === 'reviews' && (
                 <div className="max-w-5xl flex flex-col md:flex-row gap-12 lg:gap-16">
                   <div className="w-full md:w-1/3 flex flex-col">
                     <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm text-center flex flex-col items-center">
                       <p className="text-[7rem] font-black text-slate-900 leading-none tracking-tighter mb-2">{averageRating > 0 ? averageRating.toFixed(1) : '0.0'}</p>
                       <div className="flex justify-center mb-4 scale-110">{renderStars(averageRating)}</div>
                       <p className="text-[10px] text-slate-400 font-black mb-8 tracking-widest uppercase">Basado en {reviews.length} calificaciones</p>
                       <button onClick={() => setShowReviewForm(true)} className="w-full bg-[#0866bd] hover:bg-blue-700 text-white font-black py-4 rounded-xl transition-colors text-[10px] uppercase tracking-[0.2em] shadow-lg flex justify-center items-center gap-2">
                         <MessageCircle size={16}/> Escribir Reseña
                       </button>
                     </div>
                   </div>
                   
                   <div className="w-full md:w-2/3">
                     {reviews.length === 0 ? (
                       <div className="text-center py-16 bg-white rounded-[2rem] border border-slate-200 shadow-sm">
                         <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100"><MessageCircle size={24} className="text-slate-300" /></div>
                         <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Aún no hay reseñas</p>
                       </div>
                     ) : (
                       <div className="space-y-6">
                         {reviews.map((rev) => (
                           <div key={rev.id} className="bg-white border border-slate-200 rounded-[1.5rem] p-6 shadow-sm hover:shadow-md transition-shadow">
                             <div className="flex justify-between items-start mb-4">
                               <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-slate-900 text-white font-black rounded-xl flex items-center justify-center text-lg uppercase shadow-inner">
                                   {rev.name.charAt(0)}
                                 </div>
                                 <div>
                                   <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{rev.name}</p>
                                   {rev.verified && <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1 mt-0.5"><ShieldCheck size={12}/> Verificado</p>}
                                 </div>
                               </div>
                               <div className="flex gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">{renderStars(rev.rating)}</div>
                             </div>
                             <p className="text-slate-600 text-sm leading-relaxed font-medium pl-[4rem]">{rev.comment}</p>
                             <p className="text-[9px] text-slate-400 mt-4 pl-[4rem] font-black uppercase tracking-widest">{new Date(rev.createdAt).toLocaleDateString('es-MX', dateOptions)}</p>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 </div>
               )}

             </motion.div>
           </AnimatePresence>
        </div>
      </div>

      {/* MODAL RESEÑAS */}
      <AnimatePresence>
        {showReviewForm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSubmittingReview && setShowReviewForm(false)}></motion.div>
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-white w-full max-w-lg rounded-[2rem] relative z-10 shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <Star size={18} className="text-yellow-400 fill-current"/> Tu Opinión
                </h3>
                <button onClick={() => !isSubmittingReview && setShowReviewForm(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={20} strokeWidth={2.5}/></button>
              </div>
              
              <form onSubmit={handleSubmitReview} className="p-8 space-y-6">
                <div className="flex flex-col items-center mb-2">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setNewReview({...newReview, rating: star})} className="focus:outline-none transition-transform hover:scale-125 active:scale-90 p-1">
                        <Star size={36} fill={star <= newReview.rating ? "#facc15" : "transparent"} strokeWidth={star <= newReview.rating ? 0 : 2} className={star <= newReview.rating ? "text-yellow-400" : "text-slate-300"} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tu Nombre</label>
                  <input type="text" required placeholder="Ej. Juan Pérez" value={newReview.name} onChange={(e) => setNewReview({...newReview, name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#0866bd] transition-colors"/>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Comentario</label>
                  <textarea required rows="4" placeholder="¿Qué tal la calidad de la pieza?" value={newReview.comment} onChange={(e) => setNewReview({...newReview, comment: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#0866bd] transition-colors resize-none"></textarea>
                </div>

                <button 
                  type="submit" disabled={isSubmittingReview} 
                  className="w-full bg-[#0866bd] hover:bg-blue-700 text-white font-black py-4 rounded-xl uppercase tracking-widest transition-colors text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingReview ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  {isSubmittingReview ? 'Publicando...' : 'Publicar Reseña'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
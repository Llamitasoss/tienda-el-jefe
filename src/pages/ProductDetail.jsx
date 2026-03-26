import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, limit, query, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { motion, AnimatePresence, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion';
import { 
  ShieldCheck, Loader2, AlertCircle, Check, Star, StarHalf, Shield, Share2, Store, X, Search, CheckCircle, UserCircle2, Send, Zap, ShoppingCart, MessageCircle, ChevronRight, Package, ZoomIn,
  ScanSearch, RefreshCcw, MapPin, Clock, Flame, Activity, Quote
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
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[300] px-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-3 backdrop-blur-xl border ${
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
  
  // === LUPA OPTIMIZADA ===
  const [isZooming, setIsZooming] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false); 
  const imageContainerRef = useRef(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const bgX = useMotionValue(50); 
  const bgY = useMotionValue(50); 
  
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
          console.warn("Permisos de reseñas insuficientes", e);
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
    } catch (err) {}
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
      if (i <= rating) stars.push(<Star key={i} size={16} fill="currentColor" className="text-[#ffc107] drop-shadow-[0_0_5px_rgba(255,193,7,0.5)]" />);
      else if (i - 0.5 <= rating) stars.push(<StarHalf key={i} size={16} fill="currentColor" className="text-[#ffc107] drop-shadow-[0_0_5px_rgba(255,193,7,0.5)]" />);
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0b1120] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(8,102,189,0.15)_0%,transparent_100%)]"></div>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="relative z-10">
          <Loader2 className="mb-6 text-blue-500" size={48} />
        </motion.div>
        <p className="font-black tracking-[0.3em] uppercase text-[10px] animate-pulse text-blue-400 relative z-10">Desencriptando Inventario...</p>
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
    <div className="bg-[#f4f7f9] min-h-screen selection:bg-[#0866bd] selection:text-white pb-20 relative overflow-hidden">
      
      {/* === AMBIENT BACKGROUND GLOW === */}
      <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-[#0866bd]/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-5%] w-[30vw] h-[30vw] bg-amber-400/5 rounded-full blur-[100px] pointer-events-none"></div>

      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* STICKY ACTION BAR TOP-TIER */}
      <AnimatePresence>
        {showStickyBar && product.stock > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] sm:w-auto min-w-[350px] bg-slate-900/90 backdrop-blur-2xl border border-slate-700/50 p-3 pl-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex items-center justify-between gap-6"
          >
            <div className="flex flex-col hidden sm:flex">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{product.sku}</span>
              <span className="text-sm font-black text-white truncate max-w-[200px] drop-shadow-sm">{cleanName}</span>
            </div>
            <div className="flex items-center gap-5 w-full sm:w-auto">
              <span className="text-xl font-black text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]">{formatMXN(product.price)}</span>
              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleAdd}
                className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-[#0866bd] text-white font-black uppercase tracking-[0.1em] rounded-2xl px-6 py-3 shadow-[0_5px_20px_rgba(8,102,189,0.4)] text-[10px] flex items-center justify-center gap-2 border border-blue-400/30"
              >
                <ShoppingCart size={16} /> Añadir
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BACKGROUND FUTURISTA (Blueprint Grid) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(8,102,189,0.03)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(8,102,189,0.03)_1.5px,transparent_1.5px)] bg-[size:40px_40px] pointer-events-none"></div>

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
              className={`bg-white rounded-[2.5rem] flex items-center justify-center border border-white/60 shadow-[0_30px_60px_rgba(0,0,0,0.06)] relative overflow-hidden group flex-1 min-h-[400px] lg:min-h-[600px] w-full aspect-square lg:aspect-auto ${isScannerActive ? 'cursor-default' : 'cursor-none'}`}
            >
               <div className="absolute inset-0 bg-gradient-to-tr from-slate-50 to-blue-50/40 opacity-70"></div>

               <motion.img 
                 key={`normal-${currentImageIndex}`} src={product.images[currentImageIndex]} alt={cleanName} 
                 className={`relative z-10 w-auto h-auto max-w-[85%] max-h-[85%] mix-blend-multiply transition-all duration-500 ease-out object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.15)] ${isZooming && !isScannerActive ? 'opacity-0' : 'opacity-100 group-hover:scale-105'}`} 
                 onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/600x600/f8fafc/0866BD?text=${encodeURIComponent(product.category)}`; }}
               />
               
               {isZooming && !isScannerActive && (
                 <motion.div
                   className="pointer-events-none absolute z-20 rounded-full border border-white/60 shadow-[0_20px_40px_rgba(0,0,0,0.2),inset_0_0_30px_rgba(8,102,189,0.15)] overflow-hidden bg-white/20 backdrop-blur-md"
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

               <AnimatePresence>
                 {isScannerActive && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 bg-[#0866bd]/10 backdrop-blur-[3px] mix-blend-multiply pointer-events-none">
                     <div className="absolute inset-0 bg-[linear-gradient(rgba(8,102,189,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(8,102,189,0.5)_1px,transparent_1px)] bg-[size:30px_30px] opacity-40"></div>
                     <motion.div 
                       animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                       className="absolute left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,1)]"
                     >
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-transparent to-cyan-400/30 -translate-y-full"></div>
                     </motion.div>
                     <div className="absolute top-6 left-6 text-cyan-400 font-mono text-[10px] uppercase tracking-widest flex flex-col gap-1.5 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
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
                   className={`p-3.5 rounded-2xl backdrop-blur-xl transition-all duration-300 shadow-lg border ${isScannerActive ? 'bg-cyan-500 text-white border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'bg-white/80 text-slate-500 border-white hover:text-[#0866bd] hover:bg-white hover:scale-105'}`}
                   title="Modo Escáner"
                 >
                   <ScanSearch size={22} className={isScannerActive ? 'animate-pulse' : ''}/>
                 </button>
               </div>
               
               {product.isUniversal && (
                 <div className="absolute top-6 right-6 sm:left-6 sm:right-auto bg-slate-900/90 backdrop-blur-md text-yellow-400 text-[10px] font-black px-5 py-2.5 rounded-xl uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(0,0,0,0.3)] flex items-center gap-2 z-30 border border-slate-700/50">
                   <Zap size={14} className="fill-current animate-pulse drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" /> Plug & Play
                 </div>
               )}
            </motion.div>

            {/* Miniaturas Premium */}
            {product.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2 px-1">
                {product.images.map((img, idx) => (
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} key={idx} onClick={() => setCurrentImageIndex(idx)}
                    className={`w-20 h-20 rounded-2xl border flex-shrink-0 overflow-hidden transition-all duration-300 p-2.5 bg-white relative ${currentImageIndex === idx ? 'border-[#0866bd] shadow-[0_10px_20px_rgba(8,102,189,0.2)] ring-2 ring-[#0866bd]/20' : 'border-white shadow-sm opacity-70 hover:opacity-100 hover:shadow-md'}`}
                  >
                    <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-contain mix-blend-multiply"/>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* === COLUMNA DERECHA: INFO Y COMPRA === */}
          <div className="w-full lg:w-[45%] flex flex-col h-fit relative">
            
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1, type: "spring" }}>
              
              <h1 className="text-4xl lg:text-[3.2rem] font-black text-slate-900 uppercase tracking-tighter mb-4 leading-[1.05] drop-shadow-sm">
                {cleanName}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mb-8">
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-400 to-amber-400 text-slate-900 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest shadow-[0_5px_10px_rgba(250,204,21,0.3)]">
                  <Star size={14} className="fill-current" /> {averageRating > 0 ? averageRating.toFixed(1) : 'Nuevo'}
                </div>
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white shadow-sm">Refacción OEM</span>
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">SKU: {product.sku}</span>
              </div>
              
              {/* MÓDULO FOMO FUTURISTA */}
              <AnimatePresence mode="wait">
                {product.stock > 0 && product.stock <= 10 && (
                   <motion.div 
                      initial={{ opacity: 0, height: 0, y: 10 }} animate={{ opacity: 1, height: 'auto', y: 0 }}
                      className={`w-full mb-8 p-4 rounded-[1.5rem] flex items-center gap-4 relative overflow-hidden border backdrop-blur-md shadow-sm ${product.stock <= 3 ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}
                   >
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${product.stock <= 3 ? 'bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]'}`}></div>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0 border ${product.stock <= 3 ? 'bg-red-500/20 border-red-500/30' : 'bg-amber-500/20 border-amber-500/30'}`}>
                         {product.stock <= 3 ? <Flame className="text-red-600 drop-shadow-md" size={24} /> : <Clock className="text-amber-600 drop-shadow-md" size={24} />}
                      </div>
                      <div>
                         <p className={`font-black text-[11px] uppercase tracking-[0.2em] drop-shadow-sm ${product.stock <= 3 ? 'text-red-600' : 'text-amber-600'}`}>
                           {product.stock <= 3 ? '¡ALERTA DE ALTA DEMANDA!' : 'INVENTARIO LIMITADO'}
                         </p>
                         <p className="text-xs font-bold mt-0.5 text-slate-700">
                            Quedan exactamente <span className={`font-black text-sm px-1 bg-white/50 rounded ${product.stock <= 3 ? 'text-red-600' : 'text-amber-600'}`}>{product.stock}</span> piezas en mostrador.
                         </p>
                      </div>
                   </motion.div>
                )}
              </AnimatePresence>

              {/* Tarjeta de Compra Premium */}
              <div ref={buySectionRef} className="mb-8 flex flex-col bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden group hover:border-blue-100 transition-colors duration-500">
                <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-blue-50/50 to-transparent opacity-60 pointer-events-none transform skew-x-12 translate-x-10"></div>
                
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={addedAnimation ? 'added' : 'price'}
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                    className="flex flex-col items-baseline gap-2 mb-8 relative z-10 w-full"
                  >
                    {addedAnimation ? (
                      <div className="flex items-center gap-3 bg-emerald-500 text-white px-6 py-5 rounded-2xl shadow-[0_10px_25px_rgba(16,185,129,0.3)] border border-emerald-400 w-full">
                         <CheckCircle size={24} />
                         <span className="text-sm font-black uppercase tracking-widest mt-0.5 drop-shadow-sm">¡Asegurado en tu carrito!</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-4">
                         <span className="text-[3.5rem] font-black text-slate-900 tracking-tighter drop-shadow-md leading-none">
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
                  <div className="flex items-center bg-slate-100 border border-slate-200/60 rounded-2xl h-16 sm:w-36 overflow-hidden focus-within:border-[#0866bd] focus-within:shadow-[0_0_15px_rgba(8,102,189,0.1)] transition-all shadow-inner shrink-0">
                     <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={product.stock === 0} className="w-12 h-full text-slate-500 hover:bg-white hover:text-[#0866bd] transition-colors text-xl font-bold disabled:opacity-50">-</button>
                     <span className="flex-1 text-center font-black text-slate-900 text-lg bg-white h-full flex items-center justify-center shadow-sm">{qty}</span>
                     <button onClick={() => setQty(Math.min(product.stock, qty + 1))} disabled={product.stock === 0} className="w-12 h-full text-slate-500 hover:bg-white hover:text-[#0866bd] transition-colors text-xl font-bold disabled:opacity-50">+</button>
                  </div>
                  
                  <motion.button 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} onClick={handleAdd} disabled={product.stock === 0}
                    className="relative flex-1 overflow-hidden bg-gradient-to-r from-slate-900 to-black text-yellow-400 font-black uppercase tracking-[0.15em] rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_40px_rgba(250,204,21,0.2)] hover:text-yellow-300 transition-all duration-500 text-xs flex items-center justify-center h-16 group disabled:opacity-50 disabled:grayscale"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] group-hover:bg-[position:200%_0,0_0] transition-[background-position] duration-[1.5s]"></div>
                    <span className="relative z-10 flex items-center gap-3 drop-shadow-sm">
                      {product.stock === 0 ? 'AGOTADO' : <><ShoppingCart size={20} className="group-hover:animate-bounce" /> Añadir a mi orden</>}
                    </span>
                  </motion.button>
                </div>
              </div>

              {/* Logística Premium */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
                 <div className="bg-white/60 backdrop-blur-md p-5 rounded-[1.5rem] border border-white shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                   <div className="bg-blue-50/80 text-[#0866bd] p-2.5 rounded-xl shrink-0 w-max mb-3 group-hover:bg-[#0866bd] group-hover:text-white transition-colors"><Store size={20}/></div>
                   <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Logística</p>
                     <p className="text-sm font-bold text-slate-800">Recolección Local</p>
                     <p className="text-[10px] text-slate-500 mt-1 font-medium">Sucursal Tonalá, Jal.</p>
                   </div>
                 </div>

                 <div className="bg-white/60 backdrop-blur-md p-5 rounded-[1.5rem] border border-white shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group">
                   <div className="bg-emerald-50/80 text-emerald-600 p-2.5 rounded-xl shrink-0 w-max mb-3 group-hover:bg-emerald-500 group-hover:text-white transition-colors"><RefreshCcw size={20}/></div>
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
        
        <div className="flex border-b border-slate-200/60 mb-10 overflow-x-auto custom-scrollbar">
          {NAV_TABS.map(tab => (
            <button 
              key={tab.id} onClick={() => setActiveTab(tab.id)} 
              className={`relative pb-5 px-6 sm:px-10 text-[11px] sm:text-xs font-black uppercase tracking-[0.2em] transition-colors duration-300 flex items-center gap-3 whitespace-nowrap ${activeTab === tab.id ? 'text-[#0866bd]' : 'text-slate-400 hover:text-slate-800'}`}
            >
              <tab.icon size={18} strokeWidth={2.5} className={activeTab === tab.id ? 'opacity-100' : 'opacity-50'} />
              <span>{tab.label}</span>
              {tab.id === 'reviews' && (
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black transition-colors duration-300 ${activeTab === 'reviews' ? 'bg-[#0866bd] text-white shadow-[0_0_10px_rgba(8,102,189,0.3)]' : 'bg-slate-200 text-slate-500'}`}>
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
               
               {activeTab === 'desc' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
                   {product.features.map((feat, idx) => (
                      <motion.div 
                        key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-5 p-6 bg-white/80 backdrop-blur-sm rounded-[1.5rem] border border-white shadow-sm hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-shadow group"
                      >
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors shadow-inner">
                          <Check size={18} className="text-[#0866bd]"/>
                        </div>
                        <p className="text-slate-700 text-sm font-bold leading-relaxed mt-1.5 group-hover:text-slate-900 transition-colors">{feat}</p>
                      </motion.div>
                   ))}
                 </div>
               )}

               {activeTab === 'compatibility' && (
                 <div className="max-w-4xl">
                    {product.isUniversal ? (
                      <div className="p-10 bg-slate-900 text-white rounded-[2rem] flex flex-col sm:flex-row items-center gap-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden border border-slate-700">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[80px] pointer-events-none"></div>
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/30 relative z-10"><Zap size={40} className="animate-pulse drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" /></div>
                        <div className="text-center sm:text-left relative z-10">
                          <h4 className="text-2xl font-black uppercase tracking-tight mb-2 text-emerald-400">Instalación Universal</h4>
                          <p className="text-sm text-slate-300 font-medium leading-relaxed max-w-xl">
                            Esta pieza está diseñada para adaptarse a la gran mayoría de motocicletas sin necesidad de modificaciones complejas. Estándar de calidad OEM.
                          </p>
                        </div>
                      </div>
                    ) : product.compatibility.length > 0 ? (
                      <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
                           <Search size={20} className="text-slate-400" />
                           <input type="text" placeholder="Filtra por marca, modelo o CC..." value={tabSearchTerm} onChange={(e) => setTabSearchTerm(e.target.value)} className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-800 placeholder:text-slate-400" />
                        </div>
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-6 bg-white/50">
                           {tabFilteredCompatibility.length > 0 ? (
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                               {tabFilteredCompatibility.map((c, i) => (
                                 <div key={i} className="flex items-center justify-between p-5 rounded-xl border border-slate-100 bg-white shadow-sm hover:border-blue-200 hover:shadow-md transition-all group">
                                   <span className="font-black text-slate-800 text-sm uppercase tracking-tight drop-shadow-sm">{typeof c === 'object' ? `${c.marca} ${c.modelo}` : c}</span>
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
                      <div className="px-8 py-10 bg-white/80 backdrop-blur-sm rounded-2xl text-sm text-slate-500 font-bold text-center border border-white shadow-sm">Consulta con tu mecánico de confianza o en mostrador para confirmar la compatibilidad exacta.</div>
                    )}
                 </div>
               )}

               {activeTab === 'reviews' && (
                 <div className="max-w-5xl flex flex-col md:flex-row gap-12 lg:gap-16">
                   <div className="w-full md:w-1/3 flex flex-col">
                     <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-sm text-center flex flex-col items-center">
                       <p className="text-[7rem] font-black text-slate-900 leading-none tracking-tighter mb-2 drop-shadow-md">{averageRating > 0 ? averageRating.toFixed(1) : '0.0'}</p>
                       <div className="flex justify-center mb-4 scale-110">{renderStars(averageRating)}</div>
                       <p className="text-[10px] text-slate-400 font-black mb-8 tracking-widest uppercase">Basado en {reviews.length} calificaciones</p>
                       <button onClick={() => setShowReviewForm(true)} className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-xl transition-all text-[10px] uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex justify-center items-center gap-2">
                         <MessageCircle size={16}/> Escribir Reseña
                       </button>
                     </div>
                   </div>
                   
                   <div className="w-full md:w-2/3">
                     {reviews.length === 0 ? (
                       <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-[2.5rem] border border-white shadow-sm">
                         <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner"><MessageCircle size={24} className="text-slate-300" /></div>
                         <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Aún no hay reseñas</p>
                       </div>
                     ) : (
                       <div className="space-y-6">
                         {reviews.map((rev) => (
                           <div key={rev.id} className="bg-white/80 backdrop-blur-sm border border-white rounded-[2rem] p-6 sm:p-8 shadow-sm hover:shadow-[0_15px_40px_rgba(0,0,0,0.05)] transition-shadow">
                             <div className="flex justify-between items-start mb-4">
                               <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-gradient-to-tr from-[#0866bd] to-blue-500 text-white font-black rounded-xl flex items-center justify-center text-lg uppercase shadow-sm border border-blue-400/50">
                                   {rev.name.charAt(0)}
                                 </div>
                                 <div>
                                   <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{rev.name}</p>
                                   {rev.verified && <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1 mt-0.5"><ShieldCheck size={12}/> Verificado</p>}
                                 </div>
                               </div>
                               <div className="flex gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 shadow-inner">{renderStars(rev.rating)}</div>
                             </div>
                             <p className="text-slate-600 text-sm leading-relaxed font-medium pl-[4rem] relative">
                               <Quote size={20} className="absolute left-4 top-0 text-slate-200 -rotate-180" />
                               {rev.comment}
                             </p>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => !isSubmittingReview && setShowReviewForm(false)}></motion.div>
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] relative z-10 shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="px-8 py-6 bg-slate-900 flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-[-50%] right-[-10%] w-32 h-32 bg-blue-500/20 rounded-full blur-[30px] pointer-events-none"></div>
                <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2 relative z-10">
                  <div className="bg-yellow-400/10 p-1.5 rounded-lg border border-yellow-400/20"><Star size={16} className="text-yellow-400 fill-current"/></div> Tu Opinión Biker
                </h3>
                <button onClick={() => !isSubmittingReview && setShowReviewForm(false)} className="text-slate-400 hover:text-white transition-colors relative z-10"><X size={20} strokeWidth={2.5}/></button>
              </div>
              
              <form onSubmit={handleSubmitReview} className="p-8 space-y-6">
                <div className="flex flex-col items-center mb-2">
                  <div className="flex gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-inner">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setNewReview({...newReview, rating: star})} className="focus:outline-none transition-transform hover:scale-125 active:scale-90 p-1">
                        <Star size={36} fill={star <= newReview.rating ? "#facc15" : "transparent"} strokeWidth={star <= newReview.rating ? 0 : 2} className={star <= newReview.rating ? "text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" : "text-slate-300"} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tu Nombre Público</label>
                  <input type="text" required placeholder="Ej. Juan Pérez" value={newReview.name} onChange={(e) => setNewReview({...newReview, name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#0866bd] focus:bg-white focus:shadow-[0_0_15px_rgba(8,102,189,0.1)] transition-all"/>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Comentario</label>
                  <textarea required rows="4" placeholder="¿Qué tal la calidad de la pieza?" value={newReview.comment} onChange={(e) => setNewReview({...newReview, comment: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#0866bd] focus:bg-white focus:shadow-[0_0_15px_rgba(8,102,189,0.1)] transition-all resize-none"></textarea>
                </div>

                <button 
                  type="submit" disabled={isSubmittingReview} 
                  className="w-full bg-gradient-to-r from-[#0866bd] to-blue-600 hover:from-blue-700 hover:to-[#0866bd] text-white font-black py-4 rounded-xl uppercase tracking-widest transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_10px_20px_rgba(8,102,189,0.3)] hover:shadow-[0_15px_30px_rgba(8,102,189,0.4)]"
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
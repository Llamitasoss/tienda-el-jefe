import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, limit, query, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { motion, AnimatePresence, useMotionValue, useSpring, useMotionTemplate } from 'framer-motion';
import { 
  ShieldCheck, Loader2, AlertCircle, Check, Star, StarHalf, Shield, Share2, Store, X, Search, CheckCircle, Send, Zap, ShoppingCart, MessageCircle, ChevronRight, Package, 
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
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[300] px-6 py-4 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-3 backdrop-blur-2xl border ${
        type === 'success' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-red-500/10 border-red-500/50 text-red-400'
      }`}
    >
      {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
      <span className="text-xs font-black uppercase tracking-widest drop-shadow-sm">{message}</span>
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
  
  // === LUPA OPTIMIZADA A 60FPS ===
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
  const handleMouseLeave = () => { setIsZooming(false); bgX.set(50); bgY.set(50); };

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
          console.warn("Permisos insuficientes para reseñas", e);
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
      // Simulación de carga premium
      setTimeout(() => setLoading(false), 600);
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
      setToast({ message: "¡Reseña procesada y aprobada!", type: 'success' });
    } catch (error) { 
      setToast({ message: "Error de red. Intenta nuevamente.", type: 'error' });
    }
    setIsSubmittingReview(false);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) stars.push(<Star key={i} size={16} fill="currentColor" className="text-amber-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />);
      else if (i - 0.5 <= rating) stars.push(<StarHalf key={i} size={16} fill="currentColor" className="text-amber-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />);
      else stars.push(<Star key={i} size={16} className="text-slate-600" />);
    }
    return stars;
  };

  const tabFilteredCompatibility = product?.compatibility.filter(c => {
    const searchString = typeof c === 'object' ? `${c.marca} ${c.modelo} ${c.cilindraje}`.toLowerCase() : c.toLowerCase();
    return searchString.includes(tabSearchTerm.toLowerCase());
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#021830] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(8,102,189,0.15)_0%,transparent_100%)]"></div>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="relative z-10 w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 border-t-2 border-r-2 border-amber-400 rounded-full opacity-50"></div>
          <div className="absolute inset-2 border-b-2 border-l-2 border-amber-200 rounded-full opacity-70 animate-spin-reverse"></div>
          <Package className="text-amber-400" size={32} />
        </motion.div>
        <p className="font-black tracking-[0.3em] uppercase text-[10px] animate-pulse text-amber-200 relative z-10 mt-6">Cargando Especificaciones...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-400 bg-[#021830]">
        <AlertCircle size={64} className="text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
        <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-4">Módulo no encontrado</h2>
        <button onClick={() => navigate('/catalogo')} className="bg-white/10 text-white border border-white/20 uppercase font-black text-xs tracking-widest px-8 py-4 rounded-full hover:bg-white hover:text-slate-900 transition-colors shadow-lg">Volver al Inventario</button>
      </div>
    );
  }

  const cleanName = product.isUniversal ? product.name.replace(/universal/gi, '').trim() : product.name;

  return (
    <div className="bg-[#021830] min-h-screen selection:bg-amber-400 selection:text-slate-900 pb-20 relative overflow-hidden">
      
      {/* === AMBIENT BACKGROUND GLOW (Zafiro y Oro) === */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(255,255,255,0.02)_1.5px,transparent_1.5px)] bg-[size:40px_40px] pointer-events-none fixed"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay pointer-events-none fixed"></div>
      
      <motion.div animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.1, 1] }} transition={{ duration: 15, repeat: Infinity }} className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-[#0866bd] rounded-full blur-[180px] pointer-events-none mix-blend-screen fixed"></motion.div>
      <motion.div animate={{ opacity: [0.05, 0.1, 0.05], scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity, delay: 2 }} className="absolute top-[30%] right-[-5%] w-[30vw] h-[30vw] bg-amber-400 rounded-full blur-[150px] pointer-events-none mix-blend-screen fixed"></motion.div>

      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* === STICKY ACTION BAR TOP-TIER (HUD Inferior) === */}
      <AnimatePresence>
        {showStickyBar && product.stock > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] sm:w-auto min-w-[350px] max-w-[600px] bg-[#042f56]/90 backdrop-blur-2xl border border-white/10 p-3 pl-6 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.6)] flex items-center justify-between gap-6"
          >
            <div className="flex flex-col hidden sm:flex overflow-hidden">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Shield size={10} className="text-amber-400"/> {product.sku}</span>
              <span className="text-sm font-black text-white truncate max-w-[220px] drop-shadow-sm leading-tight">{cleanName}</span>
            </div>
            <div className="flex items-center gap-5 w-full sm:w-auto">
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500 drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]">{formatMXN(product.price)}</span>
              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleAdd}
                className="flex-1 sm:flex-none relative overflow-hidden bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 font-black uppercase tracking-[0.1em] rounded-[1.5rem] px-6 py-3.5 shadow-[0_5px_20px_rgba(250,204,21,0.4)] hover:shadow-[0_10px_30px_rgba(250,204,21,0.6)] text-[10px] flex items-center justify-center gap-2 border border-yellow-200 group"
              >
                <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-25deg] group-hover:animate-[shimmer_1s_infinite]"></div>
                <ShoppingCart size={16} className="relative z-10 group-hover:scale-110 transition-transform" /> <span className="relative z-10">Procesar</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16 relative z-10">
        
        {/* Migas de pan (Breadcrumbs) */}
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 sm:mb-12 border-b border-white/10 pb-4">
          <Link to="/" className="hover:text-amber-400 transition-colors">Inicio</Link> <ChevronRight size={12} className="text-slate-600" />
          <Link to="/catalogo" className="hover:text-amber-400 transition-colors">Inventario</Link> <ChevronRight size={12} className="text-slate-600" />
          <span className="text-amber-400 truncate max-w-[150px] sm:max-w-none">{product.category}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
          
          {/* === COLUMNA IZQUIERDA: GALERÍA LEVITANTE & ESCÁNER (Neo-Clásica) === */}
          <div className="w-full lg:w-[55%] flex flex-col gap-6 relative lg:sticky lg:top-32 h-fit">
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, type: "spring" }}
              ref={imageContainerRef} onMouseMove={handleMouseMove} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
              className={`bg-[#042f56]/40 backdrop-blur-2xl rounded-[3rem] flex items-center justify-center border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.5)] relative overflow-hidden group flex-1 min-h-[400px] lg:min-h-[600px] w-full aspect-square lg:aspect-auto ${isScannerActive ? 'cursor-default' : 'cursor-none'}`}
            >
               {/* Resplandor focal trasero */}
               <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 to-transparent opacity-50 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none"></div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-[60px] pointer-events-none"></div>

               <motion.img 
                 key={`normal-${currentImageIndex}`} src={product.images[currentImageIndex]} alt={cleanName} 
                 className={`relative z-10 w-auto h-auto max-w-[85%] max-h-[85%] transition-all duration-700 ease-out object-contain drop-shadow-[0_30px_50px_rgba(0,0,0,0.5)] ${isZooming && !isScannerActive ? 'opacity-0' : 'opacity-100 group-hover:scale-110 group-hover:-translate-y-4 group-hover:rotate-2'}`} 
                 onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/600x600/021830/FACC15?text=${encodeURIComponent(product.category)}`; }}
               />
               
               {/* === LUPA FLOTANTE TOP-TIER === */}
               {isZooming && !isScannerActive && (
                 <motion.div
                   className="pointer-events-none absolute z-20 rounded-full border border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_0_30px_rgba(250,204,21,0.15)] overflow-hidden bg-[#042f56]/40 backdrop-blur-md"
                   style={{ x: smoothMouseX, y: smoothMouseY, translateX: "-50%", translateY: "-50%", width: 300, height: 300 }}
                 >
                   <motion.div 
                     className="w-full h-full mix-blend-screen"
                     style={{
                       backgroundImage: `url(${product.images[currentImageIndex]})`,
                       backgroundPosition: bgPositionTemplate, 
                       backgroundSize: '200%', 
                       backgroundRepeat: 'no-repeat',
                     }}
                   />
                   {/* Retícula de mira del zoom dorada */}
                   <div className="absolute inset-0 flex items-center justify-center opacity-30 mix-blend-overlay pointer-events-none">
                     <div className="w-full h-[1px] bg-amber-400"></div><div className="absolute h-full w-[1px] bg-amber-400"></div>
                     <div className="absolute w-12 h-12 border border-amber-400 rounded-full"></div>
                   </div>
                 </motion.div>
               )}

               {/* === ESCÁNER TÁCTICO DORADO === */}
               <AnimatePresence>
                 {isScannerActive && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 bg-amber-900/20 backdrop-blur-[2px] pointer-events-none">
                     <div className="absolute inset-0 bg-[linear-gradient(rgba(250,204,21,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(250,204,21,0.2)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                     <motion.div 
                       animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                       className="absolute left-0 w-full h-[2px] bg-amber-400 shadow-[0_0_20px_rgba(250,204,21,1)]"
                     >
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-transparent to-amber-400/20 -translate-y-full"></div>
                     </motion.div>
                     <div className="absolute top-8 left-8 text-amber-400 font-mono text-[10px] uppercase tracking-[0.3em] flex flex-col gap-2 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">
                       <span className="flex items-center gap-2"><Activity size={14} className="animate-pulse"/> SYS: EN LÍNEA</span>
                       <span>ID: {product.sku}</span>
                       <span>TGT: ANÁLISIS ESTRUCTURAL</span>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>

               <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-40">
                 <button 
                   onClick={() => setIsScannerActive(!isScannerActive)}
                   className={`p-4 rounded-[1.2rem] backdrop-blur-2xl transition-all duration-300 shadow-xl border ${isScannerActive ? 'bg-amber-400 text-slate-900 border-yellow-200 shadow-[0_0_30px_rgba(250,204,21,0.5)]' : 'bg-slate-900/60 text-amber-400/50 border-white/10 hover:text-amber-400 hover:bg-[#042f56] hover:border-amber-400/30 hover:scale-105'}`}
                   title="Escáner Táctico"
                 >
                   <ScanSearch size={24} className={isScannerActive ? 'animate-pulse' : ''}/>
                 </button>
               </div>
               
               {product.isUniversal && (
                 <div className="absolute top-8 right-8 sm:left-8 sm:right-auto bg-[#042f56]/80 backdrop-blur-md text-amber-400 text-[10px] font-black px-5 py-2.5 rounded-xl uppercase tracking-[0.2em] shadow-[0_15px_30px_rgba(0,0,0,0.5)] flex items-center gap-2 z-30 border border-amber-400/30">
                   <Zap size={14} className="fill-current animate-pulse drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" /> Ajuste Universal
                 </div>
               )}
            </motion.div>

            {/* Miniaturas Premium (Glassmorphism Oscuro) */}
            {product.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4 px-1">
                {product.images.map((img, idx) => (
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }} key={idx} onClick={() => setCurrentImageIndex(idx)}
                    className={`w-24 h-24 rounded-[1.5rem] flex-shrink-0 overflow-hidden transition-all duration-500 p-3 bg-[#042f56]/40 backdrop-blur-md relative ${currentImageIndex === idx ? 'border-2 border-amber-400 shadow-[0_15px_30px_rgba(250,204,21,0.3)]' : 'border border-white/10 opacity-60 hover:opacity-100 hover:shadow-lg hover:border-white/30'}`}
                  >
                    <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-contain drop-shadow-md"/>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* === COLUMNA DERECHA: INFO Y HARDWARE DE COMPRA === */}
          <div className="w-full lg:w-[45%] flex flex-col h-fit relative">
            
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2, type: "spring" }}>
              
              <h1 className="text-4xl lg:text-[3.5rem] font-black text-white uppercase tracking-tighter mb-6 leading-[1.05] drop-shadow-lg">
                {cleanName}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mb-10">
                <div className="flex items-center gap-1.5 bg-amber-400/10 text-amber-400 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest border border-amber-400/30 shadow-[0_0_15px_rgba(250,204,21,0.15)]">
                  <Star size={14} className="fill-current" /> {averageRating > 0 ? averageRating.toFixed(1) : 'Nuevo'}
                </div>
                <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest bg-white/5 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 shadow-sm">Refacción OEM</span>
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest bg-[#042f56] px-4 py-2 rounded-xl border border-white/5">SKU: {product.sku}</span>
              </div>
              
              {/* === MÓDULO FOMO FUTURISTA === */}
              <AnimatePresence mode="wait">
                {product.stock > 0 && product.stock <= 10 && (
                   <motion.div 
                      initial={{ opacity: 0, height: 0, y: 10 }} animate={{ opacity: 1, height: 'auto', y: 0 }}
                      className={`w-full mb-10 p-5 rounded-[1.5rem] flex items-center gap-5 relative overflow-hidden border backdrop-blur-md shadow-[0_20px_40px_rgba(0,0,0,0.3)] ${product.stock <= 3 ? 'bg-red-900/20 border-red-500/30' : 'bg-amber-900/20 border-amber-500/30'}`}
                   >
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${product.stock <= 3 ? 'bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,1)]' : 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,1)]'}`}></div>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner ${product.stock <= 3 ? 'bg-red-500/20 border-red-500/50' : 'bg-amber-500/20 border-amber-500/50'}`}>
                         {product.stock <= 3 ? <Flame className="text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" size={28} /> : <Clock className="text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" size={28} />}
                      </div>
                      <div>
                         <p className={`font-black text-xs uppercase tracking-[0.25em] drop-shadow-sm ${product.stock <= 3 ? 'text-red-400' : 'text-amber-400'}`}>
                           {product.stock <= 3 ? '¡ALERTA DE ALTA DEMANDA!' : 'INVENTARIO LIMITADO'}
                         </p>
                         <p className="text-sm font-medium mt-1 text-slate-300">
                            Quedan exactamente <span className={`font-black text-base px-2 bg-white/10 rounded-lg mx-1 border border-white/5 ${product.stock <= 3 ? 'text-red-400' : 'text-amber-400'}`}>{product.stock}</span> piezas físicas.
                         </p>
                      </div>
                   </motion.div>
                )}
              </AnimatePresence>

              {/* === TARJETA DE COMPRA "GOLD STANDARD" === */}
              <div ref={buySectionRef} className="mb-10 flex flex-col bg-[#042f56]/40 backdrop-blur-2xl p-8 sm:p-10 rounded-[3rem] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-amber-400/10 to-transparent opacity-40 pointer-events-none transform skew-x-12 translate-x-10 group-hover:bg-amber-400/20 transition-colors duration-700"></div>
                
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={addedAnimation ? 'added' : 'price'}
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                    className="flex flex-col items-baseline gap-2 mb-10 relative z-10 w-full"
                  >
                    {addedAnimation ? (
                      <div className="flex items-center gap-4 bg-emerald-500/10 text-emerald-400 px-8 py-6 rounded-2xl shadow-[inset_0_0_20px_rgba(16,185,129,0.2)] border border-emerald-500/30 w-full">
                         <CheckCircle size={28} className="drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                         <span className="text-base font-black uppercase tracking-widest mt-0.5 drop-shadow-sm">Asegurado en tu orden</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-5">
                         <span className="text-[4rem] sm:text-[4.5rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-amber-100 tracking-tighter drop-shadow-2xl leading-none">
                           {formatMXN(product.price)}
                         </span>
                         {product.originalPrice && (
                           <span className="text-2xl text-slate-500 line-through font-bold tracking-tight decoration-red-500/70 decoration-[3px]">
                             {formatMXN(product.originalPrice)}
                           </span>
                         )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
                
                <div className="flex flex-col sm:flex-row gap-5 w-full relative z-10">
                  {/* Selector de cantidad Zafiro */}
                  <div className="flex items-center bg-[#021830] border border-white/10 rounded-2xl h-16 sm:w-40 overflow-hidden focus-within:border-amber-400 focus-within:shadow-[0_0_20px_rgba(250,204,21,0.2)] transition-all shadow-inner shrink-0">
                     <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={product.stock === 0} className="w-14 h-full text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-2xl font-bold disabled:opacity-50">-</button>
                     <span className="flex-1 text-center font-black text-white text-xl border-x border-white/5">{qty}</span>
                     <button onClick={() => setQty(Math.min(product.stock, qty + 1))} disabled={product.stock === 0} className="w-14 h-full text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-2xl font-bold disabled:opacity-50">+</button>
                  </div>
                  
                  {/* Botón de compra Oro */}
                  <motion.button 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} onClick={handleAdd} disabled={product.stock === 0}
                    className="relative flex-1 overflow-hidden bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-900 font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_20px_40px_rgba(250,204,21,0.3)] hover:shadow-[0_25px_50px_rgba(250,204,21,0.5)] transition-all duration-500 text-[11px] sm:text-xs flex items-center justify-center h-16 group disabled:opacity-50 disabled:grayscale border border-yellow-200"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] group-hover:animate-[shimmer_1.5s_infinite]"></div>
                    <span className="relative z-10 flex items-center gap-3 drop-shadow-sm">
                      {product.stock === 0 ? 'AGOTADO' : <><ShoppingCart size={20} className="group-hover:scale-110 transition-transform" /> Añadir a la orden</>}
                    </span>
                  </motion.button>
                </div>
              </div>

              {/* Logística Premium */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
                 <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:border-amber-400/30 hover:bg-white/10 transition-all group">
                   <div className="bg-amber-400/10 text-amber-400 p-3 rounded-xl shrink-0 w-max mb-4 group-hover:bg-amber-400 group-hover:text-slate-900 transition-colors border border-amber-400/20"><Store size={22}/></div>
                   <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Logística</p>
                     <p className="text-base font-bold text-white mb-0.5">Recolección Inmediata</p>
                     <p className="text-[11px] text-slate-500 font-medium">Sucursal Tonalá, Jalisco.</p>
                   </div>
                 </div>

                 <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:border-emerald-500/30 hover:bg-white/10 transition-all group">
                   <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl shrink-0 w-max mb-4 group-hover:bg-emerald-500 group-hover:text-slate-900 transition-colors border border-emerald-500/20"><RefreshCcw size={22}/></div>
                   <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Confianza</p>
                     <p className="text-base font-bold text-white mb-0.5">100% Compatibilidad</p>
                     <p className="text-[11px] text-slate-500 font-medium">Devoluciones sin costo</p>
                   </div>
                 </div>
              </div>

            </motion.div>
          </div>
        </div>
      </div>

      {/* === NAVEGACIÓN DE PESTAÑAS (Estilo Zafiro y Oro) === */}
      <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-32 relative z-10">
        
        <div className="flex border-b border-white/10 mb-12 overflow-x-auto custom-scrollbar relative">
          {NAV_TABS.map(tab => (
            <button 
              key={tab.id} onClick={() => setActiveTab(tab.id)} 
              className={`relative pb-6 px-8 sm:px-12 text-[11px] sm:text-xs font-black uppercase tracking-[0.2em] transition-colors duration-300 flex items-center gap-3 whitespace-nowrap ${activeTab === tab.id ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <tab.icon size={18} strokeWidth={2.5} className={activeTab === tab.id ? 'text-amber-400' : 'opacity-50'} />
              <span>{tab.label}</span>
              {tab.id === 'reviews' && (
                <span className={`px-2.5 py-1 rounded-md text-[9px] font-black transition-colors duration-300 shadow-sm ${activeTab === 'reviews' ? 'bg-amber-400 text-slate-900 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'bg-[#042f56] text-slate-400 border border-white/5'}`}>
                  {reviews.length}
                </span>
              )}
              {activeTab === tab.id && (
                <motion.div layoutId="active-tab-line" className="absolute bottom-0 left-0 right-0 h-1 bg-amber-400 rounded-t-full shadow-[0_-2px_15px_rgba(250,204,21,0.8)]" transition={{ type: "spring", stiffness: 500, damping: 30 }} />
              )}
            </button>
          ))}
        </div>
        
        <div className="min-h-[400px]">
           <AnimatePresence mode="wait">
             <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
               
               {/* TAB 1: INGENIERÍA */}
               {activeTab === 'desc' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
                   {product.features.map((feat, idx) => (
                      <motion.div 
                        key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-6 p-8 bg-[#042f56]/40 backdrop-blur-xl rounded-[2rem] border border-white/5 shadow-[0_15px_30px_rgba(0,0,0,0.3)] hover:bg-[#042f56]/60 hover:border-amber-400/30 transition-all duration-300 group"
                      >
                        <div className="bg-white/5 p-3.5 rounded-xl border border-white/10 group-hover:bg-amber-400/10 group-hover:border-amber-400/30 transition-colors shadow-inner shrink-0">
                          <Check size={20} className="text-amber-400 group-hover:drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] transition-all"/>
                        </div>
                        <p className="text-slate-300 text-sm font-medium leading-relaxed mt-1 group-hover:text-white transition-colors">{feat}</p>
                      </motion.div>
                   ))}
                 </div>
               )}

               {/* TAB 2: COMPATIBILIDAD */}
               {activeTab === 'compatibility' && (
                 <div className="max-w-4xl">
                    {product.isUniversal ? (
                      <div className="p-12 bg-gradient-to-r from-emerald-900/40 to-[#042f56]/40 backdrop-blur-2xl text-white rounded-[2.5rem] flex flex-col sm:flex-row items-center gap-10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative overflow-hidden border border-emerald-500/20">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                        <div className="w-24 h-24 bg-emerald-500/20 rounded-[2rem] flex items-center justify-center text-emerald-400 shrink-0 border border-emerald-500/40 relative z-10 shadow-inner"><Zap size={48} className="animate-pulse drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]" /></div>
                        <div className="text-center sm:text-left relative z-10">
                          <h4 className="text-3xl font-black uppercase tracking-tight mb-3 text-emerald-400">Instalación Universal</h4>
                          <p className="text-base text-slate-300 font-medium leading-relaxed max-w-xl">
                            Componente de ingeniería abierta, diseñado para acoplarse a la gran mayoría de motocicletas del mercado sin necesidad de alteraciones mecánicas complejas.
                          </p>
                        </div>
                      </div>
                    ) : product.compatibility.length > 0 ? (
                      <div className="bg-[#03254c]/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-white/5 bg-[#021830]/50 flex items-center gap-5">
                           <Search size={24} className="text-slate-500" />
                           <input type="text" placeholder="Filtra por marca, modelo o CC..." value={tabSearchTerm} onChange={(e) => setTabSearchTerm(e.target.value)} className="w-full bg-transparent border-none outline-none text-base font-bold text-white placeholder:text-slate-600" />
                        </div>
                        <div className="max-h-[500px] overflow-y-auto custom-scrollbar p-8">
                           {tabFilteredCompatibility.length > 0 ? (
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                               {tabFilteredCompatibility.map((c, i) => (
                                 <div key={i} className="flex items-center justify-between p-6 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-amber-400/30 transition-all group shadow-sm">
                                   <span className="font-black text-slate-200 text-sm uppercase tracking-tight group-hover:text-white transition-colors">{typeof c === 'object' ? `${c.marca} ${c.modelo}` : c}</span>
                                   <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-400/10 px-4 py-2 rounded-xl border border-amber-400/20 shadow-inner group-hover:shadow-[0_0_15px_rgba(250,204,21,0.2)] transition-shadow">
                                     {typeof c === 'object' ? (c.años.length > 1 ? `${c.años[0]} - ${c.años[c.años.length-1]}` : c.años[0]) : 'Varios'}
                                   </span>
                                 </div>
                               ))}
                             </div>
                           ) : (
                             <div className="text-center py-16"><p className="text-slate-500 font-bold uppercase text-sm tracking-widest">Modelo no encontrado en la base de datos.</p></div>
                           )}
                        </div>
                      </div>
                    ) : (
                      <div className="px-8 py-16 bg-[#042f56]/30 backdrop-blur-md rounded-[2.5rem] text-base text-slate-400 font-medium text-center border border-white/5 shadow-sm">Consulta especificaciones técnicas con tu mecánico de confianza o directamente en el mostrador.</div>
                    )}
                 </div>
               )}

               {/* TAB 3: COMUNIDAD (RESEÑAS) */}
               {activeTab === 'reviews' && (
                 <div className="max-w-5xl flex flex-col md:flex-row gap-12 lg:gap-20">
                   <div className="w-full md:w-1/3 flex flex-col">
                     <div className="bg-[#042f56]/40 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] text-center flex flex-col items-center">
                       <p className="text-[8rem] font-black text-white leading-none tracking-tighter mb-4 drop-shadow-2xl">{averageRating > 0 ? averageRating.toFixed(1) : '0.0'}</p>
                       <div className="flex justify-center mb-6 scale-125">{renderStars(averageRating)}</div>
                       <p className="text-[10px] text-slate-400 font-black mb-10 tracking-[0.2em] uppercase">Basado en {reviews.length} calificaciones</p>
                       <button onClick={() => setShowReviewForm(true)} className="w-full bg-amber-400 hover:bg-yellow-300 text-slate-900 font-black py-5 rounded-[1.5rem] transition-all text-[11px] uppercase tracking-[0.2em] shadow-[0_15px_30px_rgba(250,204,21,0.2)] hover:shadow-[0_20px_40px_rgba(250,204,21,0.4)] flex justify-center items-center gap-3">
                         <MessageCircle size={18}/> Compartir Experiencia
                       </button>
                     </div>
                   </div>
                   
                   <div className="w-full md:w-2/3">
                     {reviews.length === 0 ? (
                       <div className="text-center py-24 bg-[#042f56]/20 backdrop-blur-md rounded-[3rem] border border-white/5 shadow-sm">
                         <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-inner"><MessageCircle size={32} className="text-slate-500" /></div>
                         <p className="text-lg font-black text-white uppercase tracking-tight mb-2">Sé el primero en opinar</p>
                         <p className="text-sm text-slate-400 font-medium">Ayuda a otros Bikers compartiendo tu experiencia de uso.</p>
                       </div>
                     ) : (
                       <div className="space-y-8">
                         {reviews.map((rev) => (
                           <div key={rev.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 sm:p-10 shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:border-amber-400/30 transition-colors group">
                             <div className="flex justify-between items-start mb-6">
                               <div className="flex items-center gap-5">
                                 <div className="w-14 h-14 bg-gradient-to-tr from-amber-600 to-yellow-400 text-slate-900 font-black rounded-2xl flex items-center justify-center text-xl uppercase shadow-inner border border-yellow-200 group-hover:scale-110 transition-transform duration-500">
                                   {rev.name.charAt(0)}
                                 </div>
                                 <div>
                                   <p className="text-base font-black text-white uppercase tracking-tight mb-1 drop-shadow-sm">{rev.name}</p>
                                   {rev.verified && <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-1.5 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]"><ShieldCheck size={14}/> Verificado</p>}
                                 </div>
                               </div>
                               <div className="flex gap-1 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 shadow-inner">{renderStars(rev.rating)}</div>
                             </div>
                             <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium pl-[5rem] relative">
                               <Quote size={24} className="absolute left-4 top-0 text-slate-600 -rotate-180" />
                               {rev.comment}
                             </p>
                             <p className="text-[10px] text-slate-500 mt-6 pl-[5rem] font-black uppercase tracking-[0.2em]">{new Date(rev.createdAt).toLocaleDateString('es-MX', dateOptions)}</p>
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

      {/* === MODAL DE RESEÑAS (Zafiro Oscuro) === */}
      <AnimatePresence>
        {showReviewForm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, backdropFilter: "blur(12px)" }} exit={{ opacity: 0, backdropFilter: "blur(0px)" }} className="absolute inset-0 bg-[#021830]/80" onClick={() => !isSubmittingReview && setShowReviewForm(false)}></motion.div>
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-[#021830] w-full max-w-xl rounded-[3rem] relative z-10 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden border border-white/20"
            >
              <div className="px-10 py-8 bg-[#042f56] flex justify-between items-center relative overflow-hidden border-b border-white/10">
                <div className="absolute top-[-50%] right-[-10%] w-40 h-40 bg-amber-400/20 rounded-full blur-[40px] pointer-events-none"></div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-3 relative z-10 drop-shadow-md">
                  <div className="bg-amber-400/20 p-2 rounded-xl border border-amber-400/30 shadow-inner"><Star size={18} className="text-amber-400 fill-current drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]"/></div> Tu Opinión Biker
                </h3>
                <button onClick={() => !isSubmittingReview && setShowReviewForm(false)} className="text-slate-400 hover:text-white transition-colors relative z-10 bg-white/5 p-2 rounded-full hover:bg-white/10 border border-white/10"><X size={20} strokeWidth={2.5}/></button>
              </div>
              
              <form onSubmit={handleSubmitReview} className="p-10 space-y-8">
                <div className="flex flex-col items-center mb-4">
                  <div className="flex gap-2 bg-[#03254c] p-4 rounded-3xl border border-white/10 shadow-inner">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setNewReview({...newReview, rating: star})} className="focus:outline-none transition-transform hover:scale-125 active:scale-90 p-1.5">
                        <Star size={40} fill={star <= newReview.rating ? "#facc15" : "transparent"} strokeWidth={star <= newReview.rating ? 0 : 2} className={star <= newReview.rating ? "text-amber-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" : "text-slate-600"} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Tu Nombre Público</label>
                  <input type="text" required placeholder="Ej. Juan Pérez" value={newReview.name} onChange={(e) => setNewReview({...newReview, name: e.target.value})} className="w-full bg-[#03254c] border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-amber-400 focus:bg-[#042f56] focus:shadow-[0_0_20px_rgba(250,204,21,0.2)] transition-all placeholder:text-slate-500"/>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Comentario / Reseña</label>
                  <textarea required rows="4" placeholder="Describe tu experiencia con la calidad y la instalación..." value={newReview.comment} onChange={(e) => setNewReview({...newReview, comment: e.target.value})} className="w-full bg-[#03254c] border border-white/10 rounded-2xl p-6 text-sm font-bold text-white focus:outline-none focus:border-amber-400 focus:bg-[#042f56] focus:shadow-[0_0_20px_rgba(250,204,21,0.2)] transition-all resize-none placeholder:text-slate-500 leading-relaxed"></textarea>
                </div>

                <button 
                  type="submit" disabled={isSubmittingReview} 
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-900 font-black py-5 rounded-2xl uppercase tracking-[0.2em] transition-all text-xs flex items-center justify-center gap-3 disabled:opacity-50 shadow-[0_15px_30px_rgba(250,204,21,0.3)] hover:shadow-[0_20px_40px_rgba(250,204,21,0.5)] border border-yellow-200 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  {isSubmittingReview ? <Loader2 size={20} className="animate-spin relative z-10" /> : <Send size={20} className="relative z-10 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                  <span className="relative z-10 mt-0.5">{isSubmittingReview ? 'Publicando...' : 'Publicar Reseña'}</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
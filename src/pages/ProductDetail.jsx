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
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[300] px-6 py-4 rounded-[1rem] shadow-[0_15px_40px_rgba(0,0,0,0.5)] flex items-center gap-3 backdrop-blur-xl border ${
        type === 'success' ? 'bg-[#0866bd]/10 border-[#0866bd]/50 text-[#0866bd]' : 'bg-[#EF4444]/10 border-[#EF4444]/50 text-[#EF4444]'
      }`}
    >
      {type === 'success' ? <CheckCircle size={16} strokeWidth={2.5} /> : <AlertCircle size={16} strokeWidth={2.5} />}
      <span className="text-[11px] font-black uppercase tracking-widest drop-shadow-sm">{message}</span>
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
          const productImages = data.images?.length > 0 ? data.images : [data.ImagenURL || data.image || "https://placehold.co/600x600/FBFBF2/0866bd?text=Sin+Foto"];

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
            images: ["https://placehold.co/600x600/FBFBF2/EF4444?text=Error"],
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
              img: relData.images?.[0] || "https://placehold.co/300x300/FBFBF2/0866bd", category: relData.subCat || relData.cat || relData.Categoria 
            });
          }
        });
        setRelatedProducts(relProds.slice(0, 4));

      } catch (error) { console.error("Error cargando datos:", error); }
      setTimeout(() => setLoading(false), 500);
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
      setToast({ message: "Error de conexión. Intenta nuevamente.", type: 'error' });
    }
    setIsSubmittingReview(false);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) stars.push(<Star key={i} size={14} fill="currentColor" className="text-[#FACC15]" />);
      else if (i - 0.5 <= rating) stars.push(<StarHalf key={i} size={14} fill="currentColor" className="text-[#FACC15]" />);
      else stars.push(<Star key={i} size={14} className="text-[#03254c]" />);
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
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="relative z-10 w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 border-t-2 border-r-2 border-[#0866bd] rounded-full opacity-80"></div>
          <div className="absolute inset-2 border-b-2 border-l-2 border-white/20 rounded-full opacity-50 animate-spin-reverse"></div>
          <Package className="text-[#0866bd]" size={20} strokeWidth={1.5} />
        </motion.div>
        <p className="font-bold tracking-[0.2em] uppercase text-[10px] animate-pulse text-[#FBFBF2]/60 relative z-10 mt-6">Accediendo al Inventario...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-[#FBFBF2] bg-[#021830]">
        <AlertCircle size={40} className="text-[#EF4444] mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" strokeWidth={1.5} />
        <h2 className="text-xl font-black uppercase tracking-tight mb-4">Pieza no encontrada</h2>
        <button onClick={() => navigate('/catalogo')} className="bg-[#0866bd] text-white border border-[#0866bd] uppercase font-bold text-[10px] tracking-widest px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors shadow-lg">Volver al Inventario</button>
      </div>
    );
  }

  const cleanName = product.isUniversal ? product.name.replace(/universal/gi, '').trim() : product.name;

  return (
    <div className="bg-[#021830] min-h-screen selection:bg-[#0866bd] selection:text-[#FBFBF2] pb-20 relative overflow-hidden font-sans">
      
      {/* === BACKGROUND GRID CLÁSICO === */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(255,255,255,0.02)_1.5px,transparent_1.5px)] bg-[size:30px_30px] pointer-events-none fixed"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay pointer-events-none fixed"></div>

      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* === STICKY ACTION BAR (HUD Inferior Elegante) === */}
      <AnimatePresence>
        {showStickyBar && product.stock > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] sm:w-auto min-w-[320px] max-w-[500px] bg-[#03254c]/95 backdrop-blur-2xl border border-white/10 p-2.5 pl-5 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex items-center justify-between gap-6"
          >
            <div className="flex flex-col hidden sm:flex overflow-hidden">
              <span className="text-[9px] font-bold text-[#FBFBF2]/50 uppercase tracking-widest flex items-center gap-1.5"><Shield size={10} className="text-[#0866bd]"/> {product.sku}</span>
              <span className="text-xs font-black text-[#FBFBF2] truncate max-w-[180px] drop-shadow-sm leading-tight">{cleanName}</span>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <span className="text-lg font-black text-[#FBFBF2]">{formatMXN(product.price)}</span>
              <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={handleAdd}
                className="flex-1 sm:flex-none relative overflow-hidden bg-[#0866bd] text-[#FBFBF2] font-black uppercase tracking-widest rounded-xl px-5 py-2.5 shadow-[0_5px_15px_rgba(8,102,189,0.3)] text-[9px] flex items-center justify-center gap-2 group border border-blue-400/30"
              >
                <ShoppingCart size={14} className="relative z-10" strokeWidth={2} /> <span className="relative z-10">Añadir</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[75rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 relative z-10">
        
        {/* Migas de pan (Breadcrumbs) - Más pequeñas y sutiles */}
        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-[#FBFBF2]/40 mb-6 border-b border-white/5 pb-3">
          <Link to="/" className="hover:text-[#0866bd] transition-colors">Inicio</Link> <ChevronRight size={10} className="text-white/20" />
          <Link to="/catalogo" className="hover:text-[#0866bd] transition-colors">Inventario</Link> <ChevronRight size={10} className="text-white/20" />
          <span className="text-[#0866bd] truncate max-w-[120px] sm:max-w-none">{product.category}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* === COLUMNA IZQUIERDA: GALERÍA (Premium White Box Reducido) === */}
          <div className="w-full lg:w-[45%] flex flex-col gap-4 relative lg:sticky lg:top-24 h-fit">
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, type: "spring" }}
              ref={imageContainerRef} onMouseMove={handleMouseMove} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
              className={`bg-[#FBFBF2] rounded-2xl flex items-center justify-center border border-white/5 shadow-[0_15px_40px_rgba(0,0,0,0.3)] relative overflow-hidden group flex-1 min-h-[300px] lg:min-h-[420px] w-full aspect-square lg:aspect-auto ${isScannerActive ? 'cursor-default' : 'cursor-none'}`}
            >
               <motion.img 
                 key={`normal-${currentImageIndex}`} src={product.images[currentImageIndex]} alt={cleanName} 
                 className={`relative z-10 w-auto h-auto max-w-[80%] max-h-[80%] transition-all duration-500 ease-out object-contain mix-blend-multiply drop-shadow-[0_15px_25px_rgba(0,0,0,0.08)] ${isZooming && !isScannerActive ? 'opacity-0' : 'opacity-100 group-hover:scale-105'}`} 
                 onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/600x600/FBFBF2/0866bd?text=${encodeURIComponent(product.category)}`; }}
               />
               
               {/* Lupa Flotante */}
               {isZooming && !isScannerActive && (
                 <motion.div
                   className="pointer-events-none absolute z-20 rounded-full border border-slate-200 shadow-[0_15px_30px_rgba(0,0,0,0.15)] overflow-hidden bg-[#FBFBF2]"
                   style={{ x: smoothMouseX, y: smoothMouseY, translateX: "-50%", translateY: "-50%", width: 220, height: 220 }}
                 >
                   <motion.div 
                     className="w-full h-full mix-blend-multiply"
                     style={{
                       backgroundImage: `url(${product.images[currentImageIndex]})`,
                       backgroundPosition: bgPositionTemplate, 
                       backgroundSize: '200%', 
                       backgroundRepeat: 'no-repeat',
                     }}
                   />
                 </motion.div>
               )}

               {/* Escáner Táctico (Modo Azul Brand) */}
               <AnimatePresence>
                 {isScannerActive && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 bg-[#021830]/10 backdrop-blur-[2px] pointer-events-none">
                     <div className="absolute inset-0 bg-[linear-gradient(rgba(8,102,189,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(8,102,189,0.2)_1px,transparent_1px)] bg-[size:30px_30px]"></div>
                     <motion.div 
                       animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                       className="absolute left-0 w-full h-[1.5px] bg-[#0866bd] shadow-[0_0_15px_rgba(8,102,189,1)]"
                     />
                   </motion.div>
                 )}
               </AnimatePresence>

               {/* Botones Flotantes de la Galería */}
               <div className="absolute bottom-4 right-4 flex gap-2 z-40">
                 <button 
                   onClick={() => setIsScannerActive(!isScannerActive)}
                   className={`p-3 rounded-xl transition-all duration-300 shadow-sm border ${isScannerActive ? 'bg-[#0866bd] text-[#FBFBF2] border-[#0866bd]' : 'bg-white/90 text-[#03254c] border-slate-200 hover:bg-[#03254c] hover:text-[#FBFBF2] hover:border-transparent'}`}
                   title="Escáner"
                 >
                   <ScanSearch size={16} strokeWidth={1.5} className={isScannerActive ? 'animate-pulse' : ''}/>
                 </button>
               </div>
               
               {product.isUniversal && (
                 <div className="absolute top-4 left-4 bg-[#0866bd] text-white text-[8px] font-black px-3 py-1.5 rounded-md uppercase tracking-widest shadow-sm flex items-center gap-1.5 z-30">
                   <Zap size={10} className="fill-current" /> Ajuste Universal
                 </div>
               )}
            </motion.div>

            {/* Miniaturas */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 px-1">
                {product.images.map((img, idx) => (
                  <motion.button 
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} key={idx} onClick={() => setCurrentImageIndex(idx)}
                    className={`w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden transition-all p-1.5 bg-[#FBFBF2] relative border ${currentImageIndex === idx ? 'border-[#0866bd] shadow-[0_2px_10px_rgba(8,102,189,0.2)]' : 'border-transparent opacity-70 hover:opacity-100 hover:shadow-sm'}`}
                  >
                    <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-contain mix-blend-multiply"/>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* === COLUMNA DERECHA: INFO Y COMPRA === */}
          <div className="w-full lg:w-[55%] flex flex-col h-fit relative text-[#FBFBF2]">
            
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1, type: "spring" }}>
              
              <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tight mb-4 leading-tight text-[#FBFBF2]">
                {cleanName}
              </h1>

              {/* Etiquetas Elegantes Reducidas */}
              <div className="flex flex-wrap items-center gap-2.5 mb-6">
                <div className="flex items-center gap-1 bg-[#0866bd]/10 border border-[#0866bd]/30 text-[#0866bd] px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest">
                  <Star size={10} className="fill-current text-[#FACC15]" /> {averageRating > 0 ? averageRating.toFixed(1) : 'Nuevo'}
                </div>
                <span className="text-[9px] font-bold text-[#FBFBF2]/80 uppercase tracking-widest bg-[#03254c] px-2.5 py-1 rounded-md border border-white/5">Refacción OEM</span>
                <span className="text-[9px] font-bold text-[#FBFBF2]/60 uppercase tracking-widest bg-[#03254c] px-2.5 py-1 rounded-md border border-white/5">SKU: {product.sku}</span>
              </div>
              
              {/* === MÓDULO DE STOCK === */}
              <AnimatePresence mode="wait">
                {product.stock > 0 && product.stock <= 10 && (
                   <motion.div 
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      className="w-full mb-6 p-3 rounded-xl flex items-center gap-3 relative overflow-hidden bg-[#03254c]/40 border border-white/5 shadow-inner"
                   >
                      <div className={`absolute top-0 left-0 w-1 h-full ${product.stock <= 3 ? 'bg-[#EF4444]' : 'bg-[#FACC15]'}`}></div>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#021830] border border-white/5">
                         {product.stock <= 3 ? <Flame className="text-[#EF4444]" size={16} strokeWidth={1.5} /> : <Clock className="text-[#FACC15]" size={16} strokeWidth={1.5} />}
                      </div>
                      <div>
                         <p className={`font-bold text-[9px] uppercase tracking-widest ${product.stock <= 3 ? 'text-[#EF4444]' : 'text-[#FACC15]'}`}>
                           {product.stock <= 3 ? 'Alta Demanda' : 'Inventario Limitado'}
                         </p>
                         <p className="text-[11px] font-medium mt-0.5 text-[#FBFBF2]/70">
                            Quedan <span className={`font-black ${product.stock <= 3 ? 'text-[#EF4444]' : 'text-[#FACC15]'}`}>{product.stock}</span> piezas físicas.
                         </p>
                      </div>
                   </motion.div>
                )}
              </AnimatePresence>

              {/* === TARJETA DE COMPRA (Navy & Brand Blue) === */}
              <div ref={buySectionRef} className="mb-6 flex flex-col bg-[#03254c]/80 backdrop-blur-xl p-6 sm:p-8 rounded-2xl border border-white/5 shadow-[0_15px_30px_rgba(0,0,0,0.4)] relative group">
                
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={addedAnimation ? 'added' : 'price'}
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                    className="flex flex-col items-baseline gap-1 mb-6 relative z-10 w-full"
                  >
                    {addedAnimation ? (
                      <div className="flex items-center gap-3 bg-[#0866bd]/10 text-[#0866bd] px-5 py-4 rounded-xl border border-[#0866bd]/30 w-full shadow-inner">
                         <CheckCircle size={20} strokeWidth={2} />
                         <span className="text-[11px] font-bold uppercase tracking-widest mt-0.5 text-[#FBFBF2]">En tu orden</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-3">
                         <span className="text-3xl sm:text-4xl font-black text-[#FBFBF2] tracking-tighter leading-none">
                           {formatMXN(product.price)}
                         </span>
                         {product.originalPrice && (
                           <span className="text-sm text-[#FBFBF2]/40 line-through font-bold tracking-tight decoration-[#EF4444]/70 decoration-2">
                             {formatMXN(product.originalPrice)}
                           </span>
                         )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full relative z-10">
                  {/* Selector de cantidad */}
                  <div className="flex items-center bg-[#021830] border border-white/10 rounded-xl h-12 sm:w-32 overflow-hidden focus-within:border-[#0866bd]/50 transition-all shadow-inner shrink-0">
                     <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={product.stock === 0} className="w-10 h-full text-[#FBFBF2]/50 hover:bg-[#0866bd] hover:text-[#FBFBF2] transition-colors text-lg font-bold disabled:opacity-50">-</button>
                     <span className="flex-1 text-center font-black text-[#FBFBF2] text-sm border-x border-white/5">{qty}</span>
                     <button onClick={() => setQty(Math.min(product.stock, qty + 1))} disabled={product.stock === 0} className="w-10 h-full text-[#FBFBF2]/50 hover:bg-[#0866bd] hover:text-[#FBFBF2] transition-colors text-lg font-bold disabled:opacity-50">+</button>
                  </div>
                  
                  {/* Botón de compra Brand Blue */}
                  <motion.button 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAdd} disabled={product.stock === 0}
                    className="relative flex-1 overflow-hidden bg-[#0866bd] text-[#FBFBF2] font-black uppercase tracking-[0.15em] rounded-xl shadow-[0_10px_20px_rgba(8,102,189,0.3)] hover:shadow-[0_15px_25px_rgba(8,102,189,0.4)] transition-all duration-300 text-[10px] flex items-center justify-center h-12 group disabled:opacity-50 border border-blue-400/30"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {product.stock === 0 ? 'AGOTADO' : <><ShoppingCart size={16} className="group-hover:scale-110 transition-transform" /> Añadir a la orden</>}
                    </span>
                  </motion.button>
                </div>
              </div>

              {/* Logística Compacta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                 <div className="bg-[#03254c]/40 p-4 rounded-xl border border-white/5 flex items-center gap-3">
                   <div className="bg-[#021830] text-[#0866bd] p-2 rounded-lg shrink-0 border border-white/5"><Store size={14} strokeWidth={2}/></div>
                   <div>
                     <p className="text-[8px] font-bold text-[#FBFBF2]/50 uppercase tracking-widest mb-0.5">Logística</p>
                     <p className="text-[11px] font-bold text-[#FBFBF2]">Recolección Local</p>
                   </div>
                 </div>

                 <div className="bg-[#03254c]/40 p-4 rounded-xl border border-white/5 flex items-center gap-3">
                   <div className="bg-[#021830] text-[#0866bd] p-2 rounded-lg shrink-0 border border-white/5"><RefreshCcw size={14} strokeWidth={2}/></div>
                   <div>
                     <p className="text-[8px] font-bold text-[#FBFBF2]/50 uppercase tracking-widest mb-0.5">Confianza</p>
                     <p className="text-[11px] font-bold text-[#FBFBF2]">100% Garantizado</p>
                   </div>
                 </div>
              </div>

            </motion.div>
          </div>
        </div>
      </div>

      {/* === NAVEGACIÓN DE PESTAÑAS === */}
      <div className="max-w-[75rem] mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-20 relative z-10">
        
        <div className="flex border-b border-white/10 mb-6 overflow-x-auto custom-scrollbar relative">
          {NAV_TABS.map(tab => (
            <button 
              key={tab.id} onClick={() => setActiveTab(tab.id)} 
              className={`relative pb-3 px-6 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'text-[#0866bd]' : 'text-[#FBFBF2]/50 hover:text-[#FBFBF2]'}`}
            >
              <tab.icon size={14} strokeWidth={1.5} className={activeTab === tab.id ? 'text-[#0866bd]' : 'opacity-50'} />
              <span>{tab.label}</span>
              {tab.id === 'reviews' && (
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black transition-colors duration-300 ${activeTab === 'reviews' ? 'bg-[#0866bd] text-white' : 'bg-[#03254c] text-[#FBFBF2]/50'}`}>
                  {reviews.length}
                </span>
              )}
              {activeTab === tab.id && (
                <motion.div layoutId="active-tab-line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0866bd] rounded-t-full shadow-[0_-1px_5px_rgba(8,102,189,0.5)]" transition={{ type: "spring", stiffness: 500, damping: 30 }} />
              )}
            </button>
          ))}
        </div>
        
        <div className="min-h-[250px]">
           <AnimatePresence mode="wait">
             <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
               
               {/* TAB 1: INGENIERÍA */}
               {activeTab === 'desc' && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl">
                   {product.features.map((feat, idx) => (
                      <motion.div 
                        key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-3 p-5 bg-[#03254c]/30 rounded-xl border border-white/5 hover:bg-[#03254c]/50 transition-colors group"
                      >
                        <div className="bg-[#021830] p-2 rounded-lg border border-white/5 shrink-0">
                          <Check size={14} className="text-[#0866bd]"/>
                        </div>
                        <p className="text-[#FBFBF2]/80 text-xs font-medium leading-relaxed mt-0.5 group-hover:text-[#FBFBF2] transition-colors">{feat}</p>
                      </motion.div>
                   ))}
                 </div>
               )}

               {/* TAB 2: COMPATIBILIDAD */}
               {activeTab === 'compatibility' && (
                 <div className="max-w-3xl">
                    {product.isUniversal ? (
                      <div className="p-8 bg-[#03254c]/80 text-[#FBFBF2] rounded-2xl flex flex-col sm:flex-row items-center gap-6 border border-[#0866bd]/20 shadow-md">
                        <div className="w-16 h-16 bg-[#0866bd]/20 rounded-xl flex items-center justify-center text-[#0866bd] shrink-0 border border-[#0866bd]/30"><Zap size={28} strokeWidth={1.5} /></div>
                        <div className="text-center sm:text-left">
                          <h4 className="text-lg font-black uppercase tracking-tight mb-1 text-[#0866bd]">Ajuste Universal</h4>
                          <p className="text-xs text-[#FBFBF2]/80 font-medium leading-relaxed">
                            Componente diseñado para acoplarse a la mayoría de modelos sin necesidad de alteraciones mecánicas complejas.
                          </p>
                        </div>
                      </div>
                    ) : product.compatibility.length > 0 ? (
                      <div className="bg-[#03254c]/40 rounded-2xl border border-white/5 overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-white/5 bg-[#021830]/50 flex items-center gap-3">
                           <Search size={16} className="text-[#FBFBF2]/40" />
                           <input type="text" placeholder="Filtra por marca o modelo..." value={tabSearchTerm} onChange={(e) => setTabSearchTerm(e.target.value)} className="w-full bg-transparent border-none outline-none text-xs font-bold text-[#FBFBF2] placeholder:text-[#FBFBF2]/30" />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-5">
                           {tabFilteredCompatibility.length > 0 ? (
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                               {tabFilteredCompatibility.map((c, i) => (
                                 <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-[#021830]/30 hover:bg-[#021830] transition-colors group">
                                   <span className="font-bold text-[#FBFBF2] text-xs uppercase tracking-tight">{typeof c === 'object' ? `${c.marca} ${c.modelo}` : c}</span>
                                   <span className="text-[9px] font-black text-[#0866bd] uppercase tracking-widest bg-[#0866bd]/10 px-2.5 py-1 rounded border border-[#0866bd]/20">
                                     {typeof c === 'object' ? (c.años.length > 1 ? `${c.años[0]} - ${c.años[c.años.length-1]}` : c.años[0]) : 'Varios'}
                                   </span>
                                 </div>
                               ))}
                             </div>
                           ) : (
                             <div className="text-center py-10"><p className="text-[#FBFBF2]/40 font-bold uppercase text-[10px] tracking-widest">Modelo no encontrado.</p></div>
                           )}
                        </div>
                      </div>
                    ) : (
                      <div className="px-6 py-10 bg-[#03254c]/30 rounded-2xl text-xs text-[#FBFBF2]/50 font-medium text-center border border-white/5">Consulta especificaciones técnicas en mostrador.</div>
                    )}
                 </div>
               )}

               {/* TAB 3: COMUNIDAD (RESEÑAS) */}
               {activeTab === 'reviews' && (
                 <div className="max-w-4xl flex flex-col md:flex-row gap-8">
                   <div className="w-full md:w-1/3 flex flex-col">
                     <div className="bg-[#03254c]/80 p-6 rounded-2xl border border-white/5 text-center flex flex-col items-center">
                       <p className="text-5xl font-black text-[#FBFBF2] leading-none tracking-tighter mb-2">{averageRating > 0 ? averageRating.toFixed(1) : '0.0'}</p>
                       <div className="flex justify-center mb-3">{renderStars(averageRating)}</div>
                       <p className="text-[9px] text-[#FBFBF2]/50 font-bold mb-6 tracking-widest uppercase">De {reviews.length} opiniones</p>
                       <button onClick={() => setShowReviewForm(true)} className="w-full bg-[#0866bd] hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl transition-colors text-[10px] uppercase tracking-widest flex justify-center items-center gap-2">
                         <MessageCircle size={14}/> Escribir Reseña
                       </button>
                     </div>
                   </div>
                   
                   <div className="w-full md:w-2/3">
                     {reviews.length === 0 ? (
                       <div className="text-center py-16 bg-[#03254c]/20 rounded-2xl border border-white/5">
                         <div className="w-12 h-12 bg-[#021830] rounded-full flex items-center justify-center mx-auto mb-3 border border-white/5"><MessageCircle size={20} className="text-[#FBFBF2]/30" /></div>
                         <p className="text-sm font-bold text-[#FBFBF2] uppercase tracking-tight mb-1">Sé el primero en opinar</p>
                         <p className="text-[11px] text-[#FBFBF2]/50 font-medium">Comparte tu experiencia de uso.</p>
                       </div>
                     ) : (
                       <div className="space-y-4">
                         {reviews.map((rev) => (
                           <div key={rev.id} className="bg-[#03254c]/40 border border-white/5 rounded-2xl p-5 sm:p-6">
                             <div className="flex justify-between items-start mb-4">
                               <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 bg-[#0866bd] text-white font-black rounded-lg flex items-center justify-center text-sm uppercase border border-blue-400/30">
                                   {rev.name.charAt(0)}
                                 </div>
                                 <div>
                                   <p className="text-xs font-bold text-[#FBFBF2] uppercase tracking-tight mb-0.5">{rev.name}</p>
                                   {rev.verified && <p className="text-[8px] text-[#0866bd] font-bold uppercase tracking-widest flex items-center gap-1"><ShieldCheck size={10}/> Verificado</p>}
                                 </div>
                               </div>
                               <div className="flex gap-0.5 bg-[#021830] px-2 py-1 rounded-md border border-white/5">{renderStars(rev.rating)}</div>
                             </div>
                             <p className="text-[#FBFBF2]/70 text-xs leading-relaxed font-medium pl-12 relative">
                               <Quote size={14} className="absolute left-4 top-0 text-[#FBFBF2]/10 -rotate-180" />
                               {rev.comment}
                             </p>
                             <p className="text-[8px] text-[#FBFBF2]/40 mt-3 pl-12 font-bold uppercase tracking-widest">{new Date(rev.createdAt).toLocaleDateString('es-MX', dateOptions)}</p>
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

      {/* === MODAL DE RESEÑAS === */}
      <AnimatePresence>
        {showReviewForm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, backdropFilter: "blur(8px)" }} exit={{ opacity: 0, backdropFilter: "blur(0px)" }} className="absolute inset-0 bg-[#021830]/80" onClick={() => !isSubmittingReview && setShowReviewForm(false)}></motion.div>
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-[#021830] w-full max-w-md rounded-3xl relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden border border-white/10"
            >
              <div className="px-6 py-5 bg-[#03254c] flex justify-between items-center border-b border-white/5">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#FBFBF2] flex items-center gap-2">
                  <MessageCircle size={14} className="text-[#0866bd]"/> Tu Opinión
                </h3>
                <button onClick={() => !isSubmittingReview && setShowReviewForm(false)} className="text-[#FBFBF2]/40 hover:text-white transition-colors"><X size={18} strokeWidth={2}/></button>
              </div>
              
              <form onSubmit={handleSubmitReview} className="p-6 space-y-5">
                <div className="flex flex-col items-center mb-2">
                  <div className="flex gap-1.5 bg-[#03254c]/50 p-2.5 rounded-xl border border-white/5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setNewReview({...newReview, rating: star})} className="focus:outline-none transition-transform hover:scale-110 active:scale-90 p-1">
                        <Star size={28} fill={star <= newReview.rating ? "#FACC15" : "transparent"} strokeWidth={star <= newReview.rating ? 0 : 1.5} className={star <= newReview.rating ? "text-[#FACC15]" : "text-[#FBFBF2]/20"} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-[#FBFBF2]/50 uppercase tracking-widest mb-1.5 ml-1">Tu Nombre Público</label>
                  <input type="text" required placeholder="Ej. Juan Pérez" value={newReview.name} onChange={(e) => setNewReview({...newReview, name: e.target.value})} className="w-full bg-[#03254c]/50 border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-[#FBFBF2] focus:outline-none focus:border-[#0866bd] transition-colors placeholder:text-[#FBFBF2]/30"/>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-[#FBFBF2]/50 uppercase tracking-widest mb-1.5 ml-1">Comentario / Reseña</label>
                  <textarea required rows="3" placeholder="Describe tu experiencia..." value={newReview.comment} onChange={(e) => setNewReview({...newReview, comment: e.target.value})} className="w-full bg-[#03254c]/50 border border-white/5 rounded-xl p-4 text-xs font-bold text-[#FBFBF2] focus:outline-none focus:border-[#0866bd] transition-colors resize-none placeholder:text-[#FBFBF2]/30"></textarea>
                </div>

                <button 
                  type="submit" disabled={isSubmittingReview} 
                  className="w-full bg-[#0866bd] text-white font-bold py-3.5 rounded-xl uppercase tracking-widest transition-colors text-[10px] flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-blue-600 mt-2"
                >
                  {isSubmittingReview ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} strokeWidth={2}/>}
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
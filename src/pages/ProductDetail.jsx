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
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[300] px-6 py-4 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.1)] flex items-center gap-3 backdrop-blur-xl border ${
        type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-red-50 border-red-200 text-red-500'
      }`}
    >
      {type === 'success' ? <CheckCircle size={18} strokeWidth={2.5} /> : <AlertCircle size={18} strokeWidth={2.5} />}
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
          const productImages = data.images?.length > 0 ? data.images : [data.ImagenURL || data.image || "https://placehold.co/600x600/f8fafc/0866bd?text=Sin+Foto"];

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
            images: ["https://placehold.co/600x600/fef2f2/EF4444?text=Error"],
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
              img: relData.images?.[0] || "https://placehold.co/300x300/f8fafc/0866bd", category: relData.subCat || relData.cat || relData.Categoria 
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
      else stars.push(<Star key={i} size={14} className="text-slate-300" />);
    }
    return stars;
  };

  const tabFilteredCompatibility = product?.compatibility.filter(c => {
    const searchString = typeof c === 'object' ? `${c.marca} ${c.modelo} ${c.cilindraje}`.toLowerCase() : c.toLowerCase();
    return searchString.includes(tabSearchTerm.toLowerCase());
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(8,102,189,0.05)_0%,transparent_100%)]"></div>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="relative z-10 w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 border-t-2 border-r-2 border-[#0866bd] rounded-full opacity-80"></div>
          <div className="absolute inset-2 border-b-2 border-l-2 border-[#0866bd]/30 rounded-full opacity-50 animate-spin-reverse"></div>
          <Package className="text-[#0866bd]" size={24} strokeWidth={1.5} />
        </motion.div>
        <p className="font-black tracking-[0.3em] uppercase text-[10px] animate-pulse text-[#0866bd] relative z-10 mt-6">Accediendo al Inventario...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-800 bg-slate-50">
        <div className="w-20 h-20 bg-red-50 flex items-center justify-center rounded-2xl mb-6 shadow-sm border border-red-100">
          <AlertCircle size={40} className="text-red-500" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight mb-4">Pieza no encontrada</h2>
        <button onClick={() => navigate('/catalogo')} className="bg-[#0866bd] text-white uppercase font-black text-[10px] tracking-widest px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-[0_10px_20px_rgba(8,102,189,0.2)]">Volver al Inventario</button>
      </div>
    );
  }

  const cleanName = product.isUniversal ? product.name.replace(/universal/gi, '').trim() : product.name;

  return (
    <div className="bg-slate-50 min-h-screen selection:bg-[#0866bd] selection:text-white pb-20 relative overflow-hidden font-sans">
      
      {/* === BACKGROUND GRID LIGHT PREMIUM === */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(0,0,0,0.03)_1.5px,transparent_1.5px)] bg-[size:30px_30px] pointer-events-none fixed"></div>

      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* === STICKY ACTION BAR (HUD Inferior Estilo iOS) === */}
      <AnimatePresence>
        {showStickyBar && product.stock > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] sm:w-auto min-w-[320px] max-w-[600px] bg-white/95 backdrop-blur-2xl border border-slate-200 p-3 pl-6 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center justify-between gap-6"
          >
            <div className="flex flex-col hidden sm:flex overflow-hidden">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Shield size={10} className="text-[#0866bd]"/> {product.sku}</span>
              <span className="text-sm font-black text-slate-800 truncate max-w-[220px] drop-shadow-sm leading-tight uppercase">{cleanName}</span>
            </div>
            <div className="flex items-center gap-5 w-full sm:w-auto">
              <span className="text-xl font-black text-[#0866bd]">{formatMXN(product.price)}</span>
              <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }} onClick={handleAdd}
                className="flex-1 sm:flex-none relative overflow-hidden bg-[#0866bd] text-white font-black uppercase tracking-widest rounded-xl px-6 py-3 shadow-[0_10px_20px_rgba(8,102,189,0.3)] hover:shadow-[0_15px_30px_rgba(8,102,189,0.4)] text-[10px] flex items-center justify-center gap-2 group border border-transparent transition-all"
              >
                <ShoppingCart size={16} className="relative z-10" strokeWidth={2.5} /> <span className="relative z-10">Añadir</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[75rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 pt-28 sm:pt-32 relative z-10">
        
        {/* Migas de pan (Breadcrumbs) Claras */}
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 mb-8 border-b border-slate-200 pb-4">
          <Link to="/" className="hover:text-[#0866bd] transition-colors">Inicio</Link> <ChevronRight size={10} className="text-slate-300" />
          <Link to="/catalogo" className="hover:text-[#0866bd] transition-colors">Inventario</Link> <ChevronRight size={10} className="text-slate-300" />
          <span className="text-[#0866bd] truncate max-w-[120px] sm:max-w-none">{product.category}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* === COLUMNA IZQUIERDA: GALERÍA (Premium White Box) === */}
          <div className="w-full lg:w-[45%] flex flex-col gap-4 relative lg:sticky lg:top-28 h-fit">
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, type: "spring" }}
              ref={imageContainerRef} onMouseMove={handleMouseMove} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}
              className={`bg-white rounded-[2rem] flex items-center justify-center border border-slate-200 shadow-sm relative overflow-hidden group flex-1 min-h-[300px] lg:min-h-[460px] w-full aspect-square lg:aspect-auto ${isScannerActive ? 'cursor-default' : 'cursor-none'}`}
            >
               <motion.img 
                 key={`normal-${currentImageIndex}`} src={product.images[currentImageIndex]} alt={cleanName} 
                 className={`relative z-10 w-auto h-auto max-w-[85%] max-h-[85%] transition-all duration-500 ease-out object-contain mix-blend-multiply drop-shadow-[0_15px_30px_rgba(0,0,0,0.05)] ${isZooming && !isScannerActive ? 'opacity-0' : 'opacity-100 group-hover:scale-105'}`} 
                 onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/600x600/f8fafc/0866bd?text=${encodeURIComponent(product.category)}`; }}
               />
               
               {/* Lupa Flotante (Glassmorphism Claro) */}
               {isZooming && !isScannerActive && (
                 <motion.div
                   className="pointer-events-none absolute z-20 rounded-full border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden bg-white"
                   style={{ x: smoothMouseX, y: smoothMouseY, translateX: "-50%", translateY: "-50%", width: 240, height: 240 }}
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

               {/* Escáner Táctico (Modo Azul Brand Limpio) */}
               <AnimatePresence>
                 {isScannerActive && (
                   <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-30 bg-blue-50/40 backdrop-blur-[2px] pointer-events-none">
                     <div className="absolute inset-0 bg-[linear-gradient(rgba(8,102,189,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(8,102,189,0.1)_1px,transparent_1px)] bg-[size:30px_30px]"></div>
                     <motion.div 
                       animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                       className="absolute left-0 w-full h-[2px] bg-[#0866bd] shadow-[0_0_20px_rgba(8,102,189,0.6)]"
                     />
                   </motion.div>
                 )}
               </AnimatePresence>

               {/* Botones Flotantes de la Galería */}
               <div className="absolute bottom-5 right-5 flex gap-2 z-40">
                 <button 
                   onClick={() => setIsScannerActive(!isScannerActive)}
                   className={`p-3.5 rounded-xl transition-all duration-300 shadow-sm border ${isScannerActive ? 'bg-[#0866bd] text-white border-[#0866bd] shadow-[0_10px_20px_rgba(8,102,189,0.3)]' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-[#0866bd] hover:border-blue-200'}`}
                   title="Escáner"
                 >
                   <ScanSearch size={18} strokeWidth={2} className={isScannerActive ? 'animate-pulse' : ''}/>
                 </button>
               </div>
               
               {product.isUniversal && (
                 <div className="absolute top-5 left-5 bg-blue-50 text-[#0866bd] border border-blue-100 text-[9px] font-black px-3.5 py-2 rounded-lg uppercase tracking-widest shadow-sm flex items-center gap-1.5 z-30">
                   <Zap size={12} className="fill-current" /> Ajuste Universal
                 </div>
               )}
            </motion.div>

            {/* Miniaturas Claras */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 px-1">
                {product.images.map((img, idx) => (
                  <motion.button 
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} key={idx} onClick={() => setCurrentImageIndex(idx)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[1.2rem] flex-shrink-0 overflow-hidden transition-all p-2 bg-white relative border shadow-sm ${currentImageIndex === idx ? 'border-[#0866bd] shadow-[0_5px_15px_rgba(8,102,189,0.15)] ring-2 ring-[#0866bd]/20' : 'border-slate-200 opacity-60 hover:opacity-100 hover:border-blue-200'}`}
                  >
                    <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-contain mix-blend-multiply"/>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* === COLUMNA DERECHA: INFO Y COMPRA === */}
          <div className="w-full lg:w-[55%] flex flex-col h-fit relative text-slate-800">
            
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1, type: "spring" }}>
              
              <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter mb-5 leading-[1.05] text-slate-900 drop-shadow-sm">
                {cleanName}
              </h1>

              {/* Etiquetas Elegantes Reducidas */}
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest shadow-sm">
                  <Star size={12} className="fill-current text-[#FACC15]" /> {averageRating > 0 ? averageRating.toFixed(1) : 'Nuevo'}
                </div>
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-sm">Refacción OEM</span>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-sm">SKU: {product.sku}</span>
              </div>
              
              {/* === MÓDULO DE STOCK === */}
              <AnimatePresence mode="wait">
                {product.stock > 0 && product.stock <= 10 && (
                   <motion.div 
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      className={`w-full mb-8 p-4 rounded-2xl flex items-center gap-4 relative overflow-hidden border shadow-sm ${product.stock <= 3 ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}
                   >
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${product.stock <= 3 ? 'bg-[#EF4444]' : 'bg-[#FACC15]'}`}></div>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white shadow-sm">
                         {product.stock <= 3 ? <Flame className="text-[#EF4444]" size={20} strokeWidth={2} /> : <Clock className="text-[#FACC15]" size={20} strokeWidth={2} />}
                      </div>
                      <div>
                         <p className={`font-black text-[10px] uppercase tracking-widest ${product.stock <= 3 ? 'text-red-600' : 'text-amber-600'}`}>
                           {product.stock <= 3 ? 'Alta Demanda' : 'Inventario Limitado'}
                         </p>
                         <p className="text-[11px] font-bold mt-0.5 text-slate-600">
                           Quedan <span className={`font-black ${product.stock <= 3 ? 'text-red-500' : 'text-amber-500'}`}>{product.stock}</span> piezas físicas.
                         </p>
                      </div>
                   </motion.div>
                )}
              </AnimatePresence>

              {/* === TARJETA DE COMPRA (White & Brand Blue) === */}
              <div ref={buySectionRef} className="mb-8 flex flex-col bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-200 shadow-[0_15px_40px_rgba(0,0,0,0.04)] relative group">
                
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={addedAnimation ? 'added' : 'price'}
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                    className="flex flex-col items-baseline gap-1 mb-6 relative z-10 w-full"
                  >
                    {addedAnimation ? (
                      <div className="flex items-center gap-3 bg-emerald-50 text-emerald-600 px-6 py-4 rounded-xl border border-emerald-200 w-full shadow-sm">
                         <CheckCircle size={20} strokeWidth={2.5} />
                         <span className="text-[11px] font-black uppercase tracking-widest mt-0.5">Añadido a la orden</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-3">
                         <span className="text-4xl sm:text-5xl font-black text-[#0866bd] tracking-tighter leading-none drop-shadow-sm">
                           {formatMXN(product.price)}
                         </span>
                         {product.originalPrice && (
                           <span className="text-sm text-slate-400 line-through font-black tracking-tight decoration-red-400 decoration-2">
                             {formatMXN(product.originalPrice)}
                           </span>
                         )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full relative z-10">
                  {/* Selector de cantidad (SaaS Style) */}
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl h-14 sm:w-36 overflow-hidden focus-within:border-[#0866bd] focus-within:bg-white transition-all shadow-inner shrink-0">
                     <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={product.stock === 0} className="w-12 h-full text-slate-500 hover:bg-[#0866bd] hover:text-white transition-colors text-xl font-black disabled:opacity-50">-</button>
                     <span className="flex-1 text-center font-black text-slate-800 text-base bg-white border-x border-slate-200 h-full flex items-center justify-center">{qty}</span>
                     <button onClick={() => setQty(Math.min(product.stock, qty + 1))} disabled={product.stock === 0} className="w-12 h-full text-slate-500 hover:bg-[#0866bd] hover:text-white transition-colors text-xl font-black disabled:opacity-50">+</button>
                  </div>
                  
                  {/* Botón de compra Brand Blue */}
                  <motion.button 
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAdd} disabled={product.stock === 0}
                    className="relative flex-1 overflow-hidden bg-[#0866bd] hover:bg-blue-700 text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-[0_15px_30px_rgba(8,102,189,0.25)] hover:shadow-[0_20px_40px_rgba(8,102,189,0.35)] transition-all duration-300 text-[10px] sm:text-xs flex items-center justify-center h-14 group disabled:opacity-50 border border-[#0866bd]"
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] group-hover:bg-[position:200%_0,0_0] transition-[background-position] duration-[1.5s]"></div>
                    <span className="relative z-10 flex items-center gap-3">
                      {product.stock === 0 ? 'AGOTADO' : <><ShoppingCart size={18} className="group-hover:scale-110 transition-transform" strokeWidth={2.5}/> Añadir a la orden</>}
                    </span>
                  </motion.button>
                </div>
              </div>

              {/* Logística Compacta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                 <div className="bg-white p-4 sm:p-5 rounded-[1.5rem] border border-slate-200 shadow-sm flex items-center gap-4">
                   <div className="bg-blue-50 text-[#0866bd] p-2.5 rounded-xl shrink-0 border border-blue-100"><Store size={18} strokeWidth={2.5}/></div>
                   <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Logística</p>
                     <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Recolección Local</p>
                   </div>
                 </div>

                 <div className="bg-white p-4 sm:p-5 rounded-[1.5rem] border border-slate-200 shadow-sm flex items-center gap-4">
                   <div className="bg-blue-50 text-[#0866bd] p-2.5 rounded-xl shrink-0 border border-blue-100"><RefreshCcw size={18} strokeWidth={2.5}/></div>
                   <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Confianza</p>
                     <p className="text-xs font-black text-slate-800 uppercase tracking-tight">100% Garantizado</p>
                   </div>
                 </div>
              </div>

            </motion.div>
          </div>
        </div>
      </div>

      {/* === NAVEGACIÓN DE PESTAÑAS (Clean Style) === */}
      <div className="max-w-[75rem] mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-24 relative z-10">
        
        <div className="flex border-b border-slate-200 mb-8 overflow-x-auto custom-scrollbar relative">
          {NAV_TABS.map(tab => (
            <button 
              key={tab.id} onClick={() => setActiveTab(tab.id)} 
              className={`relative pb-4 px-6 sm:px-8 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] transition-colors duration-300 flex items-center gap-2.5 whitespace-nowrap ${activeTab === tab.id ? 'text-[#0866bd]' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <tab.icon size={16} strokeWidth={2.5} className={activeTab === tab.id ? 'text-[#0866bd]' : 'opacity-60'} />
              <span>{tab.label}</span>
              {tab.id === 'reviews' && (
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black transition-colors duration-300 ${activeTab === 'reviews' ? 'bg-[#0866bd] text-white shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                  {reviews.length}
                </span>
              )}
              {activeTab === tab.id && (
                <motion.div layoutId="active-tab-line" className="absolute bottom-0 left-0 right-0 h-1 bg-[#0866bd] rounded-t-full shadow-[0_-2px_8px_rgba(8,102,189,0.4)]" transition={{ type: "spring", stiffness: 500, damping: 30 }} />
              )}
            </button>
          ))}
        </div>
        
        <div className="min-h-[300px]">
           <AnimatePresence mode="wait">
             <motion.div key={activeTab} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.4 }}>
               
               {/* TAB 1: INGENIERÍA */}
               {activeTab === 'desc' && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl">
                   {product.features.map((feat, idx) => (
                      <motion.div 
                        key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-4 p-6 bg-white rounded-[1.5rem] border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all group"
                      >
                        <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100 shrink-0 group-hover:bg-[#0866bd] group-hover:text-white transition-colors">
                          <Check size={16} strokeWidth={3} className="text-[#0866bd] group-hover:text-white transition-colors"/>
                        </div>
                        <p className="text-slate-600 text-xs font-bold leading-relaxed mt-1 group-hover:text-slate-900 transition-colors">{feat}</p>
                      </motion.div>
                   ))}
                 </div>
               )}

               {/* TAB 2: COMPATIBILIDAD */}
               {activeTab === 'compatibility' && (
                 <div className="max-w-4xl">
                    {product.isUniversal ? (
                      <div className="p-8 sm:p-10 bg-blue-50 text-slate-800 rounded-[2rem] flex flex-col sm:flex-row items-center gap-8 border border-blue-100 shadow-sm">
                        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-[#0866bd] shrink-0 border border-blue-200 shadow-sm"><Zap size={32} strokeWidth={2} /></div>
                        <div className="text-center sm:text-left">
                          <h4 className="text-xl font-black uppercase tracking-tight mb-2 text-[#0866bd]">Ajuste Universal</h4>
                          <p className="text-sm text-slate-600 font-bold leading-relaxed max-w-lg">
                            Componente de ingeniería adaptable. Diseñado para acoplarse a la mayoría de modelos y cilindradas sin necesidad de alteraciones mecánicas complejas.
                          </p>
                        </div>
                      </div>
                    ) : product.compatibility.length > 0 ? (
                      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
                           <Search size={20} className="text-slate-400" strokeWidth={2.5} />
                           <input type="text" placeholder="Busca por marca o modelo..." value={tabSearchTerm} onChange={(e) => setTabSearchTerm(e.target.value)} className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-800 placeholder:text-slate-400" />
                        </div>
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-6">
                           {tabFilteredCompatibility.length > 0 ? (
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                               {tabFilteredCompatibility.map((c, i) => (
                                 <div key={i} className="flex items-center justify-between p-5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-[#0866bd]/30 hover:shadow-sm transition-all group">
                                   <span className="font-black text-slate-800 text-xs uppercase tracking-tight group-hover:text-[#0866bd] transition-colors">{typeof c === 'object' ? `${c.marca} ${c.modelo}` : c}</span>
                                   <span className="text-[9px] font-black text-[#0866bd] uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100">
                                     {typeof c === 'object' ? (c.años.length > 1 ? `${c.años[0]} - ${c.años[c.años.length-1]}` : c.años[0]) : 'Varios'}
                                   </span>
                                 </div>
                               ))}
                             </div>
                           ) : (
                             <div className="text-center py-16">
                                <Search size={32} className="mx-auto text-slate-300 mb-4" strokeWidth={1.5}/>
                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Modelo no encontrado.</p>
                             </div>
                           )}
                        </div>
                      </div>
                    ) : (
                      <div className="px-8 py-12 bg-slate-50 rounded-[2rem] text-sm text-slate-500 font-bold text-center border border-slate-200">
                        <Wrench size={32} className="mx-auto text-slate-300 mb-4" strokeWidth={1.5}/>
                        Consulta especificaciones técnicas de compatibilidad directamente en mostrador.
                      </div>
                    )}
                 </div>
               )}

               {/* TAB 3: COMUNIDAD (RESEÑAS) */}
               {activeTab === 'reviews' && (
                 <div className="max-w-5xl flex flex-col md:flex-row gap-10">
                   <div className="w-full md:w-1/3 flex flex-col">
                     <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm text-center flex flex-col items-center">
                       <p className="text-6xl font-black text-slate-900 leading-none tracking-tighter mb-4">{averageRating > 0 ? averageRating.toFixed(1) : '0.0'}</p>
                       <div className="flex justify-center mb-4 gap-1">{renderStars(averageRating)}</div>
                       <p className="text-[10px] text-slate-400 font-black mb-8 tracking-widest uppercase">Basado en {reviews.length} opiniones</p>
                       <button onClick={() => setShowReviewForm(true)} className="w-full bg-slate-900 hover:bg-[#0866bd] text-white font-black py-4 rounded-xl transition-colors text-[10px] uppercase tracking-widest flex justify-center items-center gap-2 shadow-md">
                         <MessageCircle size={16} strokeWidth={2.5}/> Escribir Reseña
                       </button>
                     </div>
                   </div>
                   
                   <div className="w-full md:w-2/3">
                     {reviews.length === 0 ? (
                       <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-slate-200">
                         <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm"><MessageCircle size={24} className="text-slate-300" strokeWidth={2}/></div>
                         <p className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">Sé el primero en opinar</p>
                         <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">Comparte tu experiencia de uso con la comunidad biker de Tonalá.</p>
                       </div>
                     ) : (
                       <div className="space-y-5">
                         {reviews.map((rev) => (
                           <div key={rev.id} className="bg-white border border-slate-200 rounded-[1.5rem] p-6 sm:p-8 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group">
                             <div className="flex justify-between items-start mb-5">
                               <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-slate-100 text-[#0866bd] font-black rounded-xl flex items-center justify-center text-lg uppercase border border-slate-200 group-hover:bg-[#0866bd] group-hover:text-white transition-colors">
                                   {rev.name.charAt(0)}
                                 </div>
                                 <div>
                                   <p className="text-sm font-black text-slate-800 uppercase tracking-tight mb-1">{rev.name}</p>
                                   {rev.verified && <p className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-black uppercase tracking-widest flex items-center gap-1 w-max"><ShieldCheck size={10} strokeWidth={3}/> Verificado</p>}
                                 </div>
                               </div>
                               <div className="flex gap-1 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">{renderStars(rev.rating)}</div>
                             </div>
                             <p className="text-slate-600 text-sm leading-relaxed font-bold pl-16 relative">
                               <Quote size={20} className="absolute left-6 top-0 text-slate-200 -rotate-180" />
                               {rev.comment}
                             </p>
                             <p className="text-[9px] text-slate-400 mt-5 pl-16 font-black uppercase tracking-widest">{new Date(rev.createdAt).toLocaleDateString('es-MX', dateOptions)}</p>
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

      {/* === MODAL DE RESEÑAS (White Premium) === */}
      <AnimatePresence>
        {showReviewForm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, backdropFilter: "blur(8px)" }} exit={{ opacity: 0, backdropFilter: "blur(0px)" }} className="absolute inset-0 bg-slate-900/40" onClick={() => !isSubmittingReview && setShowReviewForm(false)}></motion.div>
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] relative z-10 shadow-[0_30px_60px_rgba(0,0,0,0.15)] overflow-hidden border border-slate-100"
            >
              <div className="px-8 py-6 bg-slate-50 flex justify-between items-center border-b border-slate-200">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                  <MessageCircle size={16} className="text-[#0866bd]" strokeWidth={2.5}/> Tu Opinión
                </h3>
                <button onClick={() => !isSubmittingReview && setShowReviewForm(false)} className="text-slate-400 hover:text-slate-800 bg-white p-1.5 rounded-full border border-slate-200 transition-all shadow-sm active:scale-90"><X size={16} strokeWidth={2.5}/></button>
              </div>
              
              <form onSubmit={handleSubmitReview} className="p-8 space-y-6">
                <div className="flex flex-col items-center mb-4">
                  <div className="flex gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 shadow-inner">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setNewReview({...newReview, rating: star})} className="focus:outline-none transition-transform hover:scale-110 active:scale-90 p-1">
                        <Star size={32} fill={star <= newReview.rating ? "#FACC15" : "transparent"} strokeWidth={star <= newReview.rating ? 0 : 2} className={star <= newReview.rating ? "text-[#FACC15]" : "text-slate-300"} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Tu Nombre Público</label>
                  <input type="text" required placeholder="Ej. Juan Pérez" value={newReview.name} onChange={(e) => setNewReview({...newReview, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0866bd] focus:bg-white transition-all shadow-inner focus:shadow-sm placeholder:text-slate-400"/>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Comentario / Reseña</label>
                  <textarea required rows="4" placeholder="Describe tu experiencia..." value={newReview.comment} onChange={(e) => setNewReview({...newReview, comment: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0866bd] focus:bg-white transition-all shadow-inner focus:shadow-sm resize-none placeholder:text-slate-400"></textarea>
                </div>

                <button 
                  type="submit" disabled={isSubmittingReview} 
                  className="w-full bg-[#0866bd] text-white font-black py-4 rounded-xl uppercase tracking-widest transition-all text-[10px] flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-blue-700 shadow-[0_10px_20px_rgba(8,102,189,0.2)] mt-4 active:scale-95"
                >
                  {isSubmittingReview ? <Loader2 size={16} className="animate-spin" strokeWidth={2.5}/> : <Send size={16} strokeWidth={2.5}/>}
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
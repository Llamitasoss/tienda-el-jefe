import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, limit, query, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { 
  ShieldCheck, Loader2, AlertCircle, Check, Star, StarHalf, Shield, Share2, Store, X, Search, CheckCircle, UserCircle2, Send, Zap, ShoppingCart, MessageCircle, ChevronRight, Package
} from 'lucide-react';
import { CartContext } from '../context/CartContext';
import ProductGrid from '../components/products/ProductGrid';

const NAV_TABS = [
  { id: 'desc', label: 'Ingeniería', icon: Package },
  { id: 'compatibility', label: 'Compatibilidad', icon: Shield },
  { id: 'reviews', label: 'Comunidad', icon: MessageCircle }
];

// --- COMPONENTE DE NOTIFICACIÓN ELEGANTE ---
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[300] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md border ${
        type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' : 'bg-red-500/90 border-red-400 text-white'
      }`}
    >
      {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
      <span className="text-xs font-bold uppercase tracking-widest">{message}</span>
    </motion.div>
  );
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const infoRef = useRef(null);
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('desc');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const [tabSearchTerm, setTabSearchTerm] = useState('');
  
  // --- NUEVA LÓGICA DE LUPA TOP-TIER ---
  const [isZooming, setIsZooming] = useState(false);
  const imageContainerRef = useRef(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 30, stiffness: 400, mass: 0.5 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const [bgPosition, setBgPosition] = useState('50% 50%');

  const handleMouseMove = (e) => {
    if (!imageContainerRef.current) return;
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    
    const x = e.clientX - left;
    const y = e.clientY - top;
    
    mouseX.set(x);
    mouseY.set(y);

    const percentX = (x / width) * 100;
    const percentY = (y / height) * 100;
    setBgPosition(`${percentX}% ${percentY}%`);
  };

  const handleMouseEnter = () => setIsZooming(true);
  const handleMouseLeave = () => setIsZooming(false);
  // ------------------------------------

  const [addedAnimation, setAddedAnimation] = useState(false);
  const [shareText, setShareText] = useState('Compartir');

  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', rating: 5, comment: '' });
  
  const [toast, setToast] = useState(null);

  const dateOptions = { day: 'numeric', month: 'short', year: 'numeric' };

  // === SOLUCIÓN: FUNCIÓN FALTANTE PARA FORMATEAR MONEDA ===
  const formatMXN = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);
  };
  // ========================================================

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
            features: data.caracteristicas || (data.Descripcion ? [data.Descripcion] : ["Pieza de alta calidad garantizada."]),
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

        const relSnap = await getDocs(query(collection(db, "productos"), limit(4)));
        let relProds = [];
        relSnap.forEach(d => {
          if (d.id !== id) {
            const relData = d.data();
            relProds.push({ 
              id: d.id, name: relData.name || relData.Nombre, price: relData.promoPrice || relData.price || relData.Precio, 
              img: relData.images?.[0] || "https://placehold.co/300x300/f8fafc/0866BD", 
              category: relData.subCat || relData.cat || relData.Categoria 
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
    for(let i=0; i<qty; i++){ addToCart(product); }
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
      const reviewData = { 
        name: newReview.name, 
        rating: newReview.rating, 
        comment: newReview.comment, 
        createdAt: new Date().toISOString(), 
        verified: true 
      };
      
      const docRef = await addDoc(collection(db, `productos/${id}/reseñas`), reviewData);
      const updatedReviews = [{ id: docRef.id, ...reviewData }, ...reviews];
      
      setReviews(updatedReviews);
      setAverageRating(updatedReviews.reduce((acc, curr) => acc + curr.rating, 0) / updatedReviews.length);
      setShowReviewForm(false);
      setNewReview({ name: '', rating: 5, comment: '' });
      setToast({ message: "¡Reseña publicada con éxito!", type: 'success' });
      
    } catch (error) { 
      console.error("Error guardando reseña:", error);
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
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-400 bg-[#0f172a]">
        <Loader2 className="animate-spin mb-6 text-[#0866bd]" size={48} />
        <p className="font-bold tracking-[0.3em] uppercase text-[10px] animate-pulse text-blue-200">Sincronizando tecnología...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-400 bg-[#f8fafc]">
        <AlertCircle size={56} className="text-red-400 mb-6 drop-shadow-md" />
        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-4">Pieza no encontrada</h2>
        <button onClick={() => navigate('/catalogo')} className="text-[#0866bd] underline uppercase font-bold text-xs tracking-widest hover:text-blue-800 transition-colors">Volver al catálogo</button>
      </div>
    );
  }

  const cleanName = product.isUniversal ? product.name.replace(/universal/gi, '').trim() : product.name;

  return (
    <div className="bg-[#f8fafc] min-h-screen selection:bg-yellow-400 selection:text-slate-900 pb-20 overflow-x-hidden relative">
      
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(8,102,189,0.01)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(8,102,189,0.01)_1.5px,transparent_1.5px)] bg-[size:30px_30px] opacity-20 pointer-events-none"></div>

      <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 relative z-10">
        
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          
          {/* === COLUMNA IZQUIERDA: GALERÍA Y LUPA LÁSER === */}
          <div className="w-full lg:w-[55%] flex flex-col sm:flex-row gap-6">
            
            {/* Miniaturas */}
            {product.images.length > 1 && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-row sm:flex-col gap-4 overflow-x-auto custom-scrollbar justify-center sm:justify-start px-2 py-2 sm:py-0 shrink-0"
              >
                {product.images.map((img, idx) => (
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    key={idx} onClick={() => setCurrentImageIndex(idx)}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl border flex-shrink-0 overflow-hidden transition-all duration-500 p-2.5 bg-white relative shadow-sm ${currentImageIndex === idx ? 'border-yellow-400 shadow-[0_5px_15px_rgba(250,204,21,0.3)] ring-2 ring-yellow-400/20' : 'border-slate-100 opacity-60 hover:opacity-100 hover:border-slate-300'}`}
                  >
                    <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-contain mix-blend-multiply rounded-lg"/>
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* IMAGEN PRINCIPAL Y LUPA TOP-TIER */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, type: "spring" }}
              ref={imageContainerRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="bg-white rounded-[2rem] flex items-center justify-center border border-slate-100 shadow-[0_15px_40px_rgb(0,0,0,0.03)] relative overflow-hidden cursor-crosshair group transition-all duration-700 hover:shadow-[0_20px_50px_rgba(8,102,189,0.05)] hover:border-blue-100 flex-1 min-h-[300px] max-h-[500px] lg:max-h-[600px] aspect-square"
            >
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,1)_0%,rgba(248,250,252,0)_100%)] transition-opacity duration-500 group-hover:opacity-40"></div>

               <AnimatePresence mode="wait">
                 <motion.img 
                   key={currentImageIndex}
                   initial={{ opacity: 0, scale: 0.98 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 1.02 }}
                   transition={{ duration: 0.3 }}
                   src={product.images[currentImageIndex]} 
                   alt={cleanName} 
                   className="relative z-10 w-auto h-auto max-w-full max-h-full mix-blend-multiply transition-opacity duration-300 ease-out object-contain p-10 sm:p-14 drop-shadow-xl group-hover:drop-shadow-3xl" 
                   onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/600x600/f8fafc/0866BD?text=${encodeURIComponent(product.category)}`; }}
                 />
               </AnimatePresence>
               
               {/* === LA NUEVA LUPA FLOTANTE (GLASSMORPHISM) === */}
               {isZooming && (
                 <motion.div
                   className="pointer-events-none absolute z-20 rounded-full border-2 border-white/40 shadow-[0_15px_35px_rgba(0,0,0,0.2),inset_0_0_20px_rgba(8,102,189,0.2)] overflow-hidden bg-white/10 backdrop-blur-sm"
                   style={{
                     x: smoothMouseX,
                     y: smoothMouseY,
                     translateX: "-50%",
                     translateY: "-50%",
                     width: 250,
                     height: 250,
                   }}
                 >
                   <div 
                     className="w-full h-full"
                     style={{
                       backgroundImage: `url(${product.images[currentImageIndex]})`,
                       backgroundPosition: bgPosition,
                       backgroundSize: '250%', 
                       backgroundRepeat: 'no-repeat',
                     }}
                   />
                   <div className="absolute inset-0 flex items-center justify-center opacity-30 mix-blend-overlay">
                     <div className="w-full h-[1px] bg-[#0866bd]"></div>
                     <div className="absolute h-full w-[1px] bg-[#0866bd]"></div>
                   </div>
                 </motion.div>
               )}
               
               {product.isUniversal && (
                 <div className="absolute top-5 left-5 bg-gradient-to-r from-emerald-400 to-emerald-600 text-white text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-[0.2em] shadow-[0_10px_20px_rgba(16,185,129,0.3)] flex items-center gap-2 z-30 backdrop-blur-md border border-white/20">
                   <Zap size={12} className="animate-pulse" /> Plug & Play
                 </div>
               )}
            </motion.div>
          </div>

          {/* === COLUMNA DERECHA: INFO Y COMPRA STICKY === */}
          <div className="w-full lg:w-[45%] flex flex-col pt-2 lg:sticky lg:top-32 h-fit" ref={infoRef}>
            
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <div className="flex items-center justify-between mb-5 gap-4">
                <span className="text-[10px] font-black text-[#0866bd] uppercase tracking-[0.25em] bg-blue-50/80 backdrop-blur-sm px-5 py-2 rounded-full border border-blue-100/50 shadow-sm">
                  {product.category}
                </span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">SKU: {product.sku}</p>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 uppercase tracking-tighter mb-5 leading-[1.1] drop-shadow-sm">
                {cleanName}
              </h1>

              <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 max-w-xl">
                 Configura tu motocicleta en el buscador principal para garantizar la compatibilidad exacta de esta pieza. Calidad premium Moto Partes El Jefe.
              </p>
              
              <div className="mb-10 flex flex-col items-start bg-gradient-to-br from-white to-slate-50 p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.03)] relative overflow-hidden group hover:border-blue-100/50 transition-colors duration-500">
                <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-white to-transparent opacity-60 pointer-events-none transform skew-x-12 translate-x-10 group-hover:translate-x-20 transition-transform duration-1000"></div>
                
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={addedAnimation ? 'added' : 'price'}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="flex flex-col items-baseline gap-4 mb-5 relative z-10"
                  >
                    {addedAnimation ? (
                      <div className="flex items-center gap-3 bg-emerald-50 text-emerald-600 px-6 py-4 rounded-2xl border border-emerald-100 shadow-sm">
                         <CheckCircle size={24} />
                         <span className="text-sm font-black uppercase tracking-widest mt-0.5">¡Pieza agregada!</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-4">
                         <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#0866bd] to-blue-700 tracking-tighter drop-shadow-sm">
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
                
                <div className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-slate-200/70 shadow-sm bg-white relative z-10 transition-colors duration-500 group-hover:border-blue-100/50">
                   <div className="relative flex h-2.5 w-2.5">
                     <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${product.stock > 10 ? 'bg-emerald-400' : product.stock > 0 ? 'bg-yellow-400' : 'bg-red-400'}`}></span>
                     <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${product.stock > 10 ? 'bg-emerald-500' : product.stock > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 mt-0.5">
                     {product.stock > 10 ? 'Disponible en Almacén' : product.stock > 0 ? `¡Últimas ${product.stock} piezas!` : 'Agotado Temporalmente'}
                   </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-10 pb-10 border-b border-slate-100">
                <div className="flex items-center bg-white border-2 border-slate-100 rounded-[1.5rem] h-16 sm:w-36 overflow-hidden focus-within:border-[#0866bd] focus-within:shadow-[0_0_15px_rgba(8,102,189,0.15)] transition-all duration-300 shadow-sm shrink-0">
                   <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={product.stock === 0} className="w-12 h-full text-slate-400 hover:bg-slate-50 hover:text-[#0866bd] transition-colors text-xl font-bold disabled:opacity-50">-</button>
                   <span className="flex-1 text-center font-black text-slate-800 text-lg">{qty}</span>
                   <button onClick={() => setQty(Math.min(product.stock, qty + 1))} disabled={product.stock === 0} className="w-12 h-full text-slate-400 hover:bg-slate-50 hover:text-[#0866bd] transition-colors text-xl font-bold disabled:opacity-50">+</button>
                </div>
                
                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
                  onClick={handleAdd} disabled={product.stock === 0}
                  className="relative flex-1 overflow-hidden bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-900 font-black uppercase tracking-[0.25em] rounded-[1.5rem] shadow-[0_15px_30px_rgba(250,204,21,0.3)] hover:shadow-[0_20px_40px_rgba(250,204,21,0.4)] transition-all duration-500 text-xs flex items-center justify-center h-16 group disabled:opacity-50 disabled:grayscale"
                >
                  <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-[-25deg] group-hover:left-[200%] transition-all duration-1000 ease-in-out z-0"></div>
                  <span className="relative z-10 flex items-center gap-3">
                    {product.stock === 0 ? 'AGOTADO' : <><ShoppingCart size={20} className="group-hover:animate-bounce" /> Agregar Al Carrito</>}
                  </span>
                </motion.button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <motion.div whileHover={{ scale: 1.05, y: -2 }} className="flex items-center gap-4 bg-white/50 backdrop-blur-sm px-5 py-4 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-100 transition-colors group cursor-default">
                   <div className="bg-white border border-slate-100 shadow-sm p-3 rounded-xl group-hover:bg-[#0866bd] transition-colors duration-300 flex items-center justify-center shrink-0">
                     <ShieldCheck size={20} className="text-slate-300 group-hover:text-white transition-colors" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 group-hover:text-slate-800 transition-colors">Garantía</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-slate-600 transition-colors">Precisión Exacta</span>
                   </div>
                 </motion.div>
                 
                 <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={handleShare} className="flex items-center justify-end gap-3 text-[10px] font-black text-slate-400 hover:text-[#0866bd] transition-colors uppercase tracking-[0.2em] bg-white shadow-sm hover:shadow-md px-5 py-4 rounded-2xl border border-slate-100 hover:border-slate-200">
                   <AnimatePresence mode="wait">
                     {shareText === '¡Copiado!' ? (
                       <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.2 }}><CheckCircle size={18} className="text-emerald-500" /></motion.div>
                     ) : (
                       <motion.div key="share" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.2 }}><Share2 size={18} className="text-[#0866bd]"/></motion.div>
                     )}
                   </AnimatePresence>
                   <span className={`mt-0.5 ${shareText === '¡Copiado!' ? 'text-emerald-500' : ''}`}>{shareText}</span>
                 </motion.button>
              </div>

            </motion.div>
          </div>
        </div>
      </div>

      {/* === PESTAÑAS MODERNAS === */}
      <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 mt-24 scroll-mt-24 relative z-10">
        
        <div className="flex justify-center mb-8 relative z-10">
          <div className="bg-slate-200/50 backdrop-blur-md p-1.5 rounded-full inline-flex shadow-inner relative border border-white/50 overflow-x-auto custom-scrollbar max-w-full">
            {NAV_TABS.map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)} 
                className={`relative py-3.5 px-6 sm:px-9 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] rounded-full z-10 transition-colors duration-500 flex items-center gap-2.5 whitespace-nowrap ${activeTab === tab.id ? 'text-[#0866bd]' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <tab.icon size={16} strokeWidth={2.5} className={`shrink-0 ${activeTab === tab.id ? 'opacity-100' : 'opacity-50'}`} />
                <span>{tab.label}</span>
                {tab.id === 'reviews' && (
                  <span className={`px-2.5 py-1 rounded-md text-[9px] font-black transition-colors duration-500 shadow-sm ${activeTab === 'reviews' ? 'bg-blue-100 text-[#0866bd]' : 'bg-slate-300/50 text-slate-500'}`}>
                    {reviews.length}
                  </span>
                )}
                {activeTab === tab.id && (
                  <motion.div layoutId="active-tab" className="absolute inset-0 bg-white rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.08)] -z-10" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Contenido de Pestañas */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="bg-white/90 backdrop-blur-3xl rounded-[3rem] p-6 sm:p-14 min-h-[300px] shadow-[0_20px_50px_rgb(0,0,0,0.03)] border border-white/70 relative -mt-16 pt-24"
        >
           <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-100/50 rounded-full blur-[100px] pointer-events-none opacity-40"></div>
           
           <AnimatePresence mode="wait">
             <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
               
               {/* === TAB 1: INGENIERÍA === */}
               {activeTab === 'desc' && (
                 <div className="max-w-4xl mx-auto">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-7">
                     {product.features.map((feat, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: idx * 0.1 }}
                          whileHover={{ y: -5, backgroundColor: "#ffffff", borderColor: "#e2e8f0", boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}
                          className="flex items-start gap-5 p-7 sm:p-8 bg-slate-50/50 rounded-[2rem] border border-transparent transition-all duration-300 group shadow-inner"
                        >
                          <div className="mt-0.5 bg-white p-3 rounded-2xl shadow-sm shrink-0 group-hover:scale-110 group-hover:bg-yellow-400 group-hover:shadow-[0_10px_20px_rgba(250,204,21,0.4)] transition-all duration-300 border border-slate-100">
                            <Check size={20} strokeWidth={2.5} className="text-[#0866bd] group-hover:text-slate-900 transition-colors"/>
                          </div>
                          <p className="text-slate-600 text-sm font-bold leading-relaxed group-hover:text-slate-900 transition-colors mt-1">{feat}</p>
                        </motion.div>
                     ))}
                   </div>
                 </div>
               )}

               {/* === TAB 2: COMPATIBILIDAD === */}
               {activeTab === 'compatibility' && (
                 <div className="max-w-4xl mx-auto">
                    {product.isUniversal ? (
                      <div className="p-8 sm:p-12 bg-gradient-to-r from-emerald-50 to-white border border-emerald-100/50 rounded-[2rem] flex flex-col md:flex-row items-center gap-8 shadow-sm">
                        <div className="w-20 h-20 bg-white rounded-[1.5rem] flex items-center justify-center text-emerald-500 shrink-0 shadow-[0_10px_20px_rgba(16,185,129,0.2)] border border-emerald-100"><Zap size={40} className="animate-pulse" /></div>
                        <div className="text-center md:text-left">
                          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Instalación Plug & Play</h4>
                          <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-xl mx-auto md:mx-0">
                            Refacción universal diseñada bajo estándares <strong className="text-emerald-700 font-black">OEM Moto Partes El Jefe</strong> para adaptarse a la mayoría de motocicletas sin necesidad de modificaciones técnicas avanzadas.
                          </p>
                        </div>
                      </div>
                    ) : product.compatibility.length > 0 ? (
                      
                      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-[0_15px_50px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col relative">
                        <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/80 backdrop-blur-md sticky top-0 z-10">
                          <div className="relative group">
                            <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0866bd] transition-colors" />
                            <input 
                              type="text" 
                              placeholder="Filtra por marca, modelo o CC..." 
                              value={tabSearchTerm} 
                              onChange={(e) => setTabSearchTerm(e.target.value)} 
                              className="w-full bg-white border-2 border-slate-100 rounded-[1.5rem] pl-16 pr-6 py-5 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#0866bd] transition-all shadow-sm focus:shadow-[0_10px_20px_rgba(8,102,189,0.1)] placeholder:font-medium placeholder:text-slate-300" 
                            />
                          </div>
                        </div>

                        <div className="max-h-[450px] overflow-y-auto custom-scrollbar p-6 sm:p-10 bg-slate-50/30">
                           {tabFilteredCompatibility.length > 0 ? (
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                               {tabFilteredCompatibility.map((c, i) => (
                                 <motion.div 
                                   initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                                   key={i} 
                                   className="flex items-center justify-between p-6 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all duration-300 shadow-sm group relative overflow-hidden"
                                 >
                                   <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-blue-50/80 to-transparent group-hover:scale-x-125 transition-transform duration-700 opacity-60"></div>
                                   <span className="font-black text-slate-800 text-sm uppercase tracking-tight relative z-10">{typeof c === 'object' ? `${c.marca} ${c.modelo}` : c}</span>
                                   <span className="text-[10px] font-black text-[#0866bd] uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-xl border border-blue-100/50 relative z-10 shadow-inner">
                                     {typeof c === 'object' ? (c.años.length > 1 ? `${c.años[0]} - ${c.años[c.años.length-1]}` : c.años[0]) : 'Varios'}
                                   </span>
                                 </motion.div>
                               ))}
                             </div>
                           ) : (
                             <div className="text-center py-20 flex flex-col items-center bg-white rounded-[2rem] border border-slate-100 border-dashed">
                               <Search size={40} className="text-slate-200 mb-4" />
                               <p className="text-slate-700 font-black text-lg uppercase tracking-tight">Modelo no encontrado</p>
                               <p className="text-slate-400 text-sm font-medium mt-2 max-w-xs">Intenta escribir solo el cilindraje o la marca para ver opciones.</p>
                             </div>
                           )}
                        </div>
                        <div className="h-10 w-full bg-gradient-to-t from-slate-50 to-transparent absolute bottom-0 left-0 pointer-events-none"></div>
                      </div>
                      
                    ) : (
                      <div className="px-8 py-10 bg-slate-50 rounded-[2rem] text-sm text-slate-500 font-medium text-center border border-slate-100">Información de compatibilidad detallada no disponible. Contacta soporte para confirmar si le queda a tu motocicleta.</div>
                    )}
                 </div>
               )}

               {/* === TAB 3: RESEÑAS === */}
               {activeTab === 'reviews' && (
                 <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12 lg:gap-20">
                   
                   {/* Resumen Izquierdo */}
                   <div className="w-full md:w-1/3 flex flex-col items-center text-center">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">Calificación Global</h4>
                     <p className="text-7xl sm:text-[6rem] font-black text-slate-900 mb-4 tracking-tighter drop-shadow-md leading-none">{averageRating > 0 ? averageRating.toFixed(1) : '0.0'}</p>
                     <div className="flex justify-center mb-6 scale-125">{renderStars(averageRating)}</div>
                     <p className="text-[10px] text-slate-400 font-black mb-12 tracking-widest uppercase">
                       {reviews.length === 0 ? 'Sin reseñas registradas' : `Basado en ${reviews.length} opiniones de BIKERS`}
                     </p>
                     <motion.button 
                       whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }} 
                       whileTap={{ scale: 0.95 }} 
                       onClick={() => setShowReviewForm(true)}
                       className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl transition-all duration-300 text-[10px] uppercase tracking-[0.25em] shadow-[0_15px_30px_rgba(0,0,0,0.15)] flex justify-center items-center gap-3 relative overflow-hidden group"
                     >
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-25deg] group-hover:translate-x-full transition-transform duration-1000"></div>
                       <MessageCircle size={18} className="relative z-10"/> <span className="relative z-10 mt-0.5">Escribir Mi Reseña</span>
                     </motion.button>
                   </div>
                   
                   {/* Lista de Reseñas */}
                   <div className="w-full md:w-2/3 md:border-l border-slate-100 md:pl-16">
                     {reviews.length === 0 ? (
                       <div className="text-center py-20 bg-slate-50/50 rounded-[3rem] border border-slate-100 border-dashed">
                         <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100"><MessageCircle size={40} className="text-slate-300" /></div>
                         <p className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">Aún no hay comentarios</p>
                         <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto">Sé el primero en compartir tu experiencia de instalación y calidad con la comunidad.</p>
                       </div>
                     ) : (
                       <div className="space-y-8">
                         {reviews.map((rev) => (
                           <div key={rev.id} className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_40px_rgba(8,102,189,0.05)] transition-all duration-300 group">
                             <div className="flex justify-between items-start mb-6 gap-4">
                               <div className="flex items-center gap-5">
                                 <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-white text-[#0866bd] font-black rounded-2xl flex items-center justify-center text-xl uppercase shadow-inner border border-blue-100 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-[#0866bd] group-hover:to-blue-700 group-hover:text-white transition-all duration-500">
                                   {rev.name.charAt(0)}
                                 </div>
                                 <div>
                                   <p className="text-base font-black text-slate-800 uppercase tracking-tight mb-1">{rev.name}</p>
                                   {rev.verified && <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest flex items-center gap-1.5"><ShieldCheck size={14}/> Compra Verificada</p>}
                                 </div>
                               </div>
                               <div className="flex gap-1 shrink-0 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">{renderStars(rev.rating)}</div>
                             </div>
                             <p className="text-slate-600 text-sm leading-relaxed font-medium pl-[4.5rem] relative">
                               <Quote size={24} className="absolute left-4 top-0 text-slate-100 -rotate-180" />
                               {rev.comment}
                             </p>
                             <p className="text-[10px] text-slate-400 mt-6 pl-[4.5rem] font-black uppercase tracking-widest">{new Date(rev.createdAt).toLocaleDateString('es-MX', dateOptions)}</p>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 </div>
               )}

             </motion.div>
           </AnimatePresence>

        </motion.div>
      </div>

      {/* === PRODUCTOS RECOMENDADOS === */}
      <div className="mt-32 max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-100 rounded-full blur-[120px] pointer-events-none opacity-20"></div>
        <ProductGrid products={relatedProducts} title={<span className="text-3xl sm:text-4xl font-black uppercase text-slate-900 tracking-tight">Recomendados <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0866bd] to-blue-600">para ti</span></span>} isInteractiveCarrousel={true}/>
      </div>

      {/* === MODAL ESCRIBIR RESEÑA (Glassmorphism Premium) === */}
      <AnimatePresence>
        {showReviewForm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={() => !isSubmittingReview && setShowReviewForm(false)}></motion.div>
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="relative bg-white rounded-[3rem] w-full max-w-lg flex flex-col shadow-[0_40px_80px_rgba(0,0,0,0.4)] overflow-hidden border border-white/20"
            >
              <div className="px-10 py-8 bg-gradient-to-br from-[#0866bd] to-blue-900 text-white flex justify-between items-center shrink-0 relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                <h3 className="text-xs font-black uppercase tracking-[0.25em] flex items-center gap-3 relative z-10">
                  <div className="bg-yellow-400 text-slate-900 p-2 rounded-xl shadow-inner"><Star size={16} className="fill-current"/></div> Mi Opinión Biker
                </h3>
                <button onClick={() => !isSubmittingReview && setShowReviewForm(false)} className="text-blue-200 hover:text-white bg-white/10 p-2.5 rounded-full shadow-sm hover:bg-white/20 transition-all relative z-10"><X size={18} strokeWidth={2.5}/></button>
              </div>
              
              <form onSubmit={handleSubmitReview} className="p-10 space-y-8 bg-[#f8fafc] grow">
                <div className="flex flex-col items-center bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Selecciona tu calificación</p>
                  <div className="flex justify-center gap-2 sm:gap-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setNewReview({...newReview, rating: star})} className="focus:outline-none transition-transform hover:scale-125 hover:-translate-y-2 active:scale-90 p-2 duration-300">
                        <Star size={40} fill={star <= newReview.rating ? "#ffc107" : "transparent"} strokeWidth={star <= newReview.rating ? 0 : 2} className={star <= newReview.rating ? "text-[#ffc107] drop-shadow-[0_10px_15px_rgba(255,193,7,0.6)]" : "text-slate-300"} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Tu Nombre (Público)</label>
                  <div className="relative group">
                    <UserCircle2 size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0866bd] transition-colors" />
                    <input type="text" required placeholder="Ej. Juan Pérez" value={newReview.name} onChange={(e) => setNewReview({...newReview, name: e.target.value})} className="w-full bg-white border-2 border-slate-100 rounded-[1.5rem] pl-16 pr-6 py-5 text-sm font-bold text-slate-700 focus:outline-none focus:border-[#0866bd] transition-all shadow-sm focus:shadow-[0_10px_20px_rgba(8,102,189,0.1)] placeholder:font-medium placeholder:text-slate-300"/>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">¿Qué te pareció la calidad?</label>
                  <textarea required rows="4" placeholder="La pieza llegó en perfectas condiciones y..." value={newReview.comment} onChange={(e) => setNewReview({...newReview, comment: e.target.value})} className="w-full bg-white border-2 border-slate-100 rounded-[1.5rem] p-6 text-sm font-bold text-slate-700 focus:outline-none focus:border-[#0866bd] transition-all shadow-sm resize-none leading-relaxed focus:shadow-[0_10px_20px_rgba(8,102,189,0.1)] placeholder:font-medium placeholder:text-slate-300"></textarea>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  type="submit" disabled={isSubmittingReview} 
                  className="w-full bg-slate-900 hover:bg-black text-white font-black px-8 py-5 rounded-[1.5rem] uppercase tracking-[0.25em] transition-all duration-300 text-[11px] flex items-center justify-center h-16 gap-3 disabled:opacity-50 disabled:grayscale shadow-[0_15px_30px_rgba(0,0,0,0.2)] relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out"></div>
                  {isSubmittingReview ? <><Loader2 size={20} className="animate-spin relative z-10" /> <span className="relative z-10 mt-0.5">Publicando...</span></> : <><Send size={20} className="relative z-10 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" /> <span className="relative z-10 mt-0.5">Publicar Mi Reseña</span></>}
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
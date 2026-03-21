import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, limit, query, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  ShieldCheck, CheckCircle2, MessageCircle, Loader2, AlertCircle, 
  Check, Star, StarHalf, Shield, Share2, Store, X, Search, CheckCircle, UserCircle2, Send
} from 'lucide-react';
import { CartContext } from '../context/CartContext';
import ProductGrid from '../components/products/ProductGrid';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const tabsRef = useRef(null);
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('desc');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // MODALES
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // LUPA Y COMPARTIR
  const [zoomPosition, setZoomPosition] = useState('50% 50%');
  const [isZooming, setIsZooming] = useState(false);
  const [shareText, setShareText] = useState('Compartir producto');

  // SISTEMA DE RESEÑAS FIREBASE
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [newReview, setNewReview] = useState({ name: '', rating: 5, comment: '' });

  const dateOptions = { day: 'numeric', month: 'long', year: 'numeric' };

  useEffect(() => {
    const fetchProductAndReviews = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "productos", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const productImages = data.images?.length > 0 
            ? data.images 
            : [data.ImagenURL || data.image || "https://placehold.co/600x600/f8fafc/0866BD?text=Sin+Foto"];

          setProduct({
            id: docSnap.id,
            // AQUÍ ESTÁ LA CORRECCIÓN DEL SKU: Ahora busca en todas partes
            sku: data.sku || data.id || data.Codigo || docSnap.id.slice(0, 8).toUpperCase(),
            name: data.name || data.Nombre,
            category: data.subCat || data.cat || data.Categoria || "Refacción",
            price: data.price || data.Precio || 0,
            originalPrice: data.promoPrice ? data.price : (data.PrecioBase || null),
            images: productImages,
            features: data.caracteristicas || (data.Descripcion ? [data.Descripcion] : ["Pieza de alta calidad garantizada."]),
            compatibility: data.compatibilidad || []
          });
        } else {
          setProduct({
            id: id, sku: "DEMO-001", name: "Refacción de Demostración", category: "General", price: 250,
            images: ["https://placehold.co/600x600/f8fafc/0866BD?text=Refaccion"],
            features: ["Pieza de demostración.", "No encontrada en Firebase."], compatibility: []
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
              id: d.id, name: relData.name || relData.Nombre, price: relData.price || relData.Precio, 
              img: relData.images?.[0] || "https://placehold.co/300x300/f8fafc/0866BD", 
              category: relData.subCat || relData.cat || relData.Categoria 
            });
          }
        });
        setRelatedProducts(relProds.slice(0, 4));

      } catch (error) {
        console.error("Error cargando datos:", error);
      }
      setLoading(false);
    };

    fetchProductAndReviews();
  }, [id]);

  const handleAdd = () => {
    if (!product) return;
    for(let i=0; i<qty; i++){ addToCart(product); }
    setQty(1);
  };

  const scrollToTabs = (tabName) => {
    setActiveTab(tabName);
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleShare = async () => {
    try {
      if (navigator.share && /mobile|android|iphone/i.test(navigator.userAgent)) {
        await navigator.share({ title: product.name, text: `Mira esta refacción: ${product.name}`, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShareText('¡Enlace copiado!');
        setTimeout(() => setShareText('Compartir producto'), 2000);
      }
    } catch (err) { console.error('Error al compartir:', err); }
  };

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));
    
    setZoomPosition(`${clampedX}% ${clampedY}%`);
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
      
      const newTotal = updatedReviews.reduce((acc, curr) => acc + curr.rating, 0);
      setAverageRating(newTotal / updatedReviews.length);

      setShowReviewForm(false);
      setNewReview({ name: '', rating: 5, comment: '' });
      
    } catch (error) {
      alert("Hubo un error al enviar tu reseña. Intenta de nuevo.");
    }
    setIsSubmittingReview(false);
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) stars.push(<Star key={i} size={16} fill="currentColor" className="text-[#ffc107]" />);
      else if (i - 0.5 <= rating) stars.push(<StarHalf key={i} size={16} fill="currentColor" className="text-[#ffc107]" />);
      else stars.push(<Star key={i} size={16} className="text-slate-200" />);
    }
    return stars;
  };

  const filteredCompatibility = product?.compatibility.filter(c => {
    const searchString = typeof c === 'object' ? `${c.marca} ${c.modelo} ${c.cilindraje}`.toLowerCase() : c.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  }) || [];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-bold tracking-widest uppercase text-sm">Cargando producto...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <AlertCircle size={64} className="text-red-400 mb-4" />
        <h2 className="text-2xl font-black text-slate-800 uppercase mb-4">Producto no encontrado</h2>
        <button onClick={() => navigate(-1)} className="text-[#0866bd] underline font-bold">Volver al catálogo</button>
      </div>
    );
  }

  return (
    <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 animate-fade-in relative bg-white sm:bg-transparent">
      
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
        
        {/* COLUMNA IZQUIERDA: GALERÍA Y LUPA */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6 animate-fade-in-up">
          <div 
            className="bg-slate-50/50 rounded-[2.5rem] flex items-center justify-center border border-slate-100 aspect-square shadow-sm relative overflow-hidden cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZooming(true)}
            onMouseLeave={() => setIsZooming(false)}
          >
             <img 
               src={product.images[currentImageIndex]} 
               alt={product.name} 
               className={`w-full h-full max-w-lg mix-blend-multiply transition-opacity duration-300 object-contain p-8 sm:p-16 ${isZooming ? 'opacity-0' : 'opacity-100'}`} 
               onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/600x600/f8fafc/0866BD?text=${encodeURIComponent(product.category)}`; }}
             />
             <div 
              className={`absolute inset-0 transition-opacity duration-200 rounded-[2.5rem] ${isZooming ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none'}`}
              style={{ 
                backgroundImage: `url(${product.images[currentImageIndex]})`, 
                backgroundPosition: zoomPosition, 
                backgroundSize: '175%', 
                backgroundRepeat: 'no-repeat', 
                backgroundColor: '#f8fafc' 
              }}
             />
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar justify-start">
              {product.images.map((img, idx) => (
                <button 
                  key={idx} onClick={() => setCurrentImageIndex(idx)}
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 flex-shrink-0 overflow-hidden transition-all duration-300 p-2 bg-white ${currentImageIndex === idx ? 'border-[#0866bd] shadow-lg shadow-blue-900/10 scale-105' : 'border-slate-100 hover:border-blue-200 opacity-60 hover:opacity-100 hover:-translate-y-1'}`}
                >
                  <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-contain mix-blend-multiply" onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/150x150/f8fafc/0866BD?text=Foto`; }}/>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: INFO Y COMPRA */}
        <div className="w-full lg:w-1/2 flex flex-col pt-2 animate-fade-in-up">
           
           <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0f172a] uppercase tracking-tight mb-4 leading-[1.1]">
             {product.name}
           </h1>
           
           <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
             <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{product.sku}</p>
             <div className="hidden sm:block text-slate-300">•</div>
             <div className="flex items-center gap-1.5 cursor-pointer group" onClick={() => scrollToTabs('reviews')}>
               <div className="flex">
                 {renderStars(averageRating)}
               </div>
               <span className="text-sm font-bold text-slate-500 group-hover:text-[#0866bd] ml-1 transition-colors underline-offset-4 group-hover:underline">
                 ({reviews.length} reseñas)
               </span>
             </div>
           </div>
           
           <div className="mb-8 p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
             <div className="flex items-baseline gap-4 mb-2">
               <span className="text-5xl sm:text-6xl font-black text-[#0866bd] tracking-tighter">
                 ${product.price.toLocaleString('es-MX')}
               </span>
               {product.originalPrice && (
                 <span className="text-xl text-slate-400 line-through font-bold">
                   ${product.originalPrice.toLocaleString('es-MX')}
                 </span>
               )}
             </div>
             <p className="text-sm font-medium text-slate-500">Precio exclusivo en línea.</p>
           </div>

           <div className="mb-10 border border-slate-200 rounded-[1.5rem] overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
             <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
               <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Compatible con:</span>
             </div>
             {product.compatibility.length > 0 ? (
               <div>
                 <table className="w-full text-left text-sm">
                   <thead className="bg-white border-b border-slate-100 text-slate-400">
                     <tr>
                       <th className="px-5 py-3 font-bold uppercase tracking-widest text-xs">Modelo</th>
                       <th className="px-5 py-3 font-bold uppercase tracking-widest text-xs text-right">Año</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {product.compatibility.slice(0, 3).map((c, idx) => (
                       <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                         <td className="px-5 py-3.5 font-bold text-slate-700 uppercase">
                           {typeof c === 'object' ? `${c.marca} ${c.modelo}` : c}
                         </td>
                         <td className="px-5 py-3.5 font-medium text-slate-500 text-right">
                           {typeof c === 'object' ? (c.años.length > 1 ? `${c.años[0]}-${c.años[c.años.length-1]}` : c.años[0]) : 'Varios'}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 {product.compatibility.length > 3 && (
                   <button 
                     onClick={() => setShowModal(true)}
                     className="w-full py-4 bg-blue-50/50 hover:bg-blue-50 text-[#0866bd] text-xs font-black uppercase tracking-widest transition-all duration-300 border-t border-blue-100 hover:tracking-[0.25em]"
                   >
                     Ver {product.compatibility.length - 3} modelos más
                   </button>
                 )}
               </div>
             ) : (
               <div className="px-5 py-4 text-sm text-slate-500 italic font-medium">Pieza de aplicación universal.</div>
             )}
           </div>

           <div className="flex flex-col sm:flex-row gap-4 mb-10">
             <div className="flex items-center bg-white border-2 border-slate-200 rounded-2xl h-16 sm:w-36 overflow-hidden focus-within:border-[#0866bd] transition-colors">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-12 h-full text-slate-400 hover:bg-slate-100 transition-colors text-2xl font-bold flex items-center justify-center">-</button>
                <span className="flex-1 text-center font-black text-slate-800 text-xl">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="w-12 h-full text-slate-400 hover:bg-slate-100 transition-colors text-2xl font-bold flex items-center justify-center">+</button>
             </div>
             
             <button 
               onClick={handleAdd} 
               className="flex-1 bg-[#ffc107] hover:bg-[#ffb300] text-slate-900 font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-yellow-500/20 active:scale-95 hover:-translate-y-1 transition-all duration-300 text-sm flex items-center justify-center h-16"
             >
                AGREGAR AL CARRITO
             </button>
           </div>

           <div className="space-y-5 border-t border-slate-200 pt-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Store size={20} className="text-[#0866bd]" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800 uppercase tracking-wide">Recolección en Tienda</p>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                    Compra en línea y pasa por tu refacción a nuestra sucursal. Sujeto a disponibilidad de inventario.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <Shield size={20} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800 uppercase tracking-wide">Compra 100% Protegida</p>
                  <p className="text-sm text-slate-500 mt-1">Garantía de compatibilidad. Si no le queda a tu moto, te la cambiamos.</p>
                </div>
              </div>
           </div>

           <div className="mt-8 flex justify-end">
             <button onClick={handleShare} className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-[#0866bd] transition-colors group px-3 py-2 rounded-xl hover:bg-blue-50">
               {shareText === '¡Enlace copiado!' ? <CheckCircle size={16} className="text-emerald-500" /> : <Share2 size={16} className="group-hover:-translate-y-1 transition-transform duration-300"/>}
               <span className={shareText === '¡Enlace copiado!' ? 'text-emerald-500' : ''}>{shareText}</span>
             </button>
           </div>

        </div>
      </div>

      <div ref={tabsRef} className="mt-16 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden scroll-mt-24 animate-fade-in-up">
        
        <div className="flex border-b border-slate-100 bg-slate-50 overflow-x-auto custom-scrollbar">
           <button onClick={() => setActiveTab('desc')} className={`flex-1 py-5 px-8 text-xs sm:text-sm font-black uppercase tracking-[0.2em] transition-all duration-300 whitespace-nowrap ${activeTab === 'desc' ? 'bg-white text-[#0866bd] border-t-4 border-[#0866bd]' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'}`}>Ficha Técnica</button>
           <button onClick={() => setActiveTab('reviews')} className={`flex-1 py-5 px-8 text-xs sm:text-sm font-black uppercase tracking-[0.2em] transition-all duration-300 whitespace-nowrap flex items-center justify-center gap-2 ${activeTab === 'reviews' ? 'bg-white text-[#0866bd] border-t-4 border-[#0866bd]' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'}`}>
             Reseñas de Clientes <span className="bg-[#0866bd]/10 text-[#0866bd] px-2 py-0.5 rounded-md text-[10px]">{reviews.length}</span>
           </button>
        </div>
        
        <div className="p-8 sm:p-12 min-h-[300px] bg-white">
           
           {activeTab === 'desc' && (
             <div className="animate-fade-in space-y-12">
               <div>
                 <h3 className="text-xl font-black text-slate-800 uppercase mb-6">Características Principales</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {product.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-blue-100 transition-colors">
                        <div className="mt-0.5 bg-blue-50 p-1.5 rounded-full shrink-0">
                          <Check size={16} className="text-[#0866bd] font-black"/>
                        </div>
                        <p className="text-slate-700 text-sm font-medium leading-relaxed">{feat}</p>
                      </div>
                   ))}
                 </div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-slate-100 bg-slate-50 p-6 rounded-2xl">
                  <div className="flex flex-col items-center text-center gap-3"><ShieldCheck size={32} className="text-emerald-500"/><span className="text-xs font-black text-slate-700 uppercase tracking-widest">Garantía Directa</span></div>
                  <div className="flex flex-col items-center text-center gap-3"><CheckCircle2 size={32} className="text-[#0866bd]"/><span className="text-xs font-black text-slate-700 uppercase tracking-widest">Calidad OEM</span></div>
                  <div className="flex flex-col items-center text-center gap-3"><MessageCircle size={32} className="text-purple-500"/><span className="text-xs font-black text-slate-700 uppercase tracking-widest">Soporte Técnico</span></div>
               </div>
             </div>
           )}

           {activeTab === 'reviews' && (
             <div className="animate-fade-in flex flex-col lg:flex-row gap-12">
               
               <div className="w-full lg:w-1/3 bg-slate-50 rounded-[2rem] p-10 text-center border border-slate-100 h-max">
                 <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Calificación Global</h4>
                 <p className="text-7xl font-black text-slate-800 mb-6">{averageRating > 0 ? averageRating.toFixed(1) : '0.0'}</p>
                 <div className="flex justify-center mb-4">
                   {renderStars(averageRating)}
                 </div>
                 <p className="text-sm text-slate-400 font-bold mb-8">
                   {reviews.length === 0 ? 'Aún no hay reseñas' : `Basado en ${reviews.length} reseñas reales`}
                 </p>
                 <button 
                   onClick={() => setShowReviewForm(true)}
                   className="w-full bg-white border-2 border-slate-200 text-slate-700 font-black py-4 rounded-xl hover:border-[#0866bd] hover:text-[#0866bd] transition-all duration-300 text-xs uppercase tracking-widest hover:-translate-y-1 hover:shadow-lg"
                 >
                   Escribir una reseña
                 </button>
               </div>
               
               <div className="w-full lg:w-2/3">
                 {reviews.length === 0 ? (
                   <div className="text-center py-16 px-4 bg-slate-50/50 rounded-[2rem] border border-slate-100 border-dashed">
                     <MessageCircle size={48} className="mx-auto text-slate-300 mb-4" />
                     <h3 className="text-xl font-black text-slate-700 uppercase mb-2">Sé el primero en opinar</h3>
                     <p className="text-slate-500 mb-6">Ayuda a otros motociclistas compartiendo tu experiencia con esta refacción.</p>
                     <button onClick={() => setShowReviewForm(true)} className="text-[#0866bd] font-bold hover:underline">Dejar mi opinión</button>
                   </div>
                 ) : (
                   <div className="space-y-8">
                     {reviews.map((rev) => (
                       <div key={rev.id} className="border-b border-slate-100 pb-8 animate-fade-in-up">
                         <div className="flex justify-between items-start mb-3">
                           <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-slate-100 text-slate-600 font-black rounded-full flex items-center justify-center text-lg uppercase">
                               {rev.name.charAt(0)}
                             </div>
                             <div>
                               <p className="text-base font-black text-slate-800">{rev.name}</p>
                               {rev.verified && <p className="text-xs text-emerald-500 font-bold flex items-center gap-1 mt-0.5"><ShieldCheck size={12}/> Comprador Verificado</p>}
                             </div>
                           </div>
                           <div className="flex text-[#ffc107]">
                             {renderStars(rev.rating)}
                           </div>
                         </div>
                         <p className="text-slate-600 text-base leading-relaxed mt-4">{rev.comment}</p>
                         <p className="text-xs text-slate-400 mt-4 font-medium">{new Date(rev.createdAt).toLocaleDateString('es-MX', dateOptions)}</p>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             </div>
           )}

        </div>
      </div>

      <div className="mt-20">
        <ProductGrid products={relatedProducts} title="Los clientes también compraron" isInteractiveCarrousel={true}/>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white rounded-[2rem] w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden">
            <div className="bg-slate-50 px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-200 flex justify-between items-center z-10">
              <div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Modelos Compatibles</h3>
                <p className="text-xs text-slate-500 font-bold mt-1 tracking-widest">{product.compatibility.length} motocicletas encontradas</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors"><X size={20} /></button>
            </div>
            <div className="px-6 py-4 border-b border-slate-100 bg-white shrink-0">
              <div className="relative focus-within:shadow-md transition-shadow">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder="Buscar modelo o cilindraje..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-12 pr-4 py-3 text-sm font-bold focus:outline-none focus:border-[#0866bd] focus:bg-white transition-colors" />
              </div>
            </div>
            <div className="overflow-y-auto p-6 sm:p-8 custom-scrollbar bg-slate-50/30 divide-y divide-slate-100">
              {filteredCompatibility.length > 0 ? (
                typeof filteredCompatibility[0] === 'object' ? (
                  filteredCompatibility.map((c, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-4 hover:bg-white p-4 rounded-2xl transition-all duration-300 animate-fade-in-up hover:shadow-lg hover:-translate-y-1">
                      <div>
                        <h4 className="font-black text-slate-700 text-sm uppercase">{c.marca} {c.modelo}</h4>
                        {c.cilindraje && c.cilindraje !== 'N/A' && <p className="text-[10px] font-black text-[#0866bd] uppercase bg-blue-50 px-2 py-0.5 rounded-md mt-1.5 w-max">{c.cilindraje}</p>}
                      </div>
                      <p className="text-xs text-slate-500 font-bold text-right">
                        {c.años.length > 1 ? `${c.años[0]} al ${c.años[c.años.length - 1]}` : c.años[0]}
                      </p>
                    </div>
                  ))
                ) : (
                  filteredCompatibility.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 text-slate-700 font-medium py-4 hover:bg-white p-4 rounded-xl transition-all duration-300 animate-fade-in-up hover:shadow-lg hover:-translate-y-1">
                      <div className="w-2 h-2 bg-[#0866bd] rounded-full shrink-0"></div> {c.trim()}
                    </div>
                  ))
                )
              ) : (
                <div className="text-center py-10 text-slate-400 font-medium">No se encontraron modelos con esa búsqueda.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {showReviewForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSubmittingReview && setShowReviewForm(false)}></div>
          <div className="relative bg-white rounded-[2rem] w-full max-w-lg flex flex-col shadow-2xl animate-slide-up overflow-hidden">
            <div className="bg-slate-50 px-6 py-5 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Tu Opinión</h3>
              <button onClick={() => !isSubmittingReview && setShowReviewForm(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmitReview} className="p-6 sm:p-8 space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-3 text-center">¿Cómo calificas esta pieza?</label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setNewReview({...newReview, rating: star})} className="focus:outline-none transition-transform hover:scale-110 active:scale-95">
                      <Star size={36} fill={star <= newReview.rating ? "#ffc107" : "transparent"} className={star <= newReview.rating ? "text-[#ffc107]" : "text-slate-200"} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Tu Nombre</label>
                <div className="relative">
                  <UserCircle2 size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" required placeholder="Ej. Juan Pérez" value={newReview.name} onChange={(e) => setNewReview({...newReview, name: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-[#0866bd] focus:bg-white transition-colors font-bold text-slate-700"/>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Tu Experiencia</label>
                <textarea required rows="4" placeholder="¿Qué te pareció la calidad? ¿Le quedó bien a tu moto?" value={newReview.comment} onChange={(e) => setNewReview({...newReview, comment: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 focus:outline-none focus:border-[#0866bd] focus:bg-white transition-colors text-slate-700 resize-none font-medium leading-relaxed"></textarea>
              </div>

              <button type="submit" disabled={isSubmittingReview} className="w-full bg-[#0866bd] hover:bg-[#064e93] text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all text-sm flex items-center justify-center h-14 gap-3 disabled:opacity-70 disabled:cursor-not-allowed">
                {isSubmittingReview ? <><Loader2 size={18} className="animate-spin" /> Publicando...</> : <><Send size={18} /> Publicar Reseña</>}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
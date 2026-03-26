import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Search, ShoppingCart, Menu, Package, Facebook, Instagram, Loader2, ChevronRight, Zap } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config'; 
import { CartContext } from '../../context/CartContext';
import MobileMenu from './MobileMenu';
import { TrackOrderModal } from '../ui/Modals';

const TikTok = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const NAV_LINKS = [
  { name: 'INICIO', path: '/' },
  { name: 'REFACCIONES', path: '/catalogo' },
  { name: 'TALLERES VIP', path: '/talleres', isVIP: true }
];

export default function Header() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [catalogCache, setCatalogCache] = useState(null); 
  const searchContainerRef = useRef(null);

  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20); 
  });

  const [hoveredNav, setHoveredNav] = useState(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const { cartItems, toggleCart } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const cartCount = cartItems.reduce((total, item) => total + item.qty, 0);
  const [isCartBouncing, setIsCartBouncing] = useState(false);

  useEffect(() => {
    if (cartCount > 0) {
      setIsCartBouncing(true);
      const timer = setTimeout(() => setIsCartBouncing(false), 300);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowDropdown(false);
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setShowDropdown(false);
    setSearchTerm('');
  }, [location.pathname]);

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const fetchAndFilter = async () => {
      setIsSearching(true);
      let localCatalog = catalogCache;

      if (!localCatalog) {
        try {
          const snapshot = await getDocs(collection(db, "productos"));
          localCatalog = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || data.Nombre || '',
              price: data.promoPrice || data.price || data.Precio || 0,
              img: data.images?.[0] || data.ImagenURL || `https://placehold.co/150x150/f8fafc/0866BD?text=Foto`,
              keys: data.searchKeys ? data.searchKeys.join(" ").toLowerCase() : ""
            };
          });
          setCatalogCache(localCatalog);
        } catch (error) {
          console.error("Error al cargar caché de búsqueda:", error);
          localCatalog = [];
        }
      }

      const lowerTerm = searchTerm.toLowerCase().trim();
      const filtered = localCatalog.filter(p => 
        p.name.toLowerCase().includes(lowerTerm) || p.keys.includes(lowerTerm)
      ).slice(0, 5); 

      setSearchResults(filtered);
      setIsSearching(false);
    };

    const debounceTimer = setTimeout(() => {
      fetchAndFilter();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, catalogCache]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/catalogo?q=${encodeURIComponent(searchTerm.trim())}`);
      setShowDropdown(false);
      setIsSearchFocused(false);
      document.activeElement.blur(); 
    } else {
      navigate('/catalogo');
    }
  };

  const handleProductClick = (id) => {
    navigate(`/producto/${id}`);
    setShowDropdown(false);
    setSearchTerm('');
    setIsSearchFocused(false);
  };

  return (
    <>
      <AnimatePresence>
        {isSearchFocused && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] pointer-events-none hidden md:block" 
          />
        )}
      </AnimatePresence>

      <motion.header 
        className="sticky top-0 z-[100] w-full border-b border-white/5"
        animate={{ 
          backgroundColor: isScrolled ? 'rgba(8, 102, 189, 0.90)' : 'rgba(8, 102, 189, 1)',
          backdropFilter: isScrolled ? 'blur(16px)' : 'blur(0px)',
          boxShadow: isScrolled ? '0 15px 40px -10px rgba(0,0,0,0.3)' : '0 4px 15px -5px rgba(0,0,0,0.1)'
        }}
        transition={{ duration: 0.4 }}
      >
        <div className="max-w-[85rem] mx-auto relative z-20">
          
          {/* TOP BAR */}
          <motion.div 
            animate={{ paddingTop: isScrolled ? '0.75rem' : '1.25rem', paddingBottom: '0.75rem' }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
          >
            {/* LOGO & BRANDING */}
            <div className="flex items-center gap-3 sm:gap-5 shrink-0">
              <button className="lg:hidden text-white hover:text-yellow-400 transition-colors" onClick={() => setMobileMenu(true)}>
                <Menu size={28} />
              </button>
              
              <Link to="/" className="flex items-center gap-3 cursor-pointer group">
                <motion.div 
                  whileHover={{ rotate: 5, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white p-1 rounded-[1rem] shadow-[0_0_15px_rgba(255,255,255,0.2)] flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 overflow-hidden border border-blue-100"
                >
                  <img src="/logo.ico" alt="Logo El Jefe" className="w-full h-full object-contain" />
                </motion.div>
                <div className="hidden sm:flex flex-col">
                  <h1 className="font-black uppercase tracking-widest text-white text-xl leading-none group-hover:text-yellow-400 transition-colors drop-shadow-md">EL JEFE</h1>
                  <p className="text-[9px] text-blue-200 uppercase tracking-[0.25em] font-bold mt-0.5 group-hover:text-white transition-colors">Moto Partes</p>
                </div>
              </Link>
            </div>

            {/* BUSCADOR INTELIGENTE */}
            <div ref={searchContainerRef} className="hidden md:block relative flex-1 max-w-2xl mx-4 lg:mx-8">
              <motion.form 
                onSubmit={handleSearchSubmit} 
                animate={{ 
                  boxShadow: isSearchFocused ? '0 0 0 4px rgba(250,204,21,0.3), 0 20px 40px rgba(0,0,0,0.2)' : '0 0 0 0px rgba(250,204,21,0)',
                  scale: isSearchFocused ? 1.02 : 1
                }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="relative w-full flex items-center bg-white/95 backdrop-blur-sm rounded-full p-1.5 border border-transparent transition-all z-20 group"
              >
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => { 
                    setIsSearchFocused(true);
                    if(searchTerm.trim().length > 0) setShowDropdown(true); 
                  }}
                  placeholder="Buscar refacción, modelo o categoría..." 
                  className="w-full py-2.5 px-6 bg-transparent outline-none text-sm font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium tracking-wide" 
                  autoComplete="off"
                />
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit" 
                  className="bg-gradient-to-r from-[#0866bd] to-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-[0_5px_15px_rgba(8,102,189,0.4)] shrink-0"
                >
                  {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                </motion.button>
              </motion.form>

              {/* DROPDOWN RESULTADOS */}
              <AnimatePresence>
                {showDropdown && searchTerm.trim().length >= 2 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -15, filter: 'blur(10px)', scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
                    exit={{ opacity: 0, y: -10, filter: 'blur(5px)', scale: 0.95 }}
                    transition={{ duration: 0.2, type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute top-[110%] left-0 w-full bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden flex flex-col z-50"
                  >
                    {isSearching && searchResults.length === 0 ? (
                       <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                         <Loader2 size={28} className="animate-spin mb-3 text-[#0866bd]" />
                         <span className="text-[10px] font-black uppercase tracking-[0.2em]">Analizando Inventario...</span>
                       </div>
                    ) : searchResults.length > 0 ? (
                      <>
                        <div className="flex flex-col p-2">
                          {searchResults.map((prod, idx) => (
                            <motion.div 
                              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                              key={prod.id} onClick={() => handleProductClick(prod.id)}
                              className="flex items-center justify-between p-3 rounded-2xl hover:bg-blue-50/80 hover:shadow-sm cursor-pointer transition-all group"
                            >
                              <div className="flex items-center gap-4 min-w-0">
                                <div className="w-14 h-14 bg-white rounded-xl border border-slate-100 flex items-center justify-center shrink-0 p-1 shadow-sm group-hover:border-blue-200 transition-colors">
                                   <img src={prod.img} alt={prod.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform" />
                                </div>
                                <p className="text-xs font-black text-slate-700 uppercase truncate group-hover:text-[#0866bd] transition-colors">
                                  {prod.name}
                                </p>
                              </div>
                              <p className="text-sm font-black text-slate-900 shrink-0 pl-4 group-hover:text-[#0866bd] transition-colors tracking-tighter">
                                ${prod.price.toLocaleString('es-MX')}
                              </p>
                            </motion.div>
                          ))}
                        </div>
                        <div 
                          onClick={handleSearchSubmit}
                          className="bg-slate-50/80 p-4 text-center border-t border-slate-100 text-[10px] font-black text-[#0866bd] uppercase tracking-widest hover:bg-[#0866bd] hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2 group"
                        >
                          Ver Catálogo Completo <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </>
                    ) : (
                      <div className="p-8 text-center flex flex-col items-center">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                          <Search size={20} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-bold text-slate-700">No encontramos piezas para</p>
                        <p className="text-xs font-medium text-slate-500 mt-1">"{searchTerm}"</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ACCIONES Y REDES */}
            <div className="flex items-center gap-3 shrink-0 relative z-20">
              <div className="hidden xl:flex items-center gap-3 mr-2 border-r border-blue-400/30 pr-5">
                <motion.a whileHover={{ scale: 1.15, y: -2 }} whileTap={{ scale: 0.95 }} href="https://www.facebook.com/profile.php?id=61582551320267" target="_blank" rel="noreferrer" className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-[#1877F2] transition-colors shadow-sm border border-white/10">
                  <Facebook size={16} />
                </motion.a>
                <motion.a whileHover={{ scale: 1.15, y: -2 }} whileTap={{ scale: 0.95 }} href="https://www.instagram.com/el_jefe1949/" target="_blank" rel="noreferrer" className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7] transition-all shadow-sm border border-white/10">
                  <Instagram size={16} />
                </motion.a>
                <motion.a whileHover={{ scale: 1.15, y: -2 }} whileTap={{ scale: 0.95 }} href="https://www.tiktok.com/@moto.partes.el.je" target="_blank" rel="noreferrer" className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-black transition-colors shadow-sm border border-white/10">
                  <TikTok size={16} />
                </motion.a>
              </div>

              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setTrackModalOpen(true)}
                className="hidden lg:flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors backdrop-blur-sm"
              >
                <Package size={14} /> Rastrear
              </motion.button>
              
              {/* CARRITO MAGNÉTICO CON EFECTO POP */}
              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                animate={isCartBouncing ? { scale: [1, 1.2, 0.9, 1.1, 1] } : {}}
                transition={{ duration: 0.5 }}
                onClick={toggleCart} 
                className="relative bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 w-12 h-12 rounded-full flex items-center justify-center shadow-[0_5px_15px_rgba(250,204,21,0.3)] hover:shadow-[0_10px_25px_rgba(250,204,21,0.5)] transition-shadow border border-yellow-300 z-50"
              >
                <ShoppingCart size={20} className="ml-[-2px]" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span 
                      key={cartCount}
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-black border-2 border-[#0866bd] shadow-[0_0_10px_rgba(220,38,38,0.5)]"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </motion.div>

          {/* === FLOATING DOCK NAV (CLASE MUNDIAL) === */}
          <div className="hidden lg:flex justify-center pb-3 pt-1 w-full relative z-20">
            <div 
              className="flex items-center gap-1 p-1.5 bg-[#03254c]/60 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
              onMouseLeave={() => setHoveredNav(null)}
            >
              {NAV_LINKS.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link 
                    key={link.path} 
                    to={link.path} 
                    onMouseEnter={() => setHoveredNav(link.path)} 
                    className="relative px-7 py-2.5 rounded-full z-10 transition-colors flex items-center"
                  >
                    {/* Hover Magnético de Cristal */}
                    {hoveredNav === link.path && (
                      <motion.div 
                        layoutId="nav-hover-pill" 
                        className="absolute inset-0 bg-white/10 rounded-full" 
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    
                    {/* Estado Activo con Neon Glow */}
                    {isActive && (
                      <motion.div 
                        layoutId="nav-active-pill" 
                        className="absolute inset-0 border border-yellow-400/50 bg-yellow-400/10 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.2)]" 
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    
                    {/* Texto del Enlace */}
                    <span className={`relative z-10 font-black text-[10px] uppercase tracking-[0.2em] flex items-center transition-colors duration-300 ${isActive ? 'text-yellow-400 drop-shadow-sm' : 'text-blue-100 hover:text-white'}`}>
                      {link.name}
                      {link.isVIP && (
                        <span className="ml-2 flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 text-[9px] font-black px-2 py-[2px] rounded-md shadow-sm">
                          <Zap size={10} className="fill-current"/> VIP
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

        </div>
      </motion.header>

      {/* Modales fuera del flujo principal para evitar conflictos */}
      <MobileMenu 
        isOpen={mobileMenu} 
        onClose={() => setMobileMenu(false)} 
        onOpenTrackModal={() => setTrackModalOpen(true)} 
      />
      
      <TrackOrderModal 
        isOpen={trackModalOpen} 
        onClose={() => setTrackModalOpen(false)} 
      />
    </>
  );
}
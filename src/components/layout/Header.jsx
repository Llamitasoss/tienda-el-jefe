import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Search, ShoppingCart, Menu, Package, Loader2, ChevronRight, Zap, House, Boxes, X, Facebook, Instagram } from 'lucide-react';
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
  { name: 'INICIO', path: '/', icon: House },
  { name: 'CATÁLOGO', path: '/catalogo', icon: Boxes },
  { name: 'VIP', path: '/talleres', isVIP: true, icon: Zap }
];

// === MICRO-INTERACCIONES BOUTIQUE (Light Premium) ===
const AnimatedIcon = ({ link, isActive, isHovered }) => {
  const iconColor = isActive ? '#0866bd' : isHovered ? '#0866bd' : '#64748b';
  
  if (link.name === 'INICIO') {
    return (
      <motion.div animate={isHovered ? { y: -2 } : { y: 0 }} transition={{ type: "spring", stiffness: 400 }}>
        <House size={14} color={iconColor} strokeWidth={isActive ? 2.5 : 2} />
      </motion.div>
    );
  }
  if (link.name === 'CATÁLOGO') {
    return (
      <motion.div animate={isHovered ? { rotateY: 180 } : { rotateY: 0 }} transition={{ duration: 0.6 }}>
        <Boxes size={14} color={iconColor} strokeWidth={isActive ? 2.5 : 2} />
      </motion.div>
    );
  }
  if (link.isVIP) {
    return (
      <motion.div animate={isHovered ? { scale: 1.2 } : { scale: 1 }}>
        <Zap size={14} color={isActive || isHovered ? '#FACC15' : '#94a3b8'} fill={isActive ? '#FACC15' : 'transparent'} strokeWidth={2} />
      </motion.div>
    );
  }
  return null;
};

export default function Header() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [catalogCache, setCatalogCache] = useState(null); 
  
  const searchInputRef = useRef(null);
  const headerRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hoveredNav, setHoveredNav] = useState(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20); 
    if (latest > 50 && showDropdown) setShowDropdown(false);
  });

  const { cartItems, toggleCart } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation(); 
  const cartCount = cartItems.reduce((total, item) => total + item.qty, 0);
  const [isCartBouncing, setIsCartBouncing] = useState(false);

  useEffect(() => {
    if (cartCount > 0) {
      setIsCartBouncing(true);
      const timer = setTimeout(() => setIsCartBouncing(false), 400);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setIsSearchOpen(false);
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setShowDropdown(false);
    setIsSearchOpen(false);
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
          localCatalog = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setCatalogCache(localCatalog);
        } catch (error) { localCatalog = []; }
      }
      const lowerTerm = searchTerm.toLowerCase().trim();
      const filtered = localCatalog.filter(p => (p.name || p.Nombre || "").toLowerCase().includes(lowerTerm)).slice(0, 4); 
      setSearchResults(filtered);
      setIsSearching(false);
    };
    const timer = setTimeout(fetchAndFilter, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, catalogCache]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/catalogo?q=${encodeURIComponent(searchTerm.trim())}`);
      setShowDropdown(false);
      setIsSearchOpen(false);
      document.activeElement.blur(); 
    } else {
      navigate('/catalogo');
    }
  };

  const handleProductClick = (id) => {
    navigate(`/producto/${id}`);
    setShowDropdown(false);
    setIsSearchOpen(false);
    setSearchTerm('');
  };

  return (
    <>
      {/* OVERLAY DE ENFOQUE LIGERO */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] pointer-events-none hidden md:block" 
          />
        )}
      </AnimatePresence>

      <div className="fixed top-4 sm:top-5 left-0 w-full flex justify-center z-[100] pointer-events-none px-4">
        
        {/* === DYNAMIC ISLAND (LIGHT PREMIUM) === */}
        <motion.div 
          layout
          ref={headerRef}
          animate={{ 
            y: isScrolled ? 0 : 0,
            boxShadow: isSearchOpen 
              ? '0 0 0 1px rgba(8,102,189,0.3), 0 20px 40px rgba(0,0,0,0.1)' 
              : isScrolled ? '0 10px 25px rgba(0,0,0,0.05)' : '0 4px 15px rgba(0,0,0,0.03)'
          }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-slate-200 rounded-full p-1.5 flex items-center gap-1.5 relative overflow-visible"
        >

          {/* 1. LOGO Y HAMBURGUESA */}
          <div className="flex items-center pl-1 shrink-0 relative z-10">
            <button className="lg:hidden text-slate-400 hover:text-[#0866bd] transition-colors ml-2" onClick={() => setMobileMenu(true)}>
              <Menu size={20} strokeWidth={2.5}/>
            </button>
            <motion.div layout>
              <Link to="/" className="flex items-center justify-center w-10 h-10 bg-slate-50 rounded-full overflow-hidden border border-slate-100 ml-2 group hover:border-[#0866bd]/30 transition-colors">
                <img src="/logo.ico" alt="Logo" className="w-full h-full object-contain p-1.5 group-hover:scale-105 transition-transform duration-500" />
              </Link>
            </motion.div>
          </div>

          {/* 2. NAVEGACIÓN PRINCIPAL */}
          <motion.nav 
            layout 
            className={`hidden lg:flex items-center relative z-10 overflow-hidden transition-all duration-300 ${isSearchOpen ? 'w-0 opacity-0 px-0 mx-0' : 'w-auto opacity-100 mx-2'}`}
            onMouseLeave={() => setHoveredNav(null)}
          >
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.path;
              const isHovered = hoveredNav === link.path;
              return (
                <Link 
                  key={link.path} to={link.path} 
                  onMouseEnter={() => setHoveredNav(link.path)} 
                  className="relative px-4 py-2.5 rounded-full z-10 flex items-center gap-2 transition-colors group/nav"
                >
                  {isHovered && !isActive && (
                    <motion.div layoutId="hover-bg" className="absolute inset-0 bg-slate-50 rounded-full" transition={{ type: "spring", stiffness: 400, damping: 25 }} />
                  )}
                  
                  <AnimatedIcon link={link} isActive={isActive} isHovered={isHovered} />
                  <span className={`relative z-10 font-bold text-[10px] uppercase tracking-widest transition-colors duration-300 ${isActive ? 'text-[#0866bd]' : 'text-slate-500 group-hover/nav:text-[#0866bd]'}`}>
                    {link.name}
                  </span>
                  
                  {/* Badge VIP Dorado */}
                  {link.isVIP && (
                    <span className={`relative z-10 flex items-center gap-1 text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm ml-0.5 transition-colors duration-300 ${isActive ? 'bg-[#FACC15] text-[#021830]' : 'bg-slate-50 border border-slate-200 text-slate-500 group-hover/nav:text-[#FACC15] group-hover/nav:border-yellow-200'}`}>
                      VIP
                    </span>
                  )}

                  {/* SUBRAYADO ACTIVO (AZUL BRAND) */}
                  {(isActive || isHovered) && (
                    <motion.div 
                      layoutId="active-laser" 
                      className={`absolute bottom-0 left-5 right-5 h-[2px] rounded-t-full ${isActive ? 'bg-[#0866bd]' : 'bg-blue-200'}`}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </motion.nav>

          {/* 3. REDES SOCIALES SUTILES */}
          <motion.div 
            layout 
            className={`hidden xl:flex items-center gap-1 relative z-10 transition-all duration-300 overflow-hidden ${isSearchOpen ? 'w-0 opacity-0 px-0 mx-0 border-none' : 'w-auto opacity-100 border-l border-slate-200 pl-2 mx-1'}`}
          >
            <motion.a whileHover={{ scale: 1.1, backgroundColor: "#1877F2", color: "#ffffff" }} whileTap={{ scale: 0.95 }} href="https://www.facebook.com/profile.php?id=61582551320267" target="_blank" rel="noreferrer" className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:border-transparent transition-all border border-slate-100">
              <Facebook size={14} />
            </motion.a>
            <motion.a whileHover={{ scale: 1.1, backgroundImage: "linear-gradient(to top right, #f9ce34, #ee2a7b, #6228d7)", color: "#ffffff" }} whileTap={{ scale: 0.95 }} href="https://www.instagram.com/el_jefe1949/" target="_blank" rel="noreferrer" className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:border-transparent transition-all border border-slate-100">
              <Instagram size={14} />
            </motion.a>
            <motion.a whileHover={{ scale: 1.1, backgroundColor: "#000000", color: "#ffffff" }} whileTap={{ scale: 0.95 }} href="https://www.tiktok.com/@moto.partes.el.je" target="_blank" rel="noreferrer" className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:border-transparent transition-all border border-slate-100">
              <TikTok size={14} />
            </motion.a>
          </motion.div>

          <motion.div layout className={`hidden lg:block w-px h-5 bg-slate-200 mx-1 transition-opacity ${isSearchOpen ? 'opacity-0' : 'opacity-100'}`}></motion.div>

          {/* 4. BUSCADOR ELEGANTE (Expansible) */}
          <motion.div layout className="relative flex items-center shrink-0 z-20">
            <form 
              onSubmit={handleSearchSubmit}
              className={`relative flex items-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isSearchOpen ? 'bg-white shadow-inner border border-[#0866bd]/40 rounded-full' : 'bg-slate-50 border border-slate-100 rounded-full'}`}
              style={{ width: isSearchOpen ? (window.innerWidth < 640 ? '180px' : '260px') : '40px', height: '40px' }}
            >
              <button 
                type="button" 
                onClick={() => {
                  if(!isSearchOpen) {
                    setIsSearchOpen(true);
                    setTimeout(() => searchInputRef.current?.focus(), 150);
                  } else {
                    handleSearchSubmit(new Event('submit'));
                  }
                }}
                className={`absolute left-0 w-10 h-10 flex items-center justify-center z-20 transition-colors rounded-full ${isSearchOpen ? 'text-[#0866bd]' : 'text-slate-400 hover:text-[#0866bd]'}`}
              >
                {isSearching ? <Loader2 size={16} className="animate-spin text-[#0866bd]" /> : <Search size={16} strokeWidth={2.5} />}
              </button>

              <input 
                ref={searchInputRef} type="text" value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                placeholder="Buscar pieza..." 
                className={`absolute inset-0 pl-10 pr-8 bg-transparent outline-none text-[11px] font-bold text-slate-800 placeholder:text-slate-400 w-full transition-opacity duration-300 ${isSearchOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
                autoComplete="off"
              />

              <AnimatePresence>
                {isSearchOpen && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}
                    type="button" 
                    onClick={() => {setIsSearchOpen(false); setShowDropdown(false); setSearchTerm('');}} 
                    className="absolute right-2.5 w-5 h-5 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-700 z-20 transition-colors"
                  >
                    <X size={10} strokeWidth={3} />
                  </motion.button>
                )}
              </AnimatePresence>
            </form>

            {/* DROPDOWN DE RESULTADOS (Clean White) */}
            <AnimatePresence>
              {isSearchOpen && showDropdown && searchTerm.trim().length >= 2 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                  animate={{ opacity: 1, y: 0, scale: 1 }} 
                  exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="absolute top-[120%] right-0 w-[280px] sm:w-[320px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden flex flex-col z-[200]"
                >
                  {isSearching && searchResults.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center">
                        <Loader2 size={24} className="animate-spin mb-3 text-[#0866bd]" strokeWidth={2.5}/>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Buscando...</span>
                      </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <div className="p-2 space-y-1">
                        {searchResults.map((prod) => (
                          <motion.div 
                            whileHover={{ backgroundColor: "#f8fafc" }}
                            key={prod.id} onClick={() => handleProductClick(prod.id)}
                            className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 p-1 border border-slate-100 group-hover:border-[#0866bd]/40 transition-colors shadow-sm">
                                  <img src={prod.img || prod.ImagenURL} alt={prod.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" />
                              </div>
                              <div className="flex flex-col">
                                <p className="text-[10px] font-bold text-slate-800 uppercase truncate leading-tight group-hover:text-[#0866bd] transition-colors">{prod.name || prod.Nombre}</p>
                                <p className="text-[9px] font-bold text-[#FACC15]">{prod.sku || 'REF'}</p>
                              </div>
                            </div>
                            <p className="text-[11px] font-black text-[#0866bd] shrink-0 pl-2">${(prod.price || prod.Precio).toLocaleString('es-MX')}</p>
                          </motion.div>
                        ))}
                      </div>
                      <div onClick={handleSearchSubmit} className="bg-slate-50 p-3 text-center border-t border-slate-100 text-[10px] font-black text-[#0866bd] uppercase tracking-widest hover:bg-[#0866bd] hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 group">
                        Ver Catálogo <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center flex flex-col items-center">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 border border-slate-100">
                        <Search size={20} className="text-slate-300" strokeWidth={2} />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sin resultados</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* 5. HERRAMIENTAS Y CARRITO DE COMPRAS */}
          <motion.div layout className="flex items-center gap-1.5 pl-1 pr-1 shrink-0 relative z-10">
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setTrackModalOpen(true)}
              className={`hidden sm:flex items-center justify-center w-10 h-10 bg-transparent text-slate-400 hover:text-[#0866bd] rounded-full transition-colors ${isSearchOpen ? 'w-0 opacity-0 p-0 overflow-hidden' : ''}`}
              title="Rastrear Pedido"
            >
              <Package size={18} strokeWidth={2} />
            </motion.button>
            
            {/* CARRITO DE COMPRAS (Azul Brand Fuerte) */}
            <div className="relative">
              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                animate={isCartBouncing ? { scale: [1, 1.15, 0.95, 1.05, 1], rotate: [0, -5, 5, 0] } : {}}
                onClick={toggleCart} 
                className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-[#0866bd] text-white shadow-[0_5px_15px_rgba(8,102,189,0.3)] hover:shadow-[0_8px_20px_rgba(8,102,189,0.4)] transition-shadow border border-blue-500/50 group"
              >
                <ShoppingCart size={18} strokeWidth={2} className="relative z-10 ml-[-1px] group-hover:scale-110 transition-transform" />
              </motion.button>
              
              {/* Notificador Pop (Rojo Vivo) */}
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.div 
                    key={cartCount} initial={{ scale: 0, y: 5 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="absolute -top-1.5 -right-1.5 pointer-events-none z-50"
                  >
                    <span className="bg-[#EF4444] text-white text-[9px] min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full font-bold border-2 border-white shadow-sm leading-none">
                      {cartCount}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
          </motion.div>
        </motion.div>
      </div>

      <MobileMenu isOpen={mobileMenu} onClose={() => setMobileMenu(false)} onOpenTrackModal={() => setTrackModalOpen(true)} />
      <TrackOrderModal isOpen={trackModalOpen} onClose={() => setTrackModalOpen(false)} />
    </>
  );
}
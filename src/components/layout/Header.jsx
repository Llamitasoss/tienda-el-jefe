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

// === MICRO-INTERACCIONES NEO-CLÁSICAS (Elegantes y sutiles) ===
const AnimatedIcon = ({ link, isActive, isHovered }) => {
  if (link.name === 'INICIO') {
    return (
      <div className="relative flex items-center justify-center">
        <motion.div animate={isHovered ? { y: -2, scale: 1.1 } : { y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
          <House size={14} className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-[#FBFBF2]' : 'text-[#FBFBF2]/50 group-hover/nav:text-[#FBFBF2]'}`} />
        </motion.div>
        <AnimatePresence>
          {isActive && (
            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.5, opacity: 0.4 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }} className="absolute inset-0 bg-[#0866bd] rounded-full blur-[4px]" />
          )}
        </AnimatePresence>
      </div>
    );
  }
  if (link.name === 'CATÁLOGO') {
    return (
      <motion.div animate={isHovered ? { rotateY: 180, scale: 1.1 } : { rotateY: 0, scale: 1 }} transition={{ duration: 0.6, ease: "easeInOut" }}>
        <Boxes size={14} className={`transition-colors duration-300 ${isActive ? 'text-[#FBFBF2]' : 'text-[#FBFBF2]/50 group-hover/nav:text-[#FBFBF2]'}`} />
      </motion.div>
    );
  }
  if (link.isVIP) {
    return (
      <motion.div animate={isHovered ? { rotate: [0, -15, 15, -10, 10, 0], scale: 1.1 } : { rotate: 0, scale: 1 }} transition={{ duration: 0.5 }}>
        <Zap size={14} className={`transition-colors duration-300 ${isActive ? 'text-[#FACC15] drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]' : 'text-[#FACC15]/60 group-hover/nav:text-[#FACC15]'}`} />
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
          localCatalog = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || data.Nombre || '',
              price: data.promoPrice || data.price || data.Precio || 0,
              img: data.images?.[0] || data.ImagenURL || `https://placehold.co/150x150/FBFBF2/0866bd?text=Foto`,
              keys: data.searchKeys ? data.searchKeys.join(" ").toLowerCase() : ""
            };
          });
          setCatalogCache(localCatalog);
        } catch (error) { localCatalog = []; }
      }

      const lowerTerm = searchTerm.toLowerCase().trim();
      const filtered = localCatalog.filter(p => p.name.toLowerCase().includes(lowerTerm) || p.keys.includes(lowerTerm)).slice(0, 4); 
      setSearchResults(filtered);
      setIsSearching(false);
    };

    const debounceTimer = setTimeout(fetchAndFilter, 300);
    return () => clearTimeout(debounceTimer);
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
      {/* OVERLAY DE ENFOQUE (Al abrir buscador) */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }} 
            animate={{ opacity: 1, backdropFilter: "blur(6px)" }} 
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }} 
            transition={{ duration: 0.4 }}
            className="fixed inset-0 bg-[#021830]/60 z-[90] pointer-events-none hidden md:block" 
          />
        )}
      </AnimatePresence>

      {/* === CONTENEDOR CENTRAL DE LA ISLA === */}
      <div className="fixed top-4 sm:top-5 left-0 w-full flex justify-center z-[100] pointer-events-none px-4">
        
        {/* === DYNAMIC ISLAND (ZAFIRO Y AZUL BRAND) === */}
        <motion.div 
          layout
          ref={headerRef}
          animate={{ 
            y: isScrolled ? 2 : 0,
            boxShadow: isSearchOpen 
              ? '0 0 0 1px rgba(8,102,189,0.5), 0 20px 40px rgba(2,24,48,0.8)' 
              : isScrolled ? '0 10px 30px rgba(2,24,48,0.6)' : '0 10px 25px rgba(2,24,48,0.4)'
          }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="pointer-events-auto bg-[#03254c]/90 backdrop-blur-2xl border border-white/10 rounded-full p-1.5 flex items-center gap-2 relative overflow-visible group/island"
        >
          {/* Brillo interno de la cápsula */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/5 via-transparent to-[#0866bd]/5 pointer-events-none mix-blend-overlay opacity-80"></div>

          {/* 1. LOGO Y HAMBURGUESA */}
          <div className="flex items-center gap-2 pl-1 shrink-0 relative z-10">
            <button className="lg:hidden text-[#FBFBF2]/60 hover:text-[#FBFBF2] transition-colors ml-2" onClick={() => setMobileMenu(true)}>
              <Menu size={20} />
            </button>
            <motion.div layout>
              <Link to="/" className="flex items-center justify-center w-10 h-10 bg-[#FBFBF2] rounded-full overflow-hidden shadow-sm hover:shadow-[0_0_15px_rgba(8,102,189,0.3)] transition-all shrink-0 border border-transparent hover:border-[#0866bd]/30 relative group">
                <img src="/logo.ico" alt="Logo" className="w-full h-full object-contain p-1.5 relative z-10 group-hover:scale-105 transition-transform duration-500" />
              </Link>
            </motion.div>
          </div>

          {/* 2. NAVEGACIÓN PRINCIPAL (Boutique Style) */}
          <motion.nav 
            layout 
            className={`hidden lg:flex items-center relative z-10 overflow-hidden transition-all duration-300 ${isSearchOpen ? 'w-0 opacity-0 px-0 mx-0' : 'w-auto opacity-100 mx-1'}`}
            onMouseLeave={() => setHoveredNav(null)}
          >
            {NAV_LINKS.map((link) => {
              const isActive = location.pathname === link.path;
              const isHovered = hoveredNav === link.path;
              return (
                <Link 
                  key={link.path} 
                  to={link.path} 
                  onMouseEnter={() => setHoveredNav(link.path)} 
                  className="relative px-4 py-2.5 rounded-full z-10 flex items-center gap-2 transition-colors group/nav"
                >
                  {isHovered && !isActive && (
                    <motion.div layoutId="hover-bg" className="absolute inset-0 bg-white/5 rounded-full" transition={{ type: "spring", stiffness: 400, damping: 25 }} />
                  )}
                  
                  <AnimatedIcon link={link} isActive={isActive} isHovered={isHovered} />
                  <span className={`relative z-10 font-bold text-[9px] uppercase tracking-[0.15em] transition-colors duration-300 ${isActive ? 'text-[#FBFBF2]' : 'text-[#FBFBF2]/60 group-hover/nav:text-[#FBFBF2]'}`}>
                    {link.name}
                  </span>
                  
                  {/* Badge VIP */}
                  {link.isVIP && (
                    <span className={`relative z-10 flex items-center gap-1 text-[7px] font-black px-1.5 py-0.5 rounded transition-colors duration-300 shadow-sm ml-0.5 ${isActive ? 'bg-[#FACC15] text-[#021830] shadow-[0_0_8px_rgba(250,204,21,0.4)]' : 'bg-[#021830] border border-[#FACC15]/30 text-[#FACC15]'}`}>
                      VIP
                    </span>
                  )}

                  {/* LÁSER ACTIVO (AZUL BRAND) */}
                  {(isActive || isHovered) && (
                    <motion.div 
                      layoutId="active-laser" 
                      className={`absolute bottom-0 left-4 right-4 h-[1.5px] rounded-t-full shadow-[0_-2px_8px_rgba(8,102,189,0.6)] ${isActive ? 'bg-[#0866bd]' : 'bg-white/30'}`}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </motion.nav>

          {/* 3. REDES SOCIALES INTEGRADAS */}
          <motion.div 
            layout 
            className={`hidden xl:flex items-center gap-1 relative z-10 transition-all duration-300 overflow-hidden ${isSearchOpen ? 'w-0 opacity-0 px-0 mx-0 border-none' : 'w-auto opacity-100 border-l border-white/10 pl-2 mx-1'}`}
          >
            <motion.a whileHover={{ scale: 1.1, backgroundColor: "#1877F2", color: "#ffffff" }} whileTap={{ scale: 0.95 }} href="https://www.facebook.com/profile.php?id=61582551320267" target="_blank" rel="noreferrer" className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 text-[#FBFBF2]/60 transition-colors border border-transparent">
              <Facebook size={14} />
            </motion.a>
            <motion.a whileHover={{ scale: 1.1, backgroundImage: "linear-gradient(to top right, #f9ce34, #ee2a7b, #6228d7)", color: "#ffffff" }} whileTap={{ scale: 0.95 }} href="https://www.instagram.com/el_jefe1949/" target="_blank" rel="noreferrer" className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 text-[#FBFBF2]/60 transition-colors border border-transparent">
              <Instagram size={14} />
            </motion.a>
            <motion.a whileHover={{ scale: 1.1, backgroundColor: "#000000", color: "#ffffff" }} whileTap={{ scale: 0.95 }} href="https://www.tiktok.com/@moto.partes.el.je" target="_blank" rel="noreferrer" className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 text-[#FBFBF2]/60 transition-colors border border-transparent">
              <TikTok size={14} />
            </motion.a>
          </motion.div>

          <motion.div layout className={`hidden lg:block w-[1px] h-5 bg-white/10 mx-1 transition-opacity ${isSearchOpen ? 'opacity-0' : 'opacity-100'}`}></motion.div>

          {/* 4. BUSCADOR EXPANSIBLE (Fino y Elegante) */}
          <motion.div layout className="relative flex items-center shrink-0 z-20">
            <form 
              onSubmit={handleSearchSubmit}
              className={`relative flex items-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isSearchOpen ? 'bg-[#021830]/80 shadow-inner border border-[#0866bd]/40 rounded-full' : 'bg-transparent rounded-full'}`}
              style={{ width: isSearchOpen ? (window.innerWidth < 640 ? '180px' : '260px') : '38px', height: '38px' }}
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
                className={`absolute left-0 w-9 h-9 ml-0.5 flex items-center justify-center z-20 transition-all duration-300 rounded-full ${isSearchOpen ? 'text-[#0866bd] hover:text-[#0866bd]' : 'text-[#FBFBF2]/60 hover:text-[#FBFBF2] hover:bg-white/5'}`}
              >
                {isSearching ? <Loader2 size={14} className="animate-spin text-[#0866bd]" /> : <Search size={14} strokeWidth={2} />}
              </button>

              <input 
                ref={searchInputRef}
                type="text" 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                placeholder="Buscar pieza..." 
                className={`absolute inset-0 pl-10 pr-8 bg-transparent outline-none text-[11px] font-medium text-[#FBFBF2] placeholder:text-[#FBFBF2]/40 w-full transition-opacity duration-300 ${isSearchOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
                autoComplete="off"
              />

              <AnimatePresence>
                {isSearchOpen && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}
                    type="button" 
                    onClick={() => {setIsSearchOpen(false); setShowDropdown(false); setSearchTerm('');}} 
                    className="absolute right-2 w-6 h-6 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-[#FBFBF2]/60 hover:text-[#FBFBF2] z-20 transition-colors"
                  >
                    <X size={10} strokeWidth={2.5} />
                  </motion.button>
                )}
              </AnimatePresence>
            </form>

            {/* DROPDOWN DE RESULTADOS (Zafiro) */}
            <AnimatePresence>
              {isSearchOpen && showDropdown && searchTerm.trim().length >= 2 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95, filter: "blur(5px)" }} 
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }} 
                  exit={{ opacity: 0, y: 10, scale: 0.95, filter: "blur(5px)" }} 
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="absolute top-[130%] right-0 w-[280px] sm:w-[320px] bg-[#03254c]/95 backdrop-blur-2xl rounded-2xl shadow-[0_20px_50px_rgba(2,24,48,0.7)] border border-white/10 overflow-hidden flex flex-col z-[200]"
                >
                  {isSearching && searchResults.length === 0 ? (
                      <div className="p-6 text-center flex flex-col items-center">
                        <Loader2 size={20} className="animate-spin mb-2 text-[#0866bd]" />
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#FBFBF2]/50">Buscando...</span>
                      </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <div className="p-2 space-y-1">
                        {searchResults.map((prod) => (
                          <motion.div 
                            whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                            key={prod.id} onClick={() => handleProductClick(prod.id)}
                            className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 bg-[#FBFBF2] rounded-lg flex items-center justify-center shrink-0 p-1 border border-transparent group-hover:border-[#0866bd] transition-colors">
                                  <img src={prod.img} alt={prod.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" />
                              </div>
                              <div className="flex flex-col">
                                <p className="text-[10px] font-bold text-[#FBFBF2] uppercase truncate leading-tight group-hover:text-[#FACC15] transition-colors">{prod.name}</p>
                                <p className="text-[9px] font-medium text-[#FBFBF2]/50">{prod.sku}</p>
                              </div>
                            </div>
                            <p className="text-[11px] font-black text-[#FACC15] shrink-0 pl-2 tracking-tighter">${prod.price.toLocaleString('es-MX')}</p>
                          </motion.div>
                        ))}
                      </div>
                      <div onClick={handleSearchSubmit} className="bg-[#021830] p-3 text-center border-t border-white/5 text-[9px] font-bold text-[#0866bd] uppercase tracking-widest hover:bg-[#0866bd] hover:text-[#FBFBF2] transition-colors cursor-pointer flex items-center justify-center gap-1 group">
                        Ver Catálogo Completo <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </>
                  ) : (
                    <div className="p-6 text-center flex flex-col items-center">
                      <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mb-2 border border-white/10">
                        <Search size={16} className="text-[#FBFBF2]/40" />
                      </div>
                      <p className="text-[10px] font-bold text-[#FBFBF2]/60 uppercase tracking-widest">Sin resultados</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* 5. HERRAMIENTAS Y CARRITO DE COMPRAS */}
          <motion.div layout className="flex items-center gap-1 pl-1 pr-1 shrink-0 relative z-10">
            <motion.button 
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }} whileTap={{ scale: 0.95 }}
              onClick={() => setTrackModalOpen(true)}
              className={`hidden sm:flex items-center justify-center w-9 h-9 bg-transparent text-[#FBFBF2]/70 rounded-full transition-colors hover:text-[#FBFBF2] ${isSearchOpen ? 'w-0 opacity-0 p-0 overflow-hidden' : ''}`}
              title="Rastrear Pedido"
            >
              <Package size={16} strokeWidth={1.5} />
            </motion.button>
            
            {/* === CARRITO DE COMPRAS (Oro Sutil) === */}
            <div className="relative">
              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                animate={isCartBouncing ? { scale: [1, 1.15, 0.95, 1.05, 1], rotate: [0, -5, 5, 0] } : {}}
                onClick={toggleCart} 
                className="relative flex items-center justify-center w-10 h-10 rounded-[1rem] group/cart shadow-[0_2px_10px_rgba(250,204,21,0.2)] hover:shadow-[0_5px_15px_rgba(250,204,21,0.4)] transition-shadow"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-[#FACC15] to-yellow-200 rounded-[1rem] overflow-hidden">
                   <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.5)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] group-hover/cart:bg-[position:200%_0,0_0] transition-[background-position] duration-[1s]"></div>
                </div>
                <ShoppingCart size={16} strokeWidth={2} className="relative z-10 text-[#021830] ml-[-1px] group-hover/cart:scale-105 transition-transform" />
              </motion.button>
              
              {/* Notificador Pop (Rojo Vivo) */}
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.div 
                    key={cartCount} initial={{ scale: 0, y: 5 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    className="absolute -top-1 -right-1 pointer-events-none z-50"
                  >
                    <span className="bg-[#EF4444] text-[#FBFBF2] text-[9px] min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full font-bold border-2 border-[#03254c] shadow-sm leading-none">
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
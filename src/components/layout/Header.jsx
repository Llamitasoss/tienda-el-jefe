import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Search, ShoppingCart, Menu, Package, Loader2, ChevronRight, Zap, House, Boxes, X } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config'; 
import { CartContext } from '../../context/CartContext';
import MobileMenu from './MobileMenu';
import { TrackOrderModal } from '../ui/Modals';

const NAV_LINKS = [
  { name: 'INICIO', path: '/', icon: House },
  { name: 'CATÁLOGO', path: '/catalogo', icon: Boxes },
  { name: 'VIP', path: '/talleres', isVIP: true, icon: Zap }
];

// === MICRO-INTERACCIONES FUTURISTAS PARA LOS ÍCONOS ===
const AnimatedIcon = ({ link, isActive, isHovered }) => {
  if (link.name === 'INICIO') {
    return (
      <div className="relative flex items-center justify-center">
        <motion.div animate={isHovered ? { y: -2, scale: 1.1 } : { y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
          <House size={16} className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-400 group-hover/nav:text-white'}`} />
        </motion.div>
        <AnimatePresence>
          {isActive && (
            <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.5, opacity: 0.2 }} exit={{ scale: 0, opacity: 0 }} transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }} className="absolute inset-0 bg-[#0866bd] rounded-full blur-[4px]" />
          )}
        </AnimatePresence>
      </div>
    );
  }
  if (link.name === 'CATÁLOGO') {
    return (
      <motion.div animate={isHovered ? { rotateY: 180, scale: 1.1 } : { rotateY: 0, scale: 1 }} transition={{ duration: 0.6, ease: "easeInOut" }}>
        <Boxes size={16} className={`transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-400 group-hover/nav:text-white'}`} />
      </motion.div>
    );
  }
  if (link.isVIP) {
    return (
      <motion.div animate={isHovered ? { rotate: [0, -15, 15, -10, 10, 0], scale: 1.1 } : { rotate: 0, scale: 1 }} transition={{ duration: 0.5 }}>
        <Zap size={16} className={`transition-colors duration-300 ${isActive ? 'text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]' : 'text-yellow-500/70 group-hover/nav:text-yellow-400'}`} />
      </motion.div>
    );
  }
  return null;
};

export default function Header() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  
  // === ESTADOS DE LA ISLA DINÁMICA ===
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

  // Motor de Búsqueda
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
      {/* OVERLAY DE OSCURECIMIENTO (Al buscar) */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }} 
            animate={{ opacity: 1, backdropFilter: "blur(4px)" }} 
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }} 
            transition={{ duration: 0.4 }}
            className="fixed inset-0 bg-slate-900/30 z-[90] pointer-events-none hidden md:block" 
          />
        )}
      </AnimatePresence>

      {/* === CONTENEDOR FLOTANTE CENTRAL === */}
      <div className="fixed top-4 sm:top-6 left-0 w-full flex justify-center z-[100] pointer-events-none px-4">
        
        {/* === DYNAMIC ISLAND (LA CÁPSULA MAESTRA) === */}
        <motion.div 
          layout // Magia pura: Anima el ancho automáticamente cuando se abre el buscador
          ref={headerRef}
          animate={{ 
            y: isScrolled ? 2 : 0,
            boxShadow: isSearchOpen 
              ? '0 0 0 2px rgba(8,102,189,0.3), 0 30px 60px rgba(0,0,0,0.4)' 
              : isScrolled ? '0 20px 40px rgba(0,0,0,0.4)' : '0 10px 30px rgba(0,0,0,0.2)'
          }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="pointer-events-auto bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-1.5 flex items-center gap-1 relative overflow-visible group/island"
        >
          {/* Borde de luz sutil en la cápsula */}
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-r from-white/5 via-transparent to-white/5 pointer-events-none opacity-50 mix-blend-overlay"></div>

          {/* 1. LOGO Y HAMBURGUESA (MÓVIL) */}
          <div className="flex items-center gap-2 pl-2 shrink-0 relative z-10">
            <button className="lg:hidden text-slate-300 hover:text-white transition-colors" onClick={() => setMobileMenu(true)}>
              <Menu size={24} />
            </button>
            <motion.div layout>
              <Link to="/" className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-slate-50 to-slate-200 rounded-full overflow-hidden shadow-[0_2px_10px_rgba(255,255,255,0.2)] hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all shrink-0 border border-white relative group">
                <img src="/logo.ico" alt="Logo" className="w-full h-full object-contain p-1 relative z-10 group-hover:scale-110 transition-transform duration-500" />
              </Link>
            </motion.div>
          </div>

          {/* 2. NAVEGACIÓN MAGNÉTICA (Solo Desktop, se oculta si el buscador requiere mucho espacio) */}
          <motion.nav 
            layout 
            className={`hidden lg:flex items-center relative mx-2 z-10 overflow-hidden transition-all duration-300 ${isSearchOpen ? 'w-0 opacity-0 px-0 mx-0' : 'w-auto opacity-100'}`}
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
                  className="relative px-5 py-3 rounded-full z-10 flex items-center gap-2.5 transition-colors group/nav"
                >
                  {/* Imán de Hover Trasero */}
                  {isHovered && !isActive && (
                    <motion.div layoutId="hover-bg" className="absolute inset-0 bg-white/10 rounded-full" transition={{ type: "spring", stiffness: 400, damping: 25 }} />
                  )}
                  
                  {/* Ícono y Texto */}
                  <AnimatedIcon link={link} isActive={isActive} isHovered={isHovered} />
                  <span className={`relative z-10 font-black text-[10px] uppercase tracking-[0.15em] transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-300 group-hover/nav:text-white'}`}>
                    {link.name}
                  </span>
                  
                  {/* Badge VIP Neón */}
                  {link.isVIP && (
                    <span className={`relative z-10 flex items-center gap-1 text-[8px] font-black px-1.5 py-[2px] rounded-md transition-colors duration-300 shadow-sm ml-0.5 ${isActive ? 'bg-yellow-400 text-slate-900 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'bg-white/10 border border-white/20 text-yellow-400'}`}>
                      VIP
                    </span>
                  )}

                  {/* LÁSER ACTIVO MAGNÉTICO (Subrayado Azul Neón) */}
                  {(isActive || isHovered) && (
                    <motion.div 
                      layoutId="active-laser" 
                      className={`absolute bottom-0 left-4 right-4 h-[2px] rounded-t-full shadow-[0_-2px_8px_rgba(8,102,189,0.8)] ${isActive ? 'bg-[#0866bd]' : 'bg-white/40'}`}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </motion.nav>

          {/* 3. BUSCADOR EXPANSIBLE (Líquido) */}
          <motion.div layout className="relative flex items-center shrink-0 z-20">
            <form 
              onSubmit={handleSearchSubmit}
              className={`relative flex items-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isSearchOpen ? 'bg-slate-800/80 shadow-inner border border-slate-600 rounded-[1.2rem]' : 'bg-transparent rounded-full'}`}
              style={{ width: isSearchOpen ? (window.innerWidth < 640 ? '200px' : '300px') : '44px', height: '44px' }}
            >
              {/* Botón Lupa */}
              <button 
                type="button" 
                onClick={() => {
                  if(!isSearchOpen) {
                    setIsSearchOpen(true);
                    setTimeout(() => searchInputRef.current?.focus(), 150); // Foco suave
                  } else {
                    handleSearchSubmit(new Event('submit'));
                  }
                }}
                className={`absolute left-0 w-11 h-11 flex items-center justify-center z-20 transition-all duration-300 rounded-[1.2rem] ${isSearchOpen ? 'text-[#0866bd] hover:text-blue-400' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
              >
                {isSearching ? <Loader2 size={18} className="animate-spin text-[#0866bd]" /> : <Search size={18} strokeWidth={2.5} />}
              </button>

              {/* Input Invisible (Se estira y aparece) */}
              <input 
                ref={searchInputRef}
                type="text" 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                placeholder="Buscar pieza..." 
                className={`absolute inset-0 pl-11 pr-10 bg-transparent outline-none text-xs font-bold text-white placeholder:text-slate-400 w-full transition-opacity duration-300 ${isSearchOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
                autoComplete="off"
              />

              {/* Botón Cerrar (X) */}
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}
                    type="button" 
                    onClick={() => {setIsSearchOpen(false); setShowDropdown(false); setSearchTerm('');}} 
                    className="absolute right-2 w-7 h-7 flex items-center justify-center bg-slate-700/50 hover:bg-slate-600 rounded-full text-slate-300 hover:text-white z-20 transition-colors"
                  >
                    <X size={12} strokeWidth={3} />
                  </motion.button>
                )}
              </AnimatePresence>
            </form>

            {/* DROPDOWN DEL BUSCADOR (Cristal Blanco Premium) */}
            <AnimatePresence>
              {isSearchOpen && showDropdown && searchTerm.trim().length >= 2 && (
                <motion.div 
                  initial={{ opacity: 0, y: 15, scale: 0.95, filter: "blur(10px)" }} 
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }} 
                  exit={{ opacity: 0, y: 10, scale: 0.95, filter: "blur(5px)" }} 
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="absolute top-[130%] right-0 w-[300px] sm:w-[350px] bg-white/95 backdrop-blur-3xl rounded-[2rem] shadow-[0_30px_60px_rgba(0,0,0,0.3)] border border-slate-200 overflow-hidden flex flex-col z-[200]"
                >
                  {isSearching && searchResults.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center">
                        <Loader2 size={28} className="animate-spin mb-3 text-[#0866bd]" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Analizando...</span>
                      </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <div className="p-2.5 space-y-1">
                        {searchResults.map((prod) => (
                          <motion.div 
                            whileHover={{ scale: 1.02, backgroundColor: "rgba(248, 250, 252, 1)" }}
                            key={prod.id} onClick={() => handleProductClick(prod.id)}
                            className="flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 bg-white rounded-xl border border-slate-100 flex items-center justify-center shrink-0 p-1.5 shadow-sm group-hover:border-blue-200 transition-colors">
                                  <img src={prod.img} alt={prod.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform" />
                              </div>
                              <p className="text-[11px] font-black text-slate-700 uppercase truncate group-hover:text-[#0866bd] transition-colors">{prod.name}</p>
                            </div>
                            <p className="text-xs font-black text-slate-900 shrink-0 pl-2 tracking-tighter group-hover:text-[#0866bd] transition-colors">${prod.price.toLocaleString('es-MX')}</p>
                          </motion.div>
                        ))}
                      </div>
                      <div onClick={handleSearchSubmit} className="bg-slate-50/80 p-4 text-center border-t border-slate-100 text-[10px] font-black text-[#0866bd] uppercase tracking-widest hover:bg-[#0866bd] hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1 group">
                        Ver Catálogo Completo <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center flex flex-col items-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <Search size={20} className="text-slate-400" />
                      </div>
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Sin resultados</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* 4. BOTONES RASTREO Y CARRITO */}
          <motion.div layout className="flex items-center gap-1.5 pl-1 shrink-0 relative z-10">
            {/* Rastrear - Se oculta suavemente si el buscador necesita espacio en móvil */}
            <motion.button 
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }} whileTap={{ scale: 0.95 }}
              onClick={() => setTrackModalOpen(true)}
              className={`hidden sm:flex items-center justify-center w-11 h-11 bg-transparent border border-transparent text-slate-300 rounded-[1.2rem] transition-colors ${isSearchOpen ? 'w-0 opacity-0 p-0 overflow-hidden' : ''}`}
              title="Rastrear Pedido"
            >
              <Package size={20} strokeWidth={2} />
            </motion.button>
            
            {/* Carrito de Compra (El Ícono de Poder) */}
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              animate={isCartBouncing ? { scale: [1, 1.25, 0.9, 1.1, 1], rotate: [0, -10, 10, 0] } : {}}
              onClick={toggleCart} 
              className="relative bg-gradient-to-tr from-yellow-500 via-amber-400 to-yellow-300 text-slate-900 w-11 h-11 rounded-[1.2rem] flex items-center justify-center shadow-[0_5px_20px_rgba(250,204,21,0.4)] border border-yellow-200 overflow-hidden group/cart"
            >
              {/* Brillo interno */}
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/40"></div>
              <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-[-25deg] group-hover/cart:animate-[shimmer_1.5s_infinite]"></div>
              
              <ShoppingCart size={18} strokeWidth={2.5} className="relative z-10 ml-[-1px] group-hover/cart:scale-110 transition-transform" />
              
              {/* Notificador Pop Neón */}
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span 
                    key={cartCount} initial={{ scale: 0, y: 5 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] min-w-[20px] h-[20px] px-1 flex items-center justify-center rounded-full font-black border-2 border-slate-900 shadow-[0_0_10px_rgba(239,68,68,0.8)] z-20"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>

        </motion.div>
      </div>

      {/* Modales fuera del flujo para evitar conflictos visuales */}
      <MobileMenu isOpen={mobileMenu} onClose={() => setMobileMenu(false)} onOpenTrackModal={() => setTrackModalOpen(true)} />
      <TrackOrderModal isOpen={trackModalOpen} onClose={() => setTrackModalOpen(false)} />
    </>
  );
}
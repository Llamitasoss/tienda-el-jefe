import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, Menu, Package, Facebook, Instagram, Loader2, ChevronRight } from 'lucide-react';
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

export default function Header() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [catalogCache, setCatalogCache] = useState(null); 
  const searchContainerRef = useRef(null);

  const { cartItems, toggleCart } = useContext(CartContext);
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const cartCount = cartItems.reduce((total, item) => total + item.qty, 0);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowDropdown(false);
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
    } else {
      navigate('/catalogo');
    }
  };

  const handleProductClick = (id) => {
    navigate(`/producto/${id}`);
    setShowDropdown(false);
    setSearchTerm('');
  };

  return (
    <header className="sticky top-0 z-[100] bg-[#0866bd] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <button className="lg:hidden text-white hover:text-yellow-300 transition-colors" onClick={() => setMobileMenu(true)}>
            <Menu size={28} />
          </button>
          <Link to="/" className="flex items-center gap-3 cursor-pointer group">
            
            {/* === AQUÍ ESTÁ TU NUEVO LOGO === */}
            <div className="bg-white p-1 rounded-xl group-hover:scale-105 transition-transform shadow-sm flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 overflow-hidden">
              <img src="/logo.ico" alt="Logo El Jefe" className="w-full h-full object-contain" />
            </div>

            <div className="hidden sm:flex flex-col">
              <h1 className="font-black uppercase tracking-widest text-white text-xl leading-none group-hover:text-yellow-300 transition-colors">EL JEFE</h1>
              <p className="text-[9px] text-blue-200 uppercase tracking-[0.2em] font-bold mt-0.5">Moto Partes</p>
            </div>
          </Link>
        </div>

        <div ref={searchContainerRef} className="hidden md:block relative flex-1 max-w-2xl mx-4 lg:mx-8">
          <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center bg-white rounded-full p-1 shadow-inner border-2 border-transparent focus-within:border-yellow-400 transition-colors z-20">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => { if(searchTerm.trim().length > 0) setShowDropdown(true); }}
              placeholder="Buscar por nombre, moto o categoría..." 
              className="w-full py-2 px-5 bg-transparent outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400" 
              autoComplete="off"
            />
            <button type="submit" className="bg-[#0866bd] text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-blue-800 transition-colors shadow-sm shrink-0">
              {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </button>
          </form>

          {showDropdown && searchTerm.trim().length >= 2 && (
            <div className="absolute top-full left-0 w-full mt-3 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-in-up flex flex-col z-50">
              
              {isSearching && searchResults.length === 0 ? (
                 <div className="p-6 text-center text-slate-400 flex flex-col items-center">
                   <Loader2 size={24} className="animate-spin mb-2 text-[#0866bd]" />
                   <span className="text-xs font-bold uppercase tracking-widest">Buscando...</span>
                 </div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="flex flex-col divide-y divide-slate-50">
                    {searchResults.map((prod) => (
                      <div 
                        key={prod.id} 
                        onClick={() => handleProductClick(prod.id)}
                        className="flex items-center justify-between p-4 hover:bg-blue-50 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 bg-white rounded-lg border border-slate-100 flex items-center justify-center shrink-0 p-1">
                             <img src={prod.img} alt={prod.name} className="w-full h-full object-contain mix-blend-multiply" />
                          </div>
                          <p className="text-xs font-black text-slate-700 uppercase truncate group-hover:text-[#0866bd] transition-colors">
                            {prod.name}
                          </p>
                        </div>
                        <p className="text-sm font-black text-[#0866bd] shrink-0 pl-4">
                          ${prod.price.toLocaleString('es-MX')}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div 
                    onClick={handleSearchSubmit}
                    className="bg-slate-50 p-4 text-center border-t border-slate-100 text-xs font-black text-[#0866bd] uppercase tracking-widest hover:bg-blue-100 transition-colors cursor-pointer flex items-center justify-center gap-2 group"
                  >
                    Ver todos los resultados <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </>
              ) : (
                <div className="p-6 text-center text-slate-500 text-sm font-medium">
                  No encontramos refacciones para "<span className="font-bold text-slate-800">{searchTerm}</span>".
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          
          <div className="hidden xl:flex items-center gap-3 mr-2 border-r border-blue-400/30 pr-5">
            <a 
              href="https://www.facebook.com/profile.php?id=61582551320267" 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-[#1877F2] hover:scale-110 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-[0_0_15px_rgba(24,119,242,0.6)] border border-white/10 backdrop-blur-sm"
            >
              <Facebook size={18} />
            </a>
            <a 
              href="https://www.instagram.com/el_jefe1949/" 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7] hover:scale-110 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-[0_0_15px_rgba(238,42,123,0.6)] border border-white/10 backdrop-blur-sm"
            >
              <Instagram size={18} />
            </a>
            <a 
              href="https://www.tiktok.com/@moto.partes.el.je" 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-black hover:scale-110 hover:-translate-y-1 transition-all duration-300 shadow-sm hover:shadow-[0_0_15px_rgba(0,0,0,0.6)] border border-white/10 backdrop-blur-sm"
            >
              <TikTok size={18} />
            </a>
          </div>

          <button 
            onClick={() => setTrackModalOpen(true)}
            className="hidden lg:flex items-center gap-2 bg-[#0b549e] hover:bg-blue-900 border border-blue-400/30 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors shadow-inner"
          >
            <Package size={16} /> Rastrear Orden
          </button>
          
          <button onClick={toggleCart} className="relative bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 w-11 h-11 rounded-full flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span key={cartCount} className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-black border-2 border-[#0866bd] animate-pop">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <nav className="hidden lg:flex bg-[#0f172a] border-b border-slate-800 justify-center gap-12">
        <Link to="/" className="relative px-4 py-4 text-slate-300 font-bold text-sm uppercase tracking-widest flex items-center hover:text-white hover:bg-slate-800 transition-colors group">
          INICIO
          <div className="absolute bottom-0 left-0 w-full h-1 bg-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
        </Link>
        <Link to="/catalogo" className="relative px-4 py-4 text-slate-300 font-bold text-sm uppercase tracking-widest flex items-center hover:text-white hover:bg-slate-800 transition-colors group">
          REFACCIONES
          <div className="absolute bottom-0 left-0 w-full h-1 bg-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
        </Link>
        
        <Link to="/talleres" className="relative px-4 py-4 text-slate-300 font-bold text-sm uppercase tracking-widest flex items-center hover:text-white hover:bg-slate-800 transition-colors group">
          TALLERES
          <span className="ml-2 bg-[#0866bd] border border-blue-400 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm shadow-blue-500/50">VIP</span>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
        </Link>
      </nav>

      <MobileMenu 
        isOpen={mobileMenu} 
        onClose={() => setMobileMenu(false)} 
        onOpenTrackModal={() => setTrackModalOpen(true)} 
      />
      
      <TrackOrderModal 
        isOpen={trackModalOpen} 
        onClose={() => setTrackModalOpen(false)} 
      />
    </header>
  );
}
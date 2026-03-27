import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from 'framer-motion';
import { 
  Search, Loader2, Wrench, Package, Settings, Cog, 
  Activity, Zap, CircleDashed, Star, X,
  Droplet, Gauge, Disc, Link2, PenTool, GitMerge, Cpu, 
  Wind, Shield, Circle, ArrowUp, ArrowDown, 
  MoveHorizontal, Lightbulb, BatteryCharging, Cable, 
  Mountain, LifeBuoy, User, Smartphone, ChevronRight, CheckCircle, ArrowRight,
  History, Trash2, SlidersHorizontal, Globe, Target
} from 'lucide-react';
import ProductGrid from '../components/products/ProductGrid';

export const INVENTORY_CATEGORIES = {
  "MANTENIMIENTO": ["Lubricación / Líquidos", "Afinación", "Frenos"],
  "KITS": ["Tracción y Arrastre", "Motor y Afinación", "Suspensión y Dirección"],
  "MOTOR": ["Componentes Internos", "Alimentación / Escape", "Sellado"],
  "TRANSMISIÓN": ["Embrague", "Caja de Vel.", "Ruedas"],
  "SUSPENSIÓN": ["Delantera", "Trasera", "Dirección"],
  "ELÉCTRICO": ["Iluminación", "Encendido y Carga", "Controles y Cableado"],
  "LLANTAS": ["Por Terreno", "Cámaras y Corbatas", "Accesorios de Rueda"],
  "ACCESORIOS": ["Para el Motociclista", "Para la Motocicleta", "Tecnología en Ruta"]
};

const SUBCATEGORY_ICONS = {
  "Lubricación / Líquidos": Droplet, "Afinación": Gauge, "Frenos": Disc,
  "Tracción y Arrastre": Link2, "Motor y Afinación": PenTool, "Suspensión y Dirección": GitMerge,
  "Componentes Internos": Cpu, "Alimentación / Escape": Wind, "Sellado": Shield,
  "Embrague": Circle, "Caja de Vel.": Cog, "Ruedas": CircleDashed,
  "Delantera": ArrowUp, "Trasera": ArrowDown, "Dirección": MoveHorizontal,
  "Iluminación": Lightbulb, "Encendido y Carga": BatteryCharging, "Controles y Cableado": Cable,
  "Por Terreno": Mountain, "Cámaras y Corbatas": LifeBuoy, "Accesorios de Rueda": Wrench,
  "Para el Motociclista": User, "Para la Motocicleta": Star, "Tecnología en Ruta": Smartphone
};

const MAIN_CATEGORIES = [
  { id: 'MANTENIMIENTO', nombre: 'Mantenimiento', icon: Wrench },
  { id: 'KITS', nombre: 'Kits Completos', icon: Package },
  { id: 'MOTOR', nombre: 'Motor', icon: Settings },
  { id: 'TRANSMISIÓN', nombre: 'Transmisión', icon: Cog },
  { id: 'SUSPENSIÓN', nombre: 'Suspensión', icon: Activity },
  { id: 'ELÉCTRICO', nombre: 'Sistema Eléctrico', icon: Zap },
  { id: 'LLANTAS', nombre: 'Llantas', icon: CircleDashed },
  { id: 'ACCESORIOS', nombre: 'Accesorios', icon: Star }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

// === COMPONENTE PREMIUM: TARJETA INTERACTIVA CON GLOW ===
const InteractiveCard = ({ children, isUniversalMode, onClick, delay = 0 }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      className={`relative group bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2rem] p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500 overflow-hidden ${isUniversalMode ? 'hover:border-emerald-300/50' : 'hover:border-blue-300/50'}`}
    >
      {/* Luz ambiental que sigue al ratón */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[2rem] opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              250px circle at ${mouseX}px ${mouseY}px,
              ${isUniversalMode ? 'rgba(16, 185, 129, 0.15)' : 'rgba(8, 102, 189, 0.15)'},
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative z-10 flex flex-col items-center w-full h-full">{children}</div>
    </motion.div>
  );
};

export default function CatalogWizard() {
  const location = useLocation();

  const [step, setStep] = useState(() => Number(sessionStorage.getItem('cw_step')) || 1);
  const [vehicle, setVehicle] = useState(() => JSON.parse(sessionStorage.getItem('cw_vehicle')) || { marca: '', cc: '', anio: '', modelo: '' });
  const [isUniversalMode, setIsUniversalMode] = useState(() => JSON.parse(sessionStorage.getItem('cw_universal')) || false);
  const [selectedCategory, setSelectedCategory] = useState(() => sessionStorage.getItem('cw_category') || '');
  const [selectedSubCategory, setSelectedSubCategory] = useState(() => sessionStorage.getItem('cw_subCategory') || '');
  const [productos, setProductos] = useState(() => JSON.parse(sessionStorage.getItem('cw_productos')) || []);
  
  const [savedGarage, setSavedGarage] = useState(() => JSON.parse(localStorage.getItem('ej_garage')) || []);
  const [sortBy, setSortBy] = useState('relevancia');
  const [inStockOnly, setInStockOnly] = useState(false);

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [dictionary, setDictionary] = useState({});
  const [dictLoading, setDictLoading] = useState(true);

  // Tema de colores dinámico basado en el modo
  const themeColor = isUniversalMode ? 'emerald' : 'blue';
  const themeHex = isUniversalMode ? '#10b981' : '#0866bd';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlCategory = params.get('categoria');

    if (urlCategory) {
      const catUpper = urlCategory.toUpperCase();
      setSelectedCategory(catUpper);
      if (vehicle.marca && vehicle.modelo && vehicle.anio) {
        setStep(3);
      } else if (isUniversalMode) {
        setStep(3);
      } else {
        setStep(1);
      }
    }
  }, [location.search, vehicle.marca, vehicle.modelo, vehicle.anio, isUniversalMode]);

  useEffect(() => {
    sessionStorage.setItem('cw_step', step);
    sessionStorage.setItem('cw_vehicle', JSON.stringify(vehicle));
    sessionStorage.setItem('cw_universal', JSON.stringify(isUniversalMode));
    sessionStorage.setItem('cw_category', selectedCategory);
    sessionStorage.setItem('cw_subCategory', selectedSubCategory);
    sessionStorage.setItem('cw_productos', JSON.stringify(productos));
  }, [step, vehicle, isUniversalMode, selectedCategory, selectedSubCategory, productos]);

  useEffect(() => {
    const buildDictionary = async () => {
      setDictLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "productos"));
        const dict = {}; 
        snapshot.forEach(doc => {
          const data = doc.data();
          if (data.compatibilidad && Array.isArray(data.compatibilidad)) {
            data.compatibilidad.forEach(comp => {
              const marca = comp.marca?.toUpperCase();
              const modelo = comp.modelo?.toUpperCase();
              const cc = comp.cilindraje || 'N/A'; 
              const anios = comp.años || [];
              if (marca && modelo && anios.length > 0) {
                if (!dict[marca]) dict[marca] = {};
                if (!dict[marca][cc]) dict[marca][cc] = {};
                if (!dict[marca][cc][modelo]) dict[marca][cc][modelo] = new Set();
                anios.forEach(anio => dict[marca][cc][modelo].add(String(anio)));
              }
            });
          }
        });
        setDictionary(dict);
      } catch (error) { console.error("Error al construir diccionario:", error); }
      // Agregamos un ligero delay para apreciar la animación premium de carga
      setTimeout(() => setDictLoading(false), 800);
    };
    buildDictionary();
  }, []);

  const availableMarcas = Object.keys(dictionary || {}).sort();
  const availableCC = (vehicle.marca && dictionary[vehicle.marca]) ? Object.keys(dictionary[vehicle.marca]).sort() : [];

  let availableModelos = [];
  if (vehicle.marca && dictionary[vehicle.marca]) {
    if (vehicle.cc && dictionary[vehicle.marca][vehicle.cc]) {
      availableModelos = Object.keys(dictionary[vehicle.marca][vehicle.cc]).sort();
    } else {
      const allModels = new Set();
      Object.values(dictionary[vehicle.marca]).forEach(ccObj => {
        if (ccObj) Object.keys(ccObj).forEach(mod => allModels.add(mod));
      });
      availableModelos = Array.from(allModels).sort();
    }
  }

  let availableAnios = [];
  if (vehicle.marca && vehicle.modelo && dictionary[vehicle.marca]) {
    const searchCC = vehicle.cc || Object.keys(dictionary[vehicle.marca]).find(c => dictionary[vehicle.marca][c] && dictionary[vehicle.marca][c][vehicle.modelo]);
    if (searchCC && dictionary[vehicle.marca][searchCC] && dictionary[vehicle.marca][searchCC][vehicle.modelo]) {
      availableAnios = Array.from(dictionary[vehicle.marca][searchCC][vehicle.modelo]).sort((a, b) => b - a);
    }
  }

  const handleMarcaChange = (e) => setVehicle({ marca: e.target.value, cc: '', modelo: '', anio: '' });
  const handleCcChange = (e) => setVehicle({ ...vehicle, cc: e.target.value, modelo: '', anio: '' });
  const handleModeloChange = (e) => setVehicle({ ...vehicle, modelo: e.target.value.toUpperCase(), anio: '' });
  const handleAnioChange = (e) => setVehicle({ ...vehicle, anio: e.target.value });

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setStep(3);
  };

  const confirmVehicle = () => {
    setIsUniversalMode(false);
    const newGarage = [vehicle, ...savedGarage.filter(v => v.marca !== vehicle.marca || v.modelo !== vehicle.modelo)].slice(0, 3);
    setSavedGarage(newGarage);
    localStorage.setItem('ej_garage', JSON.stringify(newGarage));
    setStep(selectedCategory ? 3 : 2);
  };

  const loadFromGarage = (savedVehicle) => {
    setIsUniversalMode(false);
    setVehicle(savedVehicle);
    setStep(selectedCategory ? 3 : 2);
  };

  const handleUniversalMode = () => {
    setIsUniversalMode(true);
    setVehicle({ marca: '', cc: '', anio: '', modelo: '' });
    setStep(selectedCategory ? 3 : 2);
  };

  const clearGarage = () => {
    setSavedGarage([]);
    localStorage.removeItem('ej_garage');
  };

  const fetchProductsForVehicle = async (subCategory) => {
    setSelectedSubCategory(subCategory);
    setStep(4);
    setLoadingProducts(true);
    setSortBy('relevancia'); 
    setInStockOnly(false);
    
    try {
      const q = query(collection(db, "productos"), where("cat", "==", selectedCategory), where("subCat", "==", subCategory));
      const snapshot = await getDocs(q);
      let prods = [];
      
      const modelClean = vehicle.modelo ? vehicle.modelo.trim().replace(/\s+/g, ' ') : '';
      const searchTag = `${vehicle.marca}_${modelClean}_${vehicle.anio}`.toUpperCase();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const searchKeys = data.searchKeys || [];
        const prodName = (data.name || data.Nombre || "").toLowerCase();
        
        const isUniversalProduct = data.isUniversal === true || prodName.includes('universal') || searchKeys.some(k => typeof k === 'string' && k.toLowerCase().includes('universal'));
        
        let addToResults = false;
        
        if (isUniversalMode) {
          addToResults = isUniversalProduct;
        } else {
          const isCompatible = searchKeys.includes(searchTag);
          addToResults = isCompatible || isUniversalProduct;
        }

        if (addToResults) {
          prods.push({
            id: doc.id,
            name: data.name || data.Nombre,
            category: data.subCat || data.cat,
            price: data.promoPrice || data.price || data.Precio || 0,
            originalPrice: data.promoPrice ? data.price : (data.PrecioBase || null),
            isHot: !!data.promoPrice,
            images: data.images || [],
            img: data.images?.[0] || data.image || data.ImagenURL || "https://placehold.co/600x600/f8fafc/0866BD?text=Sin+Foto",
            isUniversal: isUniversalProduct,
            stock: parseInt(data.stock) || 0
          });
        }
      });
      setProductos(prods);
    } catch (error) { console.error("Error al buscar productos compatibles:", error); }
    
    // Simular un poco de "procesamiento" para la sensación de app robusta
    setTimeout(() => setLoadingProducts(false), 600);
  };

  const resetFilters = () => {
    setVehicle({ marca: '', cc: '', anio: '', modelo: '' });
    setIsUniversalMode(false);
    setSelectedCategory('');
    setSelectedSubCategory('');
    setProductos([]);
    setSortBy('relevancia');
    setInStockOnly(false);
    setStep(1);
    sessionStorage.clear();
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  let displayedProducts = [...productos];
  if (inStockOnly) {
    displayedProducts = displayedProducts.filter(p => p.stock > 0);
  }
  if (sortBy === 'asc') {
    displayedProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'desc') {
    displayedProducts.sort((a, b) => b.price - a.price);
  }

  return (
    <div className="bg-[#f4f7f9] min-h-screen relative selection:bg-yellow-400 selection:text-slate-900 pb-20 overflow-x-hidden">
      
      {/* === FONDO DE ALTA INGENIERÍA === */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(8,102,189,0.03)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(8,102,189,0.03)_1.5px,transparent_1.5px)] bg-[size:40px_40px] pointer-events-none fixed"></div>
      
      {/* Orbes Ambientales Dinámicos */}
      <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 10, repeat: Infinity }} className="absolute top-[-5%] left-[-5%] w-[40vw] h-[40vw] bg-[#0866bd]/20 rounded-full blur-[150px] pointer-events-none mix-blend-multiply"></motion.div>
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.15, 0.05] }} transition={{ duration: 15, repeat: Infinity }} className="absolute bottom-[20%] right-[-5%] w-[35vw] h-[35vw] bg-emerald-400/20 rounded-full blur-[150px] pointer-events-none mix-blend-multiply"></motion.div>

      <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, type: "spring" }}
          className="mb-12 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 uppercase tracking-tighter flex items-center justify-center sm:justify-start gap-4 drop-shadow-sm leading-none mb-3">
              <div className="bg-white p-3 rounded-2xl shadow-[0_10px_20px_rgba(8,102,189,0.15)] border border-white/50 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 to-transparent"></div>
                <Target className="text-[#0866bd] relative z-10" size={36} strokeWidth={2.5} />
              </div>
              Motor de Búsqueda
            </h2>
            <p className="text-slate-500 font-bold mt-3 text-sm tracking-wide bg-white/50 inline-block px-4 py-1.5 rounded-full border border-white/50 shadow-sm backdrop-blur-md">
              Encuentra la pieza exacta garantizada.
            </p>
          </div>
        </motion.div>

        <div className="bg-white/70 backdrop-blur-2xl rounded-[3rem] shadow-[0_30px_80px_rgba(0,0,0,0.06)] border border-white/60 overflow-hidden relative">
          
          {/* === STEPPER (Navegación Superior) === */}
          <div className="bg-white/80 border-b border-slate-100 flex p-5 sm:p-8 gap-4 sm:gap-10 overflow-x-auto custom-scrollbar relative z-20">
            {[{ num: 1, label: 'Identificación' }, { num: 2, label: 'Sistema' }, { num: 3, label: 'Componente' }, { num: 4, label: 'Resultados' }].map((stepObj, idx) => (
              <div key={stepObj.num} className={`flex items-center gap-3 shrink-0 transition-all duration-500 ${step >= stepObj.num ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-[1.2rem] flex items-center justify-center font-black text-sm sm:text-base transition-all duration-500 ${step >= stepObj.num ? `bg-gradient-to-tr from-${themeColor}-600 to-${themeColor}-400 text-white shadow-[0_10px_20px_rgba(${isUniversalMode ? '16,185,129' : '8,102,189'},0.3)] scale-110 border border-${themeColor}-300/50` : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                  {stepObj.num}
                </div>
                <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] transition-colors duration-500 drop-shadow-sm ${step >= stepObj.num ? 'text-slate-800' : 'text-slate-400'}`}>
                  {stepObj.label}
                </span>
                {idx < 3 && <ChevronRight size={16} className={`ml-3 sm:ml-5 transition-colors duration-500 ${step > stepObj.num ? `text-${themeColor}-500` : 'text-slate-300'}`} />}
              </div>
            ))}
          </div>

          <div className="p-6 sm:p-12 lg:p-16 min-h-[500px] relative">
            
            {/* Fondo de resplandor para el contenedor de contenido */}
            <div className={`absolute inset-0 bg-gradient-to-b from-white to-${themeColor}-50/10 pointer-events-none -z-10`}></div>

            {/* === PASO 1: TU MOTO === */}
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }}>
                  
                  <div className="mb-8 flex items-center gap-4">
                    <div className="h-10 w-3 bg-gradient-to-b from-[#0866bd] to-blue-400 rounded-full shadow-[0_0_15px_rgba(8,102,189,0.4)]"></div>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-tight drop-shadow-sm">Filtro Inteligente</h3>
                  </div>

                  {/* GARAGE VIRTUAL (SaaS Style) */}
                  {!dictLoading && savedGarage.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-12 bg-white rounded-[2rem] border border-blue-100 shadow-[0_15px_30px_rgba(8,102,189,0.05)] overflow-hidden">
                      <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center">
                        <h4 className="text-xs font-black text-[#0866bd] uppercase tracking-widest flex items-center gap-2">
                          <History size={16}/> Historial (Garage)
                        </h4>
                        <button onClick={clearGarage} className="text-[10px] text-slate-400 hover:text-red-500 font-black uppercase tracking-[0.2em] flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-200 transition-all hover:border-red-200 hover:shadow-sm">
                          <Trash2 size={12}/> Limpiar
                        </button>
                      </div>
                      <div className="p-6 flex gap-4 overflow-x-auto custom-scrollbar">
                        {savedGarage.map((v, idx) => (
                          <motion.button 
                            whileHover={{ y: -5, scale: 1.02 }} whileTap={{ scale: 0.95 }} key={idx} onClick={() => loadFromGarage(v)}
                            className="flex-shrink-0 bg-white border border-slate-200 hover:border-[#0866bd] hover:shadow-[0_10px_30px_rgba(8,102,189,0.15)] px-6 py-5 rounded-[1.5rem] flex flex-col items-start gap-1.5 transition-all group relative overflow-hidden min-w-[200px] text-left"
                          >
                            <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase tracking-widest relative z-10">{v.marca}</span>
                            <span className="text-sm font-black text-slate-800 uppercase group-hover:text-[#0866bd] transition-colors relative z-10 mt-1">{v.modelo} <span className="text-slate-400 font-bold ml-1">({v.anio})</span></span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  
                  {dictLoading ? (
                    // === ANIMACIÓN DE CARGA TOP-TIER ===
                    <div className="flex flex-col items-center justify-center py-24 px-6 text-slate-400 bg-slate-900 rounded-[3rem] border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.2)] relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0866bd]/20 via-transparent to-transparent pointer-events-none"></div>
                      <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-t-2 border-r-2 border-blue-400 rounded-full opacity-50"></motion.div>
                        <motion.div animate={{ rotate: -360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute inset-2 border-b-2 border-l-2 border-blue-300 rounded-full opacity-70"></motion.div>
                        <Target className="text-[#0866bd] relative z-10" size={32} />
                      </div>
                      <h3 className="font-black uppercase tracking-[0.25em] text-xs text-white drop-shadow-md mb-2">Conectando con Servidor Central</h3>
                      <p className="text-[10px] text-slate-500 font-mono tracking-widest animate-pulse">Obteniendo matriz de compatibilidad...</p>
                    </div>
                  ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                      
                      <motion.div variants={itemVariants} className="flex flex-col gap-2 relative group">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-3 group-focus-within:text-[#0866bd] transition-colors drop-shadow-sm">Marca *</label>
                        <div className="relative">
                          <select value={vehicle.marca} onChange={handleMarcaChange} className="w-full bg-white border-2 border-slate-200 hover:border-blue-300 text-sm font-bold text-slate-800 rounded-2xl p-5 outline-none cursor-pointer focus:border-[#0866bd] transition-all shadow-[inset_0_2px_5px_rgba(0,0,0,0.02)] appearance-none focus:shadow-[0_0_20px_rgba(8,102,189,0.15)] relative z-10">
                            <option value="">Selecciona Marca...</option>
                            {availableMarcas.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <ChevronRight size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90 z-20" />
                        </div>
                      </motion.div>

                      <motion.div variants={itemVariants} className="flex flex-col gap-2 relative group">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-3 flex justify-between group-focus-within:text-[#0866bd] transition-colors drop-shadow-sm">
                          <span>CC</span><span className="text-slate-300 bg-slate-100 px-2 py-0.5 rounded-md text-[8px]">Opcional</span>
                        </label>
                        <div className="relative">
                          <select value={vehicle.cc} onChange={handleCcChange} disabled={!vehicle.marca || availableCC.length === 0} className="w-full bg-white border-2 border-slate-200 hover:border-blue-300 text-sm font-bold text-slate-800 rounded-2xl p-5 outline-none cursor-pointer focus:border-[#0866bd] transition-all shadow-[inset_0_2px_5px_rgba(0,0,0,0.02)] appearance-none disabled:opacity-50 disabled:bg-slate-50 disabled:border-slate-100 disabled:cursor-not-allowed focus:shadow-[0_0_20px_rgba(8,102,189,0.15)] relative z-10">
                            <option value="">Todos los CC...</option>
                            {availableCC.filter(c => c !== 'N/A').map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <ChevronRight size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90 z-20" />
                        </div>
                      </motion.div>

                      <motion.div variants={itemVariants} className="flex flex-col gap-2 relative group">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-3 group-focus-within:text-[#0866bd] transition-colors drop-shadow-sm">Modelo *</label>
                        <div className="relative">
                          <input list="modelos-motos-dict" value={vehicle.modelo} onChange={handleModeloChange} disabled={!vehicle.marca} placeholder="Ej: 250Z..." className="w-full bg-white border-2 border-slate-200 hover:border-blue-300 text-sm font-bold text-slate-800 rounded-2xl p-5 outline-none focus:border-[#0866bd] transition-all shadow-[inset_0_2px_5px_rgba(0,0,0,0.02)] uppercase placeholder:normal-case disabled:opacity-50 disabled:bg-slate-50 disabled:border-slate-100 disabled:cursor-not-allowed focus:shadow-[0_0_20px_rgba(8,102,189,0.15)] relative z-10"/>
                          <datalist id="modelos-motos-dict">{availableModelos.map(mod => <option key={mod} value={mod} />)}</datalist>
                          <Search size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none z-20" />
                        </div>
                      </motion.div>

                      <motion.div variants={itemVariants} className="flex flex-col gap-2 relative group">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-3 group-focus-within:text-[#0866bd] transition-colors drop-shadow-sm">Año *</label>
                        <div className="relative">
                          <select value={vehicle.anio} onChange={handleAnioChange} disabled={!vehicle.modelo} className="w-full bg-white border-2 border-slate-200 hover:border-blue-300 text-sm font-bold text-slate-800 rounded-2xl p-5 outline-none cursor-pointer focus:border-[#0866bd] transition-all shadow-[inset_0_2px_5px_rgba(0,0,0,0.02)] appearance-none disabled:opacity-50 disabled:bg-slate-50 disabled:border-slate-100 disabled:cursor-not-allowed focus:shadow-[0_0_20px_rgba(8,102,189,0.15)] relative z-10">
                            <option value="">Selecciona Año...</option>
                            {availableAnios.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                          <ChevronRight size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90 z-20" />
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  {!dictLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex justify-end pt-2">
                      <motion.button 
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={confirmVehicle} 
                        disabled={!vehicle.marca || !vehicle.anio || !vehicle.modelo}
                        className="relative overflow-hidden bg-slate-900 text-white font-black uppercase tracking-[0.2em] py-5 px-10 rounded-[1.5rem] shadow-[0_15px_30px_rgba(0,0,0,0.2)] hover:shadow-[0_20px_40px_rgba(8,102,189,0.3)] hover:bg-[#0866bd] transition-all duration-500 flex items-center justify-center gap-3 w-full sm:w-max disabled:opacity-50 disabled:bg-slate-400 disabled:cursor-not-allowed group border border-slate-700"
                      >
                        <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] group-hover:animate-[shimmer_1.5s_infinite] z-0 pointer-events-none"></div>
                        <span className="relative z-10 flex items-center gap-3 text-xs drop-shadow-sm">
                          Fijar Motocicleta <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                      </motion.button>
                    </motion.div>
                  )}

                  {/* === SEPARADOR Y BOTÓN UNIVERSAL TOP-TIER === */}
                  {!dictLoading && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-20">
                      <div className="relative mb-10">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                          <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-white/80 backdrop-blur-md px-6 py-2 rounded-full border border-slate-200 text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase shadow-sm">O explora sin límites</span>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.01, boxShadow: "0 25px 50px rgba(16, 185, 129, 0.25)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleUniversalMode}
                        className="w-full relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black uppercase tracking-widest py-8 px-6 sm:px-12 rounded-[2.5rem] shadow-[0_15px_30px_rgba(16,185,129,0.2)] transition-all duration-500 flex items-center justify-between gap-6 group border border-emerald-400/50"
                      >
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-[60px] pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>
                        
                        <div className="flex items-center gap-6 z-10 relative w-full">
                          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/40 shadow-inner group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                            <Globe size={32} strokeWidth={2.5} className="text-white drop-shadow-md" />
                          </div>
                          <div className="flex flex-col items-start text-left flex-1">
                            <span className="text-base sm:text-xl tracking-[0.2em] mb-1.5 drop-shadow-sm text-white">Catálogo Universal</span>
                            <span className="text-[10px] sm:text-xs font-bold text-emerald-50 normal-case tracking-wide opacity-90 max-w-md">Piezas, luces y tecnología compatibles con cualquier modelo.</span>
                          </div>
                          <div className="hidden sm:flex w-12 h-12 bg-white/20 rounded-full items-center justify-center shrink-0 group-hover:bg-white group-hover:text-emerald-600 transition-colors duration-500 backdrop-blur-sm border border-white/30">
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </motion.button>
                    </motion.div>
                  )}

                </motion.div>
              )}

              {/* === PASO 2: SISTEMA === */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }}>
                  
                  {/* BARRA DE ESTADO SUPERIOR */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-12 pb-8 border-b border-slate-200/60 gap-4 bg-white/50 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] shadow-sm border border-white">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border border-white/50 ${isUniversalMode ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-[#0866bd]'}`}>
                        {isUniversalMode ? <Globe size={28}/> : <CheckCircle size={28}/>}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isUniversalMode ? 'Modo Seleccionado' : 'Vehículo Fijado'}</p>
                        <h3 className={`text-xl sm:text-2xl font-black uppercase flex items-center gap-2 mt-0.5 tracking-tight ${isUniversalMode ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {isUniversalMode ? 'Catálogo Universal' : <>{vehicle.marca} <span className={`text-${themeColor}-600`}>{vehicle.modelo}</span> <span className="text-slate-400">({vehicle.anio})</span></>}
                        </h3>
                      </div>
                    </div>
                    <button onClick={() => setStep(1)} className="bg-white border border-slate-200 text-[10px] px-6 py-4 rounded-xl font-black text-slate-500 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all uppercase tracking-[0.2em] shadow-sm active:scale-95 flex items-center justify-center gap-2"><ArrowRight size={14} className="rotate-180"/> Modificar</button>
                  </div>
                  
                  <div className="mb-10 flex items-center gap-4">
                    <div className={`h-10 w-3 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.4)] ${isUniversalMode ? 'bg-gradient-to-b from-emerald-500 to-teal-400 shadow-emerald-500/40' : 'bg-gradient-to-b from-[#0866bd] to-blue-400 shadow-[#0866bd]/40'}`}></div>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-tight drop-shadow-sm">2. Selecciona el Sistema</h3>
                  </div>

                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    {MAIN_CATEGORIES.map((cat) => {
                      const IconComponent = cat.icon;
                      return (
                        <InteractiveCard key={cat.id} isUniversalMode={isUniversalMode} onClick={() => handleCategorySelect(cat.id)}>
                          <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 border border-slate-100 rounded-[1.5rem] flex items-center justify-center mb-5 group-hover:shadow-lg transition-all duration-500 z-10 shadow-inner ${isUniversalMode ? 'group-hover:bg-gradient-to-br group-hover:from-emerald-400 group-hover:to-teal-500 group-hover:text-white group-hover:border-transparent' : 'group-hover:bg-gradient-to-br group-hover:from-blue-500 group-hover:to-[#0866bd] group-hover:text-white group-hover:border-transparent'}`}>
                            <IconComponent size={32} strokeWidth={2} className="text-slate-400 group-hover:text-white transition-colors duration-500" />
                          </div>
                          <span className={`font-black text-[10px] sm:text-xs text-slate-500 uppercase tracking-[0.2em] text-center transition-colors z-10 ${isUniversalMode ? 'group-hover:text-emerald-600' : 'group-hover:text-[#0866bd]'}`}>{cat.nombre}</span>
                        </InteractiveCard>
                      );
                    })}
                  </motion.div>
                </motion.div>
              )}

              {/* === PASO 3: COMPONENTE === */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }}>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-12 pb-8 border-b border-slate-200/60 gap-4 bg-white/50 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] shadow-sm border border-white">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border border-white/50 ${isUniversalMode ? 'bg-emerald-50 text-emerald-600' : 'bg-yellow-50 text-yellow-600'}`}>
                        {isUniversalMode ? <Globe size={28}/> : <CheckCircle size={28}/>}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ruta de Búsqueda</p>
                        <h3 className={`text-sm sm:text-base font-black uppercase flex items-center gap-2 mt-1 tracking-tight flex-wrap ${isUniversalMode ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {isUniversalMode ? 'UNIVERSAL' : `${vehicle.marca} ${vehicle.modelo}`} <span className="text-slate-300">/</span> <span className={`text-${themeColor}-600 drop-shadow-sm`}>{selectedCategory}</span>
                        </h3>
                      </div>
                    </div>
                    <button onClick={() => setStep(2)} className="bg-white border border-slate-200 text-[10px] px-6 py-4 rounded-xl font-black text-slate-500 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all uppercase tracking-[0.2em] shadow-sm active:scale-95 flex items-center justify-center gap-2"><ArrowRight size={14} className="rotate-180"/> Sistema</button>
                  </div>
                  
                  <div className="mb-10 flex items-center gap-4">
                    <div className={`h-10 w-3 rounded-full shadow-lg ${isUniversalMode ? 'bg-gradient-to-b from-emerald-500 to-teal-400 shadow-emerald-500/40' : 'bg-gradient-to-b from-[#0866bd] to-blue-400 shadow-[#0866bd]/40'}`}></div>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-tight drop-shadow-sm">3. Tipo de Pieza</h3>
                  </div>

                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {INVENTORY_CATEGORIES[selectedCategory]?.map((subCat) => {
                      const IconComponent = SUBCATEGORY_ICONS[subCat] || Settings; 
                      return (
                        <InteractiveCard key={subCat} isUniversalMode={isUniversalMode} onClick={() => fetchProductsForVehicle(subCat)}>
                          <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 border border-slate-100 rounded-[1.5rem] flex items-center justify-center mb-5 transition-all duration-500 z-10 shadow-inner ${isUniversalMode ? 'group-hover:bg-gradient-to-br group-hover:from-emerald-400 group-hover:to-teal-500 group-hover:text-white group-hover:border-transparent group-hover:shadow-[0_10px_20px_rgba(16,185,129,0.3)]' : 'group-hover:bg-gradient-to-br group-hover:from-[#0866bd] group-hover:to-blue-600 group-hover:text-white group-hover:border-transparent group-hover:shadow-[0_10px_20px_rgba(8,102,189,0.3)]'}`}>
                            <IconComponent size={32} strokeWidth={2} className="text-slate-400 group-hover:text-white transition-colors duration-500" />
                          </div>
                          <span className={`font-black text-[10px] sm:text-xs text-slate-500 uppercase tracking-[0.2em] text-center transition-colors z-10 ${isUniversalMode ? 'group-hover:text-emerald-600' : 'group-hover:text-[#0866bd]'}`}>{subCat}</span>
                        </InteractiveCard>
                      );
                    })}
                  </motion.div>
                </motion.div>
              )}

              {/* === PASO 4: RESULTADOS === */}
              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                  
                  {/* BARRA DE ESTADO FINAL */}
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 pb-8 border-b border-slate-200/60 gap-6 bg-white/50 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] shadow-sm border border-white">
                    <div className="flex items-start sm:items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border border-white/50 shrink-0 ${isUniversalMode ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {isUniversalMode ? <Globe size={28}/> : <CheckCircle size={28}/>}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isUniversalMode ? 'Catálogo Universal' : 'Búsqueda Finalizada'}</p>
                        <h3 className={`text-sm sm:text-base font-black uppercase flex items-center gap-2 mt-1 flex-wrap tracking-tight ${isUniversalMode ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {isUniversalMode ? 'Todas las Motos' : `${vehicle.marca} ${vehicle.modelo} (${vehicle.anio})`} <span className="text-slate-300 px-1">/</span> <span className={`text-${themeColor}-600 drop-shadow-sm`}>{selectedSubCategory}</span>
                        </h3>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setStep(3)} className="flex-1 sm:flex-none bg-white border border-slate-200 text-[10px] px-6 py-4 rounded-xl font-black text-slate-500 hover:bg-slate-100 hover:border-slate-300 transition-colors uppercase tracking-[0.2em] shadow-sm active:scale-95 flex items-center justify-center gap-2"><ArrowRight size={14} className="rotate-180"/> Atrás</button>
                      <button onClick={resetFilters} className="flex-1 sm:flex-none bg-white border border-red-100 text-[10px] px-6 py-4 rounded-xl font-black text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors uppercase tracking-[0.2em] shadow-sm active:scale-95 flex items-center justify-center gap-2"><X size={14} strokeWidth={2.5}/> Reset</button>
                    </div>
                  </div>
                  
                  {loadingProducts ? (
                    // === ANIMACIÓN DE CARGA DE RESULTADOS ===
                    <div className="flex flex-col items-center justify-center py-32 text-slate-400 bg-white/40 backdrop-blur-sm rounded-[3rem] border border-white shadow-sm">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
                        <Loader2 className={`mb-6 drop-shadow-md ${isUniversalMode ? 'text-emerald-500' : 'text-[#0866bd]'}`} size={56} strokeWidth={2.5} />
                      </motion.div>
                      <p className="font-black tracking-[0.3em] uppercase text-[10px] animate-pulse text-slate-500">Filtrando Inventario Exacto...</p>
                    </div>
                  ) : productos.length > 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                      
                      {/* === PANEL DE FILTROS === */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 bg-white/80 backdrop-blur-md border border-white p-4 sm:px-6 rounded-2xl shadow-sm">
                        <h3 className="text-sm sm:text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                          Resultados <span className={`text-xs px-2.5 py-1 rounded-md text-white ${isUniversalMode ? 'bg-emerald-500' : 'bg-[#0866bd]'}`}>{displayedProducts.length}</span>
                        </h3>
                        <div className="flex flex-wrap items-center gap-5 w-full sm:w-auto">
                          
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors duration-300 shadow-inner ${inStockOnly ? (isUniversalMode ? 'bg-emerald-500' : 'bg-blue-500') : 'bg-slate-200'}`}>
                              <div className={`bg-white w-3 h-3 rounded-full shadow-sm transform transition-transform duration-300 ${inStockOnly ? 'translate-x-5' : ''}`}></div>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-800 transition-colors">En Mostrador</span>
                          </label>
                          
                          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                          
                          <div className={`flex items-center gap-3 text-slate-500 bg-white px-4 py-2.5 rounded-xl border border-slate-200 focus-within:shadow-sm transition-all group shadow-inner ${isUniversalMode ? 'focus-within:border-emerald-400' : 'focus-within:border-[#0866bd]'}`}>
                            <SlidersHorizontal size={14} className={`transition-colors ${isUniversalMode ? 'group-focus-within:text-emerald-500' : 'group-focus-within:text-[#0866bd]'}`} />
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent text-[10px] font-black uppercase tracking-[0.2em] outline-none cursor-pointer text-slate-700">
                              <option value="relevancia">Destacados</option>
                              <option value="asc">Menor Precio</option>
                              <option value="desc">Mayor Precio</option>
                            </select>
                          </div>

                        </div>
                      </div>

                      {/* RESULTADOS REFINADOS */}
                      <ProductGrid products={displayedProducts} />

                    </motion.div>
                  ) : (
                    // === ESTADO VACÍO ELEGANTE ===
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white/60 backdrop-blur-xl rounded-[3rem] border border-white shadow-[0_20px_40px_rgba(0,0,0,0.04)] relative overflow-hidden">
                      <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] -z-10 ${isUniversalMode ? 'bg-emerald-400/10' : 'bg-blue-400/10'}`}></div>
                      
                      <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mb-8 shadow-sm border border-slate-100">
                        <Search size={40} className="text-slate-300" strokeWidth={2} />
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-tight mb-4 drop-shadow-sm">Inventario Agotado</h3>
                      <p className="font-medium max-w-md text-sm text-slate-500 mb-10 leading-relaxed">
                        Por el momento no tenemos piezas disponibles en la subcategoría <strong className="text-slate-800">{selectedSubCategory}</strong> {isUniversalMode ? 'que sean tipo universal' : <>con garantía de compatibilidad para tu <strong className="text-slate-800">{vehicle.marca} {vehicle.modelo}</strong></>}.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <button onClick={() => setStep(3)} className="bg-white border border-slate-200 text-slate-600 font-black py-4 px-8 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all uppercase tracking-[0.15em] text-[10px] shadow-sm active:scale-95">Buscar Otro Componente</button>
                        <button onClick={resetFilters} className={`text-white font-black py-4 px-8 rounded-xl transition-all uppercase tracking-[0.15em] text-[10px] shadow-[0_10px_20px_rgba(0,0,0,0.15)] active:scale-95 border border-transparent ${isUniversalMode ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-900 hover:bg-[#0866bd]'}`}>Limpiar Filtros</button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
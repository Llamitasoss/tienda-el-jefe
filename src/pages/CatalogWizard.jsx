import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { motion, AnimatePresence, useMotionTemplate, useMotionValue } from 'framer-motion';
import { 
  Search, Loader2, Wrench, Package, Settings, Cog, 
  Activity, Zap, CircleDashed, Star, X,
  Droplet, Gauge, Disc, Link2, PenTool, GitMerge, Cpu, 
  Wind, Shield, Circle, ArrowUp, ArrowDown, 
  MoveHorizontal, Lightbulb, BatteryCharging, Cable, 
  Mountain, LifeBuoy, User, Smartphone, CheckCircle, ArrowRight,
  History, Trash2, SlidersHorizontal, Globe, Target, ChevronDown, Clock
} from 'lucide-react';

// Aquí está la ruta corregida:
import ProductGrid from "../components/products/ProductGrid";

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
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 400, damping: 30 } }
};

// === COMPONENTE PREMIUM: TARJETA INTERACTIVA ===
const InteractiveCard = ({ children, isUniversalMode, onClick }) => {
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
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      className={`relative group bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer shadow-[0_5px_15px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-all duration-500 overflow-hidden ${isUniversalMode ? 'hover:border-emerald-300/60' : 'hover:border-[#0866bd]/40'}`}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[2rem] opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              300px circle at ${mouseX}px ${mouseY}px,
              ${isUniversalMode ? 'rgba(16, 185, 129, 0.08)' : 'rgba(8, 102, 189, 0.06)'},
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
      setTimeout(() => setDictLoading(false), 500);
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
            img: data.images?.[0] || data.image || data.ImagenURL || "https://placehold.co/600x600/FBFBF2/0866bd?text=Sin+Foto",
            isUniversal: isUniversalProduct,
            stock: parseInt(data.stock) || 0
          });
        }
      });
      setProductos(prods);
    } catch (error) { console.error("Error al buscar productos:", error); }
    
    setTimeout(() => setLoadingProducts(false), 500);
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

  // Pestañas del Stepper Conectado
  const stepsConfig = [
    { num: 1, label: 'Identificación' },
    { num: 2, label: 'Sistema' },
    { num: 3, label: 'Componente' },
    { num: 4, label: 'Resultados' }
  ];

  return (
    <div className="bg-slate-50 min-h-screen relative selection:bg-[#0866bd] selection:text-[#FBFBF2] pt-32 sm:pt-40 pb-20 overflow-x-hidden font-sans">
      
      {/* Fondo Light Premium */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(0,0,0,0.03)_1.5px,transparent_1.5px)] bg-[size:30px_30px] pointer-events-none fixed"></div>
      
      {/* Orbes Ambientales */}
      <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.03, 0.08, 0.03] }} transition={{ duration: 10, repeat: Infinity }} className="absolute top-[0%] left-[-5%] w-[40vw] h-[40vw] bg-[#0866bd] rounded-full blur-[150px] pointer-events-none mix-blend-multiply"></motion.div>

      <div className="max-w-[75rem] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, type: "spring" }}
          className="mb-8 sm:mb-12 flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-4 mb-4">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-50/50"></div>
                <Target size={28} className="text-[#0866bd] relative z-10" strokeWidth={2} />
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 uppercase tracking-tighter">
                Motor de <span className="text-[#0866bd]">Búsqueda</span>
              </h1>
            </div>
            <span className="inline-block bg-white border border-slate-200 text-slate-600 font-bold text-[10px] sm:text-xs uppercase tracking-widest px-5 py-2.5 rounded-xl shadow-sm">
              Encuentra la pieza exacta garantizada.
            </span>
          </div>
        </motion.div>

        {/* CONTENEDOR PRINCIPAL MORPHING */}
        <motion.div layout className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden relative">
          
          {/* === STEPPER CONECTADO (Next-Level) === */}
          <div className="bg-slate-50 border-b border-slate-100 px-4 sm:px-10 py-8 relative z-20 overflow-hidden">
            <div className="max-w-3xl mx-auto relative">
              
              {/* Riel de progreso base */}
              <div className="absolute top-5 left-0 w-full h-1.5 bg-slate-200 rounded-full z-0"></div>
              {/* Riel de progreso activo (Azul Brand) */}
              <div 
                className="absolute top-5 left-0 h-1.5 bg-[#0866bd] rounded-full z-0 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_0_10px_rgba(8,102,189,0.5)]" 
                style={{ width: `${((step - 1) / (stepsConfig.length - 1)) * 100}%` }}
              ></div>

              <div className="relative z-10 flex justify-between">
                {stepsConfig.map((s) => (
                  <div key={s.num} className="flex flex-col items-center gap-3 relative group w-1/4">
                    <motion.div 
                      layout
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-[1.2rem] flex items-center justify-center font-black text-sm sm:text-base transition-all duration-500 shadow-sm border-2 ${
                        step > s.num ? 'bg-[#0866bd] border-[#0866bd] text-white' : 
                        step === s.num ? 'bg-white border-[#0866bd] text-[#0866bd] scale-110 shadow-[0_5px_15px_rgba(8,102,189,0.2)]' : 
                        'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      {step > s.num ? <CheckCircle size={20} strokeWidth={3} /> : s.num}
                    </motion.div>
                    {/* Evitar overflow con absolute y width max */}
                    <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-center absolute -bottom-6 w-[150%] transition-colors duration-500 ${step >= s.num ? 'text-slate-800 drop-shadow-sm' : 'text-slate-400'}`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* Espaciado extra para acomodar los labels absolutos */}
            <div className="h-6"></div>
          </div>

          <div className="p-6 sm:p-10 lg:p-14 relative min-h-[400px]">
            <div className={`absolute inset-0 bg-gradient-to-b from-transparent to-${themeColor}-50/30 pointer-events-none -z-10`}></div>

            <AnimatePresence mode="wait">
              {/* === PASO 1: TU MOTO === */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }}>
                  
                  <div className="mb-8 flex items-center gap-3">
                    <div className="h-8 w-2 bg-[#0866bd] rounded-full shadow-[0_2px_8px_rgba(8,102,189,0.4)]"></div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight drop-shadow-sm">Identificador</h3>
                  </div>

                  {/* GARAGE VIRTUAL (Máscara de Fade) */}
                  {!dictLoading && savedGarage.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 bg-slate-50 rounded-[1.5rem] border border-slate-200 overflow-hidden shadow-inner relative">
                      <div className="bg-white border-b border-slate-200 px-5 py-3 flex justify-between items-center">
                        <h4 className="text-[10px] font-black text-[#0866bd] uppercase tracking-widest flex items-center gap-2">
                          <History size={14}/> Tu Garage
                        </h4>
                        <button onClick={clearGarage} className="text-[9px] text-slate-400 hover:text-red-500 font-black uppercase tracking-widest flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-all hover:border-red-200 active:scale-95">
                          <Trash2 size={12}/> Limpiar
                        </button>
                      </div>
                      
                      {/* Fade Mask */}
                      <div className="relative" style={{ maskImage: 'linear-gradient(to right, black 85%, transparent)' }}>
                        <div className="p-5 flex gap-4 overflow-x-auto custom-scrollbar cursor-grab active:cursor-grabbing">
                          {savedGarage.map((v, idx) => (
                            <motion.button 
                              whileHover={{ y: -3, scale: 1.02 }} whileTap={{ scale: 0.95 }} key={idx} onClick={() => loadFromGarage(v)}
                              className="flex-shrink-0 bg-white border border-slate-200 hover:border-[#0866bd]/50 shadow-sm hover:shadow-md px-5 py-4 rounded-2xl flex flex-col items-start gap-1 transition-all group relative overflow-hidden min-w-[180px] text-left"
                            >
                              <span className="text-[8px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md uppercase tracking-widest">{v.marca}</span>
                              <span className="text-xs font-black text-slate-800 uppercase group-hover:text-[#0866bd] transition-colors mt-1.5">{v.modelo} <span className="text-slate-400 font-bold ml-1">({v.anio})</span></span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  {dictLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-slate-400 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner relative overflow-hidden">
                      <Loader2 className="animate-spin text-[#0866bd] mb-4" size={40} strokeWidth={2} />
                      <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-[#0866bd] mb-1">Sincronizando</h3>
                      <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase animate-pulse">Base de datos de compatibilidad...</p>
                    </div>
                  ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                      
                      {/* Inputs con Iconos (SaaS Style) */}
                      <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-2">Marca *</label>
                        <div className="relative group">
                          <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0866bd] transition-colors z-20 pointer-events-none" size={16} strokeWidth={2.5}/>
                          <select value={vehicle.marca} onChange={handleMarcaChange} className="w-full bg-slate-50 border border-slate-200 focus:border-[#0866bd] focus:bg-white rounded-xl pl-11 pr-10 py-4 text-xs font-bold text-slate-800 outline-none cursor-pointer transition-all shadow-inner focus:shadow-sm appearance-none relative z-10">
                            <option value="">Selecciona...</option>
                            {availableMarcas.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-20" />
                        </div>
                      </motion.div>

                      <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
                        <div className="flex justify-between pl-2">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cilindraje</label>
                          <span className="text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded text-[7px] font-bold">Opcional</span>
                        </div>
                        <div className="relative group">
                          <Gauge className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0866bd] transition-colors z-20 pointer-events-none" size={16} strokeWidth={2.5}/>
                          <select value={vehicle.cc} onChange={handleCcChange} disabled={!vehicle.marca || availableCC.length === 0} className="w-full bg-slate-50 border border-slate-200 focus:border-[#0866bd] focus:bg-white rounded-xl pl-11 pr-10 py-4 text-xs font-bold text-slate-800 outline-none cursor-pointer transition-all shadow-inner focus:shadow-sm appearance-none disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed relative z-10">
                            <option value="">Todos...</option>
                            {availableCC.filter(c => c !== 'N/A').map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-20" />
                        </div>
                      </motion.div>

                      <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-2">Modelo *</label>
                        <div className="relative group">
                          <Wrench className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0866bd] transition-colors z-20 pointer-events-none" size={16} strokeWidth={2.5}/>
                          <input list="modelos-motos-dict" value={vehicle.modelo} onChange={handleModeloChange} disabled={!vehicle.marca} placeholder="Ej: 250Z..." className="w-full bg-slate-50 border border-slate-200 focus:border-[#0866bd] focus:bg-white rounded-xl pl-11 pr-10 py-4 text-xs font-bold text-slate-800 outline-none transition-all shadow-inner focus:shadow-sm uppercase placeholder:normal-case disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed relative z-10"/>
                          <datalist id="modelos-motos-dict">{availableModelos.map(mod => <option key={mod} value={mod} />)}</datalist>
                          <Search size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none z-20" />
                        </div>
                      </motion.div>

                      <motion.div variants={itemVariants} className="flex flex-col gap-1.5">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-2">Año *</label>
                        <div className="relative group">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#0866bd] transition-colors z-20 pointer-events-none" size={16} strokeWidth={2.5}/>
                          <select value={vehicle.anio} onChange={handleAnioChange} disabled={!vehicle.modelo} className="w-full bg-slate-50 border border-slate-200 focus:border-[#0866bd] focus:bg-white rounded-xl pl-11 pr-10 py-4 text-xs font-bold text-slate-800 outline-none cursor-pointer transition-all shadow-inner focus:shadow-sm appearance-none disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed relative z-10">
                            <option value="">Selecciona...</option>
                            {availableAnios.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-20" />
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  {!dictLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex justify-end pt-4 border-t border-slate-100">
                      <motion.button 
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={confirmVehicle} 
                        disabled={!vehicle.marca || !vehicle.anio || !vehicle.modelo}
                        className="bg-[#0866bd] text-white font-black uppercase tracking-widest text-[10px] py-4 px-10 rounded-xl shadow-[0_5px_15px_rgba(8,102,189,0.3)] hover:shadow-[0_10px_25px_rgba(8,102,189,0.4)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none group border border-transparent"
                      >
                        Siguiente <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </motion.button>
                    </motion.div>
                  )}

                  {!dictLoading && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-16">
                      <div className="relative mb-8">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                        <div className="relative flex justify-center">
                          <span className="bg-white px-4 py-1.5 rounded-md border border-slate-200 text-[8px] font-black tracking-widest text-slate-400 uppercase shadow-sm">Opciones Generales</span>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.01, boxShadow: "0 15px 30px rgba(16, 185, 129, 0.15)" }} whileTap={{ scale: 0.98 }} onClick={handleUniversalMode}
                        className="w-full relative overflow-hidden bg-white text-slate-800 font-black uppercase tracking-widest py-6 px-6 sm:px-10 rounded-2xl shadow-sm transition-all duration-500 flex items-center justify-between gap-6 group border border-slate-200 hover:border-emerald-300"
                      >
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-multiply pointer-events-none"></div>
                        <div className="flex items-center gap-5 z-10 relative w-full">
                          <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100 group-hover:scale-110 transition-transform duration-500">
                            <Globe size={24} strokeWidth={2} className="text-emerald-500" />
                          </div>
                          <div className="flex flex-col items-start text-left flex-1">
                            <span className="text-sm sm:text-base tracking-tight mb-1 text-emerald-600">Catálogo Universal</span>
                            <span className="text-[9px] font-bold text-slate-500 normal-case tracking-wide max-w-md">Piezas compatibles con cualquier motocicleta.</span>
                          </div>
                          <div className="hidden sm:flex w-10 h-10 bg-emerald-50 rounded-full items-center justify-center shrink-0 group-hover:bg-emerald-500 group-hover:text-white text-emerald-500 transition-colors duration-500 border border-emerald-100 group-hover:border-transparent">
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </motion.button>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* === PASO 2 & 3: CATEGORÍAS (Reutilizando la lógica interactiva) === */}
              {(step === 2 || step === 3) && (
                <motion.div key={`step${step}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }}>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-10 pb-6 border-b border-slate-200 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border bg-white shadow-sm ${isUniversalMode ? 'border-emerald-200 text-emerald-500' : 'border-blue-200 text-[#0866bd]'}`}>
                        {isUniversalMode ? <Globe size={24}/> : <CheckCircle size={24}/>}
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{isUniversalMode ? 'Modo' : 'Fijado'}</p>
                        <h3 className={`text-base sm:text-lg font-black uppercase flex items-center gap-2 tracking-tight ${isUniversalMode ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {isUniversalMode ? 'Universal' : <>{vehicle.marca} <span className="text-[#0866bd]">{vehicle.modelo}</span></>}
                        </h3>
                      </div>
                    </div>
                    <button onClick={() => setStep(step - 1)} className="bg-white border border-slate-200 text-[9px] px-5 py-3 rounded-xl font-black text-slate-500 hover:bg-slate-100 transition-all uppercase tracking-widest shadow-sm active:scale-95 flex items-center justify-center gap-1.5"><ArrowRight size={12} className="rotate-180"/> Atrás</button>
                  </div>
                  
                  <div className="mb-8 flex items-center gap-3">
                    <div className={`h-8 w-2 rounded-full ${isUniversalMode ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-[#0866bd] shadow-[0_0_10px_rgba(8,102,189,0.3)]'}`}></div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 uppercase tracking-tight">{step === 2 ? 'Sistema Principal' : 'Componente Específico'}</h3>
                  </div>

                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
                    {(step === 2 ? MAIN_CATEGORIES : INVENTORY_CATEGORIES[selectedCategory])?.map((item) => {
                      const id = step === 2 ? item.id : item;
                      const nombre = step === 2 ? item.nombre : item;
                      const IconComponent = step === 2 ? item.icon : (SUBCATEGORY_ICONS[item] || Settings);
                      
                      return (
                        <InteractiveCard key={id} isUniversalMode={isUniversalMode} onClick={() => step === 2 ? handleCategorySelect(id) : fetchProductsForVehicle(id)}>
                          <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 z-10 shadow-inner group-hover:text-white group-hover:border-transparent ${isUniversalMode ? 'group-hover:bg-emerald-500 group-hover:shadow-[0_5px_15px_rgba(16,185,129,0.3)]' : 'group-hover:bg-[#0866bd] group-hover:shadow-[0_5px_15px_rgba(8,102,189,0.3)]'}`}>
                            <IconComponent size={24} strokeWidth={2} className="text-slate-400 group-hover:text-white transition-colors duration-500" />
                          </div>
                          <span className={`font-black text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-widest text-center transition-colors z-10 ${isUniversalMode ? 'group-hover:text-emerald-600' : 'group-hover:text-[#0866bd]'}`}>{nombre}</span>
                        </InteractiveCard>
                      );
                    })}
                  </motion.div>
                </motion.div>
              )}

              {/* === PASO 4: RESULTADOS === */}
              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="pb-8">
                  
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 pb-6 border-b border-slate-200 gap-4 bg-slate-50 p-5 rounded-2xl shadow-inner border border-slate-100">
                    <div className="flex items-start sm:items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border bg-white shadow-sm shrink-0 ${isUniversalMode ? 'border-emerald-200 text-emerald-500' : 'border-emerald-200 text-emerald-500'}`}>
                        {isUniversalMode ? <Globe size={24}/> : <CheckCircle size={24}/>}
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{isUniversalMode ? 'Universal' : 'Resultados'}</p>
                        <h3 className={`text-xs sm:text-sm font-black uppercase flex items-center gap-1.5 mt-0.5 flex-wrap tracking-tight ${isUniversalMode ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {isUniversalMode ? 'Cualquier Moto' : `${vehicle.marca} ${vehicle.modelo}`} <span className="text-slate-300">/</span> <span className="text-[#0866bd]">{selectedSubCategory}</span>
                        </h3>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setStep(3)} className="flex-1 sm:flex-none bg-white border border-slate-200 text-[9px] px-4 py-2.5 rounded-lg font-black text-slate-500 hover:bg-slate-100 transition-colors uppercase tracking-widest shadow-sm active:scale-95 flex items-center justify-center gap-1.5"><ArrowRight size={12} className="rotate-180"/> Atrás</button>
                      <button onClick={resetFilters} className="flex-1 sm:flex-none bg-white border border-red-200 text-[9px] px-4 py-2.5 rounded-lg font-black text-red-500 hover:bg-red-50 transition-colors uppercase tracking-widest shadow-sm active:scale-95 flex items-center justify-center gap-1.5"><X size={12} strokeWidth={2.5}/> Limpiar</button>
                    </div>
                  </div>
                  
                  {loadingProducts ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
                        <Loader2 className={`mb-4 drop-shadow-sm ${isUniversalMode ? 'text-emerald-500' : 'text-[#0866bd]'}`} size={40} strokeWidth={2} />
                      </motion.div>
                      <p className="font-black tracking-[0.2em] uppercase text-[9px] animate-pulse text-slate-500">Filtrando Inventario Exacto...</p>
                    </div>
                  ) : productos.length > 0 ? (
                    <motion.div id="resultados-wizard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                      
                      {/* === PANEL DE FILTROS iOS STYLE === */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white border border-slate-200 p-3 sm:px-5 rounded-2xl shadow-sm">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                          Compatibles <span className={`text-[10px] px-2 py-0.5 rounded-md text-white ${isUniversalMode ? 'bg-emerald-500' : 'bg-[#0866bd]'}`}>{displayedProducts.length}</span>
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                          
                          {/* Toggle Switch Nativo iOS Style */}
                          <div 
                            className="flex items-center gap-3 cursor-pointer group"
                            onClick={() => setInStockOnly(!inStockOnly)}
                          >
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-slate-800 transition-colors">Mostrador</span>
                            <div className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300 shadow-inner border border-black/5 ${inStockOnly ? (isUniversalMode ? 'bg-emerald-500' : 'bg-[#0866bd]') : 'bg-slate-200'}`}>
                              <motion.div layout className="bg-white w-4 h-4 rounded-full shadow-sm" style={{ alignSelf: 'center', marginLeft: inStockOnly ? 'auto' : 0 }} />
                            </div>
                          </div>
                          
                          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                          
                          <div className={`flex items-center gap-2 text-slate-500 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus-within:shadow-sm transition-all group shadow-inner ${isUniversalMode ? 'focus-within:border-emerald-400' : 'focus-within:border-[#0866bd]'}`}>
                            <SlidersHorizontal size={14} className={`transition-colors ${isUniversalMode ? 'group-focus-within:text-emerald-500' : 'group-focus-within:text-[#0866bd]'}`} />
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer text-slate-700">
                              <option value="relevancia">Relevantes</option>
                              <option value="asc">Menor Precio</option>
                              <option value="desc">Mayor Precio</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* RESULTADOS */}
                      <ProductGrid products={displayedProducts} />

                    </motion.div>
                  ) : (
                    // === ESTADO VACÍO ELEGANTE ===
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-slate-100">
                        <Search size={28} className="text-slate-300" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-3">Pieza no encontrada</h3>
                      <p className="font-medium max-w-md text-xs text-slate-500 mb-8 leading-relaxed">
                        No tenemos piezas exactas en la categoría <strong className="text-slate-800">{selectedSubCategory}</strong> {isUniversalMode ? 'tipo universal' : <>para <strong className="text-slate-800">{vehicle.marca} {vehicle.modelo}</strong></>}. Es posible que esté en sucursal.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <button onClick={() => setStep(3)} className="bg-white border border-slate-200 text-slate-600 font-black py-3.5 px-6 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all uppercase tracking-widest text-[9px] shadow-sm active:scale-95">Buscar Otra Pieza</button>
                        <a 
                          href={`https://wa.me/523332406334?text=${encodeURIComponent(`Hola, busco: ${selectedSubCategory} para ${vehicle.marca} ${vehicle.modelo} ${vehicle.cc}cc ${vehicle.anio}. ¿La tienen?`)}`}
                          target="_blank" rel="noreferrer"
                          className="bg-[#0866bd] text-white font-black py-3.5 px-6 rounded-xl transition-all uppercase tracking-widest text-[9px] shadow-sm hover:shadow-[0_5px_15px_rgba(8,102,189,0.3)] hover:bg-blue-700 active:scale-95 border border-transparent flex items-center justify-center gap-2"
                        >
                          <Zap size={12} className="fill-current"/> Consultar Asesor
                        </a>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
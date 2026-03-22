import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Loader2, Wrench, Package, Settings, Cog, 
  Activity, Zap, CircleDashed, Star, X,
  Droplet, Gauge, Disc, Link2, PenTool, GitMerge, Cpu, 
  Wind, Shield, Circle, ArrowUp, ArrowDown, 
  MoveHorizontal, Lightbulb, BatteryCharging, Cable, 
  Mountain, LifeBuoy, User, Smartphone, ChevronRight, CheckCircle, ArrowRight,
  History, Trash2, SlidersHorizontal 
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

// Variantes para animación en cascada (Stagger)
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function CatalogWizard() {
  const location = useLocation();

  const [step, setStep] = useState(() => Number(sessionStorage.getItem('cw_step')) || 1);
  const [vehicle, setVehicle] = useState(() => JSON.parse(sessionStorage.getItem('cw_vehicle')) || { marca: '', cc: '', anio: '', modelo: '' });
  const [selectedCategory, setSelectedCategory] = useState(() => sessionStorage.getItem('cw_category') || '');
  const [selectedSubCategory, setSelectedSubCategory] = useState(() => sessionStorage.getItem('cw_subCategory') || '');
  const [productos, setProductos] = useState(() => JSON.parse(sessionStorage.getItem('cw_productos')) || []);
  
  const [savedGarage, setSavedGarage] = useState(() => JSON.parse(localStorage.getItem('ej_garage')) || []);
  const [sortBy, setSortBy] = useState('relevancia');
  const [inStockOnly, setInStockOnly] = useState(false);

  const [loadingProducts, setLoadingProducts] = useState(false);
  const [dictionary, setDictionary] = useState({});
  const [dictLoading, setDictLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlCategory = params.get('categoria');

    if (urlCategory) {
      const catUpper = urlCategory.toUpperCase();
      setSelectedCategory(catUpper);
      
      if (vehicle.marca && vehicle.modelo && vehicle.anio) {
        setStep(3);
      } else {
        setStep(1);
      }
    }
  }, [location.search, vehicle.marca, vehicle.modelo, vehicle.anio]);

  useEffect(() => {
    sessionStorage.setItem('cw_step', step);
    sessionStorage.setItem('cw_vehicle', JSON.stringify(vehicle));
    sessionStorage.setItem('cw_category', selectedCategory);
    sessionStorage.setItem('cw_subCategory', selectedSubCategory);
    sessionStorage.setItem('cw_productos', JSON.stringify(productos));
  }, [step, vehicle, selectedCategory, selectedSubCategory, productos]);

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
      setDictLoading(false);
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
    const newGarage = [vehicle, ...savedGarage.filter(v => v.marca !== vehicle.marca || v.modelo !== vehicle.modelo)].slice(0, 3);
    setSavedGarage(newGarage);
    localStorage.setItem('ej_garage', JSON.stringify(newGarage));
    
    if (selectedCategory) {
      setStep(3);
    } else {
      setStep(2);
    }
  };

  const loadFromGarage = (savedVehicle) => {
    setVehicle(savedVehicle);
    if (selectedCategory) {
      setStep(3);
    } else {
      setStep(2);
    }
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
      const modelClean = vehicle.modelo.trim().replace(/\s+/g, ' ');
      const searchTag = `${vehicle.marca}_${modelClean}_${vehicle.anio}`.toUpperCase();
      
      const q = query(collection(db, "productos"), where("cat", "==", selectedCategory), where("subCat", "==", subCategory));
      const snapshot = await getDocs(q);
      let prods = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const searchKeys = data.searchKeys || [];
        const prodName = (data.name || data.Nombre || "").toLowerCase();
        
        const isCompatible = searchKeys.includes(searchTag);
        const isUniversal = data.isUniversal === true || prodName.includes('universal') || searchKeys.some(k => typeof k === 'string' && k.toLowerCase().includes('universal'));

        if (isCompatible || isUniversal) {
          prods.push({
            id: doc.id,
            name: data.name || data.Nombre,
            category: data.subCat || data.cat,
            price: data.promoPrice || data.price || data.Precio || 0,
            originalPrice: data.promoPrice ? data.price : (data.PrecioBase || null),
            isHot: !!data.promoPrice,
            images: data.images || [],
            img: data.images?.[0] || data.image || data.ImagenURL || "https://placehold.co/600x600/f8fafc/0866BD?text=Sin+Foto",
            isUniversal: isUniversal,
            stock: parseInt(data.stock) || 0
          });
        }
      });
      setProductos(prods);
    } catch (error) { console.error("Error al buscar productos compatibles:", error); }
    setLoadingProducts(false);
  };

  const resetFilters = () => {
    setVehicle({ marca: '', cc: '', anio: '', modelo: '' });
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
    <div className="bg-[#f8fafc] min-h-screen relative selection:bg-yellow-400 selection:text-slate-900 pb-20 overflow-x-hidden">
      
      {/* Fondo Decorativo Top-Tier */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(8,102,189,0.01)_1.5px,transparent_1.5px),linear-gradient(90deg,rgba(8,102,189,0.01)_1.5px,transparent_1.5px)] bg-[size:30px_30px] opacity-20 pointer-events-none"></div>
      <div className="absolute top-20 left-10 w-[30rem] h-[30rem] bg-[#0866bd]/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-40 right-10 w-[30rem] h-[30rem] bg-yellow-400/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="mb-10 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight flex items-center justify-center sm:justify-start gap-4 drop-shadow-sm">
              <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
                <Search className="text-[#0866bd]" size={32} />
              </div>
              Buscador Inteligente
            </h2>
            <p className="text-slate-500 font-medium mt-3 text-sm">Encuentra piezas garantizadas para tu motocicleta en 4 sencillos pasos.</p>
          </div>
        </motion.div>

        <div className="bg-white/80 backdrop-blur-2xl rounded-[3rem] shadow-[0_20px_50px_rgb(0,0,0,0.03)] border border-white/50 overflow-hidden relative">
          
          {/* === STEPPER MEJORADO === */}
          <div className="bg-gradient-to-r from-slate-50/50 to-white border-b border-slate-100/50 flex p-5 sm:p-8 gap-4 sm:gap-10 overflow-x-auto custom-scrollbar relative z-20">
            {[{ num: 1, label: 'Tu Moto' }, { num: 2, label: 'Sistema' }, { num: 3, label: 'Componente' }, { num: 4, label: 'Resultados' }].map((stepObj, idx) => (
              <div key={stepObj.num} className={`flex items-center gap-3 shrink-0 transition-all duration-500 ${step >= stepObj.num ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-black text-sm sm:text-base transition-all duration-500 ${step >= stepObj.num ? 'bg-[#0866bd] text-white shadow-[0_0_20px_rgba(8,102,189,0.3)] scale-110' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                  {stepObj.num}
                </div>
                <span className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] transition-colors duration-500 ${step >= stepObj.num ? 'text-slate-800' : 'text-slate-400'}`}>
                  {stepObj.label}
                </span>
                {idx < 3 && <ChevronRight size={16} className={`ml-3 sm:ml-5 transition-colors duration-500 ${step > stepObj.num ? 'text-[#0866bd]' : 'text-slate-200'}`} />}
              </div>
            ))}
          </div>

          <div className="p-8 sm:p-12 lg:p-16 min-h-[500px]">
            
            {/* === PASO 1: TU MOTO === */}
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }}>
                  <div className="mb-10 flex items-center gap-4">
                    <div className="h-10 w-2.5 bg-[#0866bd] rounded-full shadow-[0_0_15px_rgba(8,102,189,0.4)]"></div>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-tight">1. Identifica tu Motocicleta</h3>
                  </div>

                  {/* === MI GARAGE VIRTUAL FLOTANTE === */}
                  {!dictLoading && savedGarage.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-12 bg-gradient-to-r from-blue-50/50 to-transparent p-6 rounded-[2rem] border border-blue-100/30">
                      <div className="flex justify-between items-center mb-5">
                        <h4 className="text-xs font-black text-[#0866bd] uppercase tracking-widest flex items-center gap-2">
                          <History size={16}/> Mi Garage Virtual
                        </h4>
                        <button onClick={clearGarage} className="text-[10px] text-slate-400 hover:text-red-500 font-bold uppercase tracking-widest flex items-center gap-1 transition-colors">
                          <Trash2 size={12}/> Limpiar
                        </button>
                      </div>
                      <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-2">
                        {savedGarage.map((v, idx) => (
                          <motion.button 
                            whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(8,102,189,0.1)", borderColor: "#0866bd" }}
                            whileTap={{ scale: 0.95 }}
                            key={idx} onClick={() => loadFromGarage(v)}
                            className="flex-shrink-0 bg-white border border-blue-100 px-6 py-4 rounded-[1.5rem] flex flex-col items-start gap-1 transition-all group"
                          >
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{v.marca}</span>
                            <span className="text-sm font-black text-slate-800 uppercase group-hover:text-[#0866bd] transition-colors">{v.modelo} <span className="text-slate-400">({v.anio})</span></span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  
                  {dictLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50/30 rounded-[3rem] border border-slate-100 border-dashed">
                      <Loader2 className="animate-spin mb-4 text-[#0866bd]" size={48} />
                      <p className="font-bold uppercase tracking-[0.25em] text-[10px] animate-pulse">Sincronizando Base de Datos...</p>
                    </div>
                  ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                      
                      <motion.div variants={itemVariants} className="flex flex-col gap-2 group">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 group-focus-within:text-[#0866bd] transition-colors">1. Marca *</label>
                        <div className="relative">
                          <select value={vehicle.marca} onChange={handleMarcaChange} className="w-full bg-slate-50/50 border-2 border-slate-100 hover:border-blue-100 text-sm font-bold text-slate-800 rounded-2xl p-4 sm:p-5 outline-none cursor-pointer focus:border-[#0866bd] focus:bg-white transition-all shadow-sm appearance-none focus:shadow-[0_0_20px_rgba(8,102,189,0.1)]">
                            <option value="">Selecciona Marca...</option>
                            {availableMarcas.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <ChevronRight size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" />
                        </div>
                      </motion.div>

                      <motion.div variants={itemVariants} className="flex flex-col gap-2 group">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 flex justify-between group-focus-within:text-[#0866bd] transition-colors">
                          <span>2. CC</span><span className="text-slate-300">Opcional</span>
                        </label>
                        <div className="relative">
                          <select value={vehicle.cc} onChange={handleCcChange} disabled={!vehicle.marca || availableCC.length === 0} className="w-full bg-slate-50/50 border-2 border-slate-100 hover:border-blue-100 text-sm font-bold text-slate-800 rounded-2xl p-4 sm:p-5 outline-none cursor-pointer focus:border-[#0866bd] focus:bg-white transition-all shadow-sm appearance-none disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed focus:shadow-[0_0_20px_rgba(8,102,189,0.1)]">
                            <option value="">Todos los CC...</option>
                            {availableCC.filter(c => c !== 'N/A').map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <ChevronRight size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" />
                        </div>
                      </motion.div>

                      <motion.div variants={itemVariants} className="flex flex-col gap-2 relative group">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 group-focus-within:text-[#0866bd] transition-colors">3. Modelo *</label>
                        <input list="modelos-motos-dict" value={vehicle.modelo} onChange={handleModeloChange} disabled={!vehicle.marca} placeholder="Ej: 250Z..." className="w-full bg-slate-50/50 border-2 border-slate-100 hover:border-blue-100 text-sm font-bold text-slate-800 rounded-2xl p-4 sm:p-5 outline-none focus:border-[#0866bd] focus:bg-white transition-all shadow-sm uppercase placeholder:normal-case disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed focus:shadow-[0_0_20px_rgba(8,102,189,0.1)]"/>
                        <datalist id="modelos-motos-dict">{availableModelos.map(mod => <option key={mod} value={mod} />)}</datalist>
                      </motion.div>

                      <motion.div variants={itemVariants} className="flex flex-col gap-2 group">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 group-focus-within:text-[#0866bd] transition-colors">4. Año *</label>
                        <div className="relative">
                          <select value={vehicle.anio} onChange={handleAnioChange} disabled={!vehicle.modelo} className="w-full bg-slate-50/50 border-2 border-slate-100 hover:border-blue-100 text-sm font-bold text-slate-800 rounded-2xl p-4 sm:p-5 outline-none cursor-pointer focus:border-[#0866bd] focus:bg-white transition-all shadow-sm appearance-none disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed focus:shadow-[0_0_20px_rgba(8,102,189,0.1)]">
                            <option value="">Selecciona Año...</option>
                            {availableAnios.map(a => <option key={a} value={a}>{a}</option>)}
                          </select>
                          <ChevronRight size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none rotate-90" />
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  {!dictLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex justify-end pt-6 border-t border-slate-100">
                      <motion.button 
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={confirmVehicle} 
                        disabled={!vehicle.marca || !vehicle.anio || !vehicle.modelo}
                        className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-900 font-black uppercase tracking-[0.2em] py-5 px-10 rounded-2xl shadow-[0_15px_30px_rgba(250,204,21,0.3)] hover:shadow-[0_20px_40px_rgba(250,204,21,0.5)] transition-all duration-500 flex items-center justify-center gap-3 w-full sm:w-max disabled:opacity-50 disabled:grayscale group"
                      >
                        <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-[-25deg] group-hover:left-[200%] transition-all duration-1000 ease-in-out z-0"></div>
                        <span className="relative z-10 flex items-center gap-3 text-xs">
                          Confirmar Motocicleta <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                      </motion.button>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* === PASO 2: SISTEMA === */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }}>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-12 pb-8 border-b border-slate-100 gap-4 bg-slate-50/50 p-6 sm:p-8 rounded-[2rem] shadow-inner">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-500 border border-emerald-100"><CheckCircle size={28}/></div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehículo Seleccionado</p>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-800 uppercase flex items-center gap-2 mt-0.5 tracking-tight">
                          {vehicle.marca} <span className="text-[#0866bd]">{vehicle.modelo}</span> <span className="text-slate-400">({vehicle.anio})</span>
                        </h3>
                      </div>
                    </div>
                    <button onClick={() => setStep(1)} className="bg-white border border-slate-200 text-[10px] px-6 py-3.5 rounded-xl font-black text-slate-500 hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-colors uppercase tracking-[0.2em] shadow-sm active:scale-95 flex items-center justify-center gap-2"><ArrowRight size={14} className="rotate-180"/> Cambiar Vehículo</button>
                  </div>
                  
                  <div className="mb-10 flex items-center gap-4">
                    <div className="h-10 w-2.5 bg-[#0866bd] rounded-full shadow-[0_0_15px_rgba(8,102,189,0.4)]"></div>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-tight">2. ¿Qué buscas mejorar?</h3>
                  </div>

                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    {MAIN_CATEGORIES.map((cat) => {
                      const IconComponent = cat.icon;
                      return (
                        <motion.div 
                          variants={itemVariants} 
                          whileHover={{ y: -5, borderColor: "rgba(8,102,189,0.3)" }}
                          whileTap={{ scale: 0.95 }}
                          key={cat.id} onClick={() => handleCategorySelect(cat.id)} 
                          className="bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(8,102,189,0.08)] transition-all duration-300 group relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 border border-slate-100 rounded-[1.5rem] flex items-center justify-center mb-5 group-hover:bg-[#0866bd] group-hover:shadow-[0_10px_20px_rgba(8,102,189,0.3)] transition-all duration-500 z-10">
                            <IconComponent size={32} className="text-slate-400 group-hover:text-white transition-colors duration-500" />
                          </div>
                          <span className="font-black text-[10px] sm:text-xs text-slate-500 uppercase tracking-[0.2em] text-center group-hover:text-[#0866bd] transition-colors z-10">{cat.nombre}</span>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </motion.div>
              )}

              {/* === PASO 3: COMPONENTE === */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }}>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-12 pb-8 border-b border-slate-100 gap-4 bg-slate-50/50 p-6 sm:p-8 rounded-[2rem] shadow-inner">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-500 border border-emerald-100"><CheckCircle size={28}/></div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtros Activos</p>
                        <h3 className="text-sm sm:text-base font-black text-slate-800 uppercase flex items-center gap-2 mt-1 tracking-tight flex-wrap">
                          {vehicle.marca} {vehicle.modelo} <span className="text-[#0866bd]">/</span> {selectedCategory}
                        </h3>
                      </div>
                    </div>
                    <button onClick={() => setStep(2)} className="bg-white border border-slate-200 text-[10px] px-6 py-3.5 rounded-xl font-black text-slate-500 hover:bg-slate-800 hover:text-white hover:border-slate-800 transition-colors uppercase tracking-[0.2em] shadow-sm active:scale-95 flex items-center justify-center gap-2"><ArrowRight size={14} className="rotate-180"/> Cambiar Sistema</button>
                  </div>
                  
                  <div className="mb-10 flex items-center gap-4">
                    <div className="h-10 w-2.5 bg-[#0866bd] rounded-full shadow-[0_0_15px_rgba(8,102,189,0.4)]"></div>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-tight">3. Selecciona el Componente</h3>
                  </div>

                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {INVENTORY_CATEGORIES[selectedCategory]?.map((subCat) => {
                      const IconComponent = SUBCATEGORY_ICONS[subCat] || Settings; 
                      return (
                        <motion.div 
                          variants={itemVariants}
                          whileHover={{ y: -5, borderColor: "rgba(250,204,21,0.5)" }}
                          whileTap={{ scale: 0.95 }}
                          key={subCat} onClick={() => fetchProductsForVehicle(subCat)} 
                          className="bg-white border border-slate-100 rounded-[2rem] p-6 sm:p-8 flex flex-col items-center justify-center cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(250,204,21,0.15)] transition-all duration-500 group relative overflow-hidden"
                        >
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-yellow-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 border border-slate-100 rounded-[1.5rem] flex items-center justify-center mb-5 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-yellow-500 group-hover:border-transparent group-hover:shadow-[0_10px_20px_rgba(250,204,21,0.4)] transition-all duration-500 z-10">
                            <IconComponent size={32} className="text-slate-400 group-hover:text-slate-900 transition-colors duration-500" />
                          </div>
                          <span className="font-black text-[10px] sm:text-xs text-slate-500 uppercase tracking-[0.2em] text-center group-hover:text-slate-900 transition-colors z-10">{subCat}</span>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </motion.div>
              )}

              {/* === PASO 4: RESULTADOS === */}
              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-10 pb-8 border-b border-slate-100 gap-6 bg-slate-50/50 p-6 sm:p-8 rounded-[2rem] shadow-inner">
                    <div className="flex items-start sm:items-center gap-5">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-500 shrink-0 border border-emerald-100"><CheckCircle size={28}/></div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Búsqueda Completada</p>
                        <h3 className="text-sm sm:text-base font-black text-slate-800 uppercase flex items-center gap-2 mt-1 flex-wrap tracking-tight">
                          {vehicle.marca} {vehicle.modelo} ({vehicle.anio}) <span className="text-[#0866bd] px-1">/</span> {selectedSubCategory}
                        </h3>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setStep(3)} className="flex-1 sm:flex-none bg-white border border-slate-200 text-[10px] px-6 py-3.5 rounded-xl font-black text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-colors uppercase tracking-[0.2em] shadow-sm active:scale-95 text-center flex items-center justify-center gap-2"><ArrowRight size={14} className="rotate-180"/> Atrás</button>
                      <button onClick={resetFilters} className="flex-1 sm:flex-none bg-white border border-red-100 text-[10px] px-6 py-3.5 rounded-xl font-black text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors uppercase tracking-[0.2em] shadow-sm active:scale-95 flex items-center justify-center gap-2"><X size={14}/> Reset</button>
                    </div>
                  </div>
                  
                  {loadingProducts ? (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                      <Loader2 className="animate-spin mb-6 text-[#0866bd]" size={56} />
                      <p className="font-black tracking-[0.25em] uppercase text-xs animate-pulse">Analizando Inventario...</p>
                    </div>
                  ) : productos.length > 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                      
                      {/* === PANEL DE FILTROS INTELIGENTES === */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 bg-white border border-slate-100 p-4 sm:px-6 rounded-2xl shadow-sm">
                        <h3 className="text-sm sm:text-base font-black text-slate-800 uppercase tracking-tight">Piezas Encontradas ({displayedProducts.length})</h3>
                        <div className="flex flex-wrap items-center gap-5 w-full sm:w-auto">
                          
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors duration-300 shadow-inner ${inStockOnly ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                              <div className={`bg-white w-3 h-3 rounded-full shadow-sm transform transition-transform duration-300 ${inStockOnly ? 'translate-x-5' : ''}`}></div>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-slate-800 transition-colors">Ocultar Agotados</span>
                          </label>
                          
                          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
                          
                          <div className="flex items-center gap-3 text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 focus-within:border-[#0866bd] focus-within:shadow-sm transition-all group">
                            <SlidersHorizontal size={16} className="group-focus-within:text-[#0866bd] transition-colors" />
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent text-[10px] font-black uppercase tracking-[0.2em] outline-none cursor-pointer text-slate-700">
                              <option value="relevancia">Destacados</option>
                              <option value="asc">Menor Precio</option>
                              <option value="desc">Mayor Precio</option>
                            </select>
                          </div>

                        </div>
                      </div>

                      {displayedProducts.length > 0 ? (
                        <ProductGrid products={displayedProducts} />
                      ) : (
                        <div className="text-center py-20 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 border-dashed">
                          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"><Package size={32} className="text-slate-300" /></div>
                          <p className="font-black text-sm uppercase tracking-widest text-slate-700 mb-2">No hay stock con estos filtros</p>
                          <p className="text-xs font-medium text-slate-500">Desactiva la opción "Ocultar Agotados" para ver el catálogo completo.</p>
                        </div>
                      )}

                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white/50 backdrop-blur-sm rounded-[3rem] border border-slate-100 shadow-inner">
                      <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-sm border border-slate-100">
                        <Search size={40} className="text-slate-300" />
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-tight mb-4">Inventario Agotado</h3>
                      <p className="font-medium max-w-md text-sm text-slate-500 mb-10 leading-relaxed">
                        Por el momento no tenemos refacciones registradas en <strong className="text-slate-700">{selectedSubCategory}</strong> con compatibilidad verificada para la <strong className="text-slate-700">{vehicle.marca} {vehicle.modelo} ({vehicle.anio})</strong>.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <button onClick={() => setStep(3)} className="bg-white border-2 border-slate-200 text-slate-600 font-black py-4 px-8 rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all uppercase tracking-[0.15em] text-[10px] shadow-sm active:scale-95">Probar Otro Componente</button>
                        <button onClick={resetFilters} className="bg-slate-900 text-white font-black py-4 px-8 rounded-2xl hover:bg-[#0866bd] transition-all uppercase tracking-[0.15em] text-[10px] shadow-[0_10px_20px_rgba(0,0,0,0.1)] active:scale-95">Iniciar Nueva Búsqueda</button>
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
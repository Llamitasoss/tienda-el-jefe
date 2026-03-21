import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  Search, Loader2, Wrench, Package, Settings, Cog, 
  Activity, Zap, CircleDashed, Star,
  // --- NUEVOS ICONOS PARA SUBCATEGORÍAS ---
  Droplet, Gauge, Disc, Link2, PenTool, GitMerge, Cpu, 
  Wind, Shield, Circle, ArrowUpCircle, ArrowDownCircle, 
  MoveHorizontal, Lightbulb, BatteryCharging, Cable, 
  Mountain, LifeBuoy, User, Smartphone
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

// --- DICCIONARIO DE ICONOS PARA SUBCATEGORÍAS ---
const SUBCATEGORY_ICONS = {
  "Lubricación / Líquidos": Droplet,
  "Afinación": Gauge,
  "Frenos": Disc,
  "Tracción y Arrastre": Link2,
  "Motor y Afinación": PenTool,
  "Suspensión y Dirección": GitMerge,
  "Componentes Internos": Cpu,
  "Alimentación / Escape": Wind,
  "Sellado": Shield,
  "Embrague": Circle,
  "Caja de Vel.": Cog,
  "Ruedas": CircleDashed,
  "Delantera": ArrowUpCircle,
  "Trasera": ArrowDownCircle,
  "Dirección": MoveHorizontal,
  "Iluminación": Lightbulb,
  "Encendido y Carga": BatteryCharging,
  "Controles y Cableado": Cable,
  "Por Terreno": Mountain,
  "Cámaras y Corbatas": LifeBuoy,
  "Accesorios de Rueda": Wrench,
  "Para el Motociclista": User,
  "Para la Motocicleta": Star,
  "Tecnología en Ruta": Smartphone
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

export default function CatalogWizard() {
  // --- MEMORIA CACHÉ ---
  const [step, setStep] = useState(() => Number(sessionStorage.getItem('cw_step')) || 1);
  const [vehicle, setVehicle] = useState(() => JSON.parse(sessionStorage.getItem('cw_vehicle')) || { marca: '', cc: '', anio: '', modelo: '' });
  const [selectedCategory, setSelectedCategory] = useState(() => sessionStorage.getItem('cw_category') || '');
  const [selectedSubCategory, setSelectedSubCategory] = useState(() => sessionStorage.getItem('cw_subCategory') || '');
  const [productos, setProductos] = useState(() => JSON.parse(sessionStorage.getItem('cw_productos')) || []);
  
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [dictionary, setDictionary] = useState({});
  const [dictLoading, setDictLoading] = useState(true);

  // GUARDAR EN MEMORIA CADA QUE ALGO CAMBIE
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
      } catch (error) {
        console.error("Error al construir diccionario:", error);
      }
      setDictLoading(false);
    };

    buildDictionary();
  }, []);

  // --- PARACAÍDAS ---
  const availableMarcas = Object.keys(dictionary || {}).sort();
  
  const availableCC = (vehicle.marca && dictionary[vehicle.marca]) 
    ? Object.keys(dictionary[vehicle.marca]).sort() 
    : [];

  let availableModelos = [];
  if (vehicle.marca && dictionary[vehicle.marca]) {
    if (vehicle.cc && dictionary[vehicle.marca][vehicle.cc]) {
      availableModelos = Object.keys(dictionary[vehicle.marca][vehicle.cc]).sort();
    } else {
      const allModels = new Set();
      Object.values(dictionary[vehicle.marca]).forEach(ccObj => {
        if (ccObj) {
          Object.keys(ccObj).forEach(mod => allModels.add(mod));
        }
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

  const fetchProductsForVehicle = async (subCategory) => {
    setSelectedSubCategory(subCategory);
    setStep(4);
    setLoadingProducts(true);
    
    try {
      const modelClean = vehicle.modelo.trim().replace(/\s+/g, ' ');
      const searchTag = `${vehicle.marca}_${modelClean}_${vehicle.anio}`.toUpperCase();
      
      const q = query(
        collection(db, "productos"),
        where("cat", "==", selectedCategory),
        where("subCat", "==", subCategory)
      );
      
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
            isUniversal: isUniversal
          });
        }
      });
      
      setProductos(prods);
    } catch (error) {
      console.error("Error al buscar productos compatibles:", error);
    }
    
    setLoadingProducts(false);
  };

  const resetFilters = () => {
    setVehicle({ marca: '', cc: '', anio: '', modelo: '' });
    setSelectedCategory('');
    setSelectedSubCategory('');
    setProductos([]);
    setStep(1);
    sessionStorage.removeItem('cw_step');
    sessionStorage.removeItem('cw_vehicle');
    sessionStorage.removeItem('cw_category');
    sessionStorage.removeItem('cw_subCategory');
    sessionStorage.removeItem('cw_productos');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center">
          <Search className="mr-3 text-[#0866bd]" size={32} />
          Buscador Inteligente
        </h2>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 flex p-4 gap-8 overflow-x-auto custom-scrollbar">
          {[
            { num: 1, label: 'Tu Moto' },
            { num: 2, label: 'Sistema' },
            { num: 3, label: 'Componente' },
            { num: 4, label: 'Resultados' }
          ].map((stepObj) => (
            <div key={stepObj.num} className={`flex items-center gap-2 shrink-0 ${step >= stepObj.num ? 'opacity-100' : 'opacity-40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${step >= stepObj.num ? 'bg-[#0866bd] text-white shadow-md' : 'bg-slate-200 text-slate-500'}`}>
                {stepObj.num}
              </div>
              <span className={`text-xs font-bold uppercase tracking-widest ${step >= stepObj.num ? 'text-[#0866bd]' : 'text-slate-500'}`}>
                {stepObj.label}
              </span>
            </div>
          ))}
        </div>

        <div className="p-6 md:p-10 min-h-[400px]">
          {/* PASO 1 */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="mb-8 border-l-4 border-[#0866bd] pl-4">
                <h3 className="text-2xl font-black text-[#0f172a] uppercase">1. Identifica tu Motocicleta</h3>
              </div>
              
              {dictLoading ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <Loader2 className="animate-spin mb-4" size={40} />
                  <p className="font-bold uppercase tracking-widest text-xs">Cargando base de datos de motos...</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 mb-10">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">1. Marca *</label>
                      <select value={vehicle.marca} onChange={handleMarcaChange} className="bg-slate-50 border-2 border-slate-200 text-sm font-bold text-slate-700 rounded-xl p-4 outline-none cursor-pointer focus:border-[#0866bd] focus:bg-white transition-all shadow-sm">
                        <option value="">Selecciona Marca...</option>
                        {availableMarcas.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 flex justify-between">
                        <span>2. CC</span>
                        <span className="text-slate-300">Opcional</span>
                      </label>
                      <select value={vehicle.cc} onChange={handleCcChange} disabled={!vehicle.marca || availableCC.length === 0} className="bg-slate-50 border-2 border-slate-200 text-sm font-bold text-slate-700 rounded-xl p-4 outline-none cursor-pointer focus:border-[#0866bd] focus:bg-white transition-all disabled:opacity-50 shadow-sm">
                        <option value="">Todos los CC...</option>
                        {availableCC.filter(c => c !== 'N/A').map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-2 relative">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">3. Modelo *</label>
                      <input list="modelos-motos-dict" value={vehicle.modelo} onChange={handleModeloChange} disabled={!vehicle.marca} placeholder="Escribe o selecciona..." className="bg-slate-50 border-2 border-slate-200 text-sm font-bold text-slate-700 rounded-xl p-4 outline-none focus:border-[#0866bd] focus:bg-white transition-all disabled:opacity-50 shadow-sm uppercase placeholder:normal-case"/>
                      <datalist id="modelos-motos-dict">
                        {availableModelos.map(mod => <option key={mod} value={mod} />)}
                      </datalist>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">4. Año *</label>
                      <select value={vehicle.anio} onChange={handleAnioChange} disabled={!vehicle.modelo} className="bg-slate-50 border-2 border-slate-200 text-sm font-bold text-slate-700 rounded-xl p-4 outline-none cursor-pointer focus:border-[#0866bd] focus:bg-white transition-all disabled:opacity-50 shadow-sm">
                        <option value="">Selecciona Año...</option>
                        {availableAnios.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>

                  <button 
                    onClick={() => setStep(2)} 
                    disabled={!vehicle.marca || !vehicle.anio || !vehicle.modelo}
                    className="bg-gradient-to-r from-[#0866bd] to-blue-600 text-white font-black tracking-widest uppercase py-4 px-12 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95 flex items-center gap-3 w-max disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                  >
                    Confirmar Moto <span className="text-xl leading-none">→</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* PASO 2 */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 pb-6 border-b border-slate-100 gap-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vehículo Confirmado</p>
                  <h3 className="text-xl font-black text-[#0866bd] uppercase flex items-center gap-2">
                    {vehicle.marca} <span className="text-slate-800">{vehicle.modelo}</span> ({vehicle.anio})
                  </h3>
                </div>
                <button onClick={() => setStep(1)} className="border-2 border-slate-200 text-xs px-5 py-2.5 rounded-xl font-bold hover:bg-slate-50 hover:text-[#0866bd] hover:border-[#0866bd] transition-colors uppercase tracking-widest">
                  Cambiar Moto
                </button>
              </div>

              <div className="mb-8 border-l-4 border-[#0866bd] pl-4">
                <h3 className="text-2xl font-black text-[#0f172a] uppercase">2. ¿Qué buscas reparar / mejorar?</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {MAIN_CATEGORIES.map((cat) => {
                  const IconComponent = cat.icon;
                  return (
                    <div 
                      key={cat.id} 
                      onClick={() => handleCategorySelect(cat.id)}
                      className="bg-white border-2 border-slate-100 rounded-[1.5rem] p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#0866bd] hover:bg-blue-50/30 hover:shadow-xl transition-all hover:-translate-y-1 group"
                    >
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-[#0866bd] transition-colors shadow-inner">
                        <IconComponent size={28} className="text-slate-400 group-hover:text-white transition-colors" />
                      </div>
                      <span className="font-black text-[11px] sm:text-xs text-[#0f172a] uppercase tracking-wide text-center group-hover:text-[#0866bd]">
                        {cat.nombre}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 3 */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 pb-6 border-b border-slate-100 gap-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtros Activos</p>
                  <h3 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2 flex-wrap">
                    {vehicle.marca} {vehicle.modelo} <span className="text-[#0866bd] px-2">•</span> {selectedCategory}
                  </h3>
                </div>
                <button onClick={() => setStep(2)} className="border-2 border-slate-200 text-xs px-5 py-2.5 rounded-xl font-bold hover:bg-slate-50 hover:text-[#0866bd] hover:border-[#0866bd] transition-colors uppercase tracking-widest">
                  ← Cambiar Sistema
                </button>
              </div>

              <div className="mb-8 border-l-4 border-[#0866bd] pl-4">
                <h3 className="text-2xl font-black text-[#0f172a] uppercase">3. Selecciona el componente exacto</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {INVENTORY_CATEGORIES[selectedCategory]?.map((subCat) => {
                  // Aquí sacamos el icono, o ponemos Settings si no lo encuentra
                  const IconComponent = SUBCATEGORY_ICONS[subCat] || Settings; 
                  
                  return (
                    <div 
                      key={subCat} 
                      onClick={() => fetchProductsForVehicle(subCat)}
                      className="bg-white border-2 border-slate-100 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#0866bd] hover:shadow-lg transition-all group"
                    >
                      {/* === AQUÍ ESTÁ EL DISEÑO PREMIUM PARA SUBCATEGORÍAS === */}
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-[#0866bd] transition-colors shadow-inner">
                        <IconComponent size={28} className="text-slate-400 group-hover:text-white transition-colors" />
                      </div>
                      <span className="font-black text-xs text-[#0f172a] uppercase tracking-wide text-center group-hover:text-[#0866bd]">
                        {subCat}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASO 4 */}
          {step === 4 && (
            <div className="animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 pb-6 border-b border-slate-100 gap-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compatibilidad Confirmada</p>
                  <h3 className="text-lg font-black text-slate-800 uppercase flex items-center gap-2 flex-wrap">
                    {vehicle.marca} {vehicle.modelo} ({vehicle.anio}) <span className="text-[#0866bd] px-2">•</span> {selectedSubCategory}
                  </h3>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep(3)} className="text-[#0866bd] font-bold text-sm hover:underline flex items-center gap-1 bg-blue-50 px-4 py-2 rounded-lg">
                    ← Componente
                  </button>
                  <button onClick={resetFilters} className="text-red-500 font-bold text-sm hover:underline flex items-center gap-1 bg-red-50 px-4 py-2 rounded-lg">
                    ✖ Borrar Moto
                  </button>
                </div>
              </div>
              
              {loadingProducts ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <Loader2 className="animate-spin mb-4" size={48} />
                  <p className="font-bold tracking-widest uppercase text-sm">Validando compatibilidad y universales...</p>
                </div>
              ) : productos.length > 0 ? (
                <ProductGrid products={productos} />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center bg-slate-50 rounded-3xl border border-slate-100 border-dashed">
                  <Search size={64} className="text-slate-300 mb-4" />
                  <h3 className="text-2xl font-black text-slate-600 uppercase mb-2">No hay piezas compatibles</h3>
                  <p className="font-medium max-w-md text-sm mb-8">Por el momento no tenemos refacciones registradas en <strong>{selectedSubCategory}</strong> que le queden específicamente a la <strong>{vehicle.marca} {vehicle.modelo} ({vehicle.anio})</strong>.</p>
                  
                  <div className="flex gap-4">
                    <button onClick={() => setStep(3)} className="bg-white border-2 border-slate-200 text-slate-600 font-bold py-3 px-6 rounded-xl hover:bg-slate-100 transition-colors uppercase tracking-widest text-xs shadow-sm">
                      Probar otro componente
                    </button>
                    <button onClick={resetFilters} className="bg-slate-800 text-white font-bold py-3 px-6 rounded-xl hover:bg-black transition-colors uppercase tracking-widest text-xs shadow-sm">
                      Buscar otra Moto
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
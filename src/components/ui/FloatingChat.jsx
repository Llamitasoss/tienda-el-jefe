import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, Phone, Package, ExternalLink, MapPin, ChevronRight, Zap } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false); // Para el saludo proactivo
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [catalog, setCatalog] = useState([]);
  
  const [messages, setMessages] = useState([
    { text: "¡Hola! Bienvenido a Moto Partes El Jefe 🏍️ ¿En qué puedo ayudarte hoy?", isBot: true }
  ]);
  
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // 1. CARGAR CATÁLOGO Y MOSTRAR SALUDO PROACTIVO
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const snapshot = await getDocs(collection(db, "productos"));
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.name || d.Nombre || '',
            price: d.promoPrice || d.price || d.Precio || 0,
            img: d.images?.[0] || d.ImagenURL || 'https://placehold.co/150x150/f8fafc/0866BD?text=Foto',
            searchStr: `${d.name || d.Nombre} ${d.searchKeys?.join(' ') || ''} ${d.subCat || d.cat || d.Categoria || ''}`
          };
        });
        setCatalog(data);
      } catch (error) {
        console.error("Error cargando catálogo para el bot:", error);
      }
    };
    fetchCatalog();

    // Mostrar saludo proactivo después de 5 segundos
    const greetingTimer = setTimeout(() => {
      if (!isOpen) setShowGreeting(true);
    }, 5000);

    return () => clearTimeout(greetingTimer);
  }, []);

  // 2. AUTO-SCROLL
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // 3. BIENVENIDA SECUNDARIA AL ABRIR
  useEffect(() => {
    if (isOpen && messages.length === 1) {
      setIsTyping(true);
      setShowGreeting(false); // Ocultar saludo proactivo si abre el chat
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          text: "¿Buscas alguna refacción en especial o quieres saber el estado de tu pedido?", 
          isBot: true 
        }]);
        setIsTyping(false);
      }, 1500);
    }
  }, [isOpen, messages.length]);

  // 4. MOTOR DE BÚSQUEDA INTELIGENTE
  const normalizeString = (str) => {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const searchProducts = (query) => {
    const cleanQuery = normalizeString(query);
    const stopWords = ['tienes', 'la', 'el', 'los', 'las', 'para', 'de', 'un', 'una', 'busco', 'quiero', 'ocupo', 'hay', 'alguna', 'refaccion', 'pieza'];
    const keywords = cleanQuery.split(' ').filter(word => word.length > 2 && !stopWords.includes(word));

    if (keywords.length === 0) return [];

    let scoredProducts = catalog.map(p => {
      let score = 0;
      const productStr = normalizeString(p.searchStr);
      keywords.forEach(kw => { if (productStr.includes(kw)) score += 1; });
      return { ...p, score };
    });

    return scoredProducts.filter(p => p.score > 0).sort((a, b) => b.score - a.score).slice(0, 3); // Top 3 resultados
  };

  // 5. MANEJO DE MENSAJES (CEREBRO DEL BOT)
  const processUserMessage = (userText) => {
    setMessages(prev => [...prev, { text: userText, isBot: false }]);
    setIsTyping(true);

    setTimeout(() => {
      const lowerMsg = normalizeString(userText);

      // Intenciones Estáticas
      if (lowerMsg.includes('rastrear') || lowerMsg.includes('pedido') || lowerMsg.includes('estado')) {
        setMessages(prev => [...prev, { text: "Para rastrear tu pedido ve al menú superior y dale clic al botón 'Rastrear Orden'. O si prefieres, dímelo y te transfiero con un asesor. 📦", isBot: true }]);
        setIsTyping(false);
        return;
      }

      if (lowerMsg.includes('ubicacion') || lowerMsg.includes('donde estan') || lowerMsg.includes('direccion') || lowerMsg.includes('sucursal')) {
        setMessages(prev => [...prev, { text: "Nuestra sucursal física está en: Marcos Lara 60, Santa Paula, Tonalá, Jalisco. ¡Te esperamos para entrega inmediata! 📍", isBot: true }]);
        setIsTyping(false);
        return;
      }

      if (lowerMsg.includes('asesor') || lowerMsg.includes('hablar con') || lowerMsg.includes('humano') || lowerMsg.includes('whatsapp')) {
        window.open('https://wa.me/523332406334', '_blank');
        setMessages(prev => [...prev, { text: "¡Te estoy conectando con un asesor en WhatsApp para atenderte más rápido! 🚀", isBot: true }]);
        setIsTyping(false);
        return;
      }

      // Búsqueda de Productos
      const foundProducts = searchProducts(userText);

      if (foundProducts.length > 0) {
        setMessages(prev => [...prev, { 
          text: `¡Claro! Encontré est${foundProducts.length > 1 ? 'os' : 'o'} en nuestro inventario:`, 
          isBot: true,
          products: foundProducts
        }]);
      } else {
        setMessages(prev => [...prev, { 
          text: "No encontré esa pieza exacta en la tienda online, pero seguro la tenemos en bodega física. ¿Te conecto con un asesor para confirmar?", 
          isBot: true,
          needsWhatsappBtn: true,
          userQuery: userText
        }]);
      }
      setIsTyping(false);
    }, 1200); // Tiempo de "pensamiento"
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    const userMessage = message.trim();
    setMessage('');
    processUserMessage(userMessage);
  };

  const handleProductClick = (id) => {
    navigate(`/producto/${id}`);
    setIsOpen(false);
  };

  const quickReplies = [
    { icon: Phone, text: "Hablar con asesor", action: () => processUserMessage("Quiero hablar con un asesor") },
    { icon: Package, text: "Rastrear pedido", action: () => processUserMessage("Quiero rastrear mi pedido") },
    { icon: MapPin, text: "Ver Ubicación", action: () => processUserMessage("¿Cuál es su ubicación?") }
  ];

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-[100] font-sans flex flex-col items-end">
      
      {/* VENTANA DEL CHAT PRINCIPAL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="absolute bottom-[80px] right-0 w-[calc(100vw-2rem)] sm:w-[400px] bg-white/95 backdrop-blur-3xl rounded-[2rem] shadow-[0_20px_80px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden flex flex-col h-[550px] max-h-[80vh] z-50"
          >
            {/* === Cabecera del Chat Premium === */}
            <div className="bg-gradient-to-br from-slate-900 to-black p-5 flex items-center justify-between text-white shrink-0 relative overflow-hidden shadow-md">
              <div className="absolute top-[-50%] right-[-20%] w-40 h-40 bg-blue-500/20 rounded-full blur-[40px] pointer-events-none"></div>
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-gradient-to-tr from-yellow-400 to-amber-500 rounded-[1.2rem] flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.4)] border border-yellow-300">
                  <Bot size={24} className="text-slate-900" />
                </div>
                <div>
                  <h4 className="font-black tracking-tighter text-lg uppercase text-white leading-none">El Jefecito</h4>
                  <p className="text-[9px] text-blue-200 font-bold flex items-center gap-1.5 uppercase tracking-[0.2em] mt-1">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span> En Línea
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors relative z-10 backdrop-blur-sm border border-white/10 active:scale-90">
                <X size={18} />
              </button>
            </div>

            {/* === Área de Mensajes === */}
            <div className="p-5 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 space-y-6 relative">
              
              <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-50 rounded-full blur-[80px] pointer-events-none opacity-50"></div>

              {messages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  key={idx} 
                  className={`flex flex-col relative z-10 ${msg.isBot ? 'items-start' : 'items-end'}`}
                >
                  
                  {/* Burbuja de Texto */}
                  <div className={`max-w-[85%] p-4 text-[13px] leading-relaxed shadow-sm relative ${
                    msg.isBot 
                      ? 'bg-white border border-slate-100 text-slate-700 rounded-[1.5rem] rounded-tl-sm' 
                      : 'bg-gradient-to-tr from-[#0866bd] to-blue-600 text-white rounded-[1.5rem] rounded-tr-sm font-medium shadow-[0_5px_15px_rgba(8,102,189,0.2)]'
                  }`}>
                    {msg.text}
                  </div>

                  {/* Resultados de Búsqueda (Mini-Cards) */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-3 w-[95%] space-y-3">
                      {msg.products.map(prod => (
                        <motion.div 
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          key={prod.id} 
                          className="bg-white border border-slate-100 p-3 rounded-[1.2rem] flex gap-3 items-center shadow-[0_5px_15px_rgba(0,0,0,0.03)] hover:border-blue-200 hover:shadow-md transition-all group cursor-pointer relative overflow-hidden" 
                          onClick={() => handleProductClick(prod.id)}
                        >
                          <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          
                          <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center p-1.5 shrink-0 border border-slate-100 group-hover:border-blue-100 transition-colors">
                            <img src={prod.img} alt={prod.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="flex-1 min-w-0 py-1">
                            <p className="text-[11px] font-black text-slate-800 truncate uppercase leading-none mb-1.5 group-hover:text-[#0866bd] transition-colors">{prod.name}</p>
                            <p className="text-xs font-black text-[#0866bd]">${prod.price.toLocaleString('es-MX')}</p>
                          </div>
                          <div className="w-8 h-8 bg-blue-50 text-[#0866bd] rounded-full flex items-center justify-center shrink-0 group-hover:bg-[#0866bd] group-hover:text-white transition-colors mr-1 shadow-sm">
                            <ChevronRight size={16} />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Botón WhatsApp Respaldo */}
                  {msg.needsWhatsappBtn && (
                    <motion.a 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={`https://wa.me/523332406334?text=${encodeURIComponent(`Hola, estoy buscando la pieza: "${msg.userQuery}". ¿Lo tendrán en sucursal?`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 bg-gradient-to-r from-emerald-400 to-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-5 py-3.5 rounded-xl transition-all shadow-[0_5px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_10px_20px_rgba(16,185,129,0.4)]"
                    >
                      <Zap size={14} className="fill-current"/> Consultar en Sucursal
                    </motion.a>
                  )}
                </motion.div>
              ))}
              
              {/* Animación "Escribiendo..." fluida */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                    className="flex justify-start relative z-10"
                  >
                    <div className="bg-white border border-slate-100 rounded-[1.5rem] rounded-tl-sm px-5 py-4 shadow-sm flex gap-2 items-center h-10">
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut" }} className="w-1.5 h-1.5 bg-[#0866bd] rounded-full opacity-60"></motion.div>
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.15 }} className="w-1.5 h-1.5 bg-[#0866bd] rounded-full opacity-80"></motion.div>
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.3 }} className="w-1.5 h-1.5 bg-[#0866bd] rounded-full"></motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* === BARRITAS DE SUGERENCIAS (Quick Replies) === */}
            <AnimatePresence>
              {isOpen && messages.length <= 2 && !isTyping && (
                 <motion.div 
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   exit={{ opacity: 0, height: 0 }}
                   className="px-5 py-3 bg-white flex gap-2 overflow-x-auto border-t border-slate-100 shrink-0 custom-scrollbar shadow-[0_-5px_15px_rgba(0,0,0,0.02)]"
                 >
                   {quickReplies.map((reply, i) => (
                     <button 
                       key={i} 
                       onClick={reply.action}
                       className="whitespace-nowrap flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl hover:border-[#0866bd] hover:bg-blue-50 hover:text-[#0866bd] transition-all shadow-sm shrink-0 active:scale-95"
                     >
                       <reply.icon size={14}/> {reply.text}
                     </button>
                   ))}
                 </motion.div>
              )}
            </AnimatePresence>

            {/* === Input de Envío === */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 shrink-0">
              <form onSubmit={handleSend} className="relative flex items-center group">
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Busca refacciones o haz una pregunta..." 
                  className="w-full bg-white border-2 border-slate-200 focus:border-[#0866bd] rounded-2xl pl-5 pr-14 py-4 text-[13px] font-bold text-slate-700 outline-none transition-all shadow-inner focus:shadow-[0_0_20px_rgba(8,102,189,0.1)] placeholder:font-medium placeholder:text-slate-400"
                />
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit" 
                  disabled={!message.trim() || isTyping}
                  className="absolute right-2 w-11 h-11 bg-gradient-to-tr from-[#0866bd] to-blue-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:grayscale transition-all shadow-[0_5px_15px_rgba(8,102,189,0.3)]"
                >
                  <Send size={18} className="ml-0.5" />
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === SALUDO PROACTIVO ANIMADO (NUEVO) === */}
      <AnimatePresence>
        {!isOpen && showGreeting && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="mb-4 bg-white border border-slate-100 shadow-[0_15px_35px_rgba(0,0,0,0.1)] p-4 rounded-2xl rounded-br-sm relative cursor-pointer group"
            onClick={() => setIsOpen(true)}
          >
            <div className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
            <div className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></div>
            <p className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
               ¿Buscas una refacción? <Zap size={14} className="text-yellow-400 fill-current"/>
            </p>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Pregúntame, te ayudo rápido.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === BOTÓN FLOTANTE PRINCIPAL (NEÓN) === */}
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setIsOpen(!isOpen);
          setShowGreeting(false); // Ocultar saludo al hacer clic
        }}
        className="group relative w-16 h-16 bg-gradient-to-tr from-[#0866bd] to-blue-600 rounded-[1.5rem] flex items-center justify-center shadow-[0_10px_30px_rgba(8,102,189,0.5)] border border-blue-400/50 transition-all z-50 mt-2"
      >
        {/* Anillo exterior animado */}
        <div className="absolute inset-0 bg-blue-400 rounded-[1.5rem] animate-ping opacity-20 pointer-events-none"></div>
        
        {/* Badge rojo de notificación */}
        {!isOpen && !showGreeting && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-[#f8fafc] rounded-full"></span>
        )}

        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={28} className="text-white" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Bot size={32} className="text-white group-hover:scale-110 transition-transform" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

    </div>
  );
}
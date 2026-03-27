import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, Phone, Package, ExternalLink, MapPin, ChevronRight, Zap } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false); 
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
      setShowGreeting(false); 
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
    }, 1200); 
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
    <div className="fixed bottom-6 left-4 sm:left-auto sm:right-6 sm:bottom-8 z-[100] font-sans flex flex-col items-end">
      
      {/* === VENTANA DEL CHAT PRINCIPAL (Neo-Clásica) === */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="absolute bottom-[90px] right-0 w-[calc(100vw-2rem)] sm:w-[400px] bg-[#021830]/90 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_30px_80px_rgba(4,47,86,0.6)] border border-white/10 overflow-hidden flex flex-col h-[550px] max-h-[80vh] z-50"
          >
            {/* === Cabecera del Chat Premium === */}
            <div className="bg-gradient-to-br from-[#042f56] to-[#021830] p-6 pb-5 flex items-center justify-between text-white shrink-0 relative overflow-hidden border-b border-white/5">
              <div className="absolute top-[-50%] right-[-20%] w-40 h-40 bg-amber-400/10 rounded-full blur-[40px] pointer-events-none"></div>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay pointer-events-none"></div>
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-yellow-300 rounded-[1.2rem] flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.3)] border border-yellow-200">
                  <Bot size={28} className="text-slate-900" />
                </div>
                <div>
                  <h4 className="font-black tracking-tighter text-xl uppercase text-white leading-none drop-shadow-sm">El Jefecito</h4>
                  <p className="text-[9px] text-blue-200 font-bold flex items-center gap-1.5 uppercase tracking-[0.3em] mt-1.5 opacity-80">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span> Asistente AI
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="bg-white/5 hover:bg-white/10 rounded-full p-2.5 transition-colors relative z-10 backdrop-blur-md border border-white/10 active:scale-90 text-slate-300 hover:text-white">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* === Área de Mensajes (Dark Glassmorphism) === */}
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-transparent space-y-6 relative">
              <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none"></div>

              {messages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  key={idx} 
                  className={`flex flex-col relative z-10 ${msg.isBot ? 'items-start' : 'items-end'}`}
                >
                  
                  {/* Burbuja de Texto Neo-Clásica */}
                  <div className={`max-w-[85%] p-4 text-[13px] leading-relaxed shadow-sm relative backdrop-blur-md ${
                    msg.isBot 
                      ? 'bg-white/5 border border-white/10 text-slate-200 rounded-[1.5rem] rounded-tl-sm' 
                      : 'bg-gradient-to-tr from-amber-600 to-yellow-500 text-slate-950 rounded-[1.5rem] rounded-tr-sm font-bold shadow-[0_5px_15px_rgba(250,204,21,0.2)] border border-yellow-400'
                  }`}>
                    {msg.text}
                  </div>

                  {/* Resultados de Búsqueda (Mini-HUD Cards) */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-3 w-full space-y-3">
                      {msg.products.map(prod => (
                        <motion.div 
                          whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                          whileTap={{ scale: 0.98 }}
                          key={prod.id} 
                          className="bg-white/5 backdrop-blur-sm border border-white/10 p-3 rounded-[1.2rem] flex gap-3 items-center shadow-sm hover:border-amber-400/50 transition-all group cursor-pointer relative overflow-hidden" 
                          onClick={() => handleProductClick(prod.id)}
                        >
                          <div className="absolute top-0 right-0 w-16 h-full bg-gradient-to-l from-amber-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                          
                          <div className="w-14 h-14 bg-white rounded-[1rem] flex items-center justify-center p-1.5 shrink-0 border border-slate-200 group-hover:border-amber-200 transition-colors shadow-inner">
                            <img src={prod.img} alt={prod.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="flex-1 min-w-0 py-1">
                            <p className="text-[10px] font-black text-slate-300 truncate uppercase leading-none mb-1.5 group-hover:text-white transition-colors">{prod.name}</p>
                            <p className="text-[13px] font-black text-amber-400 drop-shadow-sm">${prod.price.toLocaleString('es-MX')}</p>
                          </div>
                          <div className="w-8 h-8 bg-white/5 text-amber-400 rounded-full flex items-center justify-center shrink-0 group-hover:bg-amber-400 group-hover:text-slate-900 transition-colors mr-1 border border-white/10">
                            <ChevronRight size={16} strokeWidth={2.5} />
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
                      className="mt-4 inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-widest px-5 py-3.5 rounded-xl transition-all shadow-[0_5px_15px_rgba(16,185,129,0.1)] hover:bg-emerald-500 hover:text-slate-900 hover:shadow-[0_10px_20px_rgba(16,185,129,0.3)] hover:border-transparent"
                    >
                      <Zap size={14} className="fill-current"/> Consultar con Humano
                    </motion.a>
                  )}
                </motion.div>
              ))}
              
              {/* Animación "Escribiendo..." (Tech Pulse) */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                    className="flex justify-start relative z-10"
                  >
                    <div className="bg-white/5 border border-white/10 rounded-[1.2rem] rounded-tl-sm px-5 py-4 shadow-sm flex gap-2 items-center h-10 backdrop-blur-md">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }} className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_5px_#fcd34d]"></motion.div>
                      <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0.2 }} className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_5px_#fcd34d]"></motion.div>
                      <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0.4 }} className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_5px_#fcd34d]"></motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* === BARRITAS DE SUGERENCIAS (Quick Replies Oro) === */}
            <AnimatePresence>
              {isOpen && messages.length <= 2 && !isTyping && (
                 <motion.div 
                   initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                   className="px-6 py-4 bg-[#03254c]/50 flex gap-2 overflow-x-auto border-t border-white/5 shrink-0 custom-scrollbar backdrop-blur-md"
                 >
                   {quickReplies.map((reply, i) => (
                     <button 
                       key={i} onClick={reply.action}
                       className="whitespace-nowrap flex items-center gap-2 bg-white/5 border border-white/10 text-slate-300 text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-[1rem] hover:border-amber-400 hover:bg-amber-400 hover:text-slate-900 transition-all shadow-sm shrink-0 active:scale-95"
                     >
                       <reply.icon size={14}/> {reply.text}
                     </button>
                   ))}
                 </motion.div>
              )}
            </AnimatePresence>

            {/* === Input de Envío Premium === */}
            <div className="p-5 sm:p-6 bg-[#021830] border-t border-white/10 shrink-0">
              <form onSubmit={handleSend} className="relative flex items-center group">
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe el modelo o pieza..." 
                  className="w-full bg-[#042f56] border border-white/10 focus:border-amber-400 rounded-2xl pl-5 pr-14 py-4 text-xs font-bold text-white outline-none transition-all shadow-inner focus:shadow-[0_0_15px_rgba(250,204,21,0.2)] placeholder:font-medium placeholder:text-slate-500"
                />
                <motion.button 
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  type="submit" disabled={!message.trim() || isTyping}
                  className="absolute right-2 w-11 h-11 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-900 rounded-[1rem] flex items-center justify-center disabled:opacity-50 disabled:grayscale transition-all shadow-[0_5px_15px_rgba(250,204,21,0.3)] border border-yellow-200"
                >
                  <Send size={18} className="ml-0.5" strokeWidth={2.5} />
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === SALUDO PROACTIVO (Cápsula Oscura) === */}
      <AnimatePresence>
        {!isOpen && showGreeting && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="mb-4 bg-[#03254c]/90 backdrop-blur-md border border-white/20 shadow-[0_15px_30px_rgba(4,47,86,0.6)] px-5 py-4 rounded-[1.5rem] rounded-br-sm relative cursor-pointer group"
            onClick={() => setIsOpen(true)}
          >
            <div className="absolute top-1.5 right-2 w-2 h-2 bg-amber-400 rounded-full animate-ping opacity-50"></div>
            <div className="absolute top-1.5 right-2 w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_8px_#fcd34d]"></div>
            <p className="text-[11px] font-black text-white uppercase tracking-tight flex items-center gap-2 drop-shadow-sm">
               Asistencia Inmediata <Zap size={14} className="text-amber-400 fill-current"/>
            </p>
            <p className="text-[10px] text-blue-200 font-medium mt-1">Encuentra piezas compatibles en segundos.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === BOTÓN FLOTANTE PRINCIPAL (Esfera Dorada) === */}
      <motion.button 
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
        onClick={() => { setIsOpen(!isOpen); setShowGreeting(false); }}
        className="group relative w-[4.5rem] h-[4.5rem] bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 rounded-full flex items-center justify-center shadow-[0_15px_40px_rgba(250,204,21,0.4)] border-2 border-[#021830] transition-all z-50 mt-2 hover:shadow-[0_20px_50px_rgba(250,204,21,0.6)]"
      >
        {/* Anillo de pulso sutil */}
        <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-20 pointer-events-none"></div>
        
        {/* Textura de metal cepillado (Opcional, muy sutil) */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/brushed-alum.png')] opacity-[0.15] mix-blend-overlay rounded-full pointer-events-none"></div>
        
        {/* Badge rojo notificador */}
        {!isOpen && !showGreeting && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-[#021830] rounded-full shadow-sm"></span>
        )}

        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={32} strokeWidth={2.5} className="text-slate-900" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle size={32} className="text-slate-900 fill-current opacity-80 mix-blend-overlay absolute inset-0 m-auto translate-y-[-2px] blur-[1px]" />
              <Bot size={34} strokeWidth={2} className="text-slate-900 group-hover:scale-110 transition-transform drop-shadow-sm relative z-10" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

    </div>
  );
}
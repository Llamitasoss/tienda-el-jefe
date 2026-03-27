import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, Phone, Package, MapPin, ChevronRight, Zap } from 'lucide-react';
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
            img: d.images?.[0] || d.ImagenURL || 'https://placehold.co/150x150/ffffff/0866bd?text=Foto',
            searchStr: `${d.name || d.Nombre} ${d.searchKeys?.join(' ') || ''} ${d.subCat || d.cat || d.Categoria || ''}`
          };
        });
        setCatalog(data);
      } catch (error) {
        console.error("Error cargando catálogo para el bot:", error);
      }
    };
    fetchCatalog();

    const greetingTimer = setTimeout(() => {
      if (!isOpen) setShowGreeting(true);
    }, 5000);

    return () => clearTimeout(greetingTimer);
  }, [isOpen]);

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

      if (lowerMsg.includes('rastrear') || lowerMsg.includes('pedido') || lowerMsg.includes('estado')) {
        setMessages(prev => [...prev, { text: "Para rastrear tu pedido ve al menú superior y dale clic al icono de la caja 'Rastrear Pedido'. O si prefieres, te transfiero con un asesor. 📦", isBot: true }]);
        setIsTyping(false);
        return;
      }

      if (lowerMsg.includes('ubicacion') || lowerMsg.includes('donde estan') || lowerMsg.includes('direccion') || lowerMsg.includes('sucursal')) {
        setMessages(prev => [...prev, { text: "Nuestra sucursal física está en: Marcos Lara 60, Santa Paula, Tonalá, Jalisco. ¡Te esperamos! 📍", isBot: true }]);
        setIsTyping(false);
        return;
      }

      if (lowerMsg.includes('asesor') || lowerMsg.includes('hablar con') || lowerMsg.includes('humano') || lowerMsg.includes('whatsapp')) {
        window.open('https://wa.me/523332406334', '_blank');
        setMessages(prev => [...prev, { text: "¡Te estoy conectando con un asesor en WhatsApp para atenderte más rápido! 🚀", isBot: true }]);
        setIsTyping(false);
        return;
      }

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
    // CAMBIO CLAVE: Alineado a la IZQUIERDA (left-4 sm:left-6) y items-start para evitar empalmes
    <div className="fixed bottom-6 left-4 sm:left-6 z-[100] font-sans flex flex-col items-start">
      
      {/* === VENTANA DEL CHAT PRINCIPAL (Light Premium) === */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20, originX: 0, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="absolute bottom-[80px] left-0 w-[calc(100vw-2rem)] sm:w-[360px] bg-white/95 backdrop-blur-3xl rounded-[2rem] shadow-[0_20px_60px_rgba(8,102,189,0.2)] border border-slate-100 overflow-hidden flex flex-col h-[500px] max-h-[80vh] z-50"
          >
            {/* === Cabecera del Chat === */}
            <div className="bg-[#0866bd] p-5 pb-4 flex items-center justify-between text-white shrink-0 relative overflow-hidden shadow-sm">
              <div className="absolute top-[-50%] right-[-20%] w-40 h-40 bg-white/10 rounded-full blur-[30px] pointer-events-none"></div>
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-inner border border-blue-100/50">
                  <Bot size={24} className="text-[#0866bd]" />
                </div>
                <div>
                  <h4 className="font-black tracking-tight text-base uppercase text-white leading-none">El Jefecito</h4>
                  <p className="text-[9px] text-blue-100 font-bold flex items-center gap-1.5 uppercase tracking-[0.2em] mt-1">
                    <span className="w-1.5 h-1.5 bg-[#FACC15] rounded-full animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.8)]"></span> Asistente AI
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors relative z-10 border border-white/10 active:scale-90 text-blue-50">
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            {/* === Área de Mensajes === */}
            <div className="p-5 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 space-y-5 relative">
              <div className="absolute inset-0 bg-[radial-gradient(rgba(8,102,189,0.03)_1px,transparent_1px)] bg-[size:15px_15px] pointer-events-none"></div>

              {messages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  key={idx} 
                  className={`flex flex-col relative z-10 ${msg.isBot ? 'items-start' : 'items-end'}`}
                >
                  
                  {/* Burbuja de Texto Light Premium */}
                  <div className={`max-w-[85%] px-4 py-3 text-xs font-medium leading-relaxed shadow-sm relative ${
                    msg.isBot 
                      ? 'bg-white border border-slate-100 text-slate-700 rounded-[1.2rem] rounded-tl-sm' 
                      : 'bg-gradient-to-tr from-[#0866bd] to-blue-600 text-white rounded-[1.2rem] rounded-tr-sm shadow-[0_5px_15px_rgba(8,102,189,0.2)] border border-[#0866bd]/50'
                  }`}>
                    {msg.text}
                  </div>

                  {/* Resultados de Búsqueda (Tarjetas Limpias) */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-2 w-[95%] space-y-2.5">
                      {msg.products.map(prod => (
                        <motion.div 
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          key={prod.id} 
                          className="bg-white border border-slate-100 p-2.5 rounded-xl flex gap-3 items-center shadow-sm hover:border-[#0866bd]/30 hover:shadow-md transition-all group cursor-pointer" 
                          onClick={() => handleProductClick(prod.id)}
                        >
                          <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center p-1 shrink-0 border border-slate-100 group-hover:border-[#0866bd]/20 transition-colors">
                            <img src={prod.img} alt={prod.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="flex-1 min-w-0 py-0.5">
                            <p className="text-[10px] font-bold text-slate-800 truncate uppercase leading-none mb-1 group-hover:text-[#0866bd] transition-colors">{prod.name}</p>
                            <p className="text-xs font-black text-[#0866bd]">${prod.price.toLocaleString('es-MX')}</p>
                          </div>
                          <div className="w-6 h-6 bg-blue-50 text-[#0866bd] rounded-full flex items-center justify-center shrink-0 group-hover:bg-[#0866bd] group-hover:text-white transition-colors mr-1">
                            <ChevronRight size={14} strokeWidth={2.5} />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Botón WhatsApp Respaldo */}
                  {msg.needsWhatsappBtn && (
                    <motion.a 
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      href={`https://wa.me/523332406334?text=${encodeURIComponent(`Hola, estoy buscando la pieza: "${msg.userQuery}". ¿Lo tendrán en sucursal?`)}`}
                      target="_blank" rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 bg-[#0866bd]/10 border border-[#0866bd]/20 text-[#0866bd] hover:bg-[#0866bd] hover:text-white text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-lg transition-all shadow-sm"
                    >
                      <Zap size={12} className="fill-current"/> Consultar Asesor
                    </motion.a>
                  )}
                </motion.div>
              ))}
              
              {/* Animación "Escribiendo..." */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                    className="flex justify-start relative z-10"
                  >
                    <div className="bg-white border border-slate-100 rounded-xl rounded-tl-sm px-4 py-3 shadow-sm flex gap-1.5 items-center h-8">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }} className="w-1.5 h-1.5 bg-[#0866bd] rounded-full"></motion.div>
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0.2 }} className="w-1.5 h-1.5 bg-[#0866bd] rounded-full"></motion.div>
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut", delay: 0.4 }} className="w-1.5 h-1.5 bg-[#0866bd] rounded-full"></motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div ref={messagesEndRef} className="h-1" />
            </div>

            {/* === BARRITAS DE SUGERENCIAS === */}
            <AnimatePresence>
              {isOpen && messages.length <= 2 && !isTyping && (
                 <motion.div 
                   initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                   className="px-5 py-3 bg-slate-50 flex gap-2 overflow-x-auto border-t border-slate-100 shrink-0 custom-scrollbar"
                 >
                   {quickReplies.map((reply, i) => (
                     <button 
                       key={i} onClick={reply.action}
                       className="whitespace-nowrap flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-[9px] font-bold uppercase tracking-widest px-3 py-2 rounded-lg hover:border-[#0866bd] hover:bg-blue-50 hover:text-[#0866bd] transition-all shadow-sm shrink-0 active:scale-95"
                     >
                       <reply.icon size={12}/> {reply.text}
                     </button>
                   ))}
                 </motion.div>
              )}
            </AnimatePresence>

            {/* === Input de Envío === */}
            <div className="p-4 sm:p-5 bg-white border-t border-slate-100 shrink-0">
              <form onSubmit={handleSend} className="relative flex items-center group">
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe el modelo o pieza..." 
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#0866bd] rounded-xl pl-4 pr-12 py-3 text-xs font-medium text-slate-800 outline-none transition-all shadow-inner focus:shadow-[0_0_15px_rgba(8,102,189,0.1)] placeholder:text-slate-400"
                />
                <motion.button 
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  type="submit" disabled={!message.trim() || isTyping}
                  className="absolute right-1.5 w-9 h-9 bg-[#0866bd] text-white rounded-lg flex items-center justify-center disabled:opacity-50 disabled:grayscale transition-all shadow-sm hover:shadow-[0_5px_15px_rgba(8,102,189,0.3)]"
                >
                  <Send size={14} className="ml-0.5" strokeWidth={2} />
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === SALUDO PROACTIVO (Alineado a la Izquierda) === */}
      <AnimatePresence>
        {!isOpen && showGreeting && (
          <motion.div
            initial={{ opacity: 0, x: -50, scale: 0.9 }} // Ahora viene desde la izquierda
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="mb-3 bg-white border border-slate-100 shadow-[0_15px_30px_rgba(0,0,0,0.1)] px-4 py-3 rounded-2xl rounded-bl-sm relative cursor-pointer group"
            onClick={() => setIsOpen(true)}
          >
            {/* Punto Rojo de Alerta */}
            <div className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-[#EF4444] rounded-full animate-ping opacity-60"></div>
            <div className="absolute top-1.5 right-2 w-1.5 h-1.5 bg-[#EF4444] rounded-full shadow-[0_0_8px_#EF4444]"></div>
            
            <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
               Asistencia Inmediata <Zap size={12} className="text-[#FACC15] fill-current"/>
            </p>
            <p className="text-[9px] text-slate-500 font-medium mt-0.5">Pregúntame, te ayudo rápido.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === BOTÓN FLOTANTE PRINCIPAL (Azul Brand) === */}
      <motion.button 
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}
        onClick={() => { setIsOpen(!isOpen); setShowGreeting(false); }}
        className="group relative w-14 h-14 bg-[#0866bd] rounded-2xl flex items-center justify-center shadow-[0_10px_25px_rgba(8,102,189,0.4)] border border-blue-500/30 transition-all z-50 mt-1 hover:shadow-[0_15px_35px_rgba(8,102,189,0.5)]"
      >
        {/* Anillo de pulso sutil */}
        <div className="absolute inset-0 bg-[#0866bd] rounded-2xl animate-ping opacity-20 pointer-events-none"></div>
        
        {/* Badge rojo notificador */}
        {!isOpen && !showGreeting && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#EF4444] border-[2px] border-white rounded-full shadow-sm"></span>
        )}

        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={24} strokeWidth={2} className="text-white" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <Bot size={26} strokeWidth={1.5} className="text-white group-hover:scale-110 transition-transform" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

    </div>
  );
}
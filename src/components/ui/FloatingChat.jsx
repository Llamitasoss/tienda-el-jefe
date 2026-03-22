import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, Phone, Package, ExternalLink, MapPin } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [catalog, setCatalog] = useState([]);
  
  const [messages, setMessages] = useState([
    { text: "¡Hola! Bienvenido a Moto Partes El Jefe 🏍️ ¿En qué puedo ayudarte hoy?", isBot: true }
  ]);
  
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // 1. CARGAR CATÁLOGO
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
  }, []);

  // 2. AUTO-SCROLL
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // 3. BIENVENIDA SECUNDARIA
  useEffect(() => {
    if (isOpen && messages.length === 1) {
      setIsTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          text: "¿Buscas alguna refacción en especial o quieres saber el estado de tu pedido?", 
          isBot: true 
        }]);
        setIsTyping(false);
      }, 1500);
    }
  }, [isOpen, messages.length]);

  // 4. MOTOR DE BÚSQUEDA
  const normalizeString = (str) => {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const searchProducts = (query) => {
    const cleanQuery = normalizeString(query);
    const stopWords = ['tienes', 'la', 'el', 'los', 'las', 'para', 'de', 'un', 'una', 'busco', 'quiero', 'ocupo', 'hay'];
    const keywords = cleanQuery.split(' ').filter(word => word.length > 2 && !stopWords.includes(word));

    if (keywords.length === 0) return [];

    let scoredProducts = catalog.map(p => {
      let score = 0;
      const productStr = normalizeString(p.searchStr);
      keywords.forEach(kw => { if (productStr.includes(kw)) score += 1; });
      return { ...p, score };
    });

    return scoredProducts.filter(p => p.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
  };

  // 5. MANEJO DE MENSAJES
  const processUserMessage = (userText) => {
    setMessages(prev => [...prev, { text: userText, isBot: false }]);
    setIsTyping(true);

    setTimeout(() => {
      const lowerMsg = normalizeString(userText);

      if (lowerMsg.includes('rastrear') || lowerMsg.includes('pedido')) {
        setMessages(prev => [...prev, { text: "Para rastrear tu pedido ve al menú superior y dale clic al botón 'Rastrear Orden'. 📦", isBot: true }]);
        setIsTyping(false);
        return;
      }

      if (lowerMsg.includes('ubicacion') || lowerMsg.includes('donde estan') || lowerMsg.includes('direccion')) {
        setMessages(prev => [...prev, { text: "Estamos en: Marcos Lara 60, Santa Paula, Tonalá, Jalisco. ¡Te esperamos! 📍", isBot: true }]);
        setIsTyping(false);
        return;
      }

      if (lowerMsg.includes('asesor') || lowerMsg.includes('hablar con')) {
        window.open('https://wa.me/523332406334', '_blank');
        setMessages(prev => [...prev, { text: "¡Te estoy conectando con un asesor en WhatsApp para atenderte más rápido! 🚀", isBot: true }]);
        setIsTyping(false);
        return;
      }

      const foundProducts = searchProducts(userText);

      if (foundProducts.length > 0) {
        setMessages(prev => [...prev, { 
          text: `¡Claro! Encontré est${foundProducts.length > 1 ? 'os' : 'o'} para ti:`, 
          isBot: true,
          products: foundProducts
        }]);
      } else {
        setMessages(prev => [...prev, { 
          text: "No encontré esa pieza exacta aquí, pero seguro la tenemos en bodega. ¿Te conecto con un asesor?", 
          isBot: true,
          needsWhatsappBtn: true,
          userQuery: userText
        }]);
      }
      setIsTyping(false);
    }, 1500);
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
    { icon: Phone, text: "Hablar con un asesor", action: () => processUserMessage("Quiero hablar con un asesor") },
    { icon: Package, text: "Rastrear pedido", action: () => processUserMessage("Quiero rastrear mi pedido") },
    { icon: MapPin, text: "Ubicación", action: () => processUserMessage("¿Cuál es su ubicación?") }
  ];

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-[100] font-sans">
      
      {/* VENTANA DEL CHAT */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute bottom-[80px] right-0 w-[calc(100vw-2rem)] sm:w-[400px] bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden flex flex-col h-[520px] max-h-[75vh]"
          >
            {/* Cabecera del Chat */}
            <div className="bg-slate-900 p-5 flex items-center justify-between text-white shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-[40px] pointer-events-none"></div>
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                  <Bot size={24} className="text-slate-900" />
                </div>
                <div>
                  <h4 className="font-black tracking-widest text-sm uppercase text-white">El Jefecito</h4>
                  <p className="text-[10px] text-blue-200 font-bold flex items-center gap-1.5 uppercase tracking-wider mt-0.5">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_5px_rgba(52,211,153,0.8)]"></span> Asistente Virtual
                  </p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors relative z-10 backdrop-blur-sm border border-white/5">
                <X size={18} />
              </button>
            </div>

            {/* Área de Mensajes */}
            <div className="p-5 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 space-y-5 relative">
              {messages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  key={idx} 
                  className={`flex flex-col ${msg.isBot ? 'items-start' : 'items-end'}`}
                >
                  
                  <div className={`max-w-[85%] p-4 text-[13px] leading-relaxed shadow-sm ${
                    msg.isBot 
                      ? 'bg-white border border-slate-200 text-slate-700 rounded-[1.5rem] rounded-tl-sm' 
                      : 'bg-gradient-to-tr from-[#0866bd] to-blue-600 text-white rounded-[1.5rem] rounded-tr-sm font-medium'
                  }`}>
                    {msg.text}
                  </div>

                  {/* Minicarjetas de Productos */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-3 w-[95%] space-y-2.5">
                      {msg.products.map(prod => (
                        <motion.div 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          key={prod.id} 
                          className="bg-white border border-slate-200 p-2.5 rounded-2xl flex gap-3 items-center shadow-sm hover:border-[#0866bd]/50 hover:shadow-md transition-all group cursor-pointer" 
                          onClick={() => handleProductClick(prod.id)}
                        >
                          <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center p-1.5 shrink-0 border border-slate-100">
                            <img src={prod.img} alt={prod.name} className="w-full h-full object-contain mix-blend-multiply" />
                          </div>
                          <div className="flex-1 min-w-0 py-1">
                            <p className="text-[11px] font-black text-slate-800 truncate uppercase leading-none mb-1">{prod.name}</p>
                            <p className="text-sm font-black text-[#0866bd]">${prod.price.toLocaleString('es-MX')}</p>
                          </div>
                          <div className="w-8 h-8 bg-blue-50 text-[#0866bd] rounded-full flex items-center justify-center shrink-0 group-hover:bg-[#0866bd] group-hover:text-white transition-colors mr-1">
                            <ExternalLink size={14} />
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
                      href={`https://wa.me/523332406334?text=${encodeURIComponent(`Hola, estoy buscando: ${msg.userQuery}. ¿Lo tendrán en sucursal?`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-500 hover:text-white text-[10px] font-black uppercase tracking-widest px-5 py-3 rounded-xl transition-all shadow-sm"
                    >
                      <Phone size={14} /> Contactar por WhatsApp
                    </motion.a>
                  )}
                </motion.div>
              ))}
              
              {/* Animación Escribiendo */}
              <AnimatePresence>
                {isTyping && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white border border-slate-200 rounded-[1.5rem] rounded-tl-sm px-4 py-3.5 shadow-sm flex gap-1.5 items-center h-10">
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full"></motion.div>
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full"></motion.div>
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full"></motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div ref={messagesEndRef} />
            </div>

            {/* BARRITAS DE SUGERENCIAS */}
            <AnimatePresence>
              {isOpen && messages.length <= 2 && !isTyping && (
                 <motion.div 
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   exit={{ opacity: 0, height: 0 }}
                   className="px-4 py-3 bg-white flex gap-2 overflow-x-auto border-t border-slate-100 shrink-0 custom-scrollbar shadow-[0_-5px_15px_rgba(0,0,0,0.02)]"
                 >
                   {quickReplies.map((reply, i) => (
                     <button 
                       key={i} 
                       onClick={reply.action}
                       className="whitespace-nowrap flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-xl hover:border-[#0866bd] hover:bg-blue-50 hover:text-[#0866bd] transition-all shadow-sm shrink-0"
                     >
                       <reply.icon size={14}/> {reply.text}
                     </button>
                   ))}
                 </motion.div>
              )}
            </AnimatePresence>

            {/* Input de Envío */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
              <form onSubmit={handleSend} className="relative flex items-center group">
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe tu mensaje..." 
                  className="w-full bg-white border-2 border-slate-200 focus:border-[#0866bd] rounded-[1.2rem] pl-5 pr-14 py-3.5 text-[13px] font-medium text-slate-700 outline-none transition-all shadow-sm focus:shadow-[0_0_15px_rgba(8,102,189,0.1)]"
                />
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit" 
                  disabled={!message.trim() || isTyping}
                  className="absolute right-2 w-10 h-10 bg-[#0866bd] text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-[#0866bd] transition-colors shadow-md"
                >
                  <Send size={16} className="ml-0.5" />
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTÓN FLOTANTE PRINCIPAL (NEÓN) */}
      <div className="flex justify-end mt-4">
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="group relative w-16 h-16 bg-gradient-to-tr from-[#0866bd] to-blue-600 rounded-[1.5rem] flex items-center justify-center shadow-[0_10px_25px_rgba(8,102,189,0.4)] border border-blue-400/50 transition-all z-50"
        >
          <div className="absolute inset-0 bg-blue-400 rounded-[1.5rem] animate-ping opacity-20 pointer-events-none"></div>
          
          {/* Badge rojo sutil para llamar la atención si está cerrado */}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-[#f8fafc] rounded-full"></span>
          )}

          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X size={28} className="text-white" />
              </motion.div>
            ) : (
              <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <Bot size={32} className="text-white group-hover:animate-bounce" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, Phone, Package, ExternalLink, MapPin } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

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
  }, [isOpen]);

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
      
      {/* VENTANA DEL CHAT (Posición Absoluta respecto al contenedor) */}
      <div 
        className={`absolute bottom-[80px] right-0 w-[calc(100vw-2rem)] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300 origin-bottom-right flex flex-col ${
          isOpen ? 'scale-100 opacity-100 h-[500px] max-h-[75vh]' : 'scale-50 opacity-0 h-0 pointer-events-none'
        }`}
      >
        {/* Cabecera del Chat */}
        <div className="bg-[#0866bd] p-4 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Bot size={20} />
            </div>
            <div>
              <h4 className="font-black tracking-widest text-sm uppercase">El Jefecito</h4>
              <p className="text-[10px] text-blue-100 font-bold flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> En línea
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:text-blue-200 transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* Área de Mensajes */}
        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar bg-slate-50 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.isBot ? 'items-start' : 'items-end'} animate-fade-in-up`}>
              
              <div className={`max-w-[85%] p-3 text-sm ${
                msg.isBot 
                  ? 'bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-sm shadow-sm' 
                  : 'bg-[#0866bd] text-white rounded-2xl rounded-tr-sm shadow-md'
              }`}>
                {msg.text}
              </div>

              {/* Minicarjetas de Productos */}
              {msg.products && msg.products.length > 0 && (
                <div className="mt-2 w-[95%] space-y-2">
                  {msg.products.map(prod => (
                    <div key={prod.id} className="bg-white border border-slate-200 p-2 rounded-xl flex gap-3 items-center shadow-sm hover:border-[#0866bd]/50 transition-colors group cursor-pointer" onClick={() => handleProductClick(prod.id)}>
                      <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center p-1 shrink-0">
                        <img src={prod.img} alt={prod.name} className="w-full h-full object-contain mix-blend-multiply" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-slate-800 truncate uppercase">{prod.name}</p>
                        <p className="text-xs font-black text-[#0866bd] mt-0.5">${prod.price.toLocaleString('es-MX')}</p>
                      </div>
                      <button className="w-7 h-7 bg-blue-50 text-[#0866bd] rounded-full flex items-center justify-center shrink-0 group-hover:bg-[#0866bd] group-hover:text-white transition-colors">
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Botón WhatsApp Respaldo */}
              {msg.needsWhatsappBtn && (
                <a 
                  href={`https://wa.me/523332406334?text=${encodeURIComponent(`Hola, estoy buscando: ${msg.userQuery}. ¿Lo tendrán en sucursal?`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-2 bg-white border-2 border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-full transition-colors"
                >
                  <Phone size={14} /> WhatsApp
                </a>
              )}
            </div>
          ))}
          
          {/* Animación Escribiendo */}
          {isTyping && (
            <div className="flex justify-start animate-fade-in-up">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-3 shadow-sm flex gap-1.5">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* BARRITAS DE SUGERENCIAS */}
        {isOpen && messages.length <= 2 && !isTyping && (
           <div className="px-3 py-3 bg-slate-50 flex gap-2 overflow-x-auto border-t border-slate-100 shrink-0 custom-scrollbar">
             {quickReplies.map((reply, i) => (
               <button 
                 key={i} 
                 onClick={reply.action}
                 className="whitespace-nowrap flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-full hover:border-[#0866bd] hover:text-[#0866bd] transition-colors shadow-sm shrink-0"
               >
                 <reply.icon size={12}/> {reply.text}
               </button>
             ))}
           </div>
        )}

        {/* Input de Envío */}
        <div className="p-3 bg-white border-t border-slate-100 shrink-0">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input 
              type="text" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe un mensaje..." 
              className="w-full bg-slate-100 border border-transparent focus:border-[#0866bd]/30 rounded-full pl-4 pr-12 py-3 text-sm outline-none transition-all"
            />
            <button 
              type="submit" 
              disabled={!message.trim() || isTyping}
              className="absolute right-2 w-9 h-9 bg-[#0866bd] text-white rounded-full flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-[#0866bd] transition-colors"
            >
              <Send size={14} className="ml-0.5" />
            </button>
          </form>
        </div>
      </div>

      {/* BOTÓN FLOTANTE PRINCIPAL */}
      <div className="flex justify-end mt-4">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="group relative w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/30 hover:scale-110 transition-transform duration-300"
        >
          <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-20 pointer-events-none"></div>
          {isOpen ? (
            <X size={28} className="text-slate-900" />
          ) : (
            <MessageCircle size={28} className="text-slate-900 group-hover:animate-wiggle" />
          )}
        </button>
      </div>

    </div>
  );
}
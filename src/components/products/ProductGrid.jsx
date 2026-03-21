import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { CartContext } from '../../context/CartContext'; // Ajusta la ruta si es necesario

export default function ProductGrid({ products, title }) {
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);

  if (!products || products.length === 0) return null;

  return (
    <div className="w-full">
      {title && <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-6">{title}</h3>}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div 
            key={product.id} 
            className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm hover:shadow-xl hover:border-[#0866bd] transition-all duration-300 group flex flex-col relative"
          >
            {/* CONTENEDOR DE LA IMAGEN (Hace clic hacia los detalles) */}
            <div 
              className="bg-slate-50 rounded-2xl aspect-square mb-4 flex items-center justify-center p-4 cursor-pointer overflow-hidden relative"
              onClick={() => navigate(`/producto/${product.id}`)} // Asegúrate de que esta ruta coincida con la de tu App.jsx
            >
              <img 
                src={product.img} 
                alt={product.name} 
                className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                // EL ESCUDO ANTI-ERRORES: Si la imagen está rota, pone esta por defecto
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = `https://placehold.co/300x300/f8fafc/0866BD?text=${encodeURIComponent(product.category || 'Refacción')}`;
                }}
              />
              
              {/* Botón de agregar rápido al carrito (Flotante) */}
              <button 
                onClick={(e) => {
                  e.stopPropagation(); // Evita que al darle al carrito te meta a la página del producto
                  addToCart(product);
                  // Opcional: Podrías lanzar un toast aquí diciendo "Agregado"
                }}
                className="absolute bottom-3 right-3 w-12 h-12 bg-[#ffc107] hover:bg-[#ffb300] text-slate-900 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform z-10"
              >
                <ShoppingCart size={20} className="font-black" />
              </button>
            </div>

            {/* INFO DEL PRODUCTO (Hace clic hacia los detalles) */}
            <div 
              className="flex flex-col flex-1 cursor-pointer"
              onClick={() => navigate(`/producto/${product.id}`)}
            >
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 line-clamp-1">
                {product.category}
              </p>
              <h4 className="text-sm font-black text-[#0f172a] uppercase leading-tight line-clamp-2 mb-3 group-hover:text-[#0866bd] transition-colors">
                {product.name}
              </h4>
              
              <div className="mt-auto flex items-end justify-between">
                <div>
                  <p className="text-2xl font-black text-[#0866bd] tracking-tighter">
                    ${product.price?.toLocaleString('es-MX')}
                  </p>
                  {product.originalPrice && (
                    <p className="text-xs text-slate-400 line-through font-bold">
                      ${product.originalPrice.toLocaleString('es-MX')}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}
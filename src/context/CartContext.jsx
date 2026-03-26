import React, { createContext, useState, useEffect, useMemo } from 'react';

export const CartContext = createContext();

export function CartProvider({ children }) {
  // 1. Inicialización segura desde LocalStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('carritoElJefe');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Error leyendo carrito, limpiando caché corrupta:", error);
      localStorage.removeItem('carritoElJefe');
      return [];
    }
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);

  // 2. Sincronización automática con LocalStorage
  useEffect(() => {
    localStorage.setItem('carritoElJefe', JSON.stringify(cartItems));
  }, [cartItems]);

  // 3. Agregar al Carrito (Optimizada para recibir cantidades y validar Stock)
  const addToCart = (product, quantityToAdd = 1) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      
      if (existingItem) {
        // Calculamos la nueva cantidad sin exceder el stock disponible
        const newQty = existingItem.qty + quantityToAdd;
        const finalQty = product.stock ? Math.min(newQty, product.stock) : newQty;
        
        return prev.map(item => 
          item.id === product.id ? { ...item, qty: finalQty } : item
        );
      }
      
      // Si es un producto nuevo, aseguramos no exceder el stock desde el primer clic
      const initialQty = product.stock ? Math.min(quantityToAdd, product.stock) : quantityToAdd;
      return [...prev, { ...product, qty: initialQty }];
    });
    
    // Abrimos el carrito para dar feedback visual de éxito
    setIsCartOpen(true);
  };

  // 4. Eliminar producto del carrito
  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  // 5. Actualizar cantidad (Con validación estricta de Stock y Límite Inferior)
  const updateQty = (id, delta) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        
        // Evitamos que baje de 1 o suba más del stock máximo
        if (newQty < 1) return item; 
        if (item.stock && newQty > item.stock) return item;
        
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  // 6. Vaciar carrito completo (Ideal para después de hacer la compra)
  const clearCart = () => {
    setCartItems([]);
  };

  const toggleCart = () => setIsCartOpen(!isCartOpen);

  // 7. Cálculos de alto rendimiento (useMemo evita que se recalcule innecesariamente)
  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => total + ((item.promoPrice || item.price) * item.qty), 0);
  }, [cartItems]);

  const cartCount = useMemo(() => {
    return cartItems.reduce((count, item) => count + item.qty, 0);
  }, [cartItems]);

  // Exponemos todas las herramientas en el contexto
  const contextValue = {
    cartItems,
    isCartOpen,
    cartTotal,
    cartCount,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
    toggleCart,
    setIsCartOpen
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}
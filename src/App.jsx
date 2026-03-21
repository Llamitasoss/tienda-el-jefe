import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Contexto Global (Carrito)
import { CartProvider } from './context/CartContext'; 

// Componentes de Layout e Interfaz (Los que se ven en todas las páginas)
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/layout/ScrollToTop'; 
import CartSidebar from './components/ui/CartSidebar';
import FloatingChat from './components/ui/FloatingChat'; 

// Páginas (Vistas principales)
import Home from './pages/Home';
import CatalogWizard from './pages/CatalogWizard';
import ProductDetail from './pages/ProductDetail';
import Talleres from './pages/Talleres'; 

export default function App() {
  return (
    <CartProvider> 
      <Router>
        {/* Este componente escucha los cambios de ruta y sube el scroll automáticamente */}
        <ScrollToTop /> 
        
        {/* Componentes Globales (Menú, Carrito y Chat flotante) */}
        <Header />
        <CartSidebar />
        <FloatingChat />

        {/* Contenedor principal donde cambian las vistas según la URL */}
        <main className="min-h-screen">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalogo" element={<CatalogWizard />} />
            <Route path="/producto/:id" element={<ProductDetail />} />
            <Route path="/talleres" element={<Talleres />} />
          </Routes>
        </main>
        
        {/* Pie de página */}
        <Footer />
      </Router>
    </CartProvider>
  );
}
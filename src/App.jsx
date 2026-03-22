import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Contexto Global (Carrito)
import { CartProvider } from './context/CartContext'; 

// Componentes de Layout e Interfaz (Los que se ven en todas las páginas)
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/layout/ScrollToTop'; 
import CartSidebar from './components/ui/CartSidebar';
import FloatingChat from './components/ui/FloatingChat'; 
import PageTransition from './components/layout/PageTransition'; // <-- NUEVO

// Páginas (Vistas principales)
import Home from './pages/Home';
import CatalogWizard from './pages/CatalogWizard';
import ProductDetail from './pages/ProductDetail';
import Talleres from './pages/Talleres'; 

// === MAGIA TOP-TIER: RUTAS ANIMADAS ===
// Separamos las rutas en este componente para poder usar useLocation()
function AnimatedRoutes() {
  const location = useLocation();

  return (
    // AnimatePresence "espera" a que la animación de salida termine antes de cargar la nueva página
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/catalogo" element={<PageTransition><CatalogWizard /></PageTransition>} />
        <Route path="/producto/:id" element={<PageTransition><ProductDetail /></PageTransition>} />
        <Route path="/talleres" element={<PageTransition><Talleres /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

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
          <AnimatedRoutes />
        </main>
        
        {/* Pie de página */}
        <Footer />
      </Router>
    </CartProvider>
  );
}
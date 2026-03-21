import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Cada vez que cambie la ruta (pathname), mueve el scroll arriba
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth' // Le da un efecto de deslizamiento suave muy pro
    });
  }, [pathname]);

  return null; // Este componente no muestra nada visualmente, solo hace el trabajo sucio
}
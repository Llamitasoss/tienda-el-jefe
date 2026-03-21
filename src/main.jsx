import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// --- EL CAZADOR DE FALLAS (ErrorBoundary) ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el estado para que el siguiente renderizado muestre la interfaz de repuesto.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Aquí podrías enviar el error a un servicio de log si quisieras
    console.error("Falla crítica detectada:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-10 font-sans">
          <div className="max-w-md w-full border-2 border-red-500 rounded-3xl p-8 bg-slate-800 shadow-2xl animate-pulse">
            <h1 className="text-2xl font-black text-red-500 uppercase mb-4">¡Falla en el Sistema!</h1>
            <p className="text-slate-300 mb-6 font-medium">
              El motor de la página se detuvo. Revisa la consola (F12) para más detalles.
            </p>
            <div className="bg-black/50 p-4 rounded-xl mb-6 overflow-auto max-h-40">
              <code className="text-xs text-red-300">{this.state.error?.toString()}</code>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-3 rounded-xl transition-all uppercase tracking-widest text-sm"
            >
              Reiniciar Sistema
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

// --- RENDERIZADO PRINCIPAL ---
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
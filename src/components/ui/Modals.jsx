import React, { useState } from 'react';
import { X, Search, Package, Clock, Loader2 } from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';

export function TrackOrderModal({ isOpen, onClose }) {
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!telefono.trim()) return;
    
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Busca en la colección de pedidos el último pedido asociado a ese número de WhatsApp
      const pedidosRef = collection(db, "pedidos");
      const qPhone = query(pedidosRef, where("telefono", "==", telefono.trim()), limit(1));
      
      const querySnapshot = await getDocs(qPhone);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        setResult({ id: doc.id, ...doc.data() });
      } else {
        setError('No encontramos ningún pedido activo con ese número de WhatsApp. Asegúrate de escribirlo a 10 dígitos.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectar con la base de datos.');
    }
    
    setLoading(false);
  };

  const renderStatus = (status) => {
    if (status === 'nuevo') return <span className="text-blue-500 font-bold bg-blue-50 px-3 py-1 rounded-lg">En Cola de Espera</span>;
    if (status === 'preparando') return <span className="text-yellow-600 font-bold bg-yellow-50 px-3 py-1 rounded-lg">Preparando Pedido</span>;
    if (status === 'listo') return <span className="text-emerald-500 font-bold bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">¡Listo para Recoger!</span>;
    return <span className="text-slate-500 font-bold">{status}</span>;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-md rounded-3xl p-6 relative z-10 shadow-2xl animate-pop-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-200 p-2 rounded-full transition-colors">
          <X size={20} />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-50 text-[#0866bd] rounded-2xl flex items-center justify-center shadow-inner"><Package size={24} /></div>
          <div>
            <h3 className="font-black text-xl text-slate-800 uppercase tracking-tight">Rastrear Orden</h3>
            <p className="text-xs font-medium text-slate-500">Consulta el estatus en tiempo real</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mb-6">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">WhatsApp Registrado</label>
          <div className="flex bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-[#0866bd] transition-colors shadow-sm">
            <input 
              type="tel" 
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ej: 3312345678" 
              className="w-full px-4 py-3 outline-none bg-transparent font-bold text-slate-700" 
            />
            <button type="submit" disabled={loading} className="px-5 bg-[#0866bd] text-white hover:bg-blue-800 transition-colors disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm font-bold text-center border border-red-100 animate-fade-in">
            {error}
          </div>
        )}

        {result && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mt-4 animate-fade-in-up">
            <div className="flex justify-between items-start mb-4 border-b border-slate-200 pb-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estatus de tu orden</p>
                {renderStatus(result.status)}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hora Local</p>
                <span className="font-bold text-slate-700 text-sm flex items-center gap-1"><Clock size={14}/> {result.time || "Reciente"}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Resumen</p>
              <p className="font-bold text-sm text-slate-700 mb-1">{result.items} Artículos empacados</p>
              <p className="text-xs text-slate-500">Orden a nombre de: <strong className="text-slate-800">{result.cliente}</strong></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
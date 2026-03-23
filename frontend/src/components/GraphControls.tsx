import { Minimize2, Layers, RotateCw } from 'lucide-react';

interface GraphControlsProps {
  isRotating: boolean;
  setIsRotating: (val: boolean) => void;
}

export const GraphControls = ({ isRotating, setIsRotating }: GraphControlsProps) => {
  return (
    <div className="absolute top-6 left-6 z-20 flex gap-2">
      <button className="glass-panel flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold text-slate-700 hover:bg-white transition-all active:scale-95">
        <Minimize2 size={14} /> MINIMIZE
      </button>
      <button className="flex items-center gap-2 bg-[#0f172a] text-white px-5 py-2 rounded-xl shadow-xl shadow-slate-900/10 text-[11px] font-bold hover:bg-black transition-all active:scale-95">
        <Layers size={14} /> GRANULAR OVERLAY
      </button>
      <button 
        onClick={() => setIsRotating(!isRotating)} 
        className={`glass-panel p-2.5 rounded-xl transition-all active:scale-95 ${isRotating ? 'text-blue-500 bg-white' : 'text-gray-400'}`}
      >
         <RotateCw size={18} className={isRotating ? 'animate-spin-slow' : ''} />
      </button>
    </div>
  );
};

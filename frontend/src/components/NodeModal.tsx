import { X } from 'lucide-react';

interface NodeModalProps {
  selectedNode: any;
  setSelectedNode: (node: any) => void;
  neighborCount: number;
}

export const NodeModal = ({ selectedNode, setSelectedNode, neighborCount }: NodeModalProps) => {
  if (!selectedNode) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#fcfcfc]/20 backdrop-blur-[2px] z-40 animate-in" 
        onClick={() => setSelectedNode(null)}
      />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[440px] glass-panel rounded-3xl overflow-hidden node-card-animate shadow-2xl">
        <div className="px-7 py-6 border-b border-white/5 flex justify-between items-start bg-transparent">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">{selectedNode.label || 'Entity Details'}</h3>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1 block">{selectedNode.group}</span>
          </div>
          <button onClick={() => setSelectedNode(null)} className="p-2 rounded-xl hover:bg-gray-100 transition-all active:scale-90">
            <X size={18} className="text-gray-400" />
          </button>
        </div>
        <div className="px-7 py-8 max-h-[500px] overflow-y-auto scrollbar-hide space-y-5">
          {Object.entries(selectedNode.properties || selectedNode).map(([k, v]) => {
            if (['x', 'y', 'vx', 'vy', 'index', 'id', 'color', 'val', 'group', 'label', '__lineColor', '__highlight'].includes(k)) return null;
            return (
              <div key={k} className="flex flex-col group">
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-tighter opacity-70 group-hover:opacity-100 transition-opacity">
                  {k.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="text-[14px] text-slate-900 font-bold mt-1 bg-white/10 p-2 rounded-lg border border-white/10 group-hover:bg-white/20 transition-all font-mono tracking-tight">
                  {String(v)}
                </span>
              </div>
            );
          })}
          <div className="pt-6 flex items-center justify-between border-t border-white/5">
             <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-bold uppercase italic">Meta Analysis</span>
                <span className="text-[13px] font-black text-slate-900 mt-1">Neighbors: {neighborCount}</span>
             </div>
             <button className="bg-blue-600 text-white text-[11px] font-bold px-4 py-2 rounded-lg shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">DEEP ANALYZE</button>
          </div>
        </div>
      </div>
    </>
  );
};

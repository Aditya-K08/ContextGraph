import { useState, useEffect, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import axios from 'axios';
import { 
  Send, Loader2, RotateCw, 
  Menu, Layers, X, Minimize2, Search, Bell, User
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

interface GraphData {
  nodes: any[];
  links: any[];
}

function App() {
  const fgRef = useRef<any>(null);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loadingGraph, setLoadingGraph] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());

  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'system', content: string, sql?: string}[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const [dimensions, setDimensions] = useState({ 
    width: window.innerWidth - 400, 
    height: window.innerHeight - 56 
  });

  useEffect(() => {
    fetchGraph();
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth - 400,
        height: window.innerHeight - 56
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let animationFrame: number;
    const rotate = () => {
      if (isRotating) {
        setRotation(prev => (prev + 0.005) % (Math.PI * 2));
      }
      animationFrame = requestAnimationFrame(rotate);
    };
    rotate();
    return () => cancelAnimationFrame(animationFrame);
  }, [isRotating]);

  const fetchGraph = async () => {
    try {
      const res = await axios.get(`${API_BASE}/graph`);
      setGraphData(res.data);
      setLoadingGraph(false);
    } catch (err) {
      console.error('Failed to fetch graph data:', err);
      setLoadingGraph(false);
    }
  };

  const updateHighlight = () => {
    setHighlightNodes(new Set(highlightNodes));
    setHighlightLinks(new Set(highlightLinks));
  };

  const handleNodeHover = (node: any) => {
    highlightNodes.clear();
    highlightLinks.clear();
    if (node) {
      highlightNodes.add(node.id);
      graphData.links.forEach(link => {
        if (link.source.id === node.id || link.target.id === node.id) {
          highlightLinks.add(link);
          highlightNodes.add(link.source.id);
          highlightNodes.add(link.target.id);
        }
      });
    }
    updateHighlight();
  };

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(3, 1000);
    }
  }, []);

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg = query;
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setQuery('');
    setLoadingChat(true);

    try {
      const res = await axios.post(`${API_BASE}/chat`, { query: userMsg });
      const data = res.data;
      setChatHistory(prev => [
        ...prev, 
        { role: 'system', content: data.answer, sql: data.sql }
      ]);

      // NEW: Auto-zoom to target_id if found
      if (data.target_id) {
        const tId = String(data.target_id).trim().toLowerCase();
        let targetNode = graphData.nodes.find(n => 
          n.id.toLowerCase() === tId ||
          n.properties?.sap_id?.toLowerCase() === tId ||
          n.properties?.accounting_doc?.toLowerCase() === tId
        );

        // Fallback: Full-text search in the node object
        if (!targetNode) {
          targetNode = graphData.nodes.find(n => 
            JSON.stringify(n).toLowerCase().includes(tId)
          );
        }

        if (targetNode) {
          setTimeout(() => {
            handleNodeClick(targetNode);
          }, 200);
        }
      }
    } catch (err) {
      setChatHistory(prev => [
        ...prev, 
        { role: 'system', content: "Sorry, I couldn't reach the backend. Is it running?" }
      ]);
    } finally {
      setLoadingChat(false);
    }
  };

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isSelected = selectedNode?.id === node.id;
    const isHighlighted = highlightNodes.has(node.id) || isSelected;
    const radius = isHighlighted ? 10 : 4; // Larger highlighted dots
    
    // Draw Dramatic Pulse for selected node
    if (isSelected) {
      const time = Date.now() / 250;
      const pulseRadius = radius + 6 + Math.sin(time) * 4;
      ctx.beginPath();
      ctx.arc(node.x, node.y, pulseRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(59, 130, 246, ${0.6 + Math.sin(time) * 0.3})`;
      ctx.lineWidth = 3 / globalScale;
      ctx.stroke();
      
      // Secondary outer faint ring
      ctx.beginPath();
      ctx.arc(node.x, node.y, pulseRadius + 5, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(59, 130, 246, 0.2)`;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    
    // Group Colors
    const colors: any = {
      'Customer': '#EF4444',
      'Product': '#3B82F6',
      'Order': '#F59E0B',
      'OrderItem': '#F97316',
      'Delivery': '#14B8A6',
      'Invoice': '#6366F1',
      'Payment': '#10B981',
      'Plant': '#A855F7',
      'StorageLocation': '#71717A',
      'ScheduleLine': '#EC4899',
      'JournalEntryItem': '#06B6D4'
    };
    ctx.fillStyle = node.color || colors[node.group] || '#3B82F6';
    ctx.fill();

    if (isHighlighted) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();
      
      const label = node.label;
      const fontSize = 12 / globalScale;
      ctx.font = `bold ${fontSize}px Inter, -apple-system, sans-serif`;
      ctx.fillStyle = '#111';
      ctx.textAlign = 'center';
      
      // Label Background Tooltip
      const textWidth = ctx.measureText(label).width;
      const pad = 4 / globalScale;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(node.x - textWidth/2 - pad, node.y + radius + 4, textWidth + pad*2, fontSize + pad*2);
      ctx.fillStyle = '#0f172a';
      ctx.fillText(label, node.x, node.y + radius + fontSize + 6);
    }
  }, [highlightNodes, selectedNode]);

  return (
    <div className="flex flex-col h-screen w-full bg-[#fcfcfc] text-slate-900 font-sans overflow-hidden select-none">
      
      {/* TOP HEADER */}
      <header className="h-14 border-b border-gray-100 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-4">
          <Menu size={20} className="text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-gray-400 font-semibold tracking-wide">MAPPING</span>
            <span className="text-gray-300">/</span>
            <span className="text-[13px] text-slate-800 font-extrabold tracking-tight">ORDER TO CASH</span>
          </div>
        </div>
        <div className="flex items-center gap-5 text-gray-400">
           <Search size={18} className="hover:text-gray-600 cursor-pointer" />
           <Bell size={18} className="hover:text-gray-600 cursor-pointer" />
           <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-[10px] shadow-lg shadow-indigo-600/20 cursor-pointer">AK</div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFT PANE: Graph */}
        <div className="flex-1 relative bg-[#fcfcfc] overflow-hidden">
          
          {/* FLOATING CONTROLS */}
          <div className="absolute top-6 left-6 z-20 flex gap-2">
            <button className="glass-panel flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold text-slate-700 hover:bg-white transition-all active:scale-95">
              <Minimize2 size={14} /> MINIMIZE
            </button>
            <button className="flex items-center gap-2 bg-[#0f172a] text-white px-5 py-2 rounded-xl shadow-xl shadow-slate-900/10 text-[11px] font-bold hover:bg-black transition-all active:scale-95">
              <Layers size={14} /> GRANULAR OVERLAY
            </button>
            <button onClick={() => setIsRotating(!isRotating)} className={`glass-panel p-2.5 rounded-xl transition-all active:scale-95 ${isRotating ? 'text-blue-500 bg-white' : 'text-gray-400'}`}>
               <RotateCw size={18} className={isRotating ? 'animate-spin-slow' : ''} />
            </button>
          </div>

          {loadingGraph ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-blue-500" size={40} />
                <span className="text-xs font-bold text-gray-400 animate-pulse tracking-widest uppercase">Initializing Graph Engine...</span>
              </div>
            </div>
          ) : (
            <div className="w-full h-full opacity-0 animate-in" style={{ animationDelay: '0.2s' }}>
               <ForceGraph2D
                  ref={fgRef}
                  width={dimensions.width}
                  height={dimensions.height}
                  graphData={graphData}
                  nodeCanvasObject={paintNode}
                  onNodeHover={handleNodeHover}
                  onNodeClick={handleNodeClick}
                  onBackgroundClick={() => setSelectedNode(null)}
                  linkColor={(link: any) => highlightLinks.has(link) ? '#3b82f6' : 'rgba(59, 130, 246, 0.12)'}
                  linkWidth={(link: any) => highlightLinks.has(link) ? 3 : 1}
                  linkDirectionalParticles={(link: any) => highlightLinks.has(link) ? 6 : 0}
                  linkDirectionalParticleSpeed={0.008}
                  backgroundColor="#fcfcfc"
                  onRenderFramePre={(ctx) => {
                    ctx.save();
                    if (rotation !== 0) {
                      const centerX = dimensions.width / 2;
                      const centerY = dimensions.height / 2;
                      ctx.translate(centerX, centerY);
                      ctx.rotate(rotation);
                      ctx.translate(-centerX, -centerY);
                    }
                  }}
                  onRenderFramePost={(ctx) => ctx.restore()}
                  cooldownTicks={120}
                />
            </div>
          )}

          {/* NODE INFO OVERLAY */}
          {selectedNode && (
            <>
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-[#fcfcfc]/60 backdrop-blur-sm z-40 animate-in" 
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
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-tighter opacity-70 group-hover:opacity-100 transition-opacity">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="text-[14px] text-slate-900 font-bold mt-1 bg-white/10 p-2 rounded-lg border border-white/10 group-hover:bg-white/20 transition-all font-mono tracking-tight">{String(v)}</span>
                    </div>
                  );
                })}
                <div className="pt-6 flex items-center justify-between border-t border-white/5">
                   <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold uppercase italic">Meta Analysis</span>
                      <span className="text-[13px] font-black text-slate-900 mt-1">Neighbors: {graphData.links.filter(l => l.source.id === selectedNode.id || l.target.id === selectedNode.id).length}</span>
                   </div>
                   <button className="bg-blue-600 text-white text-[11px] font-bold px-4 py-2 rounded-lg shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all">DEEP ANALYZE</button>
                </div>
              </div>
            </div>
            </>
          )}
        </div>
 
        {/* RIGHT SIDEBAR: Dodge AI */}
        <div className="w-[400px] premium-sidebar flex flex-col z-30">
          <div className="p-7 pb-5">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Intelligent Agent</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Orders-to-Cash Live</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-7 pt-2 space-y-8 scrollbar-hide">
            <div className="flex gap-4 animate-in">
               <div className="w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-slate-900/10 flex-shrink-0">D</div>
               <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                     <span className="text-[12px] font-black text-slate-900">Dodge AI</span>
                     <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter">System</span>
                  </div>
                  <p className="text-[13px] text-slate-700 leading-relaxed font-medium">Greetings. I've finished mapping the <span className="font-bold text-slate-900 underline decoration-blue-500/30 decoration-2">Order to Cash</span> dataset. How can I assist your analysis today?</p>
               </div>
            </div>

            {chatHistory.map((msg, i) => (
              <div key={i} className="flex gap-4 animate-in">
                <div className="flex-shrink-0">
                  {msg.role === 'user' ? (
                    <div className="w-11 h-11 bg-gray-100 rounded-2xl border border-gray-200 flex items-center justify-center text-gray-500 shadow-sm overflow-hidden">
                      <User size={22} />
                    </div>
                  ) : (
                    <div className="w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-2xl flex-shrink-0 shadow-xl shadow-slate-900/10">D</div>
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                   <div className="flex items-center gap-2">
                      <span className="text-[12px] font-black text-slate-900">{msg.role === 'user' ? 'YOU' : 'DODGE AI'}</span>
                      {msg.role === 'system' && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter">LUNA-2</span>}
                   </div>
                   <div className={msg.role === 'user' ? 'chat-user-bubble' : 'text-[13px] text-slate-700 font-medium leading-relaxed'}>
                     {msg.content}
                   </div>
                </div>
              </div>
            ))}

            {loadingChat && (
              <div className="flex gap-4 animate-pulse">
                <div className="w-11 h-11 bg-gray-100 rounded-2xl" />
                <div className="flex-1 space-y-2.5 pt-1">
                  <div className="w-20 h-2.5 bg-gray-100 rounded-full" />
                  <div className="w-full h-14 bg-gray-100 rounded-2xl" />
                </div>
              </div>
            )}
          </div>

          <div className="p-7 pt-2">
            <form onSubmit={handleQuery} className="group relative flex items-end chat-input-wrapper p-2">
              <textarea
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleQuery(e as any);
                  }
                }}
                rows={1}
                placeholder="Query your supply chain..."
                className="w-full bg-transparent border-none outline-none text-[13px] font-semibold py-3 pl-4 pr-12 resize-none scrollbar-hide max-h-[200px] text-slate-800 placeholder-slate-400"
              />
              <button 
                type="submit" 
                disabled={!query.trim() || loadingChat}
                className="absolute right-3 bottom-3 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-black transition-all disabled:opacity-20 shadow-lg shadow-blue-500/20"
              >
                {loadingChat ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
            <div className="mt-4 text-center">
               <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Enterprise Graph Insight • v2.0.4</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

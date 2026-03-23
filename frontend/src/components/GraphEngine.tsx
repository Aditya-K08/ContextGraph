import { useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Loader2 } from 'lucide-react';
import type { GraphData } from '../types';

interface GraphEngineProps {
  fgRef: any;
  loadingGraph: boolean;
  graphData: GraphData;
  dimensions: { width: number; height: number };
  highlightNodes: Set<string>;
  highlightLinks: Set<any>;
  selectedNode: any;
  onNodeHover: (node: any) => void;
  onNodeClick: (node: any) => void;
  onBackgroundClick: () => void;
  rotation: number;
}

export const GraphEngine = ({ 
  fgRef, loadingGraph, graphData, dimensions, 
  highlightNodes, highlightLinks, selectedNode,
  onNodeHover, onNodeClick, onBackgroundClick, rotation
}: GraphEngineProps) => {

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isSelected = selectedNode?.id === node.id;
    const isHighlighted = highlightNodes.has(node.id) || isSelected;
    const radius = isHighlighted ? 10 : 4;
    
    if (isSelected) {
      const time = Date.now() / 250;
      const pulseRadius = radius + 6 + Math.sin(time) * 4;
      ctx.beginPath();
      ctx.arc(node.x, node.y, pulseRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(59, 130, 246, ${0.6 + Math.sin(time) * 0.3})`;
      ctx.lineWidth = 3 / globalScale;
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, pulseRadius + 5, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(59, 130, 246, 0.2)`;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    
    const colors: any = {
      'Customer': '#EF4444', 'Product': '#3B82F6', 'Order': '#F59E0B',
      'OrderItem': '#F97316', 'Delivery': '#14B8A6', 'Invoice': '#6366F1',
      'Payment': '#10B981', 'Plant': '#A855F7', 'StorageLocation': '#71717A',
      'ScheduleLine': '#EC4899', 'JournalEntryItem': '#06B6D4'
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
      
      const textWidth = ctx.measureText(label).width;
      const pad = 4 / globalScale;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(node.x - textWidth/2 - pad, node.y + radius + 4, textWidth + pad*2, fontSize + pad*2);
      ctx.fillStyle = '#0f172a';
      ctx.fillText(label, node.x, node.y + radius + fontSize + 6);
    }
  }, [highlightNodes, selectedNode]);

  if (loadingGraph) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-500" size={40} />
          <span className="text-xs font-bold text-gray-400 animate-pulse tracking-widest uppercase">Initializing Graph Engine...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full opacity-0 animate-in" style={{ animationDelay: '0.2s' }}>
      <ForceGraph2D
        ref={fgRef}
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeCanvasObject={paintNode}
        onNodeHover={onNodeHover}
        onNodeClick={onNodeClick}
        onBackgroundClick={onBackgroundClick}
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
  );
};

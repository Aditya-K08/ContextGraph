import { useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { ChatSidebar } from './components/ChatSidebar';
import { GraphControls } from './components/GraphControls';
import { NodeModal } from './components/NodeModal';
import { GraphEngine } from './components/GraphEngine';

import { useDimensions } from './hooks/useDimensions';
import { useGraphData } from './hooks/useGraphData';
import { useChat } from './hooks/useChat';

function App() {
  const fgRef = useRef<any>(null);
  const dimensions = useDimensions();
  const { 
    graphData, loadingGraph, highlightNodes, highlightLinks, 
    selectedNode, setSelectedNode, fetchGraph, handleNodeHover 
  } = useGraphData();
  
  const { 
    chatHistory, loadingChat, query, setQuery, handleQuery 
  } = useChat();

  useEffect(() => {
    fetchGraph();
  }, []);

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(3, 1000);
    }
  }, [setSelectedNode]);

  const onChatSuccess = (data: any) => {
    if (data.target_id) {
      const tId = String(data.target_id).trim().toLowerCase();
      let targetNode = graphData.nodes.find(n => 
        n.id.toLowerCase() === tId ||
        n.properties?.sap_id?.toLowerCase() === tId ||
        n.properties?.accounting_doc?.toLowerCase() === tId
      );

      if (!targetNode) {
        targetNode = graphData.nodes.find(n => 
          JSON.stringify(n).toLowerCase().includes(tId)
        );
      }

      if (targetNode) {
        setTimeout(() => handleNodeClick(targetNode), 200);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#fcfcfc] text-slate-900 font-sans overflow-hidden select-none">
      <Header />
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 relative bg-[#fcfcfc] overflow-hidden">
          <GraphControls />
          
          <GraphEngine 
            fgRef={fgRef}
            loadingGraph={loadingGraph}
            graphData={graphData}
            dimensions={dimensions}
            highlightNodes={highlightNodes}
            highlightLinks={highlightLinks}
            selectedNode={selectedNode}
            onNodeHover={handleNodeHover}
            onNodeClick={handleNodeClick}
            onBackgroundClick={() => setSelectedNode(null)}
          />

          <NodeModal 
            selectedNode={selectedNode} 
            setSelectedNode={setSelectedNode}
            neighborCount={graphData.links.filter(l => 
              l.source.id === selectedNode?.id || l.target.id === selectedNode?.id
            ).length}
          />
        </div>

        <ChatSidebar 
          chatHistory={chatHistory}
          loadingChat={loadingChat}
          query={query}
          setQuery={setQuery}
          onSend={(e) => {
            e.preventDefault();
            handleQuery(query, onChatSuccess);
          }}
        />
      </div>
    </div>
  );
}

export default App;

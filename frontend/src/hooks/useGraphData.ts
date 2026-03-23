import { useState, useCallback } from 'react';
import axios from 'axios';
import type { GraphData } from '../types';

const API_BASE = 'http://localhost:8000/api';

export const useGraphData = () => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loadingGraph, setLoadingGraph] = useState(true);
  const [highlightNodes, setHighlightNodes] = useState(new Set<string>());
  const [highlightLinks, setHighlightLinks] = useState(new Set<any>());
  const [selectedNode, setSelectedNode] = useState<any>(null);

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
    setHighlightNodes(new Set(highlightNodes));
    setHighlightLinks(new Set(highlightLinks));
  };

  return {
    graphData,
    loadingGraph,
    highlightNodes,
    highlightLinks,
    selectedNode,
    setSelectedNode,
    fetchGraph,
    handleNodeHover
  };
};

export interface GraphData {
  nodes: any[];
  links: any[];
}

export interface ChatMessage {
  role: 'user' | 'system';
  content: string;
  sql?: string;
}

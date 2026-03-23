import { useState } from 'react';
import axios from 'axios';
import type { ChatMessage } from '../types';

const API_BASE = 'http://localhost:8000/api';

export const useChat = () => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [query, setQuery] = useState('');

  const handleQuery = async (userMsg: string, onSuccess: (data: any) => void) => {
    if (!userMsg.trim()) return;

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
      onSuccess(data);
    } catch (err) {
      setChatHistory(prev => [
        ...prev, 
        { role: 'system', content: "Sorry, I couldn't reach the backend. Is it running?" }
      ]);
    } finally {
      setLoadingChat(false);
    }
  };

  return {
    chatHistory,
    loadingChat,
    query,
    setQuery,
    handleQuery
  };
};

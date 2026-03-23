import { Send, Loader2, User } from 'lucide-react';
import type { ChatMessage } from '../types';

interface ChatSidebarProps {
  chatHistory: ChatMessage[];
  loadingChat: boolean;
  query: string;
  setQuery: (val: string) => void;
  onSend: (e: React.FormEvent) => void;
}

export const ChatSidebar = ({ chatHistory, loadingChat, query, setQuery, onSend }: ChatSidebarProps) => {
  return (
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
        <form onSubmit={onSend} className="group relative flex items-end chat-input-wrapper p-2">
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
                onSend(e as any);
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
  );
};

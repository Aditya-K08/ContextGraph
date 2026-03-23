import { Menu, Search, Bell } from 'lucide-react';

export const Header = () => {
  return (
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
  );
};

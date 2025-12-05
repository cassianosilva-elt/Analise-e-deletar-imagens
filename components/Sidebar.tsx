import React from 'react';
import { LayoutDashboard, FolderSearch, Settings, HelpCircle, BarChart3, ChevronRight } from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
  <div className={`
    flex items-center px-4 py-3 mx-2 rounded-lg cursor-pointer transition-all duration-200 group
    ${active 
      ? 'bg-[#FF4D00] text-white shadow-lg shadow-orange-900/20' 
      : 'text-gray-400 hover:bg-[#2A2A2A] hover:text-white'}
  `}>
    <Icon className={`w-5 h-5 mr-3 ${active ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
    <span className="font-medium text-sm flex-1">{label}</span>
    {active && <ChevronRight className="w-4 h-4 text-white/80" />}
  </div>
);

const Sidebar = () => {
  return (
    <div className="w-64 bg-[#1A1A1A] border-r border-[#2A2A2A] h-full flex flex-col hidden md:flex">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[#2A2A2A]">
        <div className="w-8 h-8 bg-[#FF4D00] rounded-lg mr-3 flex items-center justify-center font-bold text-white shadow-md">E</div>
        <span className="text-white font-bold text-lg tracking-tight">Eletromidia<span className="text-[#FF4D00]">.AI</span></span>
      </div>

      <div className="py-6 space-y-1">
        <div className="px-6 mb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Principal</div>
        <SidebarItem icon={LayoutDashboard} label="Dashboard" active />
        <SidebarItem icon={FolderSearch} label="Fiscalização" />
        <SidebarItem icon={BarChart3} label="Relatórios" />
      </div>
      
      <div className="mt-auto pb-6 space-y-1">
        <div className="px-6 mb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Sistema</div>
        <SidebarItem icon={Settings} label="Configurações" />
        <SidebarItem icon={HelpCircle} label="Ajuda" />
      </div>
      
      {/* User Profile Snippet */}
      <div className="p-4 border-t border-[#2A2A2A] mx-2">
        <div className="flex items-center p-2 rounded-lg bg-[#252525]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-xs text-white">
            SC
          </div>
          <div className="ml-3">
            <p className="text-xs font-medium text-white">Supervisor</p>
            <p className="text-[10px] text-gray-500">Campanha 39</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
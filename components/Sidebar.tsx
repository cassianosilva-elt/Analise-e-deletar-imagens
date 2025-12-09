import React from 'react';
import { LayoutDashboard, FolderSearch, Settings, HelpCircle, BarChart3, ChevronRight } from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, active = false }: { icon: React.ElementType, label: string, active?: boolean }) => (
  <div className={`
    flex items-center px-3 lg:px-4 py-2.5 lg:py-3 mx-2 rounded-lg cursor-pointer transition-all duration-200 group
    ${active
      ? 'bg-[#FF4D00] text-white shadow-lg shadow-orange-900/20'
      : 'text-gray-400 hover:bg-[#2A2A2A] hover:text-white'}
  `}>
    <Icon className={`w-4 h-4 lg:w-5 lg:h-5 mr-2 lg:mr-3 ${active ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
    <span className="font-medium text-xs lg:text-sm flex-1">{label}</span>
    {active && <ChevronRight className="w-3 h-3 lg:w-4 lg:h-4 text-white/80" />}
  </div>
);

const Sidebar = () => {
  return (
    <div className="w-52 lg:w-64 bg-[#1A1A1A] border-r border-[#2A2A2A] h-full flex-col hidden md:flex flex-shrink-0">
      {/* Brand Header */}
      <div className="h-14 lg:h-16 flex items-center px-4 lg:px-6 border-b border-[#2A2A2A]">
        <img
          src="./assets/ELETRO-DESKTOP.png"
          alt="Eletromidia"
          className="h-8 lg:h-9"
        />
      </div>

      <div className="py-4 lg:py-6 space-y-1 flex-1 overflow-y-auto">
        <div className="px-4 lg:px-6 mb-2 text-[10px] lg:text-xs font-semibold text-gray-600 uppercase tracking-wider">Principal</div>
        <SidebarItem icon={LayoutDashboard} label="Dashboard" active />
        <SidebarItem icon={FolderSearch} label="Fiscalização" />
        <SidebarItem icon={BarChart3} label="Relatórios" />
      </div>

      <div className="pb-4 lg:pb-6 space-y-1">
        <div className="px-4 lg:px-6 mb-2 text-[10px] lg:text-xs font-semibold text-gray-600 uppercase tracking-wider">Sistema</div>
        <SidebarItem icon={Settings} label="Configurações" />
        <SidebarItem icon={HelpCircle} label="Ajuda" />
      </div>

      {/* User Profile Snippet */}
      <div className="p-3 lg:p-4 border-t border-[#2A2A2A] mx-2">
        <div className="flex items-center p-2 rounded-lg bg-[#252525]">
          <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-[10px] lg:text-xs text-white">
            SC
          </div>
          <div className="ml-2 lg:ml-3 min-w-0">
            <p className="text-[10px] lg:text-xs font-medium text-white truncate">Supervisor</p>
            <p className="text-[8px] lg:text-[10px] text-gray-500 truncate">Campanha 39</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
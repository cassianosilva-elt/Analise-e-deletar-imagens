import React from 'react';
import { LayoutDashboard, FolderSearch, Settings, HelpCircle, BarChart3, ChevronRight, ChevronLeft, PanelLeftClose, PanelLeft } from 'lucide-react';
import { PageVisibility } from './pages/ConfiguracoesPage';

export type PageId = 'dashboard' | 'relatorios' | 'configuracoes' | 'ajuda';

interface SidebarProps {
  activePage: PageId;
  onPageChange: (page: PageId) => void;
  pageVisibility: PageVisibility;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const SidebarItem = ({
  icon: Icon,
  label,
  active = false,
  onClick,
  collapsed = false
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
  collapsed?: boolean;
}) => (
  <div
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={`
    flex items-center ${collapsed ? 'justify-center px-2' : 'px-3 lg:px-4'} py-2.5 lg:py-3 mx-2 rounded-lg cursor-pointer transition-all duration-200 group
    ${active
        ? 'bg-[#FF4D00] text-white shadow-lg shadow-orange-900/20'
        : 'text-gray-400 hover:bg-[#2A2A2A] hover:text-white'}
  `}>
    <Icon className={`w-4 h-4 lg:w-5 lg:h-5 ${collapsed ? '' : 'mr-2 lg:mr-3'} ${active ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
    {!collapsed && <span className="font-medium text-xs lg:text-sm flex-1">{label}</span>}
    {!collapsed && active && <ChevronRight className="w-3 h-3 lg:w-4 lg:h-4 text-white/80" />}
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange, pageVisibility, isCollapsed, onToggleCollapse }) => {
  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-52 lg:w-64'} bg-[#1A1A1A] border-r border-[#2A2A2A] h-full flex-col hidden md:flex flex-shrink-0 transition-all duration-300`}>
      {/* Brand Header */}
      <div className="h-14 lg:h-16 flex items-center justify-between px-3 lg:px-4 border-b border-[#2A2A2A]">
        {!isCollapsed && (
          <img
            src="./assets/ELETRO-DESKTOP.png"
            alt="Eletromidia"
            className="h-7 lg:h-8"
          />
        )}
        {isCollapsed && (
          <img
            src="./assets/ELETRO-MOBILE.png"
            alt="Eletromidia"
            className="h-7 mx-auto"
          />
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg hover:bg-[#2A2A2A] text-gray-500 hover:text-white transition-colors"
          title={isCollapsed ? 'Expandir menu' : 'Minimizar menu'}
        >
          {isCollapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="py-4 lg:py-6 space-y-1 flex-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="px-4 lg:px-6 mb-2 text-[10px] lg:text-xs font-semibold text-gray-600 uppercase tracking-wider">Principal</div>
        )}
        <SidebarItem
          icon={LayoutDashboard}
          label="Dashboard"
          active={activePage === 'dashboard'}
          onClick={() => onPageChange('dashboard')}
          collapsed={isCollapsed}
        />
        {pageVisibility.relatorios && (
          <SidebarItem
            icon={BarChart3}
            label="Relatórios"
            active={activePage === 'relatorios'}
            onClick={() => onPageChange('relatorios')}
            collapsed={isCollapsed}
          />
        )}
      </div>

      <div className="pb-4 lg:pb-6 space-y-1">
        {!isCollapsed && (
          <div className="px-4 lg:px-6 mb-2 text-[10px] lg:text-xs font-semibold text-gray-600 uppercase tracking-wider">Sistema</div>
        )}
        {pageVisibility.configuracoes && (
          <SidebarItem
            icon={Settings}
            label="Configurações"
            active={activePage === 'configuracoes'}
            onClick={() => onPageChange('configuracoes')}
            collapsed={isCollapsed}
          />
        )}
        {pageVisibility.ajuda && (
          <SidebarItem
            icon={HelpCircle}
            label="Ajuda"
            active={activePage === 'ajuda'}
            onClick={() => onPageChange('ajuda')}
            collapsed={isCollapsed}
          />
        )}
      </div>

      {/* User Profile Snippet */}
      <div className={`p-2 lg:p-3 border-t border-[#2A2A2A] mx-2`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''} p-2 rounded-lg bg-[#252525]`}>
          <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 flex items-center justify-center text-[10px] lg:text-xs text-white flex-shrink-0">
            SC
          </div>
          {!isCollapsed && (
            <div className="ml-2 lg:ml-3 min-w-0">
              <p className="text-[10px] lg:text-xs font-medium text-white truncate">Supervisor</p>
              <p className="text-[8px] lg:text-[10px] text-gray-500 truncate">Campanha 39</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;


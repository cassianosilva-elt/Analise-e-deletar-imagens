import React from 'react';
import { LayoutDashboard, Settings, HelpCircle, BarChart3, ChevronRight, PanelLeftClose, PanelLeft, Wrench } from 'lucide-react';
import { PageVisibility } from './pages/ConfiguracoesPage';
import { TranslationKey } from '../translations';

export type PageId = 'dashboard' | 'relatorios' | 'ferramentas' | 'configuracoes' | 'ajuda';

interface SidebarProps {
  activePage: PageId;
  onPageChange: (page: PageId) => void;
  pageVisibility: PageVisibility;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  darkMode?: boolean;
  t?: (key: TranslationKey) => string;
}

const SidebarItem = ({
  icon: Icon,
  label,
  active = false,
  onClick,
  collapsed = false,
  darkMode = false
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
  collapsed?: boolean;
  darkMode?: boolean;
}) => (
  <div
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={`
    flex items-center ${collapsed ? 'justify-center px-2' : 'px-3 lg:px-4'} py-2.5 lg:py-3 mx-2 rounded-lg cursor-pointer transition-all duration-200 group
    ${active
        ? 'bg-[#FF4D00] text-white shadow-lg shadow-orange-900/20'
        : darkMode
          ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
          : 'text-gray-400 hover:bg-[#2A2A2A] hover:text-white'}
  `}>
    <Icon className={`w-4 h-4 lg:w-5 lg:h-5 ${collapsed ? '' : 'mr-2 lg:mr-3'} ${active ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
    {!collapsed && <span className="font-medium text-xs lg:text-sm flex-1">{label}</span>}
    {!collapsed && active && <ChevronRight className="w-3 h-3 lg:w-4 lg:h-4 text-white/80" />}
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ activePage, onPageChange, pageVisibility, isCollapsed, onToggleCollapse, darkMode = false, t }) => {
  // Fallback translations if t is not provided
  const translate = (key: TranslationKey): string => {
    if (t) return t(key);
    const fallbacks: Record<string, string> = {
      dashboard: 'Dashboard',
      relatorios: 'Relatórios',
      ferramentas: 'Ferramentas',
      configuracoes: 'Configurações',
      ajuda: 'Ajuda'
    };
    return fallbacks[key] || key;
  };

  const bgClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-[#1A1A1A] border-[#2A2A2A]';
  const borderClass = darkMode ? 'border-gray-700' : 'border-[#2A2A2A]';
  const hoverClass = darkMode ? 'hover:bg-gray-700' : 'hover:bg-[#2A2A2A]';
  const sectionTextClass = darkMode ? 'text-gray-500' : 'text-gray-600';
  const profileBgClass = darkMode ? 'bg-gray-700' : 'bg-[#252525]';

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-52 lg:w-64'} ${bgClass} border-r h-full flex-col hidden md:flex flex-shrink-0 transition-all duration-300`}>
      {/* Brand Header */}
      <div className={`h-14 lg:h-16 flex items-center justify-between px-3 lg:px-4 border-b ${borderClass}`}>
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
          className={`p-1.5 rounded-lg ${hoverClass} text-gray-500 hover:text-white transition-colors`}
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
          <div className={`px-4 lg:px-6 mb-2 text-[10px] lg:text-xs font-semibold ${sectionTextClass} uppercase tracking-wider`}>{translate('sectionMain')}</div>
        )}
        <SidebarItem
          icon={LayoutDashboard}
          label={translate('dashboard')}
          active={activePage === 'dashboard'}
          onClick={() => onPageChange('dashboard')}
          collapsed={isCollapsed}
          darkMode={darkMode}
        />
        {pageVisibility.relatorios && (
          <SidebarItem
            icon={BarChart3}
            label={translate('relatorios')}
            active={activePage === 'relatorios'}
            onClick={() => onPageChange('relatorios')}
            collapsed={isCollapsed}
            darkMode={darkMode}
          />
        )}
        <SidebarItem
          icon={Wrench}
          label={translate('ferramentas')}
          active={activePage === 'ferramentas'}
          onClick={() => onPageChange('ferramentas')}
          collapsed={isCollapsed}
          darkMode={darkMode}
        />
      </div>

      <div className="pb-4 lg:pb-6 space-y-1">
        {!isCollapsed && (
          <div className={`px-4 lg:px-6 mb-2 text-[10px] lg:text-xs font-semibold ${sectionTextClass} uppercase tracking-wider`}>{translate('sectionSystem')}</div>
        )}
        {pageVisibility.configuracoes && (
          <SidebarItem
            icon={Settings}
            label={translate('configuracoes')}
            active={activePage === 'configuracoes'}
            onClick={() => onPageChange('configuracoes')}
            collapsed={isCollapsed}
            darkMode={darkMode}
          />
        )}
        {pageVisibility.ajuda && (
          <SidebarItem
            icon={HelpCircle}
            label={translate('ajuda')}
            active={activePage === 'ajuda'}
            onClick={() => onPageChange('ajuda')}
            collapsed={isCollapsed}
            darkMode={darkMode}
          />
        )}
      </div>

      {/* User Profile Snippet */}
      <div className={`p-2 lg:p-3 border-t ${borderClass} mx-2`}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''} p-2 rounded-lg ${profileBgClass}`}>
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



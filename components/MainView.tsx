import React, { useState, useMemo } from 'react';
import {
  Folder, Image as ImageIcon, CheckCircle2, AlertCircle, Clock,
  ExternalLink, MapPin, ChevronDown, ChevronUp,
  Search, Filter, ShieldCheck, UserCheck, MessageSquare, Info,
  Eye, EyeOff, PanelRightClose, PanelRightOpen
} from 'lucide-react';
import { FolderItem, FileItem, ItemType, AnalysisStatus } from '../types';
import { useProjectStore } from '../store/projectStore';
import { useUIStore } from '../store/uiStore';
import { useRunStore } from '../store/runStore';
import { naturalCompare } from '../utils/sorting';
import ImageLightbox from './ImageLightbox';

const StatusBadge = ({ status, darkMode = false }: { status: AnalysisStatus, darkMode?: boolean }) => {
  switch (status) {
    case AnalysisStatus.COMPLETED:
      return (
        <div className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${darkMode ? 'text-emerald-400 bg-emerald-500/10' : 'text-emerald-600 bg-emerald-50'}`}>
          <CheckCircle2 className="w-3 h-3 mr-1" /> OK
        </div>
      );
    case AnalysisStatus.PENDING:
      return (
        <div className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${darkMode ? 'text-amber-400 bg-amber-500/10' : 'text-amber-600 bg-amber-50'}`}>
          <AlertCircle className="w-3 h-3 mr-1" /> Pendente
        </div>
      );
    case AnalysisStatus.PROCESSING:
      return (
        <div className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${darkMode ? 'text-blue-400 bg-blue-500/10' : 'text-blue-600 bg-blue-50'}`}>
          <Clock className="w-3 h-3 mr-1 animate-spin" /> Analisando
        </div>
      );
    default:
      return (
        <div className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full ${darkMode ? 'text-gray-500 bg-gray-800' : 'text-gray-400 bg-gray-100'}`}>
          Aguardando
        </div>
      );
  }
};

const MainView: React.FC = () => {
  const { rootFolder, updateFolderStatus, updateFolderObservation } = useProjectStore();
  const {
    currentPath,
    setCurrentPath,
    darkMode,
    searchQuery,
    setSearchQuery
  } = useUIStore();
  const { isProcessing, activeCount } = useRunStore();

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Panel visibility states
  const [showPhotos, setShowPhotos] = useState(true);
  const [showDetails, setShowDetails] = useState(true);

  // Helper to find folder content based on current path
  const currentFolder = useMemo(() => {
    if (!rootFolder) return null;
    let current: FolderItem = rootFolder;
    for (const segment of currentPath.slice(1)) {
      const found = current.children.find(c => c.type === ItemType.FOLDER && c.name === segment.name);
      if (found) current = found as FolderItem;
      else break;
    }
    return current;
  }, [rootFolder, currentPath]);

  // Sort and filter subfolders
  const subfolders = useMemo(() => {
    if (!currentFolder) return [];

    let filtered = currentFolder.children.filter(item => item.type === ItemType.FOLDER) as FolderItem[];

    if (searchQuery) {
      filtered = filtered.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.enrichedAddress?.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    return filtered.sort((a, b) => {
      const aPending = a.status === AnalysisStatus.PENDING ? 0 : 1;
      const bPending = b.status === AnalysisStatus.PENDING ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;

      const aConfidence = a.aiResult?.eletrica?.confidence ?? 1;
      const bConfidence = b.aiResult?.eletrica?.confidence ?? 1;
      if (aConfidence < 0.6 && bConfidence >= 0.6) return -1;
      if (aConfidence >= 0.6 && bConfidence < 0.6) return 1;

      return naturalCompare(a.name, b.name);
    });
  }, [currentFolder, searchQuery]);

  const selectedFolder = useMemo(() => {
    if (!selectedFolderId) return subfolders[0] || null;
    return subfolders.find(f => f.id === selectedFolderId) || subfolders[0] || null;
  }, [selectedFolderId, subfolders]);

  const selectedImages = useMemo(() => {
    if (!selectedFolder) return [];
    return selectedFolder.children.filter(c => c.type === ItemType.IMAGE) as FileItem[];
  }, [selectedFolder]);

  const handleNavigate = (folder: FolderItem) => {
    setCurrentPath([...currentPath, { name: folder.name, path: folder.path }]);
    setSelectedFolderId(null);
  };

  const handleManualStatus = (status: AnalysisStatus) => {
    if (selectedFolder) {
      updateFolderStatus(selectedFolder.path, status, undefined, undefined, undefined, undefined, true);
    }
  };

  // Color scheme
  const colors = {
    bg: darkMode ? 'bg-[#0a0b0d]' : 'bg-[#f8fafc]',
    panel: darkMode ? 'bg-[#111318]' : 'bg-white',
    border: darkMode ? 'border-gray-800/50' : 'border-gray-100',
    text: darkMode ? 'text-gray-100' : 'text-gray-800',
    textMuted: darkMode ? 'text-gray-500' : 'text-gray-400',
    hover: darkMode ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50',
    accent: 'text-orange-500'
  };

  if (!currentFolder) return null;

  return (
    <div className={`flex flex-col h-full overflow-hidden ${colors.bg}`}>

      {/* Minimalist Header */}
      <div className={`flex items-center justify-between px-6 py-4 border-b ${colors.border} ${colors.panel}`}>
        <div className="flex items-center gap-4">
          <h2 className={`font-bold text-lg ${colors.text}`}>Auditoria</h2>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
              {subfolders.length} pastas
            </span>
            {isProcessing && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${darkMode ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                {activeCount} em análise
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${colors.textMuted}`} />
            <input
              type="text"
              placeholder="Buscar..."
              className={`pl-9 pr-4 py-2 text-sm rounded-xl border outline-none w-56 transition-all focus:ring-2 focus:ring-orange-500/20 ${darkMode ? 'bg-gray-900/50 border-gray-800 text-gray-200 placeholder:text-gray-600' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400'}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Panel toggles */}
          <div className="flex items-center gap-1 border-l pl-3 border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setShowPhotos(!showPhotos)}
              className={`p-2 rounded-lg transition-all ${showPhotos ? (darkMode ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600') : colors.hover + ' ' + colors.textMuted}`}
              title={showPhotos ? 'Ocultar fotos' : 'Mostrar fotos'}
            >
              {showPhotos ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={`p-2 rounded-lg transition-all ${showDetails ? (darkMode ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600') : colors.hover + ' ' + colors.textMuted}`}
              title={showDetails ? 'Ocultar detalhes' : 'Mostrar detalhes'}
            >
              {showDetails ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* COLUMN 1: SITE LIST */}
        <div className={`w-80 flex flex-col border-r ${colors.border} ${colors.panel}`}>
          <div className="flex-1 overflow-y-auto">
            {subfolders.map(f => (
              <div
                key={f.id}
                onClick={() => setSelectedFolderId(f.id)}
                className={`p-4 border-b ${colors.border} cursor-pointer transition-all relative
                    ${selectedFolder?.id === f.id ? (darkMode ? 'bg-orange-500/5' : 'bg-orange-50/50') : colors.hover}
                `}
              >
                {selectedFolder?.id === f.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-orange-500" />
                )}
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-medium truncate flex-1 pr-2 ${colors.text}`}>{f.name}</span>
                  <StatusBadge status={f.status} darkMode={darkMode} />
                </div>
                <div className={`flex items-center gap-1 text-[11px] ${colors.textMuted} mb-2`}>
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{f.enrichedAddress || 'Endereço não definido'}</span>
                </div>
                {f.aiResult?.eletrica && (
                  <div className="flex items-center gap-2">
                    <div className={`flex-1 h-1 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                      <div
                        className={`h-full rounded-full transition-all ${f.aiResult.eletrica.confidence < 0.6 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${f.aiResult.eletrica.confidence * 100}%` }}
                      />
                    </div>
                    <span className={`text-[9px] font-medium ${f.aiResult.eletrica.confidence < 0.6 ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {(f.aiResult.eletrica.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* COLUMN 2: EVIDENCE PREVIEW */}
        {showPhotos && (
          <div className={`flex-1 flex flex-col overflow-hidden ${darkMode ? 'bg-[#0a0b0d]' : 'bg-[#f1f5f9]'}`}>
            {selectedFolder ? (
              <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    <h3 className={`text-lg font-bold ${colors.text}`}>{selectedFolder.name}</h3>
                    <p className={`text-xs ${colors.textMuted}`}>{selectedFolder.enrichedAddress}</p>
                  </div>
                  <div className="flex gap-2">
                    {selectedFolder.equipmentInfo?.linkOperacoes && (
                      <button
                        onClick={() => window.open(selectedFolder.equipmentInfo!.linkOperacoes, '_blank')}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-orange-500/20 transition-all"
                      >
                        <ExternalLink className="w-4 h-4" /> Ver Operações
                      </button>
                    )}
                    <button
                      onClick={() => handleNavigate(selectedFolder)}
                      className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
                    >
                      <Folder className="w-4 h-4" /> Abrir
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {selectedImages.map((img, idx) => (
                    <div
                      key={img.path}
                      className={`relative rounded-2xl overflow-hidden cursor-pointer group transition-all transform hover:scale-[1.02] hover:shadow-xl
                          ${img.selectedByAI ? 'ring-2 ring-emerald-500 ring-offset-2' : ''}
                          ${darkMode ? 'ring-offset-gray-900' : 'ring-offset-white'}
                      `}
                      onClick={() => { setLightboxIndex(idx); setLightboxOpen(true); }}
                    >
                      <img src={img.url} alt={img.name} className="w-full h-56 object-cover" />
                      {img.selectedByAI && (
                        <div className="absolute top-3 left-3 bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-lg flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> EVIDÊNCIA
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end justify-center pb-4">
                        <span className="text-white text-xs font-medium bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                          Ampliar
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <ImageIcon className={`w-8 h-8 ${colors.textMuted}`} />
                </div>
                <h3 className={`text-lg font-bold ${colors.text} mb-2`}>Selecione uma pasta</h3>
                <p className={`text-sm ${colors.textMuted} max-w-xs`}>Escolha um site na lista lateral para visualizar as imagens e resultados da análise.</p>
              </div>
            )}
          </div>
        )}

        {/* COLUMN 3: DETAILS PANEL */}
        {showDetails && selectedFolder && (
          <div className={`w-96 flex flex-col border-l ${colors.border} ${colors.panel}`}>
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1">

                {/* AI Analysis Section */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`p-2 rounded-xl ${darkMode ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                      <ShieldCheck className="w-4 h-4 text-purple-500" />
                    </div>
                    <h4 className={`font-bold text-sm ${colors.text}`}>Análise IA</h4>
                  </div>

                  {selectedFolder.aiResult ? (
                    <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs font-bold uppercase ${selectedFolder.aiResult.status === 'COMPLETED' ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {selectedFolder.aiResult.status === 'COMPLETED' ? 'Concluído' : 'Pendente'}
                        </span>
                        <span className={`text-[10px] ${colors.textMuted}`}>
                          {new Date(selectedFolder.aiResult.timestamp || Date.now()).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed ${colors.text}`}>
                        {selectedFolder.aiResult.reason || 'Sem descrição da análise.'}
                      </p>

                      {selectedFolder.aiResult.eletrica && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[10px] font-bold uppercase ${colors.textMuted}`}>Confiança</span>
                            <span className={`text-xs font-bold ${selectedFolder.aiResult.eletrica.confidence < 0.6 ? 'text-amber-500' : 'text-emerald-500'}`}>
                              {(selectedFolder.aiResult.eletrica.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className={`w-full h-2 rounded-full overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
                            <div
                              className={`h-full rounded-full transition-all ${selectedFolder.aiResult.eletrica.confidence < 0.6 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'}`}
                              style={{ width: `${selectedFolder.aiResult.eletrica.confidence * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`p-6 text-center border-2 border-dashed rounded-2xl ${darkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                      <Clock className={`w-8 h-8 mx-auto mb-2 ${colors.textMuted}`} />
                      <p className={`text-xs ${colors.textMuted}`}>Aguardando análise</p>
                    </div>
                  )}
                </div>

                {/* Human Audit Section */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`p-2 rounded-xl ${darkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                      <UserCheck className="w-4 h-4 text-blue-500" />
                    </div>
                    <h4 className={`font-bold text-sm ${colors.text}`}>Validação Manual</h4>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleManualStatus(AnalysisStatus.COMPLETED)}
                        className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-xs
                            ${selectedFolder.status === AnalysisStatus.COMPLETED
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                            : (darkMode ? 'bg-gray-800 text-gray-400 hover:bg-emerald-500/10 hover:text-emerald-400' : 'bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600')}
                        `}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> APROVAR
                      </button>
                      <button
                        onClick={() => handleManualStatus(AnalysisStatus.PENDING)}
                        className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-xs
                            ${selectedFolder.status === AnalysisStatus.PENDING
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20'
                            : (darkMode ? 'bg-gray-800 text-gray-400 hover:bg-amber-500/10 hover:text-amber-400' : 'bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-600')}
                        `}
                      >
                        <AlertCircle className="w-3.5 h-3.5" /> REPROVAR
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className={`w-3.5 h-3.5 ${colors.textMuted}`} />
                        <label className={`text-[10px] font-bold uppercase ${colors.textMuted}`}>Observações</label>
                      </div>
                      <textarea
                        className={`w-full p-3 text-xs rounded-xl border outline-none min-h-[80px] transition-all focus:ring-2 focus:ring-orange-500/20 resize-none ${darkMode ? 'bg-gray-900 border-gray-800 text-gray-200 placeholder:text-gray-600' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400'}`}
                        placeholder="Adicione observações ou motivos..."
                        value={selectedFolder.observation || ''}
                        onChange={(e) => updateFolderObservation(selectedFolder.path, e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Equipment Info */}
                {selectedFolder.equipmentInfo && (
                  <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-blue-500/5 border-blue-900/30' : 'bg-blue-50/50 border-blue-100'}`}>
                    <h5 className={`text-[10px] font-bold uppercase text-blue-500 mb-3 flex items-center gap-1`}>
                      <Info className="w-3 h-3" /> Equipamento
                    </h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className={`text-[9px] uppercase ${colors.textMuted} block mb-0.5`}>Modelo</span>
                        <span className={`text-xs font-medium ${colors.text}`}>{selectedFolder.equipmentInfo.modeloAbrigo || '-'}</span>
                      </div>
                      <div>
                        <span className={`text-[9px] uppercase ${colors.textMuted} block mb-0.5`}>Tipo</span>
                        <span className={`text-xs font-medium ${colors.text}`}>{selectedFolder.equipmentInfo.tipoEquipamento || '-'}</span>
                      </div>
                      <div>
                        <span className={`text-[9px] uppercase ${colors.textMuted} block mb-0.5`}>Ponto</span>
                        <span className={`text-xs font-medium ${colors.text}`}>{selectedFolder.equipmentInfo.ponto || '-'}</span>
                      </div>
                      <div>
                        <span className={`text-[9px] uppercase ${colors.textMuted} block mb-0.5`}>Mobiliário</span>
                        <span className={`text-xs font-medium ${colors.text}`}>{selectedFolder.equipmentInfo.paradaDescricao || '-'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty state for details when no folder selected */}
        {showDetails && !selectedFolder && (
          <div className={`w-96 flex flex-col border-l ${colors.border} ${colors.panel} items-center justify-center p-10 text-center`}>
            <div className={`w-12 h-12 rounded-2xl border-2 border-dashed ${colors.border} mb-4 flex items-center justify-center`}>
              <ShieldCheck className={`w-6 h-6 ${colors.textMuted}`} />
            </div>
            <p className={`text-xs ${colors.textMuted}`}>Selecione um item para ver detalhes.</p>
          </div>
        )}

      </div>

      {/* Lightbox */}
      <ImageLightbox
        images={selectedImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

    </div>
  );
};

export default MainView;

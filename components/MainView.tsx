import React, { useState, useMemo } from 'react';
import { Folder, Image as ImageIcon, CheckCircle2, AlertCircle, Clock, File, Trash2, Square, CheckSquare, ExternalLink, MapPin, Building2 } from 'lucide-react';
import { FolderItem, FileItem, ItemType, AnalysisStatus, EquipmentInfo } from '../types';
import ImageLightbox from './ImageLightbox';

interface MainViewProps {
  items: (FolderItem | FileItem)[];
  onNavigate: (item: FolderItem) => void;
  onDeleteFolder?: (folderPath: string) => void;
  onToggleFolderSelection?: (folderPath: string) => void;
  onManualStatusChange?: (folderPath: string, status: AnalysisStatus) => void;
  onToggleImageSelection?: (imagePath: string) => void;
  onUpdateObservation?: (folderPath: string, observation: string) => void;
  selectedFolders?: Set<string>;
  currentFolderStatus?: AnalysisStatus;
  currentFolderReason?: string;
  currentFolderObservation?: string;
  currentFolderPath?: string;
  currentFolderEquipmentInfo?: EquipmentInfo;
  currentFolderEnrichedAddress?: string;
}

const StatusBadge = ({ status }: { status: AnalysisStatus }) => {
  switch (status) {
    case AnalysisStatus.COMPLETED:
      return (
        <div className="inline-flex items-center text-green-600 text-[10px] sm:text-xs font-medium bg-green-50 px-1.5 sm:px-2 py-0.5 rounded-full border border-green-100">
          <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
          <span className="hidden sm:inline">Concluído</span>
          <span className="sm:hidden">OK</span>
        </div>
      );
    case AnalysisStatus.PENDING:
      return (
        <div className="inline-flex items-center text-amber-600 text-[10px] sm:text-xs font-medium bg-amber-50 px-1.5 sm:px-2 py-0.5 rounded-full border border-amber-100">
          <AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
          <span className="hidden sm:inline">Pendente</span>
          <span className="sm:hidden">!</span>
        </div>
      );
    case AnalysisStatus.PROCESSING:
      return (
        <div className="inline-flex items-center text-blue-600 text-[10px] sm:text-xs font-medium bg-blue-50 px-1.5 sm:px-2 py-0.5 rounded-full border border-blue-100">
          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 animate-spin" />
          <span className="hidden sm:inline">Analisando</span>
          <span className="sm:hidden">...</span>
        </div>
      );
    default:
      return (
        <div className="inline-flex items-center text-gray-400 text-[10px] sm:text-xs font-medium bg-gray-50 px-1.5 sm:px-2 py-0.5 rounded-full border border-gray-100">
          <span className="hidden sm:inline">Não analisado</span>
          <span className="sm:hidden">-</span>
        </div>
      );
  }
};

const MainView: React.FC<MainViewProps> = ({
  items,
  onNavigate,
  onDeleteFolder,
  onToggleFolderSelection,
  onManualStatusChange,
  onToggleImageSelection,
  selectedFolders,
  currentFolderStatus,
  currentFolderReason,
  currentFolderObservation,
  currentFolderPath,
  onUpdateObservation,
  currentFolderEquipmentInfo,
  currentFolderEnrichedAddress
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const sortedItems = [...items].sort((a, b) => {
    if (a.type === ItemType.FOLDER && b.type !== ItemType.FOLDER) return -1;
    if (a.type !== ItemType.FOLDER && b.type === ItemType.FOLDER) return 1;
    return a.name.localeCompare(b.name);
  });

  const imageItems = useMemo(() =>
    sortedItems.filter(item => item.type === ItemType.IMAGE && item.url) as FileItem[],
    [sortedItems]
  );

  const handleDelete = (e: React.MouseEvent, folderPath: string) => {
    e.stopPropagation();
    if (onDeleteFolder) {
      onDeleteFolder(folderPath);
    }
  };

  const handleManualStatus = (e: React.MouseEvent, folderPath: string, status: AnalysisStatus) => {
    e.stopPropagation();
    if (onManualStatusChange) {
      onManualStatusChange(folderPath, status);
    }
  };

  const handleImageSelectToggle = (e: React.MouseEvent, imagePath: string) => {
    e.stopPropagation();
    if (onToggleImageSelection) {
      onToggleImageSelection(imagePath);
    }
  };

  const handleToggleSelect = (e: React.MouseEvent, folderPath: string) => {
    e.stopPropagation();
    if (onToggleFolderSelection) {
      onToggleFolderSelection(folderPath);
    }
  };

  const handleImageClick = (item: FileItem) => {
    const index = imageItems.findIndex(img => img.path === item.path);
    if (index !== -1) {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  return (
    <div className="flex-1 bg-[#F8F9FA] overflow-y-auto p-3 sm:p-4 lg:p-6">

      {/* Equipment Info Banner - When inside a folder with equipment data */}
      {currentFolderEquipmentInfo && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start flex-1 min-w-0">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600 mr-3 flex-shrink-0">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-800 text-xs sm:text-sm">Informações do Equipamento</h3>
                {currentFolderEnrichedAddress && (
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-blue-700 mt-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{currentFolderEnrichedAddress}</span>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {currentFolderEquipmentInfo.modeloAbrigo && currentFolderEquipmentInfo.modeloAbrigo !== '-' && (
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                      Modelo: {currentFolderEquipmentInfo.modeloAbrigo}
                    </span>
                  )}
                  {currentFolderEquipmentInfo.nEletro && (
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                      N° Eletro: {currentFolderEquipmentInfo.nEletro}
                    </span>
                  )}
                  {currentFolderEquipmentInfo.nParada && (
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                      N° Parada: {currentFolderEquipmentInfo.nParada}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* Operations Button */}
            {currentFolderEquipmentInfo.linkOperacoes && (
              <button
                onClick={() => window.open(currentFolderEquipmentInfo.linkOperacoes, '_blank')}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#FF4D00] hover:bg-[#E64500] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-md transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Abrir no Operações</span>
                <span className="sm:hidden">Operações</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* AI Summary Banner */}
      {currentFolderReason && (
        <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl border flex items-start shadow-sm
          ${currentFolderStatus === AnalysisStatus.COMPLETED
            ? 'bg-green-50/50 border-green-200'
            : 'bg-white border-gray-200'}
        `}>
          <div className={`p-1.5 sm:p-2 rounded-lg mr-3 sm:mr-4 flex-shrink-0 ${currentFolderStatus === AnalysisStatus.COMPLETED ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
            {currentFolderStatus === AnalysisStatus.COMPLETED ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-800 text-xs sm:text-sm">Resumo da Análise</h3>
            <p className="text-gray-600 text-xs sm:text-sm mt-0.5 sm:mt-1 break-words">{currentFolderReason}</p>
          </div>
        </div>
      )}

      {/* Observation Field */}
      {currentFolderPath && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
          <h3 className="font-semibold text-gray-800 text-xs sm:text-sm mb-2">Observações</h3>
          <textarea
            className="w-full text-xs sm:text-sm p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            rows={3}
            placeholder="Adicione observações sobre esta análise..."
            value={currentFolderObservation || ''}
            onChange={(e) => onUpdateObservation?.(currentFolderPath, e.target.value)}
          />
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header - Hidden on small screens, shown as card layout instead */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-5">Nome</div>
          <div className="col-span-3">Status</div>
          <div className="col-span-2 text-right">Tipo</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>

        {/* Mobile Header */}
        <div className="sm:hidden px-4 py-2 bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Itens
        </div>

        {/* Content */}
        <div className="divide-y divide-gray-100">
          {sortedItems.length === 0 && (
            <div className="p-6 sm:p-8 text-center text-gray-400">
              <Folder className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm sm:text-base">Pasta vazia</p>
            </div>
          )}

          {sortedItems.map((item, idx) => {
            const isFolder = item.type === ItemType.FOLDER;
            const isImage = item.type === ItemType.IMAGE;
            const isSelected = !isFolder && (item as FileItem).selectedByAI;
            const folderItem = item as FolderItem;
            const isFolderSelected = isFolder && selectedFolders?.has(folderItem.path);

            return (
              <div
                key={item.path + idx}
                onClick={() => {
                  if (isFolder) {
                    onNavigate(item as FolderItem);
                  } else if (isImage && item.url) {
                    handleImageClick(item as FileItem);
                  }
                }}
                className={`
                  p-3 sm:p-4 lg:px-6 lg:py-3 transition-colors
                  ${isFolder ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100' : ''}
                  ${isSelected ? 'bg-green-50/60' : ''}
                  ${isFolderSelected ? 'bg-blue-50/60 border-l-4 border-l-blue-400' : ''}
                `}
              >
                {/* Mobile/Tablet Layout (Simplified for brevity, keeping existing structure but just updating Desktop mainly for now or both if I can) */}
                <div className="lg:hidden">
                  <div className="flex items-center gap-3">
                    {/* Icon/Thumbnail */}
                    <div className="flex-shrink-0">
                      {isFolder ? (
                        <Folder className="w-8 h-8 sm:w-10 sm:h-10 text-[#FF4D00] fill-orange-100" />
                      ) : item.type === ItemType.IMAGE ? (
                        <div className="relative">
                          {item.url ? (
                            <img src={item.url} className={`w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-lg border ${isSelected ? 'border-green-400 shadow-sm' : 'border-gray-200'}`} alt="" />
                          ) : (
                            <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                          )}
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-[2px] shadow-sm ring-2 ring-white">
                              <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <File className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                      )}
                    </div>

                    {/* Name & Meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm sm:text-base font-medium truncate ${isSelected ? 'text-green-800' : 'text-gray-700'}`}>
                          {item.name}
                        </span>
                        {isFolder && <StatusBadge status={(item as FolderItem).status} />}
                      </div>
                      {/* Equipment enriched address */}
                      {isFolder && folderItem.enrichedAddress && (
                        <div className="flex items-center gap-1 text-[10px] sm:text-xs text-blue-600 mb-1">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{folderItem.enrichedAddress}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-500">
                        <span>{isFolder ? 'Pasta' : 'Imagem'}</span>
                        {isFolder && folderItem.equipmentInfo?.modeloAbrigo && folderItem.equipmentInfo.modeloAbrigo !== '-' && (
                          <span className="text-purple-600">• {folderItem.equipmentInfo.modeloAbrigo}</span>
                        )}
                        {isSelected && <span className="text-green-600 font-semibold">• Selecionado</span>}
                      </div>
                    </div>

                    {/* Mobile Actions */}
                    <div className="flex items-center gap-1">
                      {/* Link Operações button */}
                      {isFolder && folderItem.equipmentInfo?.linkOperacoes && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(folderItem.equipmentInfo!.linkOperacoes, '_blank');
                          }}
                          className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Abrir no Operações"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                      {isFolder && onManualStatusChange && (
                        <>
                          <button
                            onClick={(e) => handleManualStatus(e, (item as FolderItem).path, AnalysisStatus.COMPLETED)}
                            className="p-2 text-green-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleManualStatus(e, (item as FolderItem).path, AnalysisStatus.PENDING)}
                            className="p-2 text-amber-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {isImage && onToggleImageSelection && (
                        <button
                          onClick={(e) => handleImageSelectToggle(e, (item as FileItem).path)}
                          className={`p-2 rounded-lg transition-colors ${isSelected ? 'text-green-500 bg-green-50' : 'text-gray-300 hover:text-gray-500'}`}
                        >
                          {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                        </button>
                      )}

                      {isFolder && onDeleteFolder && (
                        <button
                          onClick={(e) => handleDelete(e, (item as FolderItem).path)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                          title="Excluir pasta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden lg:grid grid-cols-12 gap-4 items-center text-sm">
                  {/* Name */}
                  <div className="col-span-5 flex items-center min-w-0">
                    <div className="mr-3 flex-shrink-0">
                      {isFolder ? (
                        <Folder className="w-5 h-5 text-[#FF4D00] fill-orange-100" />
                      ) : item.type === ItemType.IMAGE ? (
                        <div className="relative group-hover:scale-105 transition-transform">
                          {item.url ? (
                            <img src={item.url} className={`w-10 h-10 object-cover rounded-lg border ${isSelected ? 'border-green-400 shadow-sm' : 'border-gray-200'}`} alt="" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                          )}
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-[2px] shadow-sm ring-2 ring-white">
                              <CheckCircle2 className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <File className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className={`truncate font-medium ${isSelected ? 'text-green-800' : 'text-gray-700'}`}>
                        {item.name}
                      </span>
                      {/* Equipment enriched address - Desktop */}
                      {isFolder && folderItem.enrichedAddress && (
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{folderItem.enrichedAddress}</span>
                        </div>
                      )}
                      {isFolder && folderItem.equipmentInfo?.modeloAbrigo && folderItem.equipmentInfo.modeloAbrigo !== '-' && (
                        <span className="text-[10px] text-purple-600 font-medium">Modelo: {folderItem.equipmentInfo.modeloAbrigo}</span>
                      )}
                      {isSelected && <span className="text-[10px] text-green-600 font-semibold uppercase tracking-wide">Selecionado para Relatório</span>}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="col-span-3">
                    {isFolder && <StatusBadge status={(item as FolderItem).status} />}
                  </div>

                  {/* Type/Meta */}
                  <div className="col-span-2 text-right text-gray-400 text-xs">
                    {isFolder ? 'Pasta' : 'Imagem'}
                  </div>

                  {/* Actions */}
                  <div className="col-span-2 text-right flex items-center justify-end gap-1">

                    {/* Link Operações button - Desktop */}
                    {isFolder && folderItem.equipmentInfo?.linkOperacoes && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(folderItem.equipmentInfo!.linkOperacoes, '_blank');
                        }}
                        className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Abrir no Operações"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}

                    {/* Manual Override Controls */}
                    {isFolder && onManualStatusChange && (
                      <>
                        <button
                          onClick={(e) => handleManualStatus(e, (item as FolderItem).path, AnalysisStatus.COMPLETED)}
                          className="p-1.5 text-green-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Marcar como Concluído"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleManualStatus(e, (item as FolderItem).path, AnalysisStatus.PENDING)}
                          className="p-1.5 text-amber-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Marcar como Pendente"
                        >
                          <AlertCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {isImage && onToggleImageSelection && (
                      <button
                        onClick={(e) => handleImageSelectToggle(e, (item as FileItem).path)}
                        title={isSelected ? "Remover seleção" : "Selecionar imagem"}
                        className={`p-1.5 rounded-lg transition-colors ${isSelected ? 'text-green-500 bg-green-50 hover:bg-green-100' : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50'}`}
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                    )}

                    {isFolder && onDeleteFolder && (
                      <button
                        onClick={(e) => handleDelete(e, (item as FolderItem).path)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir pasta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        images={imageItems}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
};

export default MainView;
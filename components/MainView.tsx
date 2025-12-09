import React, { useState, useMemo } from 'react';
import { Folder, Image as ImageIcon, CheckCircle2, AlertCircle, Clock, File, Trash2, Square, CheckSquare } from 'lucide-react';
import { FolderItem, FileItem, ItemType, AnalysisStatus } from '../types';
import ImageLightbox from './ImageLightbox';

interface MainViewProps {
  items: (FolderItem | FileItem)[];
  onNavigate: (item: FolderItem) => void;
  onDeleteFolder?: (folderPath: string) => void;
  onToggleFolderSelection?: (folderPath: string) => void;
  selectedFolders?: Set<string>;
  currentFolderStatus?: AnalysisStatus;
  currentFolderReason?: string;
}

const StatusBadge = ({ status }: { status: AnalysisStatus }) => {
  switch (status) {
    case AnalysisStatus.COMPLETED:
      return <div className="flex items-center text-green-600 text-xs font-medium bg-green-50 px-2 py-0.5 rounded-full border border-green-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Concluído</div>;
    case AnalysisStatus.PENDING:
      return <div className="flex items-center text-amber-600 text-xs font-medium bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100"><AlertCircle className="w-3 h-3 mr-1" /> Pendente</div>;
    case AnalysisStatus.PROCESSING:
      return <div className="flex items-center text-blue-600 text-xs font-medium bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100"><Clock className="w-3 h-3 mr-1 animate-spin" /> Analisando</div>;
    default:
      return <div className="flex items-center text-gray-400 text-xs font-medium bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">Não analisado</div>;
  }
};

const MainView: React.FC<MainViewProps> = ({
  items,
  onNavigate,
  onDeleteFolder,
  onToggleFolderSelection,
  selectedFolders,
  currentFolderStatus,
  currentFolderReason
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
    <div className="flex-1 bg-[#F8F9FA] overflow-y-auto p-4 sm:p-6">

      {/* AI Summary Banner */}
      {currentFolderReason && (
        <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl border flex items-start shadow-sm
          ${currentFolderStatus === AnalysisStatus.COMPLETED
            ? 'bg-green-50/50 border-green-200'
            : 'bg-white border-gray-200'}
        `}>
          <div className={`p-2 rounded-lg mr-3 sm:mr-4 ${currentFolderStatus === AnalysisStatus.COMPLETED ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
            {currentFolderStatus === AnalysisStatus.COMPLETED ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-800 text-sm">Resumo da Análise</h3>
            <p className="text-gray-600 text-xs sm:text-sm mt-1 break-words">{currentFolderReason}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header - responsive */}
        <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-1">Sel.</div>
          <div className="col-span-4">Nome</div>
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
            <div className="p-8 text-center text-gray-400">
              <Folder className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>Pasta vazia</p>
            </div>
          )}

          {sortedItems.map((item, idx) => {
            const isFolder = item.type === ItemType.FOLDER;
            const isImage = item.type === ItemType.IMAGE;
            const isSelected = !isFolder && (item as FileItem).selectedByAI;
            const folderItem = item as FolderItem;
            const isFolderSelected = isFolder && selectedFolders?.has(folderItem.path);
            const isCompleted = isFolder && folderItem.status === AnalysisStatus.COMPLETED;

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
                  flex sm:grid sm:grid-cols-12 gap-2 sm:gap-4 items-center px-4 sm:px-6 py-3 text-sm transition-colors
                  ${isFolder || isImage ? 'cursor-pointer hover:bg-gray-50' : ''}
                  ${isSelected ? 'bg-green-50/60' : ''}
                  ${isFolderSelected ? 'bg-blue-50/60 border-l-4 border-l-blue-400' : ''}
                `}
              >
                {/* Selection Checkbox - Desktop */}
                <div className="hidden sm:block col-span-1">
                  {isFolder && !isCompleted && onToggleFolderSelection && (
                    <button
                      onClick={(e) => handleToggleSelect(e, folderItem.path)}
                      className={`p-1 rounded transition-colors ${isFolderSelected
                        ? 'text-blue-600 hover:text-blue-800'
                        : 'text-gray-400 hover:text-gray-600'
                        }`}
                      title={isFolderSelected ? 'Desmarcar' : 'Selecionar para análise'}
                    >
                      {isFolderSelected ? (
                        <CheckSquare className="w-5 h-5" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  )}
                  {isFolder && isCompleted && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                </div>

                {/* Mobile: Checkbox */}
                <div className="sm:hidden flex-shrink-0">
                  {isFolder && !isCompleted && onToggleFolderSelection && (
                    <button
                      onClick={(e) => handleToggleSelect(e, folderItem.path)}
                      className={`p-1 rounded ${isFolderSelected ? 'text-blue-600' : 'text-gray-400'}`}
                    >
                      {isFolderSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </button>
                  )}
                  {isFolder && isCompleted && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                </div>

                {/* Name */}
                <div className="flex-1 sm:col-span-4 flex items-center min-w-0">
                  <div className="mr-2 sm:mr-3 flex-shrink-0">
                    {isFolder ? (
                      <Folder className={`w-5 h-5 ${isFolderSelected ? 'text-blue-500 fill-blue-100' : 'text-[#FF4D00] fill-orange-100'}`} />
                    ) : item.type === ItemType.IMAGE ? (
                      <div className="relative group">
                        {item.url ? (
                          <img
                            src={item.url}
                            className={`w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-lg border transition-transform group-hover:scale-105 ${isSelected ? 'border-green-400 shadow-sm' : 'border-gray-200'}`}
                          />
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
                    <span className={`truncate font-medium text-xs sm:text-sm ${isSelected ? 'text-green-800' : isFolderSelected ? 'text-blue-800' : 'text-gray-700'}`}>
                      {item.name}
                    </span>
                    {isSelected && <span className="text-[10px] text-green-600 font-semibold uppercase tracking-wide hidden sm:block">Selecionado</span>}
                    {isFolderSelected && <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wide hidden sm:block">Para Análise</span>}
                  </div>
                </div>

                {/* Status - Desktop */}
                <div className="hidden sm:block col-span-3">
                  {isFolder && <StatusBadge status={folderItem.status} />}
                </div>

                {/* Mobile Status */}
                <div className="sm:hidden flex-shrink-0">
                  {isFolder && <StatusBadge status={folderItem.status} />}
                </div>

                {/* Type/Meta - Desktop Only */}
                <div className="hidden sm:block col-span-2 text-right text-gray-400 text-xs">
                  {isFolder ? 'Pasta' : 'Imagem'}
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 sm:col-span-2 sm:text-right">
                  {isFolder && onDeleteFolder && (
                    <button
                      onClick={(e) => handleDelete(e, folderItem.path)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir pasta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
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
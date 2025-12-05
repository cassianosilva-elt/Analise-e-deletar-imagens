import React from 'react';
import { Folder, Image as ImageIcon, CheckCircle2, AlertCircle, Clock, File, Trash2 } from 'lucide-react';
import { FolderItem, FileItem, ItemType, AnalysisStatus } from '../types';

interface MainViewProps {
  items: (FolderItem | FileItem)[];
  onNavigate: (item: FolderItem) => void;
  onDeleteFolder?: (folderPath: string) => void;
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

const MainView: React.FC<MainViewProps> = ({ items, onNavigate, onDeleteFolder, currentFolderStatus, currentFolderReason }) => {

  const sortedItems = [...items].sort((a, b) => {
    if (a.type === ItemType.FOLDER && b.type !== ItemType.FOLDER) return -1;
    if (a.type !== ItemType.FOLDER && b.type === ItemType.FOLDER) return 1;
    return a.name.localeCompare(b.name);
  });

  const handleDelete = (e: React.MouseEvent, folderPath: string) => {
    e.stopPropagation(); // Prevent navigation
    if (onDeleteFolder) {
      onDeleteFolder(folderPath);
    }
  };

  return (
    <div className="flex-1 bg-[#F8F9FA] overflow-y-auto p-6">

      {/* AI Summary Banner */}
      {currentFolderReason && (
        <div className={`mb-6 p-4 rounded-xl border flex items-start shadow-sm
          ${currentFolderStatus === AnalysisStatus.COMPLETED
            ? 'bg-green-50/50 border-green-200'
            : 'bg-white border-gray-200'}
        `}>
          <div className={`p-2 rounded-lg mr-4 ${currentFolderStatus === AnalysisStatus.COMPLETED ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
            {currentFolderStatus === AnalysisStatus.COMPLETED ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">Resumo da Análise</h3>
            <p className="text-gray-600 text-sm mt-1">{currentFolderReason}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <div className="col-span-5">Nome</div>
          <div className="col-span-3">Status</div>
          <div className="col-span-2 text-right">Tipo</div>
          <div className="col-span-2 text-right">Ações</div>
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
            const isSelected = item.selectedByAI;

            return (
              <div
                key={item.path + idx}
                onClick={() => isFolder ? onNavigate(item as FolderItem) : null}
                className={`
                  grid grid-cols-12 gap-4 items-center px-6 py-3 text-sm transition-colors
                  ${isFolder ? 'cursor-pointer hover:bg-gray-50' : ''}
                  ${isSelected ? 'bg-green-50/60' : ''}
                `}
              >
                {/* Name */}
                <div className="col-span-5 flex items-center min-w-0">
                  <div className="mr-3 flex-shrink-0">
                    {isFolder ? (
                      <Folder className="w-5 h-5 text-[#FF4D00] fill-orange-100" />
                    ) : item.type === ItemType.IMAGE ? (
                      <div className="relative group-hover:scale-105 transition-transform">
                        {item.url ? (
                          <img src={item.url} className={`w-10 h-10 object-cover rounded-lg border ${isSelected ? 'border-green-400 shadow-sm' : 'border-gray-200'}`} />
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
                <div className="col-span-2 text-right">
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
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MainView;
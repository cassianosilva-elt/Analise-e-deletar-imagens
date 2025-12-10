import React from 'react';
import { HelpCircle, Keyboard, MessageCircle, Book, ExternalLink, Zap, FolderUp, Wand2, FileSpreadsheet } from 'lucide-react';

const ShortcutItem = ({ keys, description }: { keys: string[]; description: string }) => (
    <div className="flex items-center justify-between py-2">
        <span className="text-sm text-gray-600">{description}</span>
        <div className="flex items-center gap-1">
            {keys.map((key, idx) => (
                <React.Fragment key={idx}>
                    <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono text-gray-700 shadow-sm">
                        {key}
                    </kbd>
                    {idx < keys.length - 1 && <span className="text-gray-400 text-xs mx-0.5">+</span>}
                </React.Fragment>
            ))}
        </div>
    </div>
);

const StepItem = ({ icon: Icon, step, title, description }: { icon: React.ElementType; step: number; title: string; description: string }) => (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50">
        <div className="flex-shrink-0 w-10 h-10 bg-[#FF4D00] rounded-xl flex items-center justify-center text-white font-bold">
            {step}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-[#FF4D00]" />
                <h4 className="font-medium text-gray-900">{title}</h4>
            </div>
            <p className="text-sm text-gray-500">{description}</p>
        </div>
    </div>
);

const AjudaPage: React.FC = () => {
    return (
        <div className="flex-1 bg-[#F8F9FA] overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Ajuda</h1>
                    <p className="text-gray-500 text-sm sm:text-base">Guias e informações sobre o sistema</p>
                </div>

                {/* Quick Start Guide */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-[#FF4D00]" />
                        <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Início Rápido</h2>
                    </div>

                    <div className="p-4 sm:p-6 space-y-3">
                        <StepItem
                            icon={FolderUp}
                            step={1}
                            title="Importe uma pasta"
                            description="Clique em 'Importar' ou arraste uma pasta contendo as subpastas dos abrigos para análise."
                        />
                        <StepItem
                            icon={Wand2}
                            step={2}
                            title="Execute a análise"
                            description="Selecione as pastas desejadas e clique em 'Analisar' para a IA identificar abrigos concluídos."
                        />
                        <StepItem
                            icon={FileSpreadsheet}
                            step={3}
                            title="Exporte o relatório"
                            description="Baixe o relatório em Excel ou exporte as fotos selecionadas em formato ZIP."
                        />
                    </div>
                </div>

                {/* Keyboard Shortcuts */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                        <Keyboard className="w-4 h-4 text-gray-600" />
                        <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Atalhos de Teclado</h2>
                    </div>

                    <div className="p-4 sm:p-6 divide-y divide-gray-100">
                        <ShortcutItem keys={['Esc']} description="Fechar modal / voltar" />
                        <ShortcutItem keys={['←', '→']} description="Navegar entre imagens" />
                        <ShortcutItem keys={['+']} description="Zoom in na imagem" />
                        <ShortcutItem keys={['-']} description="Zoom out na imagem" />
                        <ShortcutItem keys={['0']} description="Resetar zoom" />
                    </div>
                </div>

                {/* FAQ */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-gray-600" />
                        <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Perguntas Frequentes</h2>
                    </div>

                    <div className="divide-y divide-gray-100">
                        <details className="group">
                            <summary className="px-4 sm:px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors list-none flex items-center justify-between">
                                <span className="font-medium text-gray-900 text-sm">Quais formatos de imagem são suportados?</span>
                                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-4 sm:px-6 pb-4 text-sm text-gray-600">
                                O sistema suporta imagens JPG, JPEG, PNG, WEBP e GIF.
                            </div>
                        </details>

                        <details className="group">
                            <summary className="px-4 sm:px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors list-none flex items-center justify-between">
                                <span className="font-medium text-gray-900 text-sm">Como a IA identifica abrigos concluídos?</span>
                                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-4 sm:px-6 pb-4 text-sm text-gray-600">
                                A IA analisa as imagens procurando por estruturas de abrigo completas, presença de totens instalados
                                e elementos visuais que indicam a finalização da instalação.
                            </div>
                        </details>

                        <details className="group">
                            <summary className="px-4 sm:px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors list-none flex items-center justify-between">
                                <span className="font-medium text-gray-900 text-sm">Posso corrigir uma análise incorreta?</span>
                                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="px-4 sm:px-6 pb-4 text-sm text-gray-600">
                                Sim! Você pode alterar manualmente o status de qualquer pasta usando os botões verde (concluído)
                                e laranja (pendente) na listagem de pastas.
                            </div>
                        </details>
                    </div>
                </div>

                {/* Support Contact */}
                <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] rounded-xl p-5 sm:p-6 text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-[#FF4D00] rounded-lg">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-lg">Precisa de mais ajuda?</h3>
                    </div>
                    <p className="text-white/70 text-sm mb-4">
                        Entre em contato com o suporte técnico para dúvidas ou problemas.
                    </p>
                    <a
                        href="mailto:suporte@eletromidia.com.br"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                    >
                        <ExternalLink className="w-4 h-4" />
                        suporte@eletromidia.com.br
                    </a>
                </div>
            </div>
        </div>
    );
};

export default AjudaPage;

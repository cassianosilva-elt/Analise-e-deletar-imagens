import React from 'react';
import { HelpCircle, Mail, Book, MessageCircle } from 'lucide-react';

const AjudaPage = () => {
    return (
        <div className="flex flex-col h-full bg-[#F8F9FA] p-6 overflow-y-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Central de Ajuda</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">

                {/* Contact Support */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <Mail className="w-5 h-5 mr-2 text-[#FF4D00]" />
                        Suporte Técnico
                    </h2>
                    <p className="text-gray-600 text-sm mb-4">
                        Encontrou um erro ou tem uma dúvida técnica? Entre em contato com nossa equipe de suporte.
                    </p>
                    <a href="mailto:suporte@eletromidia.com.br" className="text-[#FF4D00] font-medium hover:underline">
                        suporte@eletromidia.com.br
                    </a>
                </div>

                {/* Documentation */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                        <Book className="w-5 h-5 mr-2 text-blue-500" />
                        Documentação
                    </h2>
                    <p className="text-gray-600 text-sm mb-4">
                        Acesse manuais, guias de usuário e tutoriais sobre como utilizar a ferramenta de Fiscalização AI.
                    </p>
                    <button className="text-blue-600 font-medium hover:underline text-left">
                        Acessar Base de Conhecimento &rarr;
                    </button>
                </div>
            </div>

            <div className="mt-8 max-w-3xl">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Perguntas Frequentes</h2>

                <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                            <HelpCircle className="w-4 h-4 mr-2 text-gray-400" />
                            Como importo minhas pastas?
                        </h3>
                        <p className="text-sm text-gray-600">
                            Vá até a tela "Dashboard" e clique em "Abrir Pasta" no canto superior direito. Selecione a pasta raiz que contém as subpastas das paradas.
                        </p>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                            <HelpCircle className="w-4 h-4 mr-2 text-gray-400" />
                            O que significam os status?
                        </h3>
                        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 ml-1">
                            <li><span className="text-green-600 font-medium">Concluído</span>: A análise detectou problemas e aprovou ou tudo está certo.</li>
                            <li><span className="text-yellow-600 font-medium">Pendente</span>: A IA encontrou algo dúbio ou a pasta ainda não foi processada com sucesso total.</li>
                            <li><span className="text-red-600 font-medium">Erro</span>: Falha técnica ao processar as imagens.</li>
                        </ul>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                            <HelpCircle className="w-4 h-4 mr-2 text-gray-400" />
                            Como exportar o relatório?
                        </h3>
                        <p className="text-sm text-gray-600">
                            No Dashboard, clique no botão "Exportar Excel". Isso gerará uma planilha com todos os status e observações das pastas carregadas.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AjudaPage;

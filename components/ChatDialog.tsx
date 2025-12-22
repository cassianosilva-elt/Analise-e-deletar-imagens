import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Trash2, Minimize2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendChatMessage } from '../services/geminiService';

interface ChatDialogProps {
    context?: string;
    darkMode?: boolean;
}

const ChatDialog: React.FC<ChatDialogProps> = ({ context, darkMode = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen && !isMinimized) {
            setTimeout(scrollToBottom, 100);
        }
    }, [messages, isOpen, isMinimized]);

    const handleSend = async () => {
        if (!inputText.trim() || isLoading) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: inputText,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const responseText = await sendChatMessage(userMsg.text, history, context);

            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: responseText,
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            const errorMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: "Desculpe, ocorreu um erro. Verifique sua conexão.",
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([]);
    };

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
    };

    // Color schemes
    const colors = {
        bg: darkMode ? 'bg-gray-900' : 'bg-white',
        border: darkMode ? 'border-gray-800' : 'border-gray-200',
        text: darkMode ? 'text-gray-100' : 'text-gray-800',
        textMuted: darkMode ? 'text-gray-500' : 'text-gray-400',
        input: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            <div
                className={`
                    ${colors.bg} ${colors.border}
                    rounded-2xl shadow-2xl border overflow-hidden 
                    transition-all duration-300 ease-out origin-bottom-right
                    ${isOpen
                        ? `opacity-100 scale-100 translate-y-0 pointer-events-auto ${isMinimized ? 'w-72 h-14' : 'w-80 sm:w-96 h-[480px]'}`
                        : 'opacity-0 scale-95 translate-y-4 pointer-events-none w-0 h-0'}
                    ${!isMinimized ? 'flex flex-col' : ''}
                    mb-4
                `}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 flex items-center justify-between text-white shrink-0 shadow-md">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                            <Bot className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">Assistente IA</h3>
                            {!isMinimized && <p className="text-[10px] opacity-80">Tire dúvidas sobre a análise</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {!isMinimized && messages.length > 0 && (
                            <button
                                onClick={clearChat}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
                                title="Limpar conversa"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                        <button
                            onClick={toggleMinimize}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
                            title={isMinimized ? "Expandir" : "Minimizar"}
                        >
                            <Minimize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => { setIsOpen(false); setIsMinimized(false); }}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
                            title="Fechar"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Content (hidden when minimized) */}
                {!isMinimized && (
                    <>
                        {/* Messages Area */}
                        <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${darkMode ? 'bg-gray-950' : 'bg-gray-50/50'}`}>
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                                    <div className={`p-4 rounded-2xl mb-4 ${darkMode ? 'bg-gray-800' : 'bg-orange-50'}`}>
                                        <MessageCircle className="w-8 h-8 text-orange-500" />
                                    </div>
                                    <p className={`text-sm font-medium mb-1 ${colors.text}`}>Como posso ajudar?</p>
                                    <p className={`text-xs ${colors.textMuted}`}>Pergunte sobre a análise ou problemas.</p>
                                </div>
                            ) : (
                                messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`
                                                max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm
                                                ${msg.role === 'user'
                                                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-br-md'
                                                    : `${colors.bg} border ${colors.border} ${colors.text} rounded-bl-md`}
                                            `}
                                        >
                                            {msg.text}
                                        </div>
                                    </div>
                                ))
                            )}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className={`rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border ${colors.bg} ${colors.border}`}>
                                        <div className="flex gap-1.5">
                                            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className={`p-3 border-t shrink-0 ${colors.bg} ${colors.border}`}>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Digite sua mensagem..."
                                    disabled={isLoading}
                                    className={`flex-1 text-sm rounded-xl px-4 py-2.5 outline-none disabled:opacity-50 transition-all border ${colors.input} ${colors.text} focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 placeholder:${colors.textMuted}`}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!inputText.trim() || isLoading}
                                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl p-2.5 transition-all shadow-lg shadow-orange-500/20 transform active:scale-95"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => { setIsOpen(!isOpen); setIsMinimized(false); }}
                className={`
                    p-3.5 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center
                    ${isOpen
                        ? 'bg-gray-700 text-white rotate-0'
                        : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-xl shadow-orange-500/30'}
                `}
            >
                {isOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
            </button>
        </div>
    );
};

export default ChatDialog;

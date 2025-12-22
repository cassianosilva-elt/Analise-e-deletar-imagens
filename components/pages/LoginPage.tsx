import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, UserPlus, LogIn, ArrowRight, Github, Chrome, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { TranslationKey } from '../../translations';

interface LoginPageProps {
    darkMode: boolean;
    t: (key: TranslationKey) => string;
}

const LoginPage: React.FC<LoginPageProps> = ({ darkMode, t }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setError("Verifique seu e-mail para confirmar o cadastro.");
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            }
        } catch (err: any) {
            setError(err.message || "Ocorreu um erro na autenticação.");
        } finally {
            setLoading(false);
        }
    };

    const bgClass = darkMode ? 'bg-gray-900 text-white' : 'bg-[#FAFAFA] text-gray-900';
    const cardClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
    const inputClass = darkMode
        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500'
        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-orange-500';

    return (
        <div className={`min-h-screen w-full flex items-center justify-center p-4 font-['Rethink_Sans'] ${bgClass}`}>
            {/* Background Decorations */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className={`absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/4 ${darkMode ? 'from-orange-900/10 to-transparent' : 'from-orange-100/40 to-transparent'}`} />
                <div className={`absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr rounded-full blur-2xl transform -translate-x-1/4 translate-y-1/4 ${darkMode ? 'from-gray-800/40 to-transparent' : 'from-gray-100/40 to-transparent'}`} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative z-10 w-full max-w-md p-8 rounded-3xl border shadow-xl ${cardClass}`}
            >
                <div className="text-center mb-8">
                    <motion.img
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        src="./assets/ELETRO-DESKTOP.png"
                        alt="Eletromidia"
                        className="h-10 mx-auto mb-6"
                    />
                    <h1 className="text-2xl font-bold mb-2">
                        {isSignUp ? "Criar Conta" : "Bem-vindo de volta"}
                    </h1>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {isSignUp
                            ? "Cadastre-se para começar a usar o ShelterAI"
                            : "Acesse sua conta para gerenciar suas análises"}
                    </p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm ${error.includes('Verifique') ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border border-red-500/20 text-red-500'}`}
                    >
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </motion.div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 ml-1 opacity-70">E-mail</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all outline-none text-sm ${inputClass}`}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 ml-1 opacity-70">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-all outline-none text-sm ${inputClass}`}
                            />
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg bg-gradient-to-r from-[#FF4D00] to-[#FF6B00] shadow-orange-500/20 flex items-center justify-center gap-2 mt-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>{isSignUp ? "Cadastrar" : "Entrar"}</span>
                                {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                            </>
                        )}
                    </motion.button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {isSignUp ? "Já tem uma conta?" : "Não tem uma conta?"}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="ml-1.5 font-bold text-[#FF4D00] hover:underline"
                        >
                            {isSignUp ? "Fazer Login" : "Criar Agora"}
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;

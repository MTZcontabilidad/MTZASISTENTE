import React, { useEffect, useRef, useState } from 'react';
import './Mobile.css';
import { useChat } from '../../hooks/useChat';
import { supabase } from '../../lib/supabase';
import { markdownToHtml, hasMarkdown } from '../../lib/markdown';
import { useSpeechToText } from '../../lib/speechToText';

const MobileChat: React.FC = () => {
    const {
        messages,
        input,
        setInput,
        handleSend,
        loading,
        loadingHistory,
        handleClearChat
    } = useChat();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [autoSendTriggered, setAutoSendTriggered] = useState(false);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !loading) {
            handleSend();
        }
    };

    // Speech to Text Integration
    const {
        start: startListening,
        stop: stopListening,
        isListening,
        transcript,
        isSupported
    } = useSpeechToText({
        onSpeechEnd: (finalTranscript) => {
            if (finalTranscript && finalTranscript.trim().length > 0 && !autoSendTriggered) {
                setAutoSendTriggered(true);
                handleSend(); // Auto-send when speech ends
                setTimeout(() => setAutoSendTriggered(false), 1000);
            }
        }
    });

    // Sync transcript to input
    useEffect(() => {
        if (isListening && transcript) {
            setInput(transcript);
        }
    }, [transcript, isListening, setInput]);

    const toggleListening = () => {
        if (!isSupported) {
            alert("Tu navegador no soporta reconocimiento de voz.");
            return;
        }
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    const confirmClearChat = async () => {
        if (window.confirm("¿Seguro que deseas borrar toda la conversación?")) {
            await handleClearChat();
        }
    };

    const [userAvatar, setUserAvatar] = useState<string | null>(null);

    useEffect(() => {
        const fetchAvatar = async () => {
             const { data: { user } } = await supabase.auth.getUser();
             if (user) {
                 const { data } = await supabase.from('user_profiles').select('avatar_url').eq('id', user.id).single();
                 if (data?.avatar_url) setUserAvatar(data.avatar_url);
             }
        };
        fetchAvatar();
    }, []);

    return (
        <div className="mobile-view-container relative h-full flex flex-col bg-slate-900">
            <div className="glass-header">
                <div>
                     <h1 className="text-lg font-bold text-gradient">MTZ Ouroborus AI</h1>
                     <p className="text-xs text-gray-400">Asistente Virtual</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-cyan-900/20 flex items-center justify-center border border-cyan-500/30 animate-pulse-glow">
                     <span className="material-icons-round text-cyan-400">smart_toy</span>
                </div>
            </div>

            <div className="mobile-content chat-view flex-1 bg-gradient-to-b from-slate-900 to-slate-950">
                {loadingHistory ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="loader"></div>
                    </div>
                ) : (
                    <div className="chat-messages px-4 py-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 opacity-60">
                                <span className="material-icons-round text-6xl mb-4 animate-float">smart_toy</span>
                                <p>¿En qué puedo ayudarte hoy?</p>
                            </div>
                        )}
                        {messages.map((msg) => (
                            <div key={msg.id} className={`chat-message-row flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                                {msg.sender === 'assistant' && (
                                    <div className="flex-shrink-0 mr-3 mt-1">
                                        <div className="w-8 h-8 rounded-full bg-cyan-900/30 border border-cyan-500/30 flex items-center justify-center">
                                            <span className="material-icons-round text-xs text-cyan-400">smart_toy</span>
                                        </div>
                                    </div>
                                )}
                                
                                <div className={`max-w-[85%] ${msg.sender === 'user' ? 'order-1' : 'order-2'}`}>
                                    <div className={`p-4 rounded-2xl shadow-lg relative ${
                                        msg.sender === 'user' 
                                            ? 'bg-blue-600/90 text-white rounded-tr-none' 
                                            : 'bg-slate-800/90 text-gray-100 border border-slate-700/50 rounded-tl-none'
                                    }`}>
                                        <div className="message-text text-sm leading-relaxed">
                                            {hasMarkdown(msg.text) ? (
                                                <div dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.text) }} />
                                            ) : (
                                                <p className="whitespace-pre-wrap">{msg.text}</p>
                                            )}
                                        </div>

                                        {/* Display Menu Options */}
                                        {msg.menu && msg.menu.options && (
                                            <div className="flex flex-col gap-2 mt-4 pt-2 border-t border-white/5">
                                                {msg.menu.options.map((option: any, idx: number) => (
                                                    <button 
                                                        key={idx} 
                                                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 hover:bg-slate-700/50 border border-white/5 hover:border-cyan-500/30 transition-all text-left group active:scale-[0.98]"
                                                        onClick={() => handleSend(option.label || option.text)}
                                                    >
                                                        <span className="text-lg group-hover:scale-110 transition-transform">{option.icon || '🔹'}</span>
                                                        <span className="text-sm font-medium text-cyan-100">{option.label || option.text}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        
                                        <div className={`text-[10px] mt-2 opacity-60 flex items-center gap-1 ${msg.sender === 'user' ? 'justify-end text-blue-100' : 'justify-start text-gray-400'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {msg.sender === 'user' && <span className="material-icons-round text-[10px]">done_all</span>}
                                        </div>
                                    </div>
                                </div>

                                {msg.sender === 'user' && (
                                    <div className="flex-shrink-0 ml-3 mt-1 order-2">
                                         <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shadow-md">
                                             {userAvatar ? (
                                                 <img src={userAvatar} alt="User" className="w-full h-full object-cover" />
                                             ) : (
                                                 <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                                                     <span className="material-icons-round text-xs text-gray-400">person</span>
                                                 </div>
                                             )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {loading && (
                            <div className="chat-message-row flex justify-start animate-fade-in">
                                <div className="flex-shrink-0 mr-3 mt-1">
                                    <div className="w-8 h-8 rounded-full bg-cyan-900/30 border border-cyan-500/30 flex items-center justify-center">
                                         <span className="material-icons-round text-xs text-cyan-400 animate-spin">sync</span>
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl rounded-tl-none bg-slate-800/80 border border-slate-700/50">
                                    <div className="typing-indicator flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0s' }}></div>
                                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="relative z-20 bg-slate-900/95 backdrop-blur-md border-t border-white/5 pb-6 pt-2">
                {/* Quick Replies */}
                 {messages.length > 0 && !loading && (
                    <div className="flex gap-2 overflow-x-auto py-3 px-4 no-scrollbar mb-1">
                        {['Cotizar', 'Ayuda', 'Agendar', 'Soporte', 'Mis Datos'].map((reply) => (
                            <button
                                key={reply}
                                onClick={() => handleSend(reply)}
                                className="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-gray-300 hover:bg-cyan-900/30 hover:text-cyan-400 hover:border-cyan-500/30 transition-all shadow-sm active:scale-95"
                            >
                                {reply}
                            </button>
                        ))}
                    </div>
                 )}

                <div className="px-4 flex gap-3 items-end">
                    <button 
                        className="p-3 rounded-full text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        onClick={confirmClearChat}
                        title="Limpiar chat"
                    >
                        <span className="material-icons-round">delete_outline</span>
                    </button>
                    
                    <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center p-1 focus-within:border-cyan-500/50 focus-within:bg-slate-800 transition-all shadow-inner">
                        <input 
                            className="flex-1 bg-transparent text-white px-4 py-2 outline-none text-sm placeholder-gray-500" 
                            placeholder={isListening ? "Escuchando..." : "Escribe un mensaje..."}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading || loadingHistory}
                        />
                        <button 
                            className={`p-2 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-white'}`}
                            onClick={toggleListening}
                        >
                            <span className="material-icons-round">{isListening ? 'mic_off' : 'mic'}</span>
                        </button>
                    </div>
                    
                    <button 
                        className={`p-3 rounded-full shadow-lg transition-all ${
                            input.trim() 
                            ? 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-105 active:scale-95 shadow-blue-500/20' 
                            : 'bg-slate-800 text-gray-500 cursor-not-allowed'
                        }`}
                        onClick={() => handleSend()}
                        disabled={loading || !input.trim()}
                    >
                        <span className="material-icons-round transform -rotate-45 translate-x-0.5 -translate-y-0.5">send</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobileChat;

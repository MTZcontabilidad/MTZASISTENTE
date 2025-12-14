import React, { useEffect, useRef, useState } from 'react';
import './Mobile.css';
import { useChat } from '../../hooks/useChat';
import { useSpeechToText } from '../../lib/speechToText'; // Import speech hook
import { supabase } from '../../lib/supabase';
import { markdownToHtml, hasMarkdown } from '../../lib/markdown';
import LeadCaptureForm from './LeadCaptureForm';


const MobileChat: React.FC = () => {
    const {
        messages,
        input,
        setInput,
        handleSend,
        loading,
        loadingHistory,
        handleClearChat,
        userId // Destructure userId
    } = useChat();

    // Voice Transcription Hook
    const {
        isListening,
        transcript,
        start: startListening,
        stop: stopListening,
        isSupported: isSpeechSupported
    } = useSpeechToText({
        silenceTimeout: 1500, // 1.5 seconds silence to auto-send
        onSpeechEnd: (finalTranscript) => {
            if (finalTranscript.trim()) {
                setInput(finalTranscript); 
                stopListening(); // Stop recording immediately
                
                // Send and clear
                setTimeout(() => {
                    handleSend(finalTranscript); 
                    setInput(""); // Execute manual clear
                }, 100);
            }
        }
    });

    // Sync transcript to input
    useEffect(() => {
        if (transcript) {
            setInput(transcript);
        }
    }, [transcript, setInput]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [userAvatar, setUserAvatar] = useState<string | null>(null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !loading) {
            handleSend();
        }
    };

    const confirmClearChat = async () => {
        if (window.confirm("¿Seguro que deseas borrar toda la conversación?")) {
            await handleClearChat();
        }
    };

    return (
            <div className="mobile-view-container system-bg-void">
                <header className="glass-header !justify-center !flex-col !h-auto !py-4 !border-none">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 tracking-wider">MTZ Ouroborus AI</h1>
                    <p className="text-xs text-slate-400 mt-1">Assistant Online</p>
                </header>

                <div className="mobile-content-scroll chat-content">
                    {loadingHistory ? (
                        <div className="loader-container">
                            <div className="loader" style={{ borderTopColor: '#00d4ff', borderRightColor: '#00d4ff' }}></div>
                        </div>
                    ) : (
                        <div className="chat-messages-list">
                            {messages.length === 0 && (
                                <div className="chat-empty-state">
                                    <span className="material-icons-round float-animation text-[#00d4ff]" style={{ fontSize: '4rem', filter: 'drop-shadow(0 0 10px rgba(0,212,255,0.5))' }}>smart_toy</span>
                                    <p className="text-[#00d4ff] uppercase tracking-widest mt-4 text-xs font-bold">System Ready</p>
                                    <p className="text-gray-500 text-[0.7rem] uppercase mt-1">Awaiting Commands...</p>
                                </div>
                            )}
                            
                            {messages.filter(msg => msg && msg.text).map((msg) => (
                                <div key={msg.id} className={`chat-row ${msg.sender === 'user' ? 'user' : 'bot'} slide-up`}>
                                    <div 
                                        className={`system-chat-bubble ${msg.sender === 'user' ? 'user' : 'bot'}`}
                                    >
                                        <div className="message-content">
                                            {hasMarkdown(msg.text) ? (
                                                <div dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.text) }} />
                                            ) : (
                                                <p>{msg.text}</p>
                                            )}
                                        </div>

                                        {/* System Style Menu Options */}
                                        {msg.menu && msg.menu.options && (
                                            <div className="chat-menu-options flex flex-col gap-2 mt-3">
                                                {msg.menu.options.map((option: any, idx: number) => (
                                                    <button 
                                                        key={idx} 
                                                        className="system-btn-primary p-3 flex items-center gap-3 rounded hover:bg-[#00d4ff] hover:text-black transition-all w-full"
                                                        onClick={() => handleSend(option.label || option.text)}
                                                    >
                                                        <span className="material-icons-round text-sm">{option.icon || 'chevron_right'}</span>
                                                        <span className="font-semibold">{option.label || option.text}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Lead Capture Form */}
                                        {msg.leadForm && (
                                            <LeadCaptureForm 
                                                sessionId={userId || 'guest'} 
                                                onSuccess={() => handleSend('Datos enviados correctamente')}
                                            />
                                        )}
                                        
                                        <div className="message-time">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {loading && (
                                <div className="chat-row bot fade-in">
                                    <div className="chat-avatar bot">
                                         <span className="material-icons-round spin-animation text-[#00d4ff]">sync</span>
                                    </div>
                                    <div className="chat-bubble bot" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                                        <div className="text-[#00d4ff] text-xs uppercase tracking-widest animate-pulse">Running System Analysis...</div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                <div className="mobile-chat-footer">
                    <div className="chat-input-bar">
                        <button 
                            className="icon-btn-secondary text-[#00d4ff] hover:bg-[#00d4ff]/10"
                            onClick={confirmClearChat}
                            title="Limpiar chat"
                        >
                            <span className="material-icons-round">delete_outline</span>
                        </button>
                        
                        <div className="chat-input-wrapper flex-1">
                            <input 
                                className="system-input w-full p-3 h-10" 
                                placeholder="Escribe un comando..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={loading || loadingHistory}
                            />
                        </div>
                        
                        <button 
                            className={`icon-btn-secondary ${isListening ? 'active' : ''}`}
                            onClick={() => isListening ? stopListening() : startListening()}
                        >
                            <span className={`material-icons-round ${isListening ? 'text-red-500 animate-pulse' : ''}`}>{isListening ? 'mic_off' : 'mic'}</span>
                        </button>

                        <button 
                            className="icon-btn-primary"
                            onClick={() => handleSend()}
                            disabled={loading || !input.trim()}
                        >
                            <span className="material-icons-round">send</span>
                        </button>
                    </div>
                </div>
            </div>
    );
};

export default MobileChat;

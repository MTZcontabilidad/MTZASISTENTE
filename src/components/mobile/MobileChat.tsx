import React, { useEffect, useRef, useState } from 'react';
import './Mobile.css';
import { useChat } from '../../hooks/useChat';
import { useSpeechToText } from '../../lib/speechToText'; // Import speech hook
import { supabase } from '../../lib/supabase';
import { markdownToHtml, hasMarkdown } from '../../lib/markdown';


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

    // Voice Transcription Hook
    const {
        isListening,
        transcript,
        start: startListening,
        stop: stopListening,
        isSupported: isSpeechSupported
    } = useSpeechToText();

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
        <div id="mobile-app-root">
            <div className="mobile-view-container">
                <header className="glass-header">
                    <div>
                        <h1 className="header-title">MTZ Ouroborus AI</h1>
                        <p className="header-subtitle">Asistente Virtual</p>
                    </div>
                    <div className="header-icon pulse-glow">
                        <span className="material-icons-round">smart_toy</span>
                    </div>
                </header>

                <div className="mobile-content-scroll chat-content">
                    {loadingHistory ? (
                        <div className="loader-container">
                            <div className="loader"></div>
                        </div>
                    ) : (
                        <div className="chat-messages-list">
                            {messages.length === 0 && (
                                <div className="chat-empty-state">
                                    <span className="material-icons-round float-animation">smart_toy</span>
                                    <p>¿En qué puedo ayudarte hoy?</p>
                                </div>
                            )}
                            
                            {messages.filter(msg => msg && msg.text).map((msg) => (
                                <div key={msg.id} className={`chat-row ${msg.sender === 'user' ? 'user' : 'bot'} slide-up`}>
                                    {msg.sender === 'assistant' && (
                                        <div className="chat-avatar bot">
                                            <span className="material-icons-round">smart_toy</span>
                                        </div>
                                    )}
                                    
                                    <div className="chat-bubble-wrapper">
                                        <div className={`chat-bubble ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                                            <div className="message-content">
                                                {hasMarkdown(msg.text) ? (
                                                    <div dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.text) }} />
                                                ) : (
                                                    <p>{msg.text}</p>
                                                )}
                                            </div>

                                            {/* Menu Options */}
                                            {msg.menu && msg.menu.options && (
                                                <div className="chat-menu-options">
                                                    {msg.menu.options.map((option: any, idx: number) => (
                                                        <button 
                                                            key={idx} 
                                                            className="chat-menu-btn"
                                                            onClick={() => handleSend(option.label || option.text)}
                                                        >
                                                            <span className="menu-btn-icon">{option.icon || '🔹'}</span>
                                                            <span className="menu-btn-text">{option.label || option.text}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            <div className="message-time">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {msg.sender === 'user' && <span className="material-icons-round check-icon">done_all</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {msg.sender === 'user' && (
                                        <div className="chat-avatar user">
                                            {userAvatar ? (
                                                <img src={userAvatar} alt="User" />
                                            ) : (
                                                <span className="material-icons-round">person</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            {loading && (
                                <div className="chat-row bot fade-in">
                                    <div className="chat-avatar bot">
                                         <span className="material-icons-round spin-animation">sync</span>
                                    </div>
                                    <div className="chat-bubble bot">
                                        <div className="typing-indicator">
                                            <div className="dot"></div>
                                            <div className="dot"></div>
                                            <div className="dot"></div>
                                        </div>
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
                            className="icon-btn-secondary"
                            onClick={confirmClearChat}
                            title="Limpiar chat"
                        >
                            <span className="material-icons-round">delete_outline</span>
                        </button>
                        
                        <div className="chat-input-wrapper">
                            <input 
                                className="mobile-input chat-input" 
                                placeholder="Escribe un mensaje..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={loading || loadingHistory}
                            />
                        </div>
                        
                        <button 
                            className={`icon-btn-secondary ${isListening ? 'listening pulse-animation' : ''}`}
                            onClick={() => {
                                if (isListening) {
                                    stopListening();
                                } else {
                                    startListening();
                                }
                            }}
                            title={isListening ? "Detener grabación" : "Enviar audio"}
                            style={isListening ? { color: '#ef4444', borderColor: '#ef4444', marginRight: '4px' } : { marginRight: '4px' }}
                        >
                            <span className="material-icons-round">{isListening ? 'mic_off' : 'mic'}</span>
                        </button>

                        <button 
                            className={`icon-btn-primary ${input.trim() ? 'active' : ''}`}
                            onClick={() => handleSend()}
                            disabled={loading || !input.trim()}
                        >
                            <span className="material-icons-round send-icon">send</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileChat;

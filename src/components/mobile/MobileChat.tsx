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
    const transcriptRef = useRef(transcript);
    useEffect(() => {
        transcriptRef.current = transcript;
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
                <header className="glass-header" style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: '1.5rem 1rem',
                    borderBottom: 'none',
                    gap: '0.5rem'
                }}>
                    <h1 style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        background: 'linear-gradient(to right, #22d3ee, #3b82f6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        letterSpacing: '0.05em',
                        margin: 0
                    }}>
                        MTZ Ouroborus AI
                    </h1>
                    <p style={{
                        fontSize: '0.75rem',
                        color: 'var(--mobile-text-muted)',
                        margin: 0,
                        fontWeight: 500
                    }}>
                        Assistant Online
                    </p>
                </header>

                <div className="mobile-content-scroll chat-content" style={{ paddingBottom: '0' }}>
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
                                        
                                        <div className="message-time">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>

                                    {/* Lead Capture Form - Separated for full width */}
                                    {msg.leadForm && (
                                        <div className="chat-menu-options" style={{ marginTop: '0.5rem' }}>
                                             <LeadCaptureForm 
                                                sessionId={userId || 'guest'} 
                                                onSuccess={() => handleSend('Datos enviados correctamente')}
                                            />
                                        </div>
                                    )}
                                    
                                    {/* System Style Menu Options (Separated) */}
                                    {msg.menu && msg.menu.options && (
                                        <div className="chat-menu-options">
                                            {msg.menu.options.map((option: any, idx: number) => (
                                                <button 
                                                    key={idx} 
                                                    className="chat-option-btn"
                                                    onClick={() => {
                                                        if (option.url) {
                                                            window.open(option.url, '_blank');
                                                        } else {
                                                            handleSend(option.label || option.text);
                                                        }
                                                    }}
                                                >
                                                    {option.icon && (
                                                        <span className="material-icons-round">
                                                            {option.icon}
                                                        </span>
                                                    )}
                                                    <span>{option.label || option.text}</span>
                                                    {option.url && (
                                                        <span className="material-icons-round" style={{ marginLeft: 'auto', fontSize: '1rem', opacity: 0.7 }}>
                                                            open_in_new
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            {loading && (
                                <div className="chat-row bot fade-in">
                                    <div className="system-chat-bubble bot">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <span className="material-icons-round spin-animation" style={{ color: 'var(--mobile-primary)', fontSize: '1.25rem' }}>smart_toy</span>
                                            <span style={{ color: 'var(--mobile-primary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
                                                Procesando...
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* 4. Integrar Knowledge Base (SII Links) - SOLO PARA CLIENTES Y ADMINS */}

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
                            disabled={loading || loadingHistory}
                        >
                            <span className="material-icons-round">delete_outline</span>
                        </button>
                        
                        <div className="chat-input-wrapper">
                            <input 
                                className="system-input" 
                                placeholder="Escribe un comando..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={loading || loadingHistory}
                            />
                        </div>
                        
                        {isSpeechSupported && (
                            <button 
                                className={`icon-btn-secondary ${isListening ? 'active' : ''}`}
                                onClick={() => {
                                    if (isListening) {
                                        stopListening();
                                        // Wait briefly for final transcript to settle
                                        setTimeout(() => {
                                            if (transcriptRef.current.trim()) {
                                                handleSend(transcriptRef.current);
                                                setInput("");
                                            }
                                        }, 500);
                                    } else {
                                        startListening();
                                    }
                                }}
                                disabled={loading || loadingHistory}
                                title={isListening ? 'Detener grabación' : 'Grabar voz'}
                            >
                                <span className={`material-icons-round ${isListening ? 'animate-pulse' : ''}`} style={{ color: isListening ? '#ef4444' : 'inherit' }}>
                                    {isListening ? 'mic' : 'mic'}
                                </span>
                            </button>
                        )}

                        <button 
                            className="icon-btn-primary"
                            onClick={() => handleSend()}
                            disabled={loading || loadingHistory || !input.trim()}
                            title="Enviar mensaje"
                        >
                            <span className="material-icons-round">send</span>
                        </button>
                    </div>
                </div>
            </div>
    );
};

export default MobileChat;

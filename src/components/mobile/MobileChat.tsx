import React, { useEffect, useRef, useState } from 'react';
import './Mobile.css';
import { useChat } from '../../hooks/useChat';
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

    return (
        <div className="flex flex-col h-full w-full overflow-hidden relative">
            <header className="mobile-header">
                <h1 className="mobile-title">MTZ Ouroborus AI</h1>
                <p className="mobile-subtitle">Tu asistente virtual de MTZ</p>
            </header>

            <div className="mobile-content">
                {loadingHistory ? (
                    <div className="flex justify-center items-center h-full" style={{ display: 'flex', justifyContent: 'center', height: '100%', alignItems: 'center' }}>
                        <div className="loader">Cargando...</div>
                    </div>
                ) : (
                    <div className="chat-messages">
                        {messages.length === 0 && (
                            <div style={{ textAlign: 'center', marginTop: '2.5rem', color: 'var(--text-secondary)' }}>
                                <p>Inicia una conversación</p>
                            </div>
                        )}
                        {messages.map((msg) => (
                            <div key={msg.id} className={`chat-message-row ${msg.sender === 'user' ? 'user' : ''}`}>
                                {msg.sender === 'assistant' && (
                                    <div className="bot-avatar">
                                        <span className="material-icons-round text-sm">smart_toy</span>
                                    </div>
                                )}
                                
                                <div className={`chat-bubble ${msg.sender === 'assistant' ? 'bot' : 'user'}`}>
                                    {msg.sender === 'assistant' && (
                                        <div className="bot-header">
                                            <span className="bot-name">Arise</span>
                                        </div>
                                    )}
                                    
                                    <div className="message-text">
                                        {hasMarkdown(msg.text) ? (
                                            <div dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.text) }} />
                                        ) : (
                                            <p>{msg.text}</p>
                                        )}
                                    </div>

                                    {/* Display Menu Options if available */}
                                    {msg.menu && msg.menu.options && (
                                        <div className="flex flex-col gap-3 mt-3" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                                            {msg.menu.options.map((option: any, idx: number) => (
                                                <button 
                                                    key={idx} 
                                                    className="mobile-btn-ghost"
                                                    style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                                                    onClick={() => handleSend(option.label || option.text)}
                                                >
                                                    <span style={{ fontSize: '1.25rem' }}>{option.icon || '🔹'}</span>
                                                    <span className="text-sm font-medium">{option.label || option.text}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className={`timestamp ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="chat-message-row">
                                <div className="bot-avatar">
                                    <span className="material-icons-round text-sm">smart_toy</span>
                                </div>
                                <div className="chat-bubble bot">
                                    <span className="text-sm">Escribiendo...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="mobile-chat-footer">
                <div className="chat-input-container">
                    <button 
                        className="mobile-icon-btn" 
                        onClick={confirmClearChat}
                        title="Limpiar chat"
                    >
                        <span className="material-icons-round">delete</span>
                    </button>
                    
                    <div className="chat-input-wrapper">
                        <input 
                            className="chat-input-field" 
                            placeholder={isListening ? "Escuchando..." : "Escribe tu mensaje..."}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading || loadingHistory}
                        />
                        <button 
                            className={`mobile-icon-btn ${isListening ? 'listening' : ''}`}
                            style={{ 
                                background: 'transparent', 
                                padding: '0 0 0 0.5rem',
                                color: isListening ? '#ef4444' : 'inherit'
                            }}
                            onClick={toggleListening}
                            title={isListening ? "Detener grabación" : "Grabar audio"}
                        >
                            <span className="material-icons-round" style={{ fontSize: '1.25rem' }}>
                                {isListening ? 'mic_off' : 'mic'}
                            </span>
                        </button>
                    </div>
                    
                    <button 
                        className="send-btn"
                        onClick={() => handleSend()}
                        disabled={loading || !input.trim()}
                    >
                        <span className="material-icons-round" style={{ transform: 'rotate(-30deg) translateY(-1px) translateX(2px)' }}>send</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobileChat;

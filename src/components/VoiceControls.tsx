/**
 * Componente de controles de voz para accesibilidad
 * Permite activar/desactivar lectura de respuestas y entrada por voz
 */

import { useState, useEffect, useRef } from "react";
import { useTextToSpeech, getTextToSpeechService } from "../lib/textToSpeech";
import { useSpeechToText } from "../lib/speechToText";
import "./VoiceControls.css";

interface VoiceControlsProps {
  onTranscript?: (text: string) => void; // Callback cuando se obtiene texto del micrófono
  autoRead?: boolean; // Si debe leer automáticamente las respuestas del asistente
  onAutoReadChange?: (enabled: boolean) => void; // Callback para cambiar auto-lectura
  textToRead?: string; // Texto a leer cuando cambia
}

export default function VoiceControls({
  onTranscript,
  autoRead = false,
  onAutoReadChange,
  textToRead,
}: VoiceControlsProps) {
  // Si autoRead está habilitado, activar TTS automáticamente
  const [ttsEnabled, setTtsEnabled] = useState(autoRead);
  const [sttEnabled, setSttEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [rate, setRate] = useState(1.3); // Velocidad por defecto 1.3
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [useGeminiTTS, setUseGeminiTTS] = useState<boolean>(false); // Por defecto usar TTS del navegador (gratis)

  const {
    speak,
    pause,
    resume,
    stop,
    isSpeaking,
    isPaused,
    error: ttsError,
    availableVoices,
    currentVoice,
  } = useTextToSpeech();

  const {
    start: startListening,
    stop: stopListening,
    abort: abortListening,
    isListening,
    transcript,
    error: sttError,
    isSupported: sttSupported,
  } = useSpeechToText();

  // Inicializar voz seleccionada
  useEffect(() => {
    if (currentVoice && !selectedVoice) {
      setSelectedVoice(currentVoice.name);
    }
  }, [currentVoice, selectedVoice]);

  // Leer automáticamente cuando cambia el texto y TTS está habilitado
  // Usar ref para evitar leer el mismo mensaje múltiples veces
  const lastReadTextRef = useRef<string>("");
  const isReadingRef = useRef<boolean>(false);
  
  // Escuchar cambios en configuración de voz desde AdminPanel
  useEffect(() => {
    const handleVoiceSettingsChange = (event: CustomEvent) => {
      const newSettings = event.detail;
      if (newSettings) {
        setRate(newSettings.speakingRate || rate);
        setPitch(newSettings.pitch || pitch);
        setVolume(newSettings.volume || volume);
        setUseGeminiTTS(newSettings.useGeminiTTS !== undefined ? newSettings.useGeminiTTS : useGeminiTTS);
        if (newSettings.geminiVoice) {
          // No hay setter directo, pero se usará en la próxima llamada a speak
        }
      }
    };
    
    window.addEventListener('voiceSettingsChanged', handleVoiceSettingsChange as EventListener);
    return () => {
      window.removeEventListener('voiceSettingsChanged', handleVoiceSettingsChange as EventListener);
    };
  }, [rate, pitch, volume, useGeminiTTS]);
  
  useEffect(() => {
    // Solo leer si el texto es diferente al último leído, no se está hablando, y no se está leyendo ya
    if (autoRead && ttsEnabled && textToRead && 
        textToRead !== lastReadTextRef.current && 
        !isSpeaking && 
        !isReadingRef.current) {
      isReadingRef.current = true;
      lastReadTextRef.current = textToRead; // Marcar como leído
      
      const voice = selectedVoice 
        ? availableVoices.find(v => v.name === selectedVoice) || undefined
        : undefined;
      
      // Cargar configuración desde localStorage si existe
      let voiceRate = rate || 1.1;
      let voicePitch = pitch || 1.1;
      let voiceVolume = volume || 1.0;
      let useGemini = useGeminiTTS;
      let geminiVoiceName = 'es-CL-Neural2-A';
      
      try {
        const saved = localStorage.getItem('voiceSettings');
        if (saved) {
          const parsed = JSON.parse(saved);
          voiceRate = parsed.speakingRate || voiceRate;
          voicePitch = parsed.pitch || voicePitch;
          voiceVolume = parsed.volume || voiceVolume;
          useGemini = parsed.useGeminiTTS !== undefined ? parsed.useGeminiTTS : useGemini;
          geminiVoiceName = parsed.geminiVoice || geminiVoiceName;
        }
      } catch (error) {
        console.log('Error cargando configuración de voz:', error);
      }
      
      speak(textToRead, { 
        rate: voiceRate,
        pitch: voicePitch,
        volume: voiceVolume, 
        voice: voice || undefined,
        useGemini: useGemini,
        geminiVoice: useGemini ? geminiVoiceName : undefined
      }).finally(() => {
        isReadingRef.current = false;
      });
    }
  }, [textToRead, autoRead, ttsEnabled, rate, pitch, volume, speak, isSpeaking, selectedVoice, availableVoices, useGeminiTTS]);

  // Enviar transcript cuando está completo
  useEffect(() => {
    if (transcript && onTranscript && !isListening) {
      onTranscript(transcript);
    }
  }, [transcript, isListening, onTranscript]);

  const handleTtsToggle = () => {
    if (ttsEnabled) {
      stop();
    }
    setTtsEnabled(!ttsEnabled);
  };

  const handleSttToggle = () => {
    if (isListening) {
      stopListening();
      setSttEnabled(false);
    } else {
      startListening();
      setSttEnabled(true);
    }
  };

  const handleStop = () => {
    stop();
    stopListening();
    setTtsEnabled(false);
    setSttEnabled(false);
  };

  return (
    <div className="voice-controls-container" style={{ display: 'none' }}>
      {/* VoiceControls ahora está oculto - el botón Leer se muestra en cada mensaje del asistente */}
      <div className="voice-controls-buttons" style={{ display: 'none' }}></div>

      {/* Panel de configuración */}
      {showSettings && (
        <div className="voice-settings-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
            <h4 className="voice-settings-title" style={{ margin: 0 }}>Configuración de Voz</h4>
            <button
              onClick={() => setShowSettings(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 68, 68, 0.2)';
                e.currentTarget.style.color = '#ff4444';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              aria-label="Cerrar configuración"
              title="Cerrar"
            >
              ✕
            </button>
          </div>

          {/* Velocidad */}
          <div className="voice-setting">
            <label htmlFor="voice-rate">
              Velocidad: {rate.toFixed(1)}x
            </label>
            <input
              id="voice-rate"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value))}
            />
          </div>

          {/* Tono */}
          <div className="voice-setting">
            <label htmlFor="voice-pitch">
              Tono: {pitch.toFixed(1)}
            </label>
            <input
              id="voice-pitch"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={pitch}
              onChange={(e) => setPitch(parseFloat(e.target.value))}
            />
          </div>

          {/* Volumen */}
          <div className="voice-setting">
            <label htmlFor="voice-volume">
              Volumen: {Math.round(volume * 100)}%
            </label>
            <input
              id="voice-volume"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
            />
          </div>

          {/* Selección de voz */}
          {availableVoices.length > 0 && (
            <div className="voice-setting">
              <label htmlFor="voice-select">
                Voz:
              </label>
              <select
                id="voice-select"
                value={selectedVoice || currentVoice?.name || ""}
                onChange={(e) => {
                  setSelectedVoice(e.target.value);
                  const voice = availableVoices.find(v => v.name === e.target.value);
                  if (voice) {
                    // Actualizar la voz en el servicio TTS
                    const ttsService = getTextToSpeechService();
                    ttsService.setVoice(voice.name);
                  }
                }}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                  marginTop: "4px"
                }}
              >
                {availableVoices.map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Auto-lectura */}
          <div className="voice-setting checkbox">
            <label>
              <input
                type="checkbox"
                checked={autoRead}
                onChange={(e) => {
                  onAutoReadChange?.(e.target.checked);
                }}
              />
              Leer respuestas automáticamente
            </label>
          </div>

          {/* Usar Gemini TTS (voz más natural) */}
          <div className="voice-setting checkbox">
            <label>
              <input
                type="checkbox"
                checked={useGeminiTTS}
                onChange={(e) => {
                  setUseGeminiTTS(e.target.checked);
                }}
              />
              Usar voz Gemini (más natural y expresiva)
            </label>
            <p className="voice-info-small" style={{ marginTop: '4px', fontSize: '12px', color: '#666' }}>
              {useGeminiTTS 
                ? '✓ Usando voces neurales de Google Cloud (igual que Gemini)'
                : 'Usando voces del navegador'}
            </p>
          </div>

          {/* Voz actual (información) */}
          {currentVoice && (
            <div className="voice-setting info">
              <p>
                <strong>Voz actual:</strong> {currentVoice.name}
              </p>
              <p className="voice-info-small">
                Idioma: {currentVoice.lang}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Indicador de transcript */}
      {isListening && transcript && (
        <div className="voice-transcript">
          <p className="transcript-label">Escuchando:</p>
          <p className="transcript-text">{transcript}</p>
        </div>
      )}

      {/* Mensajes de error */}
      {ttsError && (
        <div className="voice-error" role="alert">
          ⚠️ {ttsError}
        </div>
      )}
      {sttError && (
        <div className="voice-error" role="alert">
          ⚠️ {sttError}
        </div>
      )}
    </div>
  );
}

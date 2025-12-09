/**
 * Componente de controles de voz para accesibilidad
 * Permite activar/desactivar lectura de respuestas y entrada por voz
 */

import { useState, useEffect } from "react";
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
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [sttEnabled, setSttEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [rate, setRate] = useState(0.9); // Velocidad más natural por defecto
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState<string>("");

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
  useEffect(() => {
    if (autoRead && ttsEnabled && textToRead && !isSpeaking) {
      const voice = selectedVoice 
        ? availableVoices.find(v => v.name === selectedVoice) || undefined
        : undefined;
      speak(textToRead, { rate, pitch, volume, voice: voice || undefined });
    }
  }, [textToRead, autoRead, ttsEnabled, rate, pitch, volume, speak, isSpeaking, selectedVoice, availableVoices]);

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
      startListening({ lang: "es-CL", continuous: false });
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
    <div className="voice-controls-container">
      <div className="voice-controls-buttons">
        {/* Botón TTS */}
        <button
          className={`voice-control-button tts-button ${ttsEnabled ? "active" : ""} ${isSpeaking ? "speaking" : ""}`}
          onClick={handleTtsToggle}
          type="button"
          aria-label={ttsEnabled ? "Desactivar lectura de voz" : "Activar lectura de voz"}
          title={ttsEnabled ? "Desactivar lectura de voz" : "Activar lectura de voz"}
        >
          <span className="voice-icon">
            {isSpeaking ? "🔊" : isPaused ? "⏸️" : "🔇"}
          </span>
          <span className="voice-label">
            {isSpeaking ? "Leyendo..." : isPaused ? "Pausado" : "Leer"}
          </span>
        </button>

        {/* Botón STT */}
        {sttSupported ? (
          <button
            className={`voice-control-button stt-button ${isListening ? "active listening" : ""}`}
            onClick={handleSttToggle}
            type="button"
            aria-label={isListening ? "Detener micrófono" : "Activar micrófono"}
            title={isListening ? "Detener micrófono" : "Activar micrófono"}
          >
            <span className="voice-icon">
              {isListening ? "🎤" : "🎙️"}
            </span>
            <span className="voice-label">
              {isListening ? "Escuchando..." : "Hablar"}
            </span>
          </button>
        ) : (
          <button
            className="voice-control-button stt-button disabled"
            type="button"
            disabled
            title="Reconocimiento de voz no disponible en este navegador"
          >
            <span className="voice-icon">🎙️</span>
            <span className="voice-label">No disponible</span>
          </button>
        )}

        {/* Botón de configuración */}
        <button
          className="voice-control-button settings-button"
          onClick={() => setShowSettings(!showSettings)}
          type="button"
          aria-label="Configuración de voz"
          title="Configuración de voz"
        >
          <span className="voice-icon">⚙️</span>
        </button>

        {/* Botón de detener todo */}
        {(isSpeaking || isListening) && (
          <button
            className="voice-control-button stop-button"
            onClick={handleStop}
            type="button"
            aria-label="Detener todo"
            title="Detener todo"
          >
            <span className="voice-icon">⏹️</span>
            <span className="voice-label">Detener</span>
          </button>
        )}
      </div>

      {/* Panel de configuración */}
      {showSettings && (
        <div className="voice-settings-panel">
          <h4 className="voice-settings-title">Configuración de Voz</h4>

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


/**
 * Menú desplegable de ajustes de voz
 * Se muestra en la barra de acciones del chat
 */

import { useState, useRef, useEffect } from "react";
import { useTextToSpeech } from "../lib/textToSpeech";
import "./VoiceSettingsDropdown.css";

interface VoiceSettingsDropdownProps {
  autoRead: boolean;
  onAutoReadChange: (enabled: boolean) => void;
}

export default function VoiceSettingsDropdown({
  autoRead,
  onAutoReadChange,
}: VoiceSettingsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [rate, setRate] = useState(1.3);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [useGeminiTTS, setUseGeminiTTS] = useState<boolean>(true);

  const {
    availableVoices,
    currentVoice,
  } = useTextToSpeech();

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Inicializar voz seleccionada
  useEffect(() => {
    if (currentVoice && !selectedVoice) {
      setSelectedVoice(currentVoice.name);
    }
  }, [currentVoice, selectedVoice]);

  return (
    <div className="voice-settings-dropdown" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="action-button voice-settings-button"
        title="Ajustes de voz"
        aria-label="Ajustes de voz"
      >
        ⚙️
      </button>

      {isOpen && (
        <div className="voice-settings-dropdown-menu">
          <div className="voice-settings-dropdown-header">
            <h4>Ajustes de Voz</h4>
            <button
              onClick={() => setIsOpen(false)}
              className="voice-settings-close"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          <div className="voice-settings-dropdown-content">
            {/* Velocidad */}
            <div className="voice-setting-item">
              <label htmlFor="dropdown-rate">
                Velocidad: {rate.toFixed(1)}x
              </label>
              <input
                id="dropdown-rate"
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value))}
              />
            </div>

            {/* Tono */}
            <div className="voice-setting-item">
              <label htmlFor="dropdown-pitch">
                Tono: {pitch.toFixed(1)}
              </label>
              <input
                id="dropdown-pitch"
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
              />
            </div>

            {/* Volumen */}
            <div className="voice-setting-item">
              <label htmlFor="dropdown-volume">
                Volumen: {Math.round(volume * 100)}%
              </label>
              <input
                id="dropdown-volume"
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
              <div className="voice-setting-item">
                <label htmlFor="dropdown-voice">Voz:</label>
                <select
                  id="dropdown-voice"
                  value={selectedVoice || currentVoice?.name || ""}
                  onChange={(e) => setSelectedVoice(e.target.value)}
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
            <div className="voice-setting-item checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={autoRead}
                  onChange={(e) => onAutoReadChange(e.target.checked)}
                />
                Leer respuestas automáticamente
              </label>
            </div>

            {/* Usar Gemini TTS */}
            <div className="voice-setting-item checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={useGeminiTTS}
                  onChange={(e) => setUseGeminiTTS(e.target.checked)}
                />
                Usar voz Gemini (más natural)
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


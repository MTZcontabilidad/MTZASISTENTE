/**
 * Panel de configuración del asistente de voz
 * Permite ajustar velocidad, tono, tiempo de pausa y más
 */

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { speakWithGemini } from "../lib/geminiTTS";
import "./VoiceSettingsPanel.css";

interface VoiceSettings {
  speakingRate: number; // Velocidad de habla (0.5 a 2.0)
  pitch: number; // Tono de voz (0.5 a 2.0)
  volume: number; // Volumen (0.0 a 1.0)
  silenceTimeout: number; // Tiempo de pausa para enviar mensaje (ms)
  useGeminiTTS: boolean; // Usar Gemini TTS o TTS del navegador
  geminiVoice: string; // Voz específica de Gemini
  autoReadEnabled: boolean; // Leer respuestas automáticamente
}

const DEFAULT_SETTINGS: VoiceSettings = {
  speakingRate: 1.1, // Velocidad optimizada para sonar natural (1.0-1.2 es ideal)
  pitch: 1.05, // Pitch ligeramente más alto para sonar amigable pero profesional
  volume: 1.0,
  silenceTimeout: 1500,
  useGeminiTTS: false, // Por defecto usar TTS del navegador (gratis)
  geminiVoice: 'es-CL-Neural2-A',
  autoReadEnabled: true,
};

export default function VoiceSettingsPanel() {
  const [settings, setSettings] = useState<VoiceSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [geminiAvailable, setGeminiAvailable] = useState<boolean | null>(null);

  // Cargar configuración desde localStorage o usar valores por defecto
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = localStorage.getItem('voiceSettings');
        if (saved) {
          const parsed = JSON.parse(saved);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
        
        // Verificar si Gemini TTS está disponible
        try {
          const { getGeminiApiKey } = await import('../lib/geminiApiKey');
          const apiKey = await getGeminiApiKey();
          setGeminiAvailable(!!apiKey);
        } catch (error) {
          console.log('No se pudo verificar Gemini TTS:', error);
          setGeminiAvailable(false);
        }
      } catch (error) {
        console.error('Error cargando configuración de voz:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // Guardar en localStorage
      localStorage.setItem('voiceSettings', JSON.stringify(settings));
      
      // También guardar en la base de datos si es necesario (en metadata de company)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Intentar guardar en metadata de company si existe
        try {
          const { data: clientInfo } = await supabase
            .from('client_info')
            .select('company_id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (clientInfo?.company_id) {
            // Actualizar metadata de company con configuración de voz
            const { data: company } = await supabase
              .from('companies')
              .select('metadata')
              .eq('id', clientInfo.company_id)
              .maybeSingle();
            
            if (company) {
              const metadata = (company.metadata as Record<string, any>) || {};
              metadata.voiceSettings = settings;
              
              await supabase
                .from('companies')
                .update({ metadata })
                .eq('id', clientInfo.company_id);
            }
          }
        } catch (error) {
          console.log('No se pudo guardar en BD, usando solo localStorage:', error);
        }
      }
      
      setMessage({ type: 'success', text: '✅ Configuración guardada exitosamente' });
      
      // Aplicar configuración inmediatamente
      applySettings(settings);
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: `❌ Error: ${error.message || 'Error desconocido'}` });
    } finally {
      setSaving(false);
    }
  };

  const applySettings = (newSettings: VoiceSettings) => {
    // Disparar evento personalizado para que los componentes actualicen su configuración
    window.dispatchEvent(new CustomEvent('voiceSettingsChanged', { detail: newSettings }));
  };

  const [isTesting, setIsTesting] = useState(false);
  const [testText, setTestText] = useState("Hola, esta es una prueba del asistente de voz. ¿Cómo suena?");

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const textToSpeak = testText.trim() || "Hola, esta es una prueba del asistente de voz. ¿Cómo suena?";
      
      if (settings.useGeminiTTS) {
        // Usar Gemini TTS para una prueba más realista
        try {
          await speakWithGemini(
            textToSpeak, // Primer parámetro: texto como string
            {
              languageCode: 'es-CL',
              voiceName: settings.geminiVoice,
              speakingRate: settings.speakingRate,
              pitch: settings.pitch,
              volumeGainDb: (settings.volume - 1) * 6, // Convertir de 0-1 a dB (-6 a 0)
            }
          );
        } catch (error: any) {
          // Detectar si la API no está habilitada
          if (error?.message?.startsWith('TTS_API_DISABLED:')) {
            const activationUrl = error.message.split(':')[1];
            const errorMsg = `⚠️ La API de Cloud Text-to-Speech no está habilitada en tu proyecto de Google Cloud.\n\n` +
              `Para habilitarla, visita:\n${activationUrl}\n\n` +
              `Mientras tanto, se usará el TTS del navegador.`;
            
            setMessage({ 
              type: 'error', 
              text: errorMsg 
            });
            setTimeout(() => setMessage(null), 10000); // Mostrar por 10 segundos
            
            console.warn('API de TTS no habilitada, usando fallback:', error);
          } else {
            console.warn('Error con Gemini TTS, usando fallback:', error);
          }
          
          // Fallback a TTS del navegador
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.rate = settings.speakingRate;
          utterance.pitch = settings.pitch;
          utterance.volume = settings.volume;
          utterance.lang = 'es-CL';
          window.speechSynthesis.speak(utterance);
        }
      } else {
        // Usar TTS del navegador
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.rate = settings.speakingRate;
        utterance.pitch = settings.pitch;
        utterance.volume = settings.volume;
        utterance.lang = 'es-CL';
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('Error en prueba de voz:', error);
      alert('Error al probar la voz. Verifica la configuración.');
    } finally {
      setTimeout(() => setIsTesting(false), 1000);
    }
  };

  if (loading) {
    return <div className="voice-settings-loading">Cargando configuración...</div>;
  }

  return (
    <div className="voice-settings-panel">
      <div className="voice-settings-header">
        <h3>🎤 Configuración del Asistente de Voz</h3>
        <p>Ajusta la velocidad, tono, tiempo de pausa y otras opciones del asistente de voz</p>
      </div>

      {message && (
        <div className={`voice-settings-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="voice-settings-content">
        {/* Velocidad de habla */}
        <div className="voice-setting-group">
          <label htmlFor="speakingRate">
            <strong>Velocidad de habla:</strong> {settings.speakingRate.toFixed(1)}x
          </label>
          <input
            id="speakingRate"
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={settings.speakingRate}
            onChange={(e) => setSettings({ ...settings, speakingRate: parseFloat(e.target.value) })}
          />
          <div className="setting-description">
            Controla qué tan rápido habla el asistente (0.5 = lento, 2.0 = muy rápido)
          </div>
        </div>

        {/* Tono de voz */}
        <div className="voice-setting-group">
          <label htmlFor="pitch">
            <strong>Tono de voz:</strong> {settings.pitch.toFixed(1)}
          </label>
          <input
            id="pitch"
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={settings.pitch}
            onChange={(e) => setSettings({ ...settings, pitch: parseFloat(e.target.value) })}
          />
          <div className="setting-description">
            Controla el tono de la voz (0.5 = grave, 2.0 = agudo)
          </div>
        </div>

        {/* Volumen */}
        <div className="voice-setting-group">
          <label htmlFor="volume">
            <strong>Volumen:</strong> {Math.round(settings.volume * 100)}%
          </label>
          <input
            id="volume"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.volume}
            onChange={(e) => setSettings({ ...settings, volume: parseFloat(e.target.value) })}
          />
          <div className="setting-description">
            Controla el volumen del asistente (0% = silencioso, 100% = máximo)
          </div>
        </div>

        {/* Tiempo de pausa para enviar mensaje */}
        <div className="voice-setting-group">
          <label htmlFor="silenceTimeout">
            <strong>Tiempo de pausa para enviar:</strong> {settings.silenceTimeout}ms ({(settings.silenceTimeout / 1000).toFixed(1)}s)
          </label>
          <input
            id="silenceTimeout"
            type="range"
            min="1000"
            max="5000"
            step="100"
            value={settings.silenceTimeout}
            onChange={(e) => setSettings({ ...settings, silenceTimeout: parseInt(e.target.value) })}
          />
          <div className="setting-description">
            Tiempo de silencio necesario para que el sistema envíe automáticamente el mensaje transcrito (1s = rápido, 5s = lento)
          </div>
        </div>

        {/* Usar Gemini TTS */}
        <div className="voice-setting-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={settings.useGeminiTTS}
              onChange={(e) => setSettings({ ...settings, useGeminiTTS: e.target.checked })}
              disabled={geminiAvailable === false}
            />
            <strong>Usar voz Gemini (opcional, requiere pago)</strong>
            {geminiAvailable === false && (
              <span className="gemini-warning"> ⚠️ No disponible (API key no configurada)</span>
            )}
            {geminiAvailable === true && (
              <span className="gemini-success"> ✓ API key encontrada</span>
            )}
          </label>
          <div className="setting-description">
            <strong style={{ color: '#ffa500' }}>💰 Requiere pago:</strong> Google Cloud Text-to-Speech es un servicio de pago (aunque tiene tier gratuito limitado). 
            <br />
            <strong style={{ color: '#51cf66' }}>✅ Recomendado:</strong> Deja esta opción deshabilitada para usar el TTS del navegador (100% gratis y funciona muy bien).
            <br />
            Solo habilítala si quieres voces más naturales y estás dispuesto a pagar por el servicio.
            {geminiAvailable === false && (
              <div style={{ marginTop: '8px', color: '#ff6b6b', fontWeight: '600' }}>
                Para usar Gemini TTS, configura la API key de Google Cloud en la base de datos (tabla companies, campo metadata.gemini_api_key).
              </div>
            )}
            {geminiAvailable === true && (
              <div style={{ marginTop: '8px', color: '#ffa500', fontWeight: '600' }}>
                ⚠️ Importante: Además de la API key, debes habilitar la API de "Cloud Text-to-Speech" en tu proyecto de Google Cloud Console.
                <br />
                Si ves un error 403, visita: <a href="https://console.developers.google.com/apis/api/texttospeech.googleapis.com/overview" target="_blank" rel="noopener noreferrer" style={{ color: '#00d4ff', textDecoration: 'underline' }}>Habilitar API de Text-to-Speech</a>
                <br />
                <strong>💳 Costos:</strong> Google Cloud TTS cobra por caracteres procesados. Consulta los precios actuales en la consola de Google Cloud.
              </div>
            )}
          </div>
        </div>

        {/* Voz de Gemini */}
        {settings.useGeminiTTS && (
          <div className="voice-setting-group">
            <label htmlFor="geminiVoice">
              <strong>Voz de Gemini:</strong>
            </label>
            <select
              id="geminiVoice"
              value={settings.geminiVoice}
              onChange={(e) => setSettings({ ...settings, geminiVoice: e.target.value })}
            >
              <option value="es-CL-Neural2-A">es-CL-Neural2-A (Femenina, Chile - Recomendada)</option>
              <option value="es-CL-Neural2-B">es-CL-Neural2-B (Masculina, Chile)</option>
              <option value="es-CL-Standard-A">es-CL-Standard-A (Femenina estándar, Chile)</option>
              <option value="es-CL-Standard-B">es-CL-Standard-B (Masculina estándar, Chile)</option>
              <option value="es-MX-Neural2-A">es-MX-Neural2-A (Femenina, México)</option>
              <option value="es-MX-Neural2-B">es-MX-Neural2-B (Masculina, México)</option>
            </select>
            <div className="setting-description">
              Selecciona la voz neural que prefieras. Las voces Neural2 son más naturales y expresivas.
            </div>
          </div>
        )}

        {/* Auto-lectura */}
        <div className="voice-setting-group checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={settings.autoReadEnabled}
              onChange={(e) => setSettings({ ...settings, autoReadEnabled: e.target.checked })}
            />
            <strong>Leer respuestas automáticamente</strong>
          </label>
          <div className="setting-description">
            Si está habilitado, el asistente leerá automáticamente sus respuestas en voz alta.
          </div>
        </div>

        {/* Campo de texto personalizado para prueba */}
        <div className="voice-setting-group">
          <label htmlFor="testText">
            <strong>Texto de prueba:</strong>
          </label>
          <textarea
            id="testText"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Escribe aquí el texto que quieres probar..."
            rows={3}
            className="test-text-input"
          />
          <div className="setting-description">
            Escribe el texto que quieres escuchar con la configuración actual. Puedes cambiarlo en tiempo real.
          </div>
        </div>

        {/* Botones de acción */}
        <div className="voice-settings-actions">
          <button
            onClick={handleTest}
            className="test-button"
            type="button"
            disabled={isTesting}
          >
            {isTesting ? "🔊 Probando..." : "🔊 Probar configuración"}
          </button>
          <button
            onClick={handleSave}
            className="save-button"
            disabled={saving}
            type="button"
          >
            {saving ? "Guardando..." : "💾 Guardar configuración"}
          </button>
          <button
            onClick={() => {
              setSettings(DEFAULT_SETTINGS);
              applySettings(DEFAULT_SETTINGS);
            }}
            className="reset-button"
            type="button"
          >
            🔄 Restaurar valores por defecto
          </button>
        </div>

        {/* Información adicional */}
        <div className="voice-settings-info">
          <h4>ℹ️ Información</h4>
          <ul>
            <li>Los cambios se aplican inmediatamente después de guardar</li>
            <li>La configuración se guarda localmente y se sincroniza con la base de datos si es posible</li>
            <li>Usa el botón "Probar configuración" para escuchar cómo suena antes de guardar</li>
            <li>El tiempo de pausa afecta qué tan rápido se envía el mensaje después de dejar de hablar</li>
            <li>Las voces Neural2 de Gemini son más naturales pero requieren API key configurada</li>
          </ul>
        </div>
      </div>
    </div>
  );
}


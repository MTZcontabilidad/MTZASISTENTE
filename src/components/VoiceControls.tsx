/**
 * Componente de controles de voz para accesibilidad (Solo STT - Voz eliminada)
 * Permite activar/desactivar entrada por voz
 */

import { useSpeechToText } from "../lib/speechToText";
import "./VoiceControls.css";

interface VoiceControlsProps {
  onTranscript?: (text: string) => void; // Callback cuando se obtiene texto del micrófono
  autoRead?: boolean; // Props heredadas (ignoradas)
  onAutoReadChange?: (enabled: boolean) => void;
  textToRead?: string;
}

export default function VoiceControls({
  onTranscript,
}: VoiceControlsProps) {
  const {
    start: startListening,
    stop: stopListening,
    isListening,
    transcript,
    error: sttError,
  } = useSpeechToText();

  // Exponer API para que otros componentes puedan controlar el STT si es necesario, 
  // o simplemente manejarlo internamente.
  // Por ahora, como se eliminó la UI de botones de aquí, asumimos que este componente 
  // actúa más como un gestor de estado/feedback visual o que los botones están en ChatInterface.
  
  // Si VoiceControls DEBE renderizar botones, necesitamos restaurarlos.
  // Revisando ChatInterface, parece que VoiceControls renderiza UI en bottom?
  // ChatInterface: <VoiceControls ... /> al final.
  
  // Vamos a mantener una UI mínima si está escuchando o error.
  
  return (
    <div className="voice-controls-container" style={{ display: isListening || sttError ? 'block' : 'none' }}>
      {isListening && transcript && (
        <div className="voice-transcript">
          <p className="transcript-label">Escuchando:</p>
          <p className="transcript-text">{transcript}</p>
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

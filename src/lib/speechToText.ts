/**
 * Implementación simple de Speech-to-Text
 * Funciona para todos los roles y páginas del chatbot
 */

import { useState, useEffect, useCallback, useRef } from "react";

// Declarar tipo para SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

/**
 * Hook simple para reconocimiento de voz
 * Con detección automática de pausas para enviar mensajes automáticamente
 */
export function useSpeechToText(options?: {
  onSpeechEnd?: (transcript: string) => void; // Callback cuando se detecta que el usuario terminó de hablar
  silenceTimeout?: number; // Tiempo en ms sin habla para considerar que terminó (default: 2000ms)
}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef<string>("");
  const lastResultTimeRef = useRef<number>(0); // Timestamp del último resultado recibido
  const onSpeechEndRef = useRef<((transcript: string) => void) | undefined>(options?.onSpeechEnd);
  const silenceTimeout = options?.silenceTimeout || 2500; // 2.5 segundos de silencio = terminó de hablar
  const hasFinalResultsRef = useRef<boolean>(false); // Indica si ya hay resultados finales
  const isListeningRef = useRef<boolean>(false); // Ref para verificar estado de escucha en callbacks

  // Actualizar referencia del callback cuando cambia
  useEffect(() => {
    onSpeechEndRef.current = options?.onSpeechEnd;
  }, [options?.onSpeechEnd]);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  // Función para resetear el timer de silencio
  const resetSilenceTimer = useCallback((currentTranscript: string, hasFinal: boolean) => {
    // Limpiar timer anterior
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Actualizar timestamp del último resultado
    lastResultTimeRef.current = Date.now();
    
    // Si hay resultados finales, marcar que los hay
    if (hasFinal) {
      hasFinalResultsRef.current = true;
    }

    // Si hay transcript y es diferente al anterior, resetear timer
    if (currentTranscript && currentTranscript.trim().length >= 2) {
      lastTranscriptRef.current = currentTranscript;
      
      // Crear nuevo timer que se dispara después del tiempo de silencio
      // Solo si hay resultados finales (el usuario ya dijo algo completo)
      if (hasFinalResultsRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          // Verificar que no haya habido nuevos resultados en el último tiempo
          const timeSinceLastResult = Date.now() - lastResultTimeRef.current;
          
          // Si todavía estamos escuchando (usar ref para estado actual), hay transcript, y pasó el tiempo de silencio sin nuevos resultados
          if (isListeningRef.current && currentTranscript.trim().length >= 2 && timeSinceLastResult >= silenceTimeout - 100) {
            console.log('✅ Pausa detectada, usuario terminó de hablar:', currentTranscript);
            if (onSpeechEndRef.current) {
              onSpeechEndRef.current(currentTranscript.trim());
            }
            // Limpiar el timer después de usarlo
            silenceTimerRef.current = null;
          }
        }, silenceTimeout);
      }
    }
  }, [silenceTimeout]);

  // Verificar soporte al montar
  useEffect(() => {
    if (typeof window === "undefined") {
      setIsSupported(false);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.lang = "es-CL";
        rec.continuous = true;
        rec.interimResults = true;
        setRecognition(rec);
        setIsSupported(true);
      } catch (err) {
        console.error("Error inicializando reconocimiento:", err);
        setIsSupported(false);
      }
    } else {
      setIsSupported(false);
    }
  }, []);

  const start = useCallback(() => {
    if (!recognition || !isSupported) {
      setError("Reconocimiento de voz no disponible");
      return;
    }

    setError(null);
    setTranscript("");
    setIsListening(true);
    isListeningRef.current = true;
    lastTranscriptRef.current = "";
    lastResultTimeRef.current = 0;
    hasFinalResultsRef.current = false;
    
    // Limpiar timer anterior
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Configurar eventos
    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";
      let hasFinal = false;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
          hasFinal = true;
        } else {
          interimTranscript += transcript;
        }
      }

      // Actualizar transcript (priorizar final, sino intermedio)
      const textToShow = finalTranscript.trim() || interimTranscript.trim();
      if (textToShow) {
        setTranscript(textToShow);
        // Resetear timer de silencio cada vez que hay nuevo texto
        // Pasar si hay resultados finales para saber cuándo empezar a contar el silencio
        resetSilenceTimer(textToShow, hasFinal);
      }
    };

    recognition.onerror = (event: any) => {
      const errorType = event.error;
      
      // Ignorar "no-speech" - es normal si el usuario no habla inmediatamente
      if (errorType === "no-speech") {
        console.log("No se detectó habla aún, continuando...");
        return;
      }

      // Otros errores sí los reportamos
      if (errorType === "not-allowed") {
        setError("Permiso de micrófono denegado");
        setIsListening(false);
      } else if (errorType === "audio-capture") {
        setError("No se pudo acceder al micrófono");
        setIsListening(false);
      } else if (errorType === "network") {
        setError("Error de red. Verifica tu conexión");
        setIsListening(false);
      } else {
        console.error("Error en reconocimiento:", errorType);
        // Para otros errores, solo loguear pero continuar
      }
    };

    recognition.onend = () => {
      const wasManualStop = (recognition as any)._manualStop;
      
      // Si fue detención manual, no reiniciar
      if (wasManualStop) {
        setIsListening(false);
        (recognition as any)._manualStop = false;
        return;
      }

      setIsListening(false);
      isListeningRef.current = false;

      // Si hay transcript final y no se ha llamado al callback, verificar si debemos llamarlo
      // Esto maneja el caso donde el reconocimiento termina naturalmente después de una pausa
      if (hasFinalResultsRef.current && lastTranscriptRef.current && lastTranscriptRef.current.trim().length >= 2) {
        const timeSinceLastResult = Date.now() - lastResultTimeRef.current;
        // Si pasó suficiente tiempo desde el último resultado, el usuario terminó de hablar
        if (timeSinceLastResult >= silenceTimeout - 500) {
          console.log('✅ Reconocimiento terminó naturalmente, usuario terminó de hablar:', lastTranscriptRef.current);
          if (onSpeechEndRef.current) {
            onSpeechEndRef.current(lastTranscriptRef.current.trim());
          }
        }
      }
      
      // Reiniciar automáticamente después de un breve delay para continuar escuchando
      // Solo si no fue detención manual
      if (!wasManualStop) {
        setTimeout(() => {
          if (recognition && !(recognition as any)._manualStop) {
            try {
              // Resetear flag de resultados finales para la próxima ronda
              hasFinalResultsRef.current = false;
              isListeningRef.current = true;
              setIsListening(true);
              recognition.start();
            } catch (err) {
              // Ignorar errores de reinicio (puede ser que ya esté iniciado)
            }
          }
        }, 300);
      }
      
      // Resetear el flag
      (recognition as any)._manualStop = false;
    };

    // Iniciar reconocimiento
    try {
      recognition.start();
    } catch (err: any) {
      if (err.message && err.message.includes("already started")) {
        // Si ya está iniciado, detener y reiniciar
        try {
          recognition.stop();
          setTimeout(() => {
            recognition.start();
          }, 100);
        } catch (retryErr) {
          setError("El reconocimiento ya está en uso");
          setIsListening(false);
          isListeningRef.current = false;
        }
      } else {
        setError("No se pudo iniciar el reconocimiento");
        setIsListening(false);
        isListeningRef.current = false;
      }
    }
  }, [recognition, isSupported, isListening, resetSilenceTimer]);

  const stop = useCallback(() => {
    if (!recognition) return;

    // Limpiar timer de silencio
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Marcar que es una detención manual para no reiniciar
    (recognition as any)._manualStop = true;
    
    // Procesar todos los resultados finales antes de detener
    // Esto asegura que tengamos el transcript completo
    try {
      // Forzar procesamiento de resultados finales
      const processFinalResults = () => {
        // El transcript ya debería estar actualizado por onresult
        // pero esperamos un momento para asegurar que todos los resultados finales se procesen
        setTimeout(() => {
          try {
            recognition.stop();
            setIsListening(false);
            isListeningRef.current = false;
          } catch (err) {
            console.error("Error al detener reconocimiento:", err);
            setIsListening(false);
            isListeningRef.current = false;
          }
        }, 100);
      };
      
      processFinalResults();
    } catch (err) {
      console.error("Error al detener reconocimiento:", err);
      setIsListening(false);
    }
  }, [recognition]);

  const abort = useCallback(() => {
    if (!recognition) return;

    // Limpiar timer de silencio
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    try {
      recognition.abort();
      setIsListening(false);
      isListeningRef.current = false;
      setTranscript("");
      lastTranscriptRef.current = "";
    } catch (err) {
      console.error("Error al abortar reconocimiento:", err);
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, [recognition]);

  return {
    start,
    stop,
    abort,
    isListening,
    transcript,
    error,
    isSupported,
  };
}


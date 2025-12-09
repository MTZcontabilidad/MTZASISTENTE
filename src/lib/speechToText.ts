/**
 * Servicio de Speech-to-Text (STT) para entrada por voz
 * Optimizado para accesibilidad
 */

import { useState, useEffect, useCallback } from "react";

interface STTOptions {
  lang?: string; // Idioma (default: 'es-CL')
  continuous?: boolean; // Continuar escuchando después de pausas
  interimResults?: boolean; // Mostrar resultados intermedios
}

// Declarar tipo para SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

class SpeechToTextService {
  private recognition: any = null;
  private isListening: boolean = false;
  private isSupported: boolean = false;
  private silenceTimeout: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      // Verificar si estamos en HTTPS (requerido para reconocimiento de voz en muchos navegadores)
      const isSecure = window.location.protocol === 'https:' || 
                       window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';
      
      if (!isSecure) {
        console.warn(
          "El reconocimiento de voz requiere HTTPS. Algunas funciones pueden no estar disponibles."
        );
      }
      
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          this.recognition = new SpeechRecognition();
          this.isSupported = true;
          this.setupRecognition();
        } catch (error) {
          console.error("Error inicializando reconocimiento de voz:", error);
          this.isSupported = false;
        }
      } else {
        this.isSupported = false;
        // Detectar el navegador para dar mensaje más específico
        const userAgent = navigator.userAgent.toLowerCase();
        let browserMessage = "Tu navegador no soporta reconocimiento de voz.";
        
        if (userAgent.includes('firefox')) {
          browserMessage = "Firefox no soporta reconocimiento de voz nativo. Por favor, usa Chrome, Edge o Safari.";
        } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
          browserMessage = "Safari requiere iOS 14.5+ o macOS 11+ para reconocimiento de voz. Por favor, actualiza tu sistema.";
        } else if (userAgent.includes('chrome') || userAgent.includes('edge')) {
          browserMessage = "Asegúrate de estar usando la versión más reciente de Chrome o Edge.";
        }
        
        console.warn(browserMessage);
      }
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    // Configuración por defecto - optimizada para accesibilidad y compatibilidad móvil
    this.recognition.lang = "es-CL";
    this.recognition.continuous = true; // Continuar escuchando para mejor accesibilidad
    this.recognition.interimResults = true; // Mostrar resultados intermedios
    this.recognition.maxAlternatives = 3; // Más alternativas para mejor precisión
    
    // Configuraciones adicionales para mejor compatibilidad móvil
    // No establecer grammars ya que puede causar errores en algunos navegadores
    // Si se necesita grammars, debe ser un SpeechGrammarList válido, no null
  }

  /**
   * Inicia el reconocimiento de voz
   */
  start(
    onResult: (text: string, isFinal: boolean) => void,
    onError?: (error: string) => void,
    options: STTOptions = {}
  ): void {
    if (!this.isSupported || !this.recognition) {
      onError?.(
        "Tu navegador no soporta reconocimiento de voz. Por favor, usa Chrome, Edge o Safari."
      );
      return;
    }

    if (this.isListening) {
      this.stop();
    }

    // Configurar opciones
    if (options.lang) {
      this.recognition.lang = options.lang;
    }
    if (options.continuous !== undefined) {
      this.recognition.continuous = options.continuous;
    }
    if (options.interimResults !== undefined) {
      this.recognition.interimResults = options.interimResults;
    }

    // Limpiar timeout anterior si existe
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
    
    // Variable para guardar el último transcript (útil para móviles)
    let lastTranscript = "";
    
    // Eventos
    this.recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      // Guardar el último transcript completo (útil para móviles cuando termina abruptamente)
      const fullTranscript = (finalTranscript + interimTranscript).trim();
      if (fullTranscript) {
        lastTranscript = fullTranscript;
      }

      // Resetear timer de silencio cuando hay resultados
      if (this.silenceTimeout) {
        clearTimeout(this.silenceTimeout);
      }
      
      // Si hay resultados finales, resetear timer para dar tiempo a más habla
      // Si no hay actividad por 2 segundos después del último resultado, auto-detener
      if (finalTranscript || interimTranscript) {
        this.silenceTimeout = setTimeout(() => {
          if (this.isListening && !options.continuous) {
            // Solo auto-detener si no es continuo (modo manual)
            this.stop();
          }
        }, 2000);
      }

      // Priorizar resultados finales, pero también enviar intermedios para mejor UX
      if (finalTranscript) {
        onResult(finalTranscript.trim(), true);
      } else if (interimTranscript) {
        onResult(interimTranscript, false);
      }
    };

    this.recognition.onerror = (event: any) => {
      let errorMessage = "Error en el reconocimiento de voz";
      let shouldReport = true;

      switch (event.error) {
        case "no-speech":
          // En móviles, esto puede ocurrir si el usuario no habla inmediatamente
          // No es necesariamente un error crítico
          errorMessage = "No se detectó habla. Intenta de nuevo.";
          shouldReport = true;
          break;
        case "audio-capture":
          errorMessage =
            "No se pudo acceder al micrófono. Verifica los permisos en la configuración de tu navegador.";
          shouldReport = true;
          break;
        case "not-allowed":
          errorMessage =
            "Permiso de micrófono denegado. Por favor, permite el acceso al micrófono en la configuración de tu navegador.";
          shouldReport = true;
          break;
        case "network":
          errorMessage =
            "Error de red. Verifica tu conexión a internet. El reconocimiento de voz requiere conexión.";
          shouldReport = true;
          break;
        case "aborted":
          // El usuario detuvo manualmente, no es un error
          shouldReport = false;
          break;
        case "service-not-allowed":
          // Algunos navegadores móviles requieren HTTPS para el reconocimiento de voz
          errorMessage =
            "El reconocimiento de voz requiere una conexión segura (HTTPS). Por favor, accede a través de HTTPS.";
          shouldReport = true;
          break;
        default:
          errorMessage = `Error: ${event.error}`;
          shouldReport = true;
      }

      this.isListening = false;
      if (shouldReport) {
        onError?.(errorMessage);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.silenceTimeout) {
        clearTimeout(this.silenceTimeout);
        this.silenceTimeout = null;
      }
      // En algunos navegadores móviles, el reconocimiento se detiene automáticamente
      // después de un período de silencio, así que no es necesariamente un error
      // Si hay un transcript pendiente que no se procesó como final, intentar procesarlo
      // Esto es especialmente importante en móviles donde el reconocimiento puede terminar abruptamente
      if (lastTranscript && lastTranscript.trim()) {
        // Dar un pequeño delay para asegurar que cualquier transcript final se haya procesado
        // Si no se procesó, el hook en ChatInterface lo manejará cuando reciba el transcript
        setTimeout(() => {
          lastTranscript = "";
        }, 100);
      }
    };

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    try {
      this.recognition.start();
    } catch (error) {
      console.error("Error al iniciar reconocimiento:", error);
      onError?.("No se pudo iniciar el reconocimiento de voz");
    }
  }

  /**
   * Detiene el reconocimiento de voz
   */
  stop(): void {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.error("Error al detener reconocimiento:", error);
      }
      this.isListening = false;
    }
  }

  /**
   * Aborta el reconocimiento de voz
   */
  abort(): void {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
    if (this.recognition && this.isListening) {
      try {
        this.recognition.abort();
      } catch (error) {
        console.error("Error al abortar reconocimiento:", error);
      }
      this.isListening = false;
    }
  }

  /**
   * Verifica si está escuchando actualmente
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Verifica si el navegador soporta reconocimiento de voz
   */
  getIsSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Obtiene los idiomas disponibles
   */
  getAvailableLanguages(): string[] {
    // Idiomas comunes en español
    return [
      "es-CL", // Español Chile
      "es-MX", // Español México
      "es-AR", // Español Argentina
      "es-ES", // Español España
      "es-US", // Español Estados Unidos
      "es", // Español genérico
    ];
  }
}

// Instancia singleton
let sttInstance: SpeechToTextService | null = null;

export function getSpeechToTextService(): SpeechToTextService {
  if (!sttInstance) {
    sttInstance = new SpeechToTextService();
  }
  return sttInstance;
}

// Hook para React
export function useSpeechToText() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const stt = getSpeechToTextService();

  useEffect(() => {
    setIsSupported(stt.getIsSupported());
  }, []);

  const start = useCallback(
    (options?: STTOptions) => {
      setError(null);
      setTranscript("");

      stt.start(
        (text, isFinal) => {
          setTranscript(text);
          if (isFinal) {
            setIsListening(false);
          }
        },
        (errorMessage) => {
          setError(errorMessage);
          setIsListening(false);
        },
        options
      );

      setIsListening(true);
    },
    [stt]
  );

  const stop = useCallback(() => {
    stt.stop();
    setIsListening(false);
  }, [stt]);

  const abort = useCallback(() => {
    stt.abort();
    setIsListening(false);
    setTranscript("");
  }, [stt]);

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



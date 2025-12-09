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

  constructor() {
    if (typeof window !== "undefined") {
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
        console.warn(
          "Tu navegador no soporta reconocimiento de voz. Usa Chrome, Edge o Safari."
        );
      }
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    // Configuración por defecto
    this.recognition.lang = "es-CL";
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
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

      if (finalTranscript) {
        onResult(finalTranscript.trim(), true);
      } else if (interimTranscript) {
        onResult(interimTranscript, false);
      }
    };

    this.recognition.onerror = (event: any) => {
      let errorMessage = "Error en el reconocimiento de voz";

      switch (event.error) {
        case "no-speech":
          errorMessage = "No se detectó habla. Intenta de nuevo.";
          break;
        case "audio-capture":
          errorMessage =
            "No se pudo acceder al micrófono. Verifica los permisos.";
          break;
        case "not-allowed":
          errorMessage =
            "Permiso de micrófono denegado. Por favor, permite el acceso al micrófono.";
          break;
        case "network":
          errorMessage =
            "Error de red. Verifica tu conexión a internet.";
          break;
        case "aborted":
          // El usuario detuvo manualmente, no es un error
          return;
        default:
          errorMessage = `Error: ${event.error}`;
      }

      this.isListening = false;
      onError?.(errorMessage);
    };

    this.recognition.onend = () => {
      this.isListening = false;
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



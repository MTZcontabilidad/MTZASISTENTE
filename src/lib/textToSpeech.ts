/**
 * Servicio de Text-to-Speech (TTS) con voces naturales y conversacionales
 * Optimizado para accesibilidad y personas con discapacidad
 */

import { useState, useCallback } from "react";

interface TTSOptions {
  rate?: number; // Velocidad de habla (0.1 a 10, default: 1)
  pitch?: number; // Tono de voz (0 a 2, default: 1)
  volume?: number; // Volumen (0 a 1, default: 1)
  lang?: string; // Idioma (default: 'es-CL' para español de Chile)
  voice?: SpeechSynthesisVoice | null; // Voz específica
}

class TextToSpeechService {
  private synth: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking: boolean = false;
  private isPaused: boolean = false;
  private availableVoices: SpeechSynthesisVoice[] = [];
  private preferredVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      
      // Recargar voces cuando estén disponibles (algunos navegadores cargan voces de forma asíncrona)
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    } else {
      throw new Error("Tu navegador no soporta síntesis de voz");
    }
  }

  private loadVoices() {
    this.availableVoices = this.synth.getVoices();
    this.selectBestVoice();
  }

  /**
   * Selecciona la mejor voz disponible en español
   * Prioriza voces naturales y conversacionales
   */
  private selectBestVoice() {
    // Priorizar voces en español de Chile o español latinoamericano
    const preferredLangCodes = ["es-CL", "es-MX", "es-AR", "es-ES", "es"];
    
    // Buscar voces preferidas
    for (const langCode of preferredLangCodes) {
      const voice = this.availableVoices.find(
        (v) => v.lang.startsWith(langCode) && v.localService
      );
      if (voice) {
        this.preferredVoice = voice;
        return;
      }
    }

    // Si no hay voces preferidas, buscar cualquier voz en español
    const spanishVoice = this.availableVoices.find((v) =>
      v.lang.startsWith("es")
    );
    if (spanishVoice) {
      this.preferredVoice = spanishVoice;
      return;
    }

    // Fallback a la primera voz disponible
    this.preferredVoice = this.availableVoices[0] || null;
  }

  /**
   * Obtiene todas las voces disponibles en español
   */
  getAvailableSpanishVoices(): SpeechSynthesisVoice[] {
    return this.availableVoices.filter((voice) => voice.lang.startsWith("es"));
  }

  /**
   * Establece una voz específica
   */
  setVoice(voiceName: string) {
    const voice = this.availableVoices.find((v) => v.name === voiceName);
    if (voice) {
      this.preferredVoice = voice;
    }
  }

  /**
   * Lee un texto en voz alta con opciones personalizadas
   */
  speak(
    text: string,
    options: TTSOptions = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // Detener cualquier habla anterior
      this.stop();

      // Limpiar el texto (remover markdown, HTML, etc.)
      const cleanText = this.cleanText(text);

      if (!cleanText.trim()) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Configurar opciones
      utterance.rate = options.rate ?? 1.0; // Velocidad conversacional
      utterance.pitch = options.pitch ?? 1.0; // Tono natural
      utterance.volume = options.volume ?? 1.0;
      utterance.lang = options.lang ?? "es-CL";

      // Usar voz preferida o la especificada
      utterance.voice = options.voice || this.preferredVoice;

      // Eventos
      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (error) => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        reject(error);
      };

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.isPaused = false;
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    });
  }

  /**
   * Limpia el texto removiendo markdown, HTML y caracteres especiales
   */
  private cleanText(text: string): string {
    // Remover HTML
    let clean = text.replace(/<[^>]*>/g, "");

    // Remover markdown básico
    clean = clean
      .replace(/\*\*(.*?)\*\*/g, "$1") // Negrita
      .replace(/\*(.*?)\*/g, "$1") // Cursiva
      .replace(/`(.*?)`/g, "$1") // Código
      .replace(/#{1,6}\s/g, "") // Encabezados
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Enlaces
      .replace(/\n{3,}/g, "\n\n") // Múltiples saltos de línea
      .trim();

    // Reemplazar caracteres especiales por palabras
    clean = clean
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, " y ")
      .replace(/&lt;/g, " menor que ")
      .replace(/&gt;/g, " mayor que ")
      .replace(/→/g, " entonces ")
      .replace(/←/g, " desde ")
      .replace(/•/g, " punto ")
      .replace(/📋/g, " lista ")
      .replace(/🏛️/g, " SII ")
      .replace(/📁/g, " carpeta ")
      .replace(/💰/g, " dinero ")
      .replace(/🧾/g, " factura ")
      .replace(/💬/g, " mensaje ")
      .replace(/📄/g, " documento ");

    return clean;
  }

  /**
   * Pausa la reproducción actual
   */
  pause() {
    if (this.isSpeaking && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
    }
  }

  /**
   * Reanuda la reproducción pausada
   */
  resume() {
    if (this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
    }
  }

  /**
   * Detiene la reproducción actual
   */
  stop() {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
    this.isPaused = false;
    this.currentUtterance = null;
  }

  /**
   * Verifica si está hablando actualmente
   */
  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  /**
   * Verifica si está pausado
   */
  getIsPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Obtiene la voz actual
   */
  getCurrentVoice(): SpeechSynthesisVoice | null {
    return this.preferredVoice;
  }
}

// Instancia singleton
let ttsInstance: TextToSpeechService | null = null;

export function getTextToSpeechService(): TextToSpeechService {
  if (!ttsInstance) {
    try {
      ttsInstance = new TextToSpeechService();
    } catch (error) {
      console.error("Error inicializando TTS:", error);
      throw error;
    }
  }
  return ttsInstance;
}

// Hook para React
export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tts = getTextToSpeechService();

  const speak = useCallback(
    async (text: string, options?: TTSOptions) => {
      try {
        setError(null);
        setIsSpeaking(true);
        await tts.speak(text, options);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error al leer el texto";
        setError(errorMessage);
        console.error("Error en TTS:", err);
      } finally {
        setIsSpeaking(false);
      }
    },
    [tts]
  );

  const pause = useCallback(() => {
    tts.pause();
    setIsPaused(true);
  }, [tts]);

  const resume = useCallback(() => {
    tts.resume();
    setIsPaused(false);
  }, [tts]);

  const stop = useCallback(() => {
    tts.stop();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [tts]);

  return {
    speak,
    pause,
    resume,
    stop,
    isSpeaking,
    isPaused,
    error,
    availableVoices: tts.getAvailableSpanishVoices(),
    currentVoice: tts.getCurrentVoice(),
  };
}



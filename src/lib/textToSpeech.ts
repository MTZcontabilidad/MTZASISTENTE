/**
 * Servicio de Text-to-Speech (TTS) con voces naturales y conversacionales
 * Optimizado para accesibilidad y personas con discapacidad
 */

import { useState, useCallback } from "react";
import { speakWithGemini } from "./geminiTTS";

interface TTSOptions {
  rate?: number; // Velocidad de habla (0.1 a 10, default: 1)
  pitch?: number; // Tono de voz (0 a 2, default: 1)
  volume?: number; // Volumen (0 a 1, default: 1)
  lang?: string; // Idioma (default: 'es-CL' para español de Chile)
  voice?: SpeechSynthesisVoice | null; // Voz específica
  useGemini?: boolean; // Si debe intentar usar Gemini TTS primero (default: true)
  geminiVoice?: string; // Voz específica de Gemini (ej: 'es-CL-Neural2-A')
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
    // Lista de nombres de voces preferidas (más naturales)
    // Estas voces suelen sonar mejor en diferentes navegadores
    const preferredVoiceNames = [
      "Microsoft Sabina - Spanish (Mexico)", // Windows - muy natural
      "Google español", // Chrome - buena calidad
      "Microsoft Pablo - Spanish (Spain)", // Windows
      "Microsoft Helena - Spanish (Spain)", // Windows
      "Microsoft Laura - Spanish (Spain)", // Windows
      "es-ES-Standard-A", // Google Cloud TTS (si está disponible)
      "es-MX-Standard-A", // Google Cloud TTS
      "es-CL-Standard-A", // Google Cloud TTS
    ];

    // Primero buscar voces preferidas por nombre
    for (const preferredName of preferredVoiceNames) {
      const voice = this.availableVoices.find((v) =>
        v.name.includes(preferredName) || preferredName.includes(v.name)
      );
      if (voice && voice.lang.startsWith("es")) {
        this.preferredVoice = voice;
        return;
      }
    }

    // Priorizar voces en español de Chile o español latinoamericano
    const preferredLangCodes = ["es-CL", "es-MX", "es-AR", "es-CO", "es-ES", "es"];
    
    // Buscar voces preferidas (priorizar voces locales que suelen ser mejores)
    for (const langCode of preferredLangCodes) {
      // Primero buscar voces locales
      const localVoice = this.availableVoices.find(
        (v) => v.lang.startsWith(langCode) && v.localService
      );
      if (localVoice) {
        this.preferredVoice = localVoice;
        return;
      }
      
      // Si no hay local, buscar cualquier voz en ese idioma
      const voice = this.availableVoices.find(
        (v) => v.lang.startsWith(langCode)
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
   * Intenta usar Gemini TTS primero si está disponible, luego fallback a navegador
   */
  async speak(
    text: string,
    options: TTSOptions = {}
  ): Promise<void> {
    // Detener cualquier habla anterior
    this.stop();

    // Limpiar el texto (remover markdown, HTML, etc.)
    const cleanText = this.cleanText(text);

    if (!cleanText.trim()) {
      return;
    }

    // Intentar usar Gemini TTS si está habilitado (default: true)
    if (options.useGemini !== false) {
      try {
        const geminiOptions = {
          languageCode: options.lang || 'es-CL',
          voiceName: options.geminiVoice || 'es-CL-Neural2-A', // Voz neural más natural
          speakingRate: options.rate ? options.rate * 0.95 : 1.15, // Más rápido y dinámico
          pitch: options.pitch ? (options.pitch - 1) * 20 : 3, // Pitch más alto (amigable y con carisma)
        };

        const success = await speakWithGemini(cleanText, geminiOptions);
        if (success) {
          this.isSpeaking = false; // Gemini maneja su propio estado
          return;
        }
      } catch (error) {
        console.log('Gemini TTS no disponible, usando TTS del navegador:', error);
        // Continuar con TTS del navegador
      }
    }

    // Fallback a TTS del navegador
    return new Promise((resolve, reject) => {

      const utterance = new SpeechSynthesisUtterance(cleanText);

      // Configurar opciones con valores más naturales, rápidos y amigables
      // Velocidad más rápida para sonar más dinámico y amigable (1.1-1.2 es ideal)
      utterance.rate = options.rate ?? 1.15; // Velocidad más rápida y dinámica
      // Pitch ligeramente más alto para sonar más amigable y con carisma (1.1-1.2 es ideal)
      utterance.pitch = options.pitch ?? 1.15; // Tono más alto, amigable y simpático
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
   * Mejora la pronunciación para que suene más natural
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

    // Mejorar pronunciación de números y fechas
    clean = this.improveNumberPronunciation(clean);
    
    // Mejorar pronunciación de acrónimos comunes
    clean = this.improveAcronymPronunciation(clean);

    // Reemplazar caracteres especiales por palabras más naturales
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
      .replace(/📄/g, " documento ")
      .replace(/✅/g, " correcto ")
      .replace(/❌/g, " incorrecto ")
      .replace(/⚠️/g, " atención ")
      .replace(/ℹ️/g, " información ");

    // Agregar pausas naturales después de puntuación
    clean = clean
      .replace(/\./g, ". ") // Pausa después de punto
      .replace(/\?/g, "? ") // Pausa después de pregunta
      .replace(/!/g, "! ") // Pausa después de exclamación
      .replace(/,/g, ", ") // Pausa breve después de coma
      .replace(/;/g, "; ") // Pausa después de punto y coma
      .replace(/:/g, ": "); // Pausa después de dos puntos

    // Limpiar espacios múltiples
    clean = clean.replace(/\s+/g, " ").trim();

    return clean;
  }

  /**
   * Mejora la pronunciación de números para que suenen más naturales
   */
  private improveNumberPronunciation(text: string): string {
    // Convertir números grandes a palabras más naturales
    // Ejemplo: "2024" -> "dos mil veinticuatro" (solo para años)
    
    // Mejorar fechas: DD/MM/YYYY o DD-MM-YYYY
    text = text.replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g, (match, day, month, year) => {
      return `${day} de ${this.monthName(parseInt(month))} de ${year}`;
    });

    // Mejorar porcentajes: "50%" -> "cincuenta por ciento"
    text = text.replace(/(\d+)%/g, (match, num) => {
      const number = parseInt(num);
      if (number <= 100) {
        return `${this.numberToWords(number)} por ciento`;
      }
      return match;
    });

    // Mejorar números de teléfono: agregar pausas
    text = text.replace(/(\d{2,3})[\s\-]?(\d{4})[\s\-]?(\d{4})/g, "$1 $2 $3");

    return text;
  }

  /**
   * Convierte números a palabras en español (solo para números pequeños)
   */
  private numberToWords(num: number): string {
    const units = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
    const teens = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"];
    const tens = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];

    if (num === 0) return "cero";
    if (num < 10) return units[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) {
      const ten = Math.floor(num / 10);
      const unit = num % 10;
      if (unit === 0) return tens[ten];
      if (ten === 2) return `veinti${units[unit]}`;
      return `${tens[ten]} y ${units[unit]}`;
    }
    if (num === 100) return "cien";
    return num.toString(); // Para números mayores, mantener como está
  }

  /**
   * Obtiene el nombre del mes en español
   */
  private monthName(month: number): string {
    const months = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
    return months[month - 1] || month.toString();
  }

  /**
   * Mejora la pronunciación de acrónimos comunes
   */
  private improveAcronymPronunciation(text: string): string {
    const acronyms: { [key: string]: string } = {
      "SII": "S I I",
      "RUT": "R U T",
      "API": "A P I",
      "URL": "U R L",
      "PDF": "P D F",
      "HTML": "H T M L",
      "CSS": "C S S",
      "JS": "J S",
      "MTZ": "M T Z",
    };

    let result = text;
    for (const [acronym, pronunciation] of Object.entries(acronyms)) {
      // Solo reemplazar si es una palabra completa (no parte de otra palabra)
      const regex = new RegExp(`\\b${acronym}\\b`, "gi");
      result = result.replace(regex, pronunciation);
    }

    return result;
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



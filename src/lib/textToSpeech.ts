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
    
    // Validar que la voz seleccionada NO sea española
    if (this.preferredVoice) {
      const isSpanish = this.preferredVoice.lang.startsWith("es-ES") || 
                       this.preferredVoice.name.toLowerCase().includes("spain") ||
                       this.preferredVoice.name.toLowerCase().includes("españa");
      
      if (isSpanish) {
        // En lugar de advertencia, solo log informativo
        console.log('ℹ️ Voz española detectada en loadVoices. Se intentará buscar una latina, pero se permitirá si no hay otra.');
        // No forzamos cambio inmediato aquí, dejamos que selectBestVoice decida
      }
    }
    
    // Log de todas las voces disponibles para depuración
    console.log('📢 Voces disponibles:', this.availableVoices.map(v => ({
      name: v.name,
      lang: v.lang,
      local: v.localService,
      isChile: v.lang.startsWith("es-CL"),
      isSpain: v.lang.startsWith("es-ES")
    })));
  }

  /**
   * Selecciona la mejor voz disponible en español
   * Prioriza voces naturales y conversacionales
   */
  private selectBestVoice() {
    // PRIORIDAD ABSOLUTA: VOCES CHILENAS (es-CL)
    // NUNCA usar voces de España (es-ES)
    
    // PASO 1: Buscar voces chilenas específicamente (MÁXIMA PRIORIDAD)
    const chileVoices = this.availableVoices.filter((v) => 
      v.lang.startsWith("es-CL") || 
      v.lang === "es-CL" ||
      v.name.toLowerCase().includes("chile") ||
      v.name.toLowerCase().includes("es-cl")
    );
    
    if (chileVoices.length > 0) {
      // Priorizar voces locales de Chile
      const localChileVoice = chileVoices.find(v => v.localService);
      if (localChileVoice) {
        this.preferredVoice = localChileVoice;
        console.log('✅ Voz chilena seleccionada (local):', localChileVoice.name, localChileVoice.lang);
        return;
      }
      // Cualquier voz de Chile
      this.preferredVoice = chileVoices[0];
      console.log('✅ Voz chilena seleccionada:', this.preferredVoice.name, this.preferredVoice.lang);
      return;
    }

    // PASO 2: Buscar voces latinoamericanas (México, Argentina, Colombia, etc.) - NUNCA España
    const latinAmericanVoices = this.availableVoices.filter((v) => {
      const lang = v.lang.toLowerCase();
      return (
        lang.startsWith("es-mx") || // México
        lang.startsWith("es-ar") || // Argentina
        lang.startsWith("es-co") || // Colombia
        lang.startsWith("es-pe") || // Perú
        lang.startsWith("es-ve") || // Venezuela
        lang.startsWith("es-us") || // Español de EEUU
        (lang === "es" && !lang.startsWith("es-es")) || // Español genérico pero NO España
        v.name.toLowerCase().includes("mexico") ||
        v.name.toLowerCase().includes("mexican") ||
        v.name.toLowerCase().includes("argentina") ||
        v.name.toLowerCase().includes("colombia") ||
        (v.name.toLowerCase().includes("spanish") && 
         !v.name.toLowerCase().includes("spain") &&
         !v.name.toLowerCase().includes("españa"))
      );
    });

    if (latinAmericanVoices.length > 0) {
      // Priorizar voces locales latinoamericanas
      const localLatinVoice = latinAmericanVoices.find(v => v.localService);
      if (localLatinVoice) {
        this.preferredVoice = localLatinVoice;
        console.log('✅ Voz latinoamericana seleccionada (local):', localLatinVoice.name, localLatinVoice.lang);
        return;
      }
      // Cualquier voz latinoamericana
      this.preferredVoice = latinAmericanVoices[0];
      console.log('✅ Voz latinoamericana seleccionada:', this.preferredVoice.name, this.preferredVoice.lang);
      return;
    }

    // PASO 3: Lista de nombres de voces preferidas (SOLO LATINOAMÉRICA - NUNCA ESPAÑA)
    const preferredVoiceNames = [
      // Voces de Windows - México (muy naturales, latinas)
      "Microsoft Sabina - Spanish (Mexico)",
      "Microsoft Raul - Spanish (Mexico)",
      "Microsoft Pablo - Spanish (Mexico)",
      "Microsoft Zira - Spanish (Mexico)",
      "Microsoft Helena - Spanish (Mexico)",
      // Voces de Chrome/Edge
      "Google español",
      // Voces de Google Cloud (si están disponibles localmente)
      "es-CL-Standard-A",
      "es-CL-Neural2-A",
      "es-MX-Standard-A",
      "es-AR-Standard-A",
      "es-CO-Standard-A",
    ];

    // Buscar voces preferidas por nombre (excluyendo España explícitamente)
    for (const preferredName of preferredVoiceNames) {
      const voice = this.availableVoices.find((v) => {
        const nameMatch = v.name.includes(preferredName) || preferredName.includes(v.name);
        const notSpain = !v.lang.startsWith("es-ES") && 
                        !v.name.toLowerCase().includes("spain") &&
                        !v.name.toLowerCase().includes("españa");
        return nameMatch && notSpain && v.lang.startsWith("es");
      });
      
      if (voice) {
        // Priorizar voces de Chile
        if (voice.lang.startsWith("es-CL")) {
          this.preferredVoice = voice;
          console.log('✅ Voz chilena encontrada por nombre:', voice.name, voice.lang);
          return;
        }
        // Si no hay de Chile, usar esta voz temporalmente (pero no España)
        if (!this.preferredVoice) {
          this.preferredVoice = voice;
        }
      }
    }

    // Si encontramos una voz de Chile en la búsqueda anterior, usarla
    if (this.preferredVoice && this.preferredVoice.lang.startsWith("es-CL")) {
      return;
    }

    // PASO 4: Buscar por códigos de idioma (SOLO LATINOAMÉRICA - NUNCA ESPAÑA)
    const preferredLangCodes = ["es-CL", "es-MX", "es-AR", "es-CO", "es-PE", "es-VE", "es-US"];
    
    for (const langCode of preferredLangCodes) {
      // Buscar voces locales primero
      const localVoice = this.availableVoices.find(
        (v) => v.lang.startsWith(langCode) && v.localService && !v.lang.startsWith("es-ES")
      );
      if (localVoice) {
        this.preferredVoice = localVoice;
        console.log('✅ Voz latinoamericana seleccionada (local):', localVoice.name, localVoice.lang);
        return;
      }
      
      // Si no hay local, buscar cualquier voz en ese idioma
      const voice = this.availableVoices.find(
        (v) => v.lang.startsWith(langCode) && !v.lang.startsWith("es-ES")
      );
      if (voice) {
        this.preferredVoice = voice;
        console.log('✅ Voz latinoamericana seleccionada:', voice.name, voice.lang);
        return;
      }
    }

    // PASO 5: Buscar cualquier voz en español genérico PERO NUNCA España
    const spanishVoice = this.availableVoices.find((v) => {
      const lang = v.lang.toLowerCase();
      return (
        lang === "es" || 
        lang.startsWith("es-")
      ) && (
        !lang.startsWith("es-es") &&
        !v.name.toLowerCase().includes("spain") &&
        !v.name.toLowerCase().includes("españa")
      );
    });
    
    if (spanishVoice) {
      this.preferredVoice = spanishVoice;
      console.log('⚠️ Voz genérica seleccionada (no España):', spanishVoice.name, spanishVoice.lang);
      return;
    }
    
    // ÚLTIMO RECURSO: Si no hay ninguna otra opción, usar la primera disponible
    // Pero mostrar advertencia si es de España
    const anyVoice = this.availableVoices.find((v) => v.lang.startsWith("es"));
    if (anyVoice) {
      if (anyVoice.lang.startsWith("es-ES")) {
        console.warn('⚠️ ADVERTENCIA: Solo se encontraron voces de España. Se recomienda instalar voces latinoamericanas.');
      }
      // Permitimos cualquier voz en español como último recurso
      this.preferredVoice = anyVoice;
      console.log('⚠️ Fallback: Usando voz disponible (posiblemente España):', anyVoice.name);
      return;
    }

    // Fallback a la primera voz disponible
    this.preferredVoice = this.availableVoices[0] || null;
  }

  /**
   * Fuerza la selección de una voz chilena o latinoamericana
   * Se llama cuando se detecta que la voz actual es española
   */
  private forceChileanVoice() {
    // Buscar voz chilena específicamente
    const chileVoice = this.availableVoices.find(v => 
      v.lang.startsWith("es-CL") && !v.lang.startsWith("es-ES")
    );
    
    if (chileVoice) {
      this.preferredVoice = chileVoice;
      console.log('✅ Voz chilena forzada:', chileVoice.name, chileVoice.lang);
      return;
    }
    
    // Buscar voces latinoamericanas (México, Argentina, etc.)
    const latinVoices = this.availableVoices.filter(v => {
      const lang = v.lang.toLowerCase();
      return (lang.startsWith("es-mx") || 
             lang.startsWith("es-ar") || 
             lang.startsWith("es-co") ||
             lang.startsWith("es-pe") ||
             lang.startsWith("es-ve") ||
             lang.startsWith("es-us")) &&
             !lang.startsWith("es-es");
    });
    
    if (latinVoices.length > 0) {
      // Priorizar voces locales
      const localVoice = latinVoices.find(v => v.localService);
      this.preferredVoice = localVoice || latinVoices[0];
      console.log('✅ Voz latinoamericana forzada:', this.preferredVoice.name, this.preferredVoice.lang);
      return;
    }
    
    // Buscar cualquier voz que NO sea España
    const nonSpanishVoice = this.availableVoices.find(v => 
      v.lang.startsWith("es") && 
      !v.lang.startsWith("es-ES") &&
      !v.name.toLowerCase().includes("spain") &&
      !v.name.toLowerCase().includes("españa")
    );
    
    if (nonSpanishVoice) {
      this.preferredVoice = nonSpanishVoice;
      console.log('✅ Voz no-española forzada:', nonSpanishVoice.name, nonSpanishVoice.lang);
    } else {
      console.warn('⚠️ No se encontró voz latinoamericana. Usando cualquier voz en español disponible.');
      const anySpanish = this.availableVoices.find(v => v.lang.startsWith("es"));
      if (anySpanish) {
          this.preferredVoice = anySpanish;
          console.log('✅ Fallback final a:', anySpanish.name);
      } else {
          console.error('❌ No se encontró NINGUNA voz en español.');
      }
    }
  }

  /**
   * Obtiene todas las voces disponibles en español (excluyendo España)
   */
  getAvailableSpanishVoices(): SpeechSynthesisVoice[] {
    return this.availableVoices.filter((voice) => 
      voice.lang.startsWith("es") && 
      !voice.lang.startsWith("es-ES") &&
      !voice.name.toLowerCase().includes("spain") &&
      !voice.name.toLowerCase().includes("españa")
    );
  }
  
  /**
   * Obtiene todas las voces chilenas disponibles
   */
  getChileanVoices(): SpeechSynthesisVoice[] {
    return this.availableVoices.filter((voice) => 
      voice.lang.startsWith("es-CL") || 
      voice.name.toLowerCase().includes("chile")
    );
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

    // Intentar usar Gemini TTS si está explícitamente habilitado (default: false - usar navegador gratis)
    if (options.useGemini === true) {
      try {
        const geminiOptions = {
          languageCode: options.lang || 'es-CL',
          voiceName: options.geminiVoice || 'es-CL-Neural2-A', // Voz neural más natural y latina
          speakingRate: options.rate ? options.rate * 0.95 : 1.1, // Velocidad más fluida (1.1 es ideal para sonar natural)
          pitch: options.pitch ? (options.pitch - 1) * 20 : 2.0, // Pitch más alto para sonar genial y amigable (2.0 semitonos)
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

      // Configurar opciones con valores optimizados para sonar natural y profesional
      // Velocidad optimizada: 1.1 es ideal para conversación natural (no muy rápido, no muy lento)
      utterance.rate = options.rate ?? 1.1; // Velocidad por defecto 1.1 (más natural)
      // Pitch optimizado: 1.05-1.1 es ideal para sonar amigable pero profesional
      utterance.pitch = options.pitch ?? 1.05; // Tono ligeramente más alto, amigable y profesional
      utterance.volume = options.volume ?? 1.0;
      
      // FORZAR selección de voz chilena o latinoamericana - RECHAZAR España
      let selectedVoice = options.voice || this.preferredVoice;

      // Configurar idioma basado en la voz seleccionada
      // Si forzamos es-CL pero la voz es es-MX, el navegador podría ignorar la voz seleccionada
      if (selectedVoice) {
        utterance.lang = selectedVoice.lang;
      } else {
        utterance.lang = "es-CL"; // Default si no hay voz específica
      }
      
      // Validar que la voz NO sea de España
      if (selectedVoice) {
        const isSpanish = selectedVoice.lang.startsWith("es-ES") || 
                         selectedVoice.name.toLowerCase().includes("spain") ||
                         selectedVoice.name.toLowerCase().includes("españa");
        
        if (isSpanish) {
          console.log('⚠️ Voz española solicitada. Intentando mejorar...');
          // Buscar voz chilena
          const chileVoice = this.availableVoices.find(v => 
            v.lang.startsWith("es-CL") && !v.lang.startsWith("es-ES")
          );
          if (chileVoice) {
            selectedVoice = chileVoice;
            console.log('✅ Voz chilena forzada:', chileVoice.name, chileVoice.lang);
          } else {
            // Buscar cualquier voz latinoamericana
            const latinVoice = this.availableVoices.find(v => {
              const lang = v.lang.toLowerCase();
              return (lang.startsWith("es-mx") || 
                     lang.startsWith("es-ar") || 
                     lang.startsWith("es-co") ||
                     lang.startsWith("es-pe") ||
                     lang.startsWith("es-ve") ||
                     lang.startsWith("es-us")) &&
                     !lang.startsWith("es-es");
            });
            if (latinVoice) {
              selectedVoice = latinVoice;
              console.log('✅ Voz latinoamericana forzada:', latinVoice.name, latinVoice.lang);
            } else {
               // Si llegamos aqui, es porque NO hay voces latinas.
               // PERMITIMOS la voz de España en lugar de fallar o buscar "nonSpanishVoice"
               console.log('⚠️ No hay voces latinas. Manteniendo voz seleccionada (España) como fallback.');
            }
          }
        }
      } else {
        // Si no hay voz seleccionada, forzar búsqueda de voz chilena
        this.forceChileanVoice();
        selectedVoice = this.preferredVoice;
      }
      
      utterance.voice = selectedVoice;
      
      // Log final para depuración
      if (selectedVoice) {
        console.log('🎤 Voz final seleccionada:', selectedVoice.name, selectedVoice.lang, 
                   selectedVoice.lang.startsWith("es-CL") ? "✅ CHILENA" : 
                   selectedVoice.lang.startsWith("es-ES") ? "❌ ESPAÑOLA" : "⚠️ LATINOAMERICANA");
      }

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

    // Remover markdown básico y símbolos ANTES de procesar el contenido
    // PRIMERO: Remover TODOS los asteriscos (incluyendo dobles) antes de procesar markdown
    clean = clean
      .replace(/\*\*/g, "") // Remover asteriscos dobles PRIMERO
      .replace(/\*/g, "") // Remover TODOS los asteriscos sueltos
      .replace(/`(.*?)`/g, "$1") // Código inline (sin asteriscos)
      .replace(/```[\s\S]*?```/g, "") // Bloques de código
      .replace(/#{1,6}\s/g, "") // Encabezados
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Enlaces
      .replace(/\n{3,}/g, "\n\n"); // Múltiples saltos de línea
    
    // Luego remover TODOS los símbolos restantes que no sean necesarios para pronunciación
    // (Ya no hay asteriscos aquí, pero mantenemos la estructura por si acaso)
    clean = clean
      .replace(/_/g, " ") // Reemplazar guiones bajos con espacios
      .replace(/~/g, "") // Remover tildes
      .replace(/`/g, "") // Remover backticks
      .replace(/#/g, "") // Remover numerales
      .replace(/\^/g, "") // Remover símbolos de potencia
      .replace(/&/g, " y ") // Reemplazar & con "y"
      // Remover símbolos matemáticos y operadores que no se deben pronunciar
      .replace(/\+/g, "") // Remover + (no pronunciar "más")
      .replace(/=/g, "") // Remover = (no pronunciar "igual")
      .replace(/\|/g, "") // Remover | (no pronunciar "o")
      .replace(/\\/g, "") // Remover backslashes
      .replace(/\//g, " ") // Reemplazar slashes con espacios
      .trim();

    // Mejorar pronunciación chilena (voz -> vos, etc.)
    clean = this.improveChileanPronunciation(clean);
    
    // Mejorar pronunciación de números y fechas
    clean = this.improveNumberPronunciation(clean);
    
    // Mejorar pronunciación de acrónimos comunes
    clean = this.improveAcronymPronunciation(clean);

    // Remover todos los emojis y caracteres especiales
    clean = clean
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, "") // Remover emojis
      .replace(/[\u{2600}-\u{26FF}]/gu, "") // Remover símbolos misceláneos
      .replace(/[\u{2700}-\u{27BF}]/gu, "") // Remover símbolos Dingbats
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, " y ")
      .replace(/&lt;/g, "")
      .replace(/&gt;/g, "")
      .replace(/→/g, "")
      .replace(/←/g, "")
      .replace(/•/g, "")
      .replace(/📋/g, "")
      .replace(/🏛️/g, " SII ")
      .replace(/📁/g, "")
      .replace(/💰/g, "")
      .replace(/🧾/g, "")
      .replace(/💬/g, "")
      .replace(/📄/g, "")
      .replace(/✅/g, "")
      .replace(/❌/g, "")
      .replace(/⚠️/g, "")
      .replace(/ℹ️/g, "")
      .replace(/👋/g, "")
      .replace(/📊/g, "")
      .replace(/🚐/g, "")
      .replace(/🪑/g, "")
      .replace(/📋/g, "")
      .replace(/💬/g, "")
      .replace(/📅/g, "");

    // Agregar pausas naturales después de puntuación - REDUCIR pausas excesivas
    // Los puntos deben tener pausa breve para sonar más natural y fluido
    clean = clean
      .replace(/\.\s{2,}/g, ". ") // Reducir múltiples espacios después de punto a uno solo
      .replace(/\?\s{2,}/g, "? ") // Reducir múltiples espacios después de pregunta
      .replace(/!\s{2,}/g, "! ") // Reducir múltiples espacios después de exclamación
      .replace(/\.\s+/g, ". ") // Pausa breve después de punto (un solo espacio)
      .replace(/\?\s+/g, "? ") // Pausa breve después de pregunta
      .replace(/!\s+/g, "! ") // Pausa breve después de exclamación
      .replace(/,\s*/g, ", ") // Pausa breve después de coma
      .replace(/;\s*/g, "; ") // Pausa después de punto y coma
      .replace(/:\s*/g, ": "); // Pausa después de dos puntos
    
    // Mejorar pronunciación de "Arise" - asegurar fluidez sin pausas extra
    // "Soy Arise" debe sonar natural y fluido, sin pausa excesiva
    clean = clean
      .replace(/\bSoy\s*,\s*Arise\b/gi, "Soy Arise") // Eliminar comas que agreguen pausa extra
      .replace(/\bSoy\s+Arise\b/gi, "Soy Arise"); // Mantener "Soy Arise" fluido sin pausa extra
    
    // Agregar pausas naturales en listas y enumeraciones
    clean = clean
      .replace(/\n\s*[-•]\s+/g, ". ") // Convertir viñetas en pausas
      .replace(/\n\s*\d+\.\s+/g, ". ") // Convertir números de lista en pausas
      .replace(/\n\n+/g, ". "); // Convertir saltos de línea múltiples en pausas
    
    // Mejorar pausas en frases largas (agregar pausas naturales)
    // Después de conjunciones comunes
    clean = clean
      .replace(/\s+y\s+/g, ", y ") // Pausa antes de "y" en listas
      .replace(/\s+o\s+/g, ", o ") // Pausa antes de "o"
      .replace(/\s+pero\s+/g, ", pero ") // Pausa antes de "pero"
      .replace(/\s+sin embargo\s+/g, ", sin embargo "); // Pausa antes de "sin embargo"
    
    // Agregar pausas naturales después de frases comunes
    clean = clean
      .replace(/(\w+)\s+(por ejemplo)\s+/gi, "$1. Por ejemplo, ") // Pausa antes de "por ejemplo"
      .replace(/(\w+)\s+(es decir)\s+/gi, "$1. Es decir, ") // Pausa antes de "es decir"
      .replace(/(\w+)\s+(además)\s+/gi, "$1. Además, "); // Pausa antes de "además"

    // Limpiar espacios múltiples pero mantener pausas naturales
    clean = clean.replace(/\s{3,}/g, " ").trim();

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
   * Mejora la pronunciación para que suene más chilena
   * Corrige palabras comunes que se pronuncian diferente en Chile
   */
  private improveChileanPronunciation(text: string): string {
    // La lógica anterior reemplazaba indiscriminadamente "voz" por "vos", lo cual es incorrecto
    // y genera problemas de pronunciación. En el contexto de un asistente, es mejor
    // mantener un español neutro o estándar de Chile sin forzar el voseo escrito.
    return text;
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
    // Validar que la voz actual NO sea española
    if (this.preferredVoice) {
      const isSpanish = this.preferredVoice.lang.startsWith("es-ES") || 
                       this.preferredVoice.name.toLowerCase().includes("spain") ||
                       this.preferredVoice.name.toLowerCase().includes("españa");
      
      if (isSpanish) {
        console.warn('⚠️ Voz española detectada en getCurrentVoice, forzando voz chilena...');
        this.forceChileanVoice();
      }
    }
    
    return this.preferredVoice;
  }
  
  /**
   * Método de depuración: muestra todas las voces disponibles y cuál está seleccionada
   */
  debugVoices() {
    console.log('=== DEBUG VOCES ===');
    console.log('Voz seleccionada actualmente:', this.preferredVoice ? {
      name: this.preferredVoice.name,
      lang: this.preferredVoice.lang,
      isChile: this.preferredVoice.lang.startsWith("es-CL"),
      isSpain: this.preferredVoice.lang.startsWith("es-ES")
    } : 'NINGUNA');
    
    console.log('\nTodas las voces en español:');
    this.availableVoices
      .filter(v => v.lang.startsWith("es"))
      .forEach(v => {
        const isChile = v.lang.startsWith("es-CL");
        const isSpain = v.lang.startsWith("es-ES");
        const isSelected = v === this.preferredVoice;
        console.log(`${isSelected ? '👉' : '  '} ${v.name} | ${v.lang} | ${isChile ? '✅ CHILE' : isSpain ? '❌ ESPAÑA' : '⚠️ OTRO'}`);
      });
    
    console.log('\nVoces chilenas disponibles:');
    const chileVoices = this.getChileanVoices();
    if (chileVoices.length > 0) {
      chileVoices.forEach(v => console.log(`  ✅ ${v.name} | ${v.lang}`));
    } else {
      console.log('  ❌ NO HAY VOCES CHILENAS DISPONIBLES');
    }
    
    console.log('==================');
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



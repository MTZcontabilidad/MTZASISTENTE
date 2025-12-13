/**
 * Integración con Google Cloud Text-to-Speech API
 * Usa las mismas voces que Gemini para una experiencia más natural
 */

import { supabase } from './supabase';
// import { getGeminiApiKey } from './geminiApiKey'; // Deprecated


export interface GeminiTTSOptions {
  text: string;
  languageCode?: string; // 'es-CL', 'es-MX', 'es-ES', etc.
  voiceName?: string; // 'es-CL-Standard-A', 'es-US-Neural2-A', etc.
  speakingRate?: number; // 0.25 a 4.0, default 1.0
  pitch?: number; // -20.0 a 20.0 semitones, default 0
  volumeGainDb?: number; // -96.0 a 16.0 dB, default 0
  audioEncoding?: 'MP3' | 'OGG_OPUS' | 'LINEAR16'; // default 'MP3'
}

interface GeminiTTSResponse {
  audioContent: string; // Base64 encoded audio
  audioFormat: string;
}

// Re-exportar getGeminiApiKey para compatibilidad
// export { getGeminiApiKey };


/**
 * Convierte texto a audio usando Google Cloud Text-to-Speech API
 * Usa las mismas voces que Gemini para una experiencia más natural
 */
export async function textToSpeechWithGemini(
  options: GeminiTTSOptions
): Promise<string | null> {
  try {
    const {
      text,
      languageCode = 'es-CL',
      voiceName = 'es-CL-Neural2-A',
      speakingRate = 1.1,
      pitch = 2.0,
      volumeGainDb = 0,
      audioEncoding = 'MP3'
    } = options;

    // Limpiar el texto
    const cleanText = cleanTextForTTS(text);
    
    if (!cleanText.trim()) {
      return null;
    }

    // Configurar el cuerpo para la Edge Function
    const requestBody = {
      input: { text: cleanText },
      voice: {
        languageCode,
        name: voiceName,
        ssmlGender: 'NEUTRAL'
      },
      audioConfig: {
        audioEncoding,
        speakingRate,
        pitch,
        volumeGainDb
      }
    };

    // Llamar a Supabase Edge Function 'google-tts'
    const { data, error } = await supabase.functions.invoke('google-tts', {
      body: requestBody
    });

    if (error) {
      console.error('Error en Supabase Edge Function (google-tts):', error);
      // Fallback a TTS del navegador si falla el servidor
      return null;
    }

    if (!data || !data.audioContent) {
       console.warn('Respuesta inválida de google-tts:', data);
       return null;
    }

    return data.audioContent; // Base64 encoded audio
  } catch (error) {
    console.error('Error en textToSpeechWithGemini:', error);
    return null; // Fallback a TTS del navegador
  }
}

/**
 * Reproduce audio desde base64 usando el Audio API
 */
export function playAudioFromBase64(base64Audio: string, format: string = 'mp3'): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Convertir base64 a blob
      const audioData = atob(base64Audio);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < audioData.length; i++) {
        uint8Array[i] = audioData.charCodeAt(i);
      }

      const mimeType = format === 'mp3' ? 'audio/mpeg' : 
                      format === 'ogg' ? 'audio/ogg' : 
                      'audio/wav';
      
      const blob = new Blob([uint8Array], { type: mimeType });
      const audioUrl = URL.createObjectURL(blob);
      
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      
      audio.onerror = (error) => {
        URL.revokeObjectURL(audioUrl);
        reject(error);
      };
      
      audio.play();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Limpia el texto para TTS (similar a textToSpeech.ts pero optimizado)
 */
export function cleanTextForTTS(text: string): string {
  // Asegurar que text sea un string
  if (typeof text !== 'string') {
    console.warn('cleanTextForTTS recibió un valor que no es string:', typeof text, text);
    text = String(text || '');
  }
  
  // Remover HTML
  let clean = text.replace(/<[^>]*>/g, '');

  // Remover markdown básico
  clean = clean
    .replace(/\*\*(.*?)\*\*/g, '$1') // Negrita
    .replace(/\*(.*?)\*/g, '$1') // Cursiva
    .replace(/`(.*?)`/g, '$1') // Código
    .replace(/#{1,6}\s/g, '') // Encabezados
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Enlaces
    .replace(/\n{3,}/g, '\n\n') // Múltiples saltos de línea
    .trim();

  // Reemplazar emojis por palabras
  clean = clean
    .replace(/📋/g, 'lista')
    .replace(/🏛️/g, 'S I I')
    .replace(/📁/g, 'carpeta')
    .replace(/💰/g, 'dinero')
    .replace(/🧾/g, 'factura')
    .replace(/💬/g, 'mensaje')
    .replace(/📄/g, 'documento')
    .replace(/✅/g, 'correcto')
    .replace(/❌/g, 'incorrecto')
    .replace(/⚠️/g, 'atención')
    .replace(/ℹ️/g, 'información');

  // Mejorar pronunciación de acrónimos
  const acronyms: { [key: string]: string } = {
    'SII': 'S I I',
    'RUT': 'R U T',
    'API': 'A P I',
    'URL': 'U R L',
    'PDF': 'P D F',
    'MTZ': 'M T Z',
  };

  for (const [acronym, pronunciation] of Object.entries(acronyms)) {
    const regex = new RegExp(`\\b${acronym}\\b`, 'gi');
    clean = clean.replace(regex, pronunciation);
  }

  // Limpiar espacios múltiples
  clean = clean.replace(/\s+/g, ' ').trim();

  return clean;
}

/**
 * Obtiene las voces disponibles de Google Cloud TTS para español
 */
export const GEMINI_VOICES = {
  'es-CL': [
    { name: 'es-CL-Standard-A', description: 'Voz femenina estándar (Chile)' },
    { name: 'es-CL-Standard-B', description: 'Voz masculina estándar (Chile)' },
    { name: 'es-CL-Neural2-A', description: 'Voz femenina neural (Chile) - Más natural' },
    { name: 'es-CL-Neural2-B', description: 'Voz masculina neural (Chile) - Más natural' },
  ],
  'es-MX': [
    { name: 'es-MX-Standard-A', description: 'Voz femenina estándar (México)' },
    { name: 'es-MX-Standard-B', description: 'Voz masculina estándar (México)' },
    { name: 'es-MX-Neural2-A', description: 'Voz femenina neural (México) - Más natural' },
    { name: 'es-MX-Neural2-B', description: 'Voz masculina neural (México) - Más natural' },
  ],
  'es-ES': [
    { name: 'es-ES-Standard-A', description: 'Voz femenina estándar (España)' },
    { name: 'es-ES-Standard-B', description: 'Voz masculina estándar (España)' },
    { name: 'es-ES-Neural2-A', description: 'Voz femenina neural (España) - Más natural' },
    { name: 'es-ES-Neural2-B', description: 'Voz masculina neural (España) - Más natural' },
  ],
};

/**
 * Hook para usar Gemini TTS con fallback automático
 */
export async function speakWithGemini(
  text: string,
  options?: Partial<GeminiTTSOptions>
): Promise<boolean> {
  try {
    // Intentar usar Gemini TTS primero
    const audioContent = await textToSpeechWithGemini({
      text,
      ...options,
    });

    if (audioContent) {
      // Reproducir audio de Gemini
      await playAudioFromBase64(audioContent, options?.audioEncoding?.toLowerCase() || 'mp3');
      return true;
    }

    // Fallback a TTS del navegador
    return false;
  } catch (error) {
    console.error('Error en speakWithGemini:', error);
    return false; // Fallback a TTS del navegador
  }
}


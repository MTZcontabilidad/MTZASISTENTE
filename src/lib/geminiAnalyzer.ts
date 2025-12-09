/**
 * Integración con Google Gemini API para analizar contenido web
 * Analiza links del SII y genera asesoría contextual
 */

import { supabase } from './supabase';

interface GeminiAnalyzeOptions {
  url: string;
  question?: string;
  context?: string;
}

interface GeminiResponse {
  text: string;
  success: boolean;
  error?: string;
}

/**
 * Obtiene la API key de Gemini desde la base de datos
 * (Reutiliza la lógica de geminiTTS.ts)
 */
async function getGeminiApiKey(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Obtener información del cliente para encontrar su RUT
    const { data: clientInfo } = await supabase
      .from('client_info')
      .select('rut, company_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!clientInfo) return null;

    let company = null;

    // Intentar buscar por company_id primero (si existe)
    if (clientInfo.company_id) {
      const { data } = await supabase
        .from('companies')
        .select('metadata')
        .eq('id', clientInfo.company_id)
        .maybeSingle();
      company = data;
    }

    // Si no se encontró por company_id, buscar por RUT
    if (!company && clientInfo.rut) {
      const { data } = await supabase
        .from('companies')
        .select('metadata')
        .eq('rut', clientInfo.rut)
        .maybeSingle();
      company = data;
    }

    if (!company?.metadata) return null;

    const metadata = company.metadata as Record<string, any>;
    return metadata.gemini_api_key || null;
  } catch (error) {
    console.error('Error obteniendo API key de Gemini:', error);
    return null;
  }
}

/**
 * Obtiene el contenido HTML de una URL
 */
async function fetchWebContent(url: string): Promise<string | null> {
  try {
    // Usar un proxy CORS o hacer fetch desde el backend si es necesario
    // Por ahora, intentamos fetch directo (puede fallar por CORS)
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      mode: 'cors',
    });

    if (!response.ok) {
      console.warn('No se pudo obtener contenido de la URL:', response.status);
      return null;
    }

    const html = await response.text();
    return html;
  } catch (error) {
    console.error('Error al obtener contenido web:', error);
    // Si falla por CORS, retornar null y usar descripción del link
    return null;
  }
}

/**
 * Limpia el HTML para enviarlo a Gemini (extrae texto relevante)
 */
function extractTextFromHTML(html: string): string {
  // Remover scripts y estilos
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');

  // Extraer texto de elementos importantes
  const importantSelectors = [
    /<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi,
    /<p[^>]*>(.*?)<\/p>/gi,
    /<li[^>]*>(.*?)<\/li>/gi,
    /<label[^>]*>(.*?)<\/label>/gi,
    /<button[^>]*>(.*?)<\/button>/gi,
    /<a[^>]*>(.*?)<\/a>/gi,
  ];

  let extractedText = '';
  for (const regex of importantSelectors) {
    const matches = text.matchAll(regex);
    for (const match of matches) {
      const content = match[1].replace(/<[^>]*>/g, '').trim();
      if (content && content.length > 3) {
        extractedText += content + '\n';
      }
    }
  }

  // Si no se extrajo mucho texto, intentar extraer todo el texto visible
  if (extractedText.length < 200) {
    extractedText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Limitar a 8000 caracteres (límite razonable para Gemini)
  return extractedText.substring(0, 8000);
}

/**
 * Analiza un link del SII usando Gemini API
 */
export async function analyzeSIILink(
  options: GeminiAnalyzeOptions
): Promise<GeminiResponse> {
  try {
    const apiKey = await getGeminiApiKey();
    
    if (!apiKey) {
      return {
        text: '',
        success: false,
        error: 'No hay API key de Gemini configurada',
      };
    }

    const { url, question, context } = options;

    // Intentar obtener contenido web
    let webContent = await fetchWebContent(url);
    let contentToAnalyze = '';

    if (webContent) {
      // Extraer texto relevante del HTML
      contentToAnalyze = extractTextFromHTML(webContent);
    } else {
      // Si no se pudo obtener el contenido, usar descripción del link
      contentToAnalyze = `URL: ${url}\n\nEsta es la página del Servicio de Impuestos Internos (SII) de Chile para declarar el Formulario 29 (F29) de IVA.`;
    }

    // Construir el prompt para Gemini
    const systemPrompt = `Eres un asistente experto en trámites tributarios chilenos del Servicio de Impuestos Internos (SII). Tu tarea es analizar el contenido de la página del SII y proporcionar una guía simple, clara y amigable para ayudar a los usuarios a completar su declaración del F29 (IVA).

IMPORTANTE - Sigue estas instrucciones:
- Sé MUY claro y directo, como si estuvieras hablando con un amigo
- Usa un lenguaje simple y amigable, sin jerga técnica innecesaria
- Proporciona pasos concretos y accionables, uno por uno
- Si encuentras información sobre plazos, requisitos o advertencias importantes, menciónala claramente
- Mantén las respuestas concisas pero completas (máximo 300 palabras)
- Si el contenido no es suficiente, usa tu conocimiento sobre el proceso del F29 en Chile
- Incluye tips útiles al final si es relevante
- Sé empático y tranquilizador, recuerda que los usuarios pueden estar estresados con los trámites tributarios`;

    let userPrompt = question 
      ? `${question}\n\nAnaliza el siguiente contenido de la página del SII:\n\n${contentToAnalyze}`
      : `Analiza el siguiente contenido de la página del SII y proporciona una guía paso a paso simple para declarar el F29:\n\n${contentToAnalyze}`;

    if (context) {
      userPrompt += `\n\nContexto adicional: ${context}`;
    }
    
    // Agregar información sobre el proceso del F29 si el contenido es limitado
    if (!contentToAnalyze || contentToAnalyze.length < 200) {
      userPrompt += `\n\nNota: Si el contenido de la página es limitado, usa tu conocimiento sobre el proceso del F29 en Chile. El F29 es la declaración mensual de IVA que incluye: Débito Fiscal (ventas), Crédito Fiscal (compras), y PPM (Pagos Provisionales Mensuales).`;
    }

    // Llamar a la API de Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\n${userPrompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error en Gemini API:', errorText);
      return {
        text: '',
        success: false,
        error: `Error al analizar el link: ${response.status}`,
      };
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      return {
        text: '',
        success: false,
        error: 'Respuesta inválida de Gemini',
      };
    }

    const generatedText = data.candidates[0].content.parts[0].text;

    return {
      text: generatedText,
      success: true,
    };
  } catch (error: any) {
    console.error('Error en analyzeSIILink:', error);
    return {
      text: '',
      success: false,
      error: error.message || 'Error desconocido',
    };
  }
}

/**
 * Genera una guía contextual para el F29 basada en el análisis del link
 */
export async function generateF29GuideFromLink(
  url: string,
  userQuestion?: string
): Promise<string> {
  const result = await analyzeSIILink({
    url,
    question: userQuestion || '¿Cómo puedo declarar el F29 paso a paso?',
    context: 'El usuario necesita ayuda para declarar el Formulario 29 (IVA) en el SII. Proporciona una guía simple y amigable.',
  });

  if (result.success && result.text) {
    return result.text;
  }

  // Fallback: guía básica si no se puede analizar
  return `Te ayudo a declarar el F29 (IVA) en el SII. Aquí tienes una guía paso a paso:

1. **Ingresa al portal del SII**: Ve a www.sii.cl y haz clic en "Ingresar a Mi SII"

2. **Autenticación**: Ingresa tu RUT y Clave Tributaria

3. **Navega al F29**: En el menú, busca "Servicios online" > "Impuestos mensuales" > "Declaración mensual (F29)"

4. **Selecciona el período**: Elige el mes y año que vas a declarar

5. **Revisa la propuesta**: El SII genera una propuesta automática basada en tus compras y ventas

6. **Revisa el formulario**: Verifica los montos de débito fiscal, crédito fiscal y PPM

7. **Envía la declaración**: Si debes dinero, selecciona el medio de pago. Si no, solo envía.

8. **Guarda el certificado**: Descarga y guarda el PDF del certificado de declaración

💡 **Tip**: Si no tienes movimiento, igual debes declarar seleccionando "Declarar Sin Movimiento" para evitar multas.

¿En qué paso necesitas más ayuda?`;
}


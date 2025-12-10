/**
 * Configuración de respuestas del chatbot
 * Aquí puedes personalizar cómo responde el asistente a los usuarios
 */

import { UserType } from "../types";

export interface ResponseTemplate {
  // Patrones que activan esta respuesta
  triggers: string[];
  // Plantilla de respuesta (puede usar {{variables}})
  template: string;
  // Prioridad (mayor número = mayor prioridad)
  priority: number;
  // Si requiere memoria específica
  requiresMemory?: {
    type?: string;
    minImportance?: number;
  };
}

export interface ResponseContext {
  // Información del usuario
  userName?: string;
  userType?: UserType;
  // Información del cliente
  companyName?: string;
  phone?: string;
  // Recuerdos relevantes
  memories: Array<{
    type: string;
    content: string;
    importance: number;
  }>;
  // Historial reciente de la conversación
  recentMessages: Array<{
    text: string;
    sender: "user" | "assistant";
  }>;
}

/**
 * Plantillas de respuestas configuradas
 */
export const responseTemplates: ResponseTemplate[] = [
  // Saludos
  {
    triggers: [
      "hola",
      "buenos días",
      "buenas tardes",
      "buenas noches",
      "hi",
      "hello",
    ],
    template:
      "{{greeting}}, {{userName}}! {{welcomeMessage}} ¿En qué puedo ayudarte hoy? ¡Estoy aquí para apoyarte en todo lo que necesites!",
    priority: 10,
  },

  // Despedidas
  {
    triggers: [
      "adiós",
      "hasta luego",
      "nos vemos",
      "chao",
      "bye",
      "hasta pronto",
    ],
    template:
      "{{goodbye}}, {{userName}}. {{closingMessage}} ¡Que tengas un excelente día! Recuerda que siempre puedes contar conmigo cuando lo necesites. ¡Tú puedes con todo!",
    priority: 10,
  },

  // Preguntas sobre servicios (se puede mejorar con menú interactivo)
  {
    triggers: ["servicio", "servicios", "qué ofrecen", "qué hacen", "empresa"],
    template:
      "{{companyInfo}} Ofrecemos servicios de contabilidad y asesoría. Nuestra misión es ayudar a las personas, y queremos ser tu apoyo y respaldo en tus decisiones importantes. ¿Te gustaría conocer más detalles sobre algún servicio en particular? Puedo ayudarte con consultas sobre trámites, documentos o asesoría personalizada. ¡Juntos encontraremos la mejor solución para ti!",
    priority: 8,
  },

  // Preguntas sobre contacto
  {
    triggers: [
      "contacto",
      "teléfono",
      "email",
      "dirección",
      "ubicación",
      "dónde están",
    ],
    template:
      "{{contactInfo}} Si necesitas más información, no dudes en preguntarme.",
    priority: 8,
  },

  // Preguntas sobre trámites (se manejará con menú interactivo automático)
  {
    triggers: [
      "trámite",
      "tramite",
      "proceso",
      "pasos",
      "cómo hacer",
      "guía",
      "guia",
      "ayuda con",
      "sii",
      "previred",
      "tesorería",
      "tesoreria",
    ],
    template:
      "Te puedo ayudar con varios trámites. Selecciona la opción que necesitas del menú que aparece a continuación.",
    priority: 9, // Mayor prioridad para que se active el menú
  },

  // Agradecimientos
  {
    triggers: ["gracias", "thank you", "muchas gracias", "te agradezco"],
    template:
      "{{appreciation}} ¡Es un placer ayudarte, {{userName}}! Si necesitas algo más, estaré aquí. ¡Sigue así, estás haciendo un gran trabajo!",
    priority: 7,
  },

  // Respuesta personalizada usando memoria
  {
    triggers: ["recuerdas", "sabes", "te dije", "mencioné"],
    template:
      "{{memoryRecall}} Basándome en lo que me has compartido, {{personalizedResponse}}",
    priority: 9,
    requiresMemory: {
      minImportance: 5,
    },
  },

  // Respuesta genérica (baja prioridad, se usa si no hay match)
  {
    triggers: [],
    template:
      "{{defaultResponse}} Si necesitas ayuda con algo específico, no dudes en preguntarme. ¡Estoy aquí para apoyarte y juntos encontraremos la solución!",
    priority: 1,
  },
];

/**
 * Mensajes personalizados según el tipo de usuario
 */
export const userTypeMessages: Record<
  UserType,
  {
    greeting: string;
    welcomeMessage: string;
    closingMessage: string;
    defaultResponse: string;
  }
> = {
  invitado: {
    greeting: "¡Hola",
    welcomeMessage: "Bienvenido a MTZ Asistente",
    closingMessage: "Fue un placer ayudarte",
    defaultResponse:
      "Gracias por contactarnos. Estoy aquí para ayudarte con cualquier consulta sobre nuestros servicios. ¡Juntos encontraremos la mejor solución para ti!",
  },
  cliente_nuevo: {
    greeting: "¡Hola",
    welcomeMessage: "Es un gusto tenerte como cliente",
    closingMessage: "Estamos aquí para apoyarte",
    defaultResponse:
      "Como cliente nuevo, estoy aquí para ayudarte con cualquier consulta. ¿En qué puedo asistirte? ¡Tú puedes con esto y estoy aquí para apoyarte en cada paso!",
  },
  cliente_existente: {
    greeting: "¡Hola",
    welcomeMessage: "Es un placer verte de nuevo",
    closingMessage: "Seguimos aquí para ti",
    defaultResponse:
      "Como cliente existente, conozco tu historial. ¿Cómo puedo ayudarte hoy? ¡Siempre es un gusto trabajar contigo!",
  },
  inclusion: {
    greeting: "¡Hola",
    welcomeMessage: "Bienvenido a MTZ Asistente",
    closingMessage: "Fue un placer ayudarte",
    defaultResponse:
      "Gracias por contactarnos. Estoy aquí para ayudarte con cualquier consulta sobre nuestros servicios. ¡Estamos juntos en esto!",
  },
};

/**
 * Formatea el nombre del cliente para usar en conversaciones
 * Usa "Don Nombre" o "Srita Nombre" según el género, o apodo si está disponible
 */
export function formatClientName(
  userName?: string,
  preferredName?: string | null,
  useFormalAddress: boolean = true,
  gender?: 'masculino' | 'femenino' | 'otro' | null
): string {
  const nameToUse = (preferredName && preferredName.trim()) || (userName && userName.trim());
  
  if (!nameToUse) {
    return "estimado cliente";
  }
  
  // Si el nombre ya contiene "Invitado" (usuarios invitados), no agregar trato formal
  // y limpiar el formato para que sea más natural
  if (nameToUse.toLowerCase().includes('invitado')) {
    // Extraer solo el número de teléfono si está presente
    const phoneMatch = nameToUse.match(/(\d+)/);
    if (phoneMatch) {
      return `Invitado ${phoneMatch[1]}`;
    }
    return nameToUse;
  }
  
  // Si el nombre ya contiene "Don" o "Srita", no duplicar
  if (nameToUse.match(/^(Don|Srita|Sr|Sra|Srta)\s/i)) {
    return nameToUse;
  }
  
  // Si no se debe usar trato formal, retornar solo el nombre
  if (!useFormalAddress) {
    return nameToUse;
  }
  
  // Determinar el trato según el género
  let formalTitle = "Don"; // Por defecto "Don"
  
  if (gender === 'femenino') {
    formalTitle = "Srita";
  } else if (gender === 'masculino') {
    formalTitle = "Don";
  } else if (gender === 'otro') {
    // Para género "otro", usar "Don" por defecto, pero se puede personalizar
    formalTitle = "Don";
  }
  // Si gender es null o undefined, usar "Don" por defecto
  
  return `${formalTitle} ${nameToUse}`;
}

/**
 * Genera mensajes contextuales basados en la información disponible
 */
export function generateContextualMessages(
  context: ResponseContext,
  options?: {
    preferredName?: string | null;
    useFormalAddress?: boolean;
    gender?: 'masculino' | 'femenino' | 'otro' | null;
  }
): Record<string, string> {
  const userType: UserType = context.userType || "invitado";
  const messages = userTypeMessages[userType];

  // Formatear nombre del cliente
  const formattedName = formatClientName(
    context.userName,
    options?.preferredName,
    options?.useFormalAddress !== false,
    options?.gender
  );

  const contextual: Record<string, string> = {
    greeting: messages.greeting,
    welcomeMessage: messages.welcomeMessage,
    closingMessage: messages.closingMessage,
    defaultResponse: messages.defaultResponse,
    userName: formattedName,
    appreciation: "¡De nada!",
    goodbye: "Hasta luego",
  };

  // Información de la empresa si está disponible
  if (context.companyName) {
    contextual.companyInfo = `Veo que eres de ${context.companyName}. `;
  } else {
    contextual.companyInfo = "";
  }

  // Información de contacto
  contextual.contactInfo =
    "Puedes contactarnos directamente a través de WhatsApp al +56990062213 (Carlos Alejandro Villagra Farias). Nuestra oficina de contabilidad está ubicada en Juan Martinez 616, Iquique. En MTZ, nuestra misión es ayudar a las personas, y queremos ser tu apoyo y respaldo. ";

  // Mensaje personalizado basado en memoria
  if (context.memories.length > 0) {
    const importantMemory = context.memories[0];
    contextual.memoryRecall = `Sí, recuerdo que ${importantMemory.content.toLowerCase()}. `;
    contextual.personalizedResponse =
      "puedo ayudarte mejor con esa información.";
  } else {
    contextual.memoryRecall = "";
    contextual.personalizedResponse = "estoy aquí para ayudarte.";
  }

  return contextual;
}

/**
 * Reemplaza variables en las plantillas
 */
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, value);
  }
  // Limpiar variables no reemplazadas
  result = result.replace(/{{[^}]+}}/g, "");
  // Limpiar espacios múltiples
  result = result.replace(/\s+/g, " ").trim();
  return result;
}

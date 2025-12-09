/**
 * Motor de generación de respuestas inteligentes
 * Integra memoria del usuario, información del cliente y contexto de conversación
 */

import {
  responseTemplates,
  generateContextualMessages,
  replaceTemplateVariables,
  type ResponseContext,
} from "./responseConfig";
import { getUserMemories, getImportantMemories } from "./memories";
import { getOrCreateClientInfo } from "./clientInfo";
import { getConversationMessages } from "./conversations";
import {
  getCompanyInfo,
  findMatchingFAQs,
  incrementFAQUsage,
} from "./companyConfig";
// Sistema de trámites (opcional - tabla no existe aún en BD)
// import {
//   findMatchingTramites,
//   getTramiteCompleto,
//   incrementTramiteUsage,
//   generateTramiteResponse,
//   generateTramitesListResponse
// } from './tramites'
import {
  getClientDocuments,
  getDocumentsByType,
  getDocumentDownloadUrl,
  formatDocumentName,
  getDocumentIcon,
  type ClientDocument,
} from "./documents";
import {
  findRelevantMenu,
  generateMenuResponse,
  type InteractiveMenu,
} from "./menus";
import {
  buscarTramites,
  getTramitesPorCategoria,
  generarMenuTramites,
} from "../config/tramites";
import { getClientGoogleScript } from "./documents";
import { UserMemory, ClientInfo, Message, UserType } from "../types";

export interface ResponseOptions {
  userId: string;
  conversationId: string | null;
  userInput: string;
  userType?: UserType;
  userName?: string;
}

/**
 * Analiza el mensaje del usuario y encuentra la mejor plantilla de respuesta
 */
function findBestTemplate(
  userInput: string,
  memories: UserMemory[],
  options?: { requiresMemory?: { type?: string; minImportance?: number } }
): (typeof responseTemplates)[0] | null {
  const inputLower = userInput.toLowerCase();

  // Filtrar plantillas que requieren memoria
  let candidates = responseTemplates;

  if (options?.requiresMemory) {
    const { type, minImportance = 0 } = options.requiresMemory;

    // Verificar si hay memoria que cumpla los requisitos
    const hasRequiredMemory = memories.some((m) => {
      if (type && m.memory_type !== type) return false;
      if (m.importance < minImportance) return false;
      return true;
    });

    if (!hasRequiredMemory) {
      // Si requiere memoria pero no la hay, no usar esta plantilla
      candidates = candidates.filter(
        (t) => t !== candidates.find((c) => c.requiresMemory)
      );
    }
  }

  // Buscar plantillas que coincidan con triggers
  const matchingTemplates = candidates
    .filter((template) => {
      if (template.triggers.length === 0) return true; // Plantilla genérica
      return template.triggers.some((trigger) =>
        inputLower.includes(trigger.toLowerCase())
      );
    })
    .sort((a, b) => b.priority - a.priority); // Ordenar por prioridad

  return matchingTemplates[0] || null;
}

/**
 * Construye el contexto para la respuesta
 */
async function buildResponseContext(
  userId: string,
  conversationId: string | null,
  userType?: UserType,
  userName?: string
): Promise<ResponseContext> {
  // Obtener información del cliente
  let clientInfo: ClientInfo | null = null;
  try {
    clientInfo = await getOrCreateClientInfo(userId);
  } catch (error) {
    console.warn("No se pudo obtener información del cliente:", error);
  }

  // Obtener información de la empresa
  let companyInfo = null;
  try {
    companyInfo = await getCompanyInfo();
  } catch (error) {
    console.warn("No se pudo obtener información de la empresa:", error);
  }

  // Obtener recuerdos importantes
  let memories: UserMemory[] = [];
  try {
    if (conversationId && !conversationId.startsWith("temp-")) {
      memories = await getUserMemories(userId, conversationId);
    } else {
      memories = await getImportantMemories(userId);
    }
  } catch (error) {
    console.warn("No se pudieron obtener recuerdos:", error);
  }

  // Obtener mensajes recientes para contexto
  let recentMessages: Array<{ text: string; sender: "user" | "assistant" }> =
    [];
  try {
    if (conversationId && !conversationId.startsWith("temp-")) {
      const allMessages = await getConversationMessages(conversationId);
      // Tomar los últimos 5 mensajes para contexto
      recentMessages = allMessages.slice(-5).map((msg) => ({
        text: msg.text,
        sender: msg.sender,
      }));
    }
  } catch (error) {
    console.warn("No se pudieron obtener mensajes recientes:", error);
  }

  return {
    userName: userName || clientInfo?.company_name || undefined,
    userType: userType || "invitado",
    companyName:
      clientInfo?.company_name || companyInfo?.company_name || undefined,
    phone: clientInfo?.phone || companyInfo?.phone || undefined,
    memories: memories.map((m) => ({
      type: m.memory_type,
      content: m.content,
      importance: m.importance,
    })),
    recentMessages,
  };
}

/**
 * Genera una respuesta inteligente basada en el contexto
 */
export interface ResponseWithMenu {
  text: string;
  menu?: InteractiveMenu;
  document?: ClientDocument;
}

export async function generateResponse(
  options: ResponseOptions
): Promise<string | ResponseWithMenu> {
  const { userId, conversationId, userInput, userType, userName } = options;

  try {
    // PRIMERO: Detectar solicitud de documentos
    const documentRequest = detectDocumentRequest(userInput);
    if (documentRequest) {
      const documents = await getDocumentsByType(userId, documentRequest.type);

      if (documents.length > 0) {
        // Si hay documentos, mostrar el más reciente o el del período solicitado
        let selectedDoc = documents[0];

        if (documentRequest.period) {
          const periodDoc = documents.find(
            (d) => d.period === documentRequest.period
          );
          if (periodDoc) selectedDoc = periodDoc;
        } else if (documentRequest.year && documentRequest.month) {
          const dateDoc = documents.find(
            (d) =>
              d.year === documentRequest.year &&
              d.month === documentRequest.month
          );
          if (dateDoc) selectedDoc = dateDoc;
        }

        const downloadUrl = getDocumentDownloadUrl(selectedDoc);
        if (downloadUrl) {
          return {
            text: `📄 ${formatDocumentName(
              selectedDoc
            )}\n\n🔗 [Descargar aquí](${downloadUrl})`,
            document: selectedDoc,
          };
        } else {
          // Si no hay URL, mostrar menú de documentos
          const menu = await findRelevantMenu("documentos");
          if (menu) {
            return {
              text: `Tienes ${documents.length} documento(s) de tipo ${
                documentRequest.type
              }.\n\n${generateMenuResponse(menu)}`,
              menu,
            };
          }
        }
      } else {
        // No hay documentos, mostrar menú
        const menu = await findRelevantMenu("documentos");
        if (menu) {
          return {
            text: `No encontré documentos de tipo ${
              documentRequest.type
            } en tu cuenta.\n\n${generateMenuResponse(menu)}`,
            menu,
          };
        }
      }
    }

    // SEGUNDO: Detectar solicitudes de trámites y generar menús automáticamente
    const tramiteMenu = detectarTramiteRequest(userInput);
    if (tramiteMenu) {
      return {
        text: `Te ayudo con los trámites disponibles. Selecciona la opción que necesitas del menú a continuación. Cada botón te llevará directamente al portal correspondiente.`,
        menu: tramiteMenu,
      };
    }

    // TERCERO: Detectar si debería mostrar un menú interactivo
    const relevantMenu = await findRelevantMenu(userInput);
    if (relevantMenu) {
      return {
        text: generateMenuResponse(relevantMenu),
        menu: relevantMenu,
      };
    }

    // CUARTO: Generar menús para servicios comunes si se solicita
    const servicioMenu = detectarServicioRequest(userInput);
    if (servicioMenu) {
      return {
        text: `Te ayudo con nuestros servicios. Selecciona la opción que te interesa:`,
        menu: servicioMenu,
      };
    }

    // QUINTO: Buscar FAQs que coincidan
    // (Sistema de trámites deshabilitado - tabla no existe en BD)
    // Si quieres habilitarlo, ejecuta supabase-tramites.sql y descomenta el código arriba
    const matchingFAQs = await findMatchingFAQs(userInput);

    // Si hay una FAQ que coincide, usarla (prioridad sobre plantillas)
    if (matchingFAQs.length > 0) {
      const bestFAQ = matchingFAQs[0]; // Ya está ordenada por prioridad

      // Incrementar contador de uso
      await incrementFAQUsage(bestFAQ.id);

      // Personalizar la respuesta de la FAQ con contexto si es necesario
      let faqAnswer = bestFAQ.answer;

      // Reemplazar variables básicas si existen
      const companyInfo = await getCompanyInfo();

      // Información de contacto principal (siempre disponible)
      faqAnswer = faqAnswer.replace(/{{phone}}/g, "+56990062213");
      faqAnswer = faqAnswer.replace(
        /{{contact_name}}/g,
        "Carlos Alejandro Villagra Farias"
      );
      faqAnswer = faqAnswer.replace(
        /{{address}}/g,
        "Juan Martinez 616, Iquique"
      );

      if (companyInfo) {
        faqAnswer = faqAnswer.replace(
          /{{company_name}}/g,
          companyInfo.company_name || ""
        );
        faqAnswer = faqAnswer.replace(/{{email}}/g, companyInfo.email || "");
        // Solo reemplazar phone y address si no fueron reemplazados ya
        if (!faqAnswer.includes("+56990062213")) {
          faqAnswer = faqAnswer.replace(
            /{{phone}}/g,
            companyInfo.phone || "+56990062213"
          );
        }
        if (!faqAnswer.includes("Juan Martinez 616")) {
          faqAnswer = faqAnswer.replace(
            /{{address}}/g,
            companyInfo.address || "Juan Martinez 616, Iquique"
          );
        }
      }

      return faqAnswer.trim();
    }

    // Construir contexto
    const context = await buildResponseContext(
      userId,
      conversationId,
      userType,
      userName
    );

    // Obtener recuerdos para la búsqueda de plantilla
    let memories: UserMemory[] = [];
    try {
      if (conversationId && !conversationId.startsWith("temp-")) {
        memories = await getUserMemories(userId, conversationId);
      } else {
        memories = await getImportantMemories(userId);
      }
    } catch (error) {
      console.warn("No se pudieron obtener recuerdos para plantilla:", error);
    }

    // Encontrar la mejor plantilla
    const template = findBestTemplate(userInput, memories);

    if (!template) {
      // Fallback: respuesta genérica
      const messages = generateContextualMessages(context);
      return messages.defaultResponse;
    }

    // Generar mensajes contextuales
    const contextualMessages = generateContextualMessages(context);

    // Agregar información de empresa si está disponible
    const companyInfo = await getCompanyInfo();

    // Información de contacto principal (siempre incluida)
    if (!contextualMessages.contactInfo.includes("+56990062213")) {
      contextualMessages.contactInfo =
        "Puedes contactarnos directamente a través de WhatsApp al +56990062213 (Carlos Alejandro Villagra Farias). Nuestra oficina de contabilidad está ubicada en Juan Martinez 616, Iquique. ";
    }

    // Información adicional de la empresa si está disponible
    if (companyInfo) {
      if (companyInfo.business_hours) {
        contextualMessages.contactInfo += ` Horarios de atención: ${companyInfo.business_hours}.`;
      }
      if (companyInfo.email && !contextualMessages.contactInfo.includes("@")) {
        contextualMessages.contactInfo += ` También puedes escribirnos a ${companyInfo.email}.`;
      }
    }

    // Reemplazar variables en la plantilla
    let response = replaceTemplateVariables(
      template.template,
      contextualMessages
    );

    // Mejorar la respuesta con información de memoria si está disponible
    if (context.memories.length > 0 && template.requiresMemory) {
      const relevantMemory = context.memories
        .filter((m) => {
          if (
            template.requiresMemory?.type &&
            m.type !== template.requiresMemory.type
          ) {
            return false;
          }
          if (
            template.requiresMemory?.minImportance &&
            m.importance < template.requiresMemory.minImportance
          ) {
            return false;
          }
          return true;
        })
        .sort((a, b) => b.importance - a.importance)[0];

      if (relevantMemory) {
        // Personalizar aún más la respuesta con el recuerdo específico
        response = response.replace(
          "{{personalizedResponse}}",
          `recuerdo que ${relevantMemory.content.toLowerCase()}. ¿Te gustaría que te ayude con algo relacionado?`
        );
      }
    }

    // Detectar si el usuario está haciendo una pregunta específica
    const isQuestion =
      userInput.trim().endsWith("?") ||
      userInput.toLowerCase().includes("cómo") ||
      userInput.toLowerCase().includes("qué") ||
      userInput.toLowerCase().includes("cuándo") ||
      userInput.toLowerCase().includes("dónde") ||
      userInput.toLowerCase().includes("por qué");

    if (isQuestion && response === contextualMessages.defaultResponse) {
      // Si es una pregunta pero no se encontró una plantilla específica
      response = `Entiendo tu pregunta sobre "${userInput}". ${contextualMessages.defaultResponse} ¿Podrías darme más detalles para poder ayudarte mejor?`;
    }

    return response.trim();
  } catch (error) {
    console.error("Error al generar respuesta:", error);
    // Respuesta de fallback en caso de error
    return "Gracias por tu mensaje. Estoy aquí para ayudarte. ¿En qué puedo asistirte?";
  }
}

/**
 * Detecta si el mensaje contiene información importante que debe guardarse en memoria
 */
export function detectImportantInfo(userInput: string): {
  shouldSave: boolean;
  type: "important_info" | "preference" | "fact" | null;
  keywords: string[];
} {
  const inputLower = userInput.toLowerCase();

  // Palabras clave para información importante
  const importantKeywords = [
    "nombre",
    "me llamo",
    "soy",
    "mi nombre es",
    "empresa",
    "trabajo en",
    "mi empresa es",
    "teléfono",
    "celular",
    "número",
    "email",
    "correo",
    "e-mail",
    "dirección",
    "vivo en",
    "ubicado en",
    "prefiero",
    "me gusta",
    "no me gusta",
    "disfruto",
    "necesito",
    "requiero",
    "busco",
  ];

  const foundKeywords = importantKeywords.filter((keyword) =>
    inputLower.includes(keyword)
  );

  if (foundKeywords.length === 0) {
    return { shouldSave: false, type: null, keywords: [] };
  }

  // Determinar el tipo de información
  let type: "important_info" | "preference" | "fact" | null = "important_info";

  if (
    inputLower.includes("prefiero") ||
    inputLower.includes("me gusta") ||
    inputLower.includes("no me gusta") ||
    inputLower.includes("disfruto")
  ) {
    type = "preference";
  } else if (
    inputLower.includes("nombre") ||
    inputLower.includes("empresa") ||
    inputLower.includes("teléfono") ||
    inputLower.includes("email") ||
    inputLower.includes("dirección")
  ) {
    type = "important_info";
  } else {
    type = "fact";
  }

  return {
    shouldSave: true,
    type,
    keywords: foundKeywords,
  };
}

/**
 * Detecta si el usuario está solicitando un documento
 */
function detectDocumentRequest(userInput: string): {
  type: "iva" | "erut" | "factura" | "boleta" | "declaracion";
  period?: string;
  year?: number;
  month?: number;
} | null {
  const inputLower = userInput.toLowerCase();

  // Detectar tipo de documento
  let documentType:
    | "iva"
    | "erut"
    | "factura"
    | "boleta"
    | "declaracion"
    | null = null;

  if (inputLower.includes("iva") || inputLower.includes("impuesto")) {
    documentType = "iva";
  } else if (inputLower.includes("erut") || inputLower.includes("rut")) {
    documentType = "erut";
  } else if (inputLower.includes("factura")) {
    documentType = "factura";
  } else if (inputLower.includes("boleta")) {
    documentType = "boleta";
  } else if (
    inputLower.includes("declaración") ||
    inputLower.includes("declaracion")
  ) {
    documentType = "declaracion";
  }

  if (!documentType) return null;

  // Detectar período (formato: 2024-01, enero 2024, etc.)
  const periodMatch = inputLower.match(/(\d{4})-(\d{1,2})|(\w+)\s+(\d{4})/);
  let period: string | undefined;
  let year: number | undefined;
  let month: number | undefined;

  if (periodMatch) {
    if (periodMatch[1] && periodMatch[2]) {
      // Formato: 2024-01
      year = parseInt(periodMatch[1]);
      month = parseInt(periodMatch[2]);
      period = `${year}-${month.toString().padStart(2, "0")}`;
    } else if (periodMatch[3] && periodMatch[4]) {
      // Formato: enero 2024
      year = parseInt(periodMatch[4]);
      const monthNames = [
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio",
        "julio",
        "agosto",
        "septiembre",
        "octubre",
        "noviembre",
        "diciembre",
      ];
      const monthName = periodMatch[3].toLowerCase();
      month = monthNames.indexOf(monthName) + 1;
      if (month > 0) {
        period = `${year}-${month.toString().padStart(2, "0")}`;
      }
    }
  }

  return {
    type: documentType,
    period,
    year,
    month,
  };
}

/**
 * Detecta si el usuario está solicitando información sobre trámites
 * y genera un menú interactivo apropiado
 */
function detectarTramiteRequest(userInput: string): InteractiveMenu | null {
  const inputLower = userInput.toLowerCase();

  // Detectar menciones de SII
  if (
    inputLower.includes("sii") ||
    inputLower.includes("impuestos internos") ||
    inputLower.includes("declaración") ||
    inputLower.includes("declaracion") ||
    inputLower.includes("iva") ||
    inputLower.includes("factura") ||
    inputLower.includes("boleta") ||
    inputLower.includes("rut")
  ) {
    const tramites = getTramitesPorCategoria("sii");
    if (tramites.length > 0) {
      return generarMenuTramites(tramites, "sii");
    }
  }

  // Detectar menciones de PreviRed
  if (
    inputLower.includes("previred") ||
    inputLower.includes("cotizaciones") ||
    inputLower.includes("previsional") ||
    inputLower.includes("finiquito")
  ) {
    const tramites = getTramitesPorCategoria("previred");
    if (tramites.length > 0) {
      return generarMenuTramites(tramites, "previred");
    }
  }

  // Detectar menciones de Tesorería
  if (
    inputLower.includes("tesorería") ||
    inputLower.includes("tesoreria") ||
    inputLower.includes("pago") ||
    inputLower.includes("certificado tributario")
  ) {
    const tramites = getTramitesPorCategoria("tesoreria");
    if (tramites.length > 0) {
      return generarMenuTramites(tramites, "tesoreria");
    }
  }

  // Detectar solicitud genérica de trámites
  if (
    inputLower.includes("trámite") ||
    inputLower.includes("tramite") ||
    inputLower.includes("proceso") ||
    inputLower.includes("guía") ||
    inputLower.includes("guia") ||
    (inputLower.includes("cómo") && inputLower.includes("hacer")) ||
    (inputLower.includes("necesito") && inputLower.includes("ayuda"))
  ) {
    // Buscar trámites relevantes por palabras clave
    const tramitesRelevantes = buscarTramites(userInput);
    if (tramitesRelevantes.length > 0) {
      // Agrupar por categoría
      const sii = tramitesRelevantes.filter((t) => t.categoria === "sii");
      const previred = tramitesRelevantes.filter(
        (t) => t.categoria === "previred"
      );
      const tesoreria = tramitesRelevantes.filter(
        (t) => t.categoria === "tesoreria"
      );

      // Si hay múltiples categorías, crear menú general
      if (sii.length > 0 && previred.length > 0) {
        return generarMenuTramites(tramitesRelevantes.slice(0, 8)); // Limitar a 8 opciones
      }

      // Si solo hay una categoría, usar esa
      if (sii.length > 0) {
        return generarMenuTramites(sii, "sii");
      }
      if (previred.length > 0) {
        return generarMenuTramites(previred, "previred");
      }
      if (tesoreria.length > 0) {
        return generarMenuTramites(tesoreria, "tesoreria");
      }
    }
  }

  return null;
}

/**
 * Detecta si el usuario está preguntando sobre servicios
 * y genera un menú interactivo con opciones de contacto y ayuda
 */
function detectarServicioRequest(userInput: string): InteractiveMenu | null {
  const inputLower = userInput.toLowerCase();

  // Detectar preguntas sobre servicios, ayuda, asesoría
  if (
    (inputLower.includes("servicio") || inputLower.includes("qué ofrecen")) &&
    (inputLower.includes("ayuda") ||
      inputLower.includes("asesoría") ||
      inputLower.includes("asesoria") ||
      inputLower.includes("información") ||
      inputLower.includes("informacion"))
  ) {
    return {
      id: "menu-servicios",
      menu_key: "servicios",
      title: "Nuestros Servicios",
      description: "Selecciona cómo te gustaría recibir ayuda o información:",
      options: [
        {
          id: "contacto-whatsapp",
          label: "💬 Contactar por WhatsApp",
          action: "open_url",
          params: {
            url_type: "whatsapp",
          },
          icon: "💬",
        },
        {
          id: "ver-tramites",
          label: "📋 Ver Trámites Disponibles",
          action: "show_menu",
          params: {
            menu: "tramites-general",
          },
          icon: "📋",
        },
        {
          id: "ver-documentos",
          label: "📄 Ver Mis Documentos",
          action: "list_documents",
          params: {},
          icon: "📄",
        },
        {
          id: "info-contabilidad",
          label: "📊 Información sobre Contabilidad",
          action: "show_info",
          params: {
            service: "contabilidad",
          },
          icon: "📊",
        },
      ],
      priority: 7,
      triggers: [],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return null;
}

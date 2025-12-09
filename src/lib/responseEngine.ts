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
import {
  enrichWithMotivation,
  generateMotivationalMessage,
  detectUserNeedsEncouragement,
  getMotivationalClosing,
} from "./personality";
import {
  detectDifficultSituation,
  generateSupportMessage,
  needsSpecialSupport,
} from "./situationDetection";
import { generateF29GuideFromLink } from "./geminiAnalyzer";
import { getClientPersonalizationInfo, upsertClientExtendedInfo, getClientExtendedInfo } from "./clientExtendedInfo";
import { getServiceByCode, formatServicePrice } from "./servicePricing";
import { updateClientInfo } from "./clientInfo";

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

  // Formatear nombre del cliente con "Don" o "Srita" y apodo si está disponible
  let formattedUserName: string | undefined = undefined;
  if (clientInfo) {
    const { formatClientName } = await import("./responseConfig");
    formattedUserName = formatClientName(
      userName || clientInfo?.company_name || undefined,
      clientInfo?.preferred_name || undefined,
      clientInfo?.use_formal_address !== false,
      clientInfo?.gender || undefined
    );
  } else {
    formattedUserName = userName || undefined;
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
    userName: formattedUserName, // Usar el nombre formateado
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
    // PRIMERO: Verificar si hay una solicitud en progreso
    const { 
      detectServiceRequest, 
      getNextQuestion, 
      processUserResponse, 
      isRequestComplete,
      submitServiceRequest 
    } = await import("./serviceRequests");
    const { getServiceRequestState, saveServiceRequestState, clearServiceRequestState } = await import("./serviceRequestState");
    
    // Verificar si hay una solicitud en progreso
    let requestState = await getServiceRequestState(conversationId || userId);
    
    // Si hay una solicitud en progreso, procesar la respuesta
    if (requestState && !requestState.isComplete && requestState.serviceType) {
      // Procesar la respuesta del usuario
      const updatedData = processUserResponse(
        requestState.serviceType,
        requestState.step,
        userInput,
        requestState.collectedData
      );
      
      // Verificar si está completa
      const complete = isRequestComplete(requestState.serviceType, updatedData);
      
      // Avanzar al siguiente paso
      const nextStep = requestState.step + 1;
      
      // Si está completa, crear la solicitud
      if (complete) {
        const submitted = await submitServiceRequest(
          requestState.serviceType,
          userId,
          conversationId || userId,
          updatedData
        );
        
        if (submitted) {
          await clearServiceRequestState(conversationId || userId);
          const serviceName = requestState.serviceType === 'wheelchair' ? 'Taller de Sillas de Ruedas' : 'Transporte Inclusivo';
          return {
            text: `¡Perfecto! He registrado tu solicitud para el ${serviceName}. 📝\n\nNuestro equipo revisará tu solicitud y te contactará pronto al teléfono que proporcionaste.\n\n**Teléfono: +56 9 3300 3113**\n\n¿Hay algo más en lo que pueda ayudarte?`,
          };
        } else {
          return {
            text: `Hubo un error al registrar tu solicitud. Por favor, contacta directamente al teléfono: +56 9 3300 3113`,
          };
        }
      }
      
      // Obtener siguiente pregunta
      const question = getNextQuestion(requestState.serviceType, nextStep, updatedData);
      
      // Actualizar estado
      const newState = {
        serviceType: requestState.serviceType,
        step: nextStep,
        collectedData: updatedData,
        isComplete: false
      };
      
      await saveServiceRequestState(conversationId || userId, newState);
      
      return {
        text: question,
        menu: undefined,
      };
    }
    
    // Si no hay solicitud en progreso, detectar si el usuario quiere iniciar una
    const serviceType = detectServiceRequest(userInput);
    
    if (serviceType) {
      // Iniciar nueva solicitud
      const newState = {
        serviceType,
        step: 1,
        collectedData: {},
        isComplete: false
      };
      
      await saveServiceRequestState(conversationId || userId, newState);
      
      // Obtener primera pregunta
      const question = getNextQuestion(serviceType, 1, {});
      
      return {
        text: question,
        menu: undefined,
      };
    }
    
    // SEGUNDO: Detectar saludos y preguntas simples para responder de manera más útil
    const inputLower = userInput.toLowerCase().trim();
    const isGreeting = 
      inputLower === 'hola' || 
      inputLower === 'hola!' || 
      inputLower === 'hola.' ||
      inputLower.startsWith('hola ') ||
      inputLower === 'buenos días' ||
      inputLower === 'buenos dias' ||
      inputLower === 'buenas tardes' ||
      inputLower === 'buenas noches' ||
      inputLower === 'hi' ||
      inputLower === 'hello';
    
    const isSimpleQuestion = 
      inputLower === 'en que puedes ayudarme' ||
      inputLower === 'en qué puedes ayudarme' ||
      inputLower === 'que puedes hacer' ||
      inputLower === 'qué puedes hacer' ||
      inputLower === 'que haces' ||
      inputLower === 'qué haces' ||
      inputLower === 'ayuda' ||
      inputLower === 'necesito ayuda' ||
      inputLower === 'que servicios' ||
      inputLower === 'qué servicios';
    
    if (isGreeting || isSimpleQuestion) {
      // Obtener información del cliente para personalizar
      const { getOrCreateClientInfo } = await import("./clientInfo");
      const { formatClientName } = await import("./responseConfig");
      const clientInfo = await getOrCreateClientInfo(userId);
      
      const formattedName = formatClientName(
        userName || clientInfo?.company_name || undefined,
        clientInfo?.preferred_name || undefined,
        clientInfo?.use_formal_address !== false,
        clientInfo?.gender || undefined
      );
      
      if (isGreeting) {
        return {
          text: `${formattedName ? `¡Hola, ${formattedName}!` : '¡Hola!'} 👋\n\nSoy **Arise**, tu asistente virtual de MTZ. Estoy aquí para ayudarte con:\n\n• 📊 Consultoría tributaria y contable\n• 🚐 Fundación Te Quiero Feliz (transporte inclusivo)\n• 🪑 Taller de Sillas de Ruedas MMC\n• 📋 Trámites y documentos\n• 💬 Soporte personalizado\n• 📅 Agendar reuniones\n\n¿En qué puedo ayudarte hoy?`,
          menu: undefined,
        };
      } else if (isSimpleQuestion) {
        return {
          text: `¡Por supuesto! 😊 Puedo ayudarte con:\n\n• 📊 **Consultoría tributaria y contable** - Declaraciones, trámites, asesoría\n• 🪑 **Taller de Sillas de Ruedas** - Reparación, mantenimiento, adaptación\n• 🚐 **Transporte Inclusivo** - Fundación Te Quiero Feliz\n• 📋 **Trámites y documentos** - IVA, RUT, certificados\n• 💬 **Soporte personalizado** - Nuestro equipo está para ayudarte\n• 📅 **Agendar reuniones** - Coordina una cita con nosotros\n\n¿Con cuál de estos servicios puedo ayudarte? Puedes escribirme directamente o usar las opciones del menú.`,
          menu: undefined,
        };
      }
    }
    
    // TERCERO: Verificar si faltan datos del usuario y preguntar
    const { detectMissingUserData } = await import("./userDataCollection");
    const missingData = await detectMissingUserData(userId);
    
    // Solo preguntar si no es una respuesta directa a una pregunta previa
    // y si el usuario no está respondiendo con datos
    const isDataResponse = userInput.match(/\d{8,9}/) || // Teléfono
                          userInput.split(' ').length <= 4 && userInput.length < 50; // Posible nombre
    
    if (missingData && !isDataResponse) {
      // Verificar si el usuario ya respondió esta pregunta en mensajes recientes
      const { getConversationMessages } = await import("./conversations");
      const recentMessages = conversationId ? await getConversationMessages(conversationId) : [];
      const lastAssistantMessage = recentMessages
        .filter(m => m.sender === 'assistant')
        .slice(-1)[0];
      
      // Si el último mensaje del asistente ya preguntó por este dato, no preguntar de nuevo
      if (!lastAssistantMessage?.text.includes(missingData.question)) {
        return {
          text: `Hola! 😊 Para brindarte un mejor servicio, ${missingData.question}`,
          menu: undefined,
        };
      }
    }
    
    // CUARTO: Detectar situaciones difíciles y ofrecer apoyo especial
    const difficultSituation = detectDifficultSituation(userInput);
    if (difficultSituation.detected && difficultSituation.needsSupport) {
      const supportMessage = generateSupportMessage(
        difficultSituation,
        userName
      );
      if (supportMessage) {
        return {
          text: supportMessage,
          menu: undefined,
        };
      }
    }

    // QUINTO: Detectar solicitud de documentos
    // IMPORTANTE: Si menciona IVA/F29/declaración, priorizar menú de trámites sobre documentos
    const isIvaOrF29Request = 
      inputLower.includes('iva') || 
      inputLower.includes('f29') || 
      inputLower.includes('formulario 29') ||
      (inputLower.includes('declarar') && inputLower.includes('iva')) ||
      (inputLower.includes('declaración') && inputLower.includes('iva')) ||
      (inputLower.includes('declaracion') && inputLower.includes('iva'));
    
    const documentRequest = detectDocumentRequest(userInput);
    if (documentRequest && !isIvaOrF29Request) {
      // Detectar intención: ¿quiere descargar, pagar, o solo información?
      const wantsDownload = inputLower.includes('descargar') || inputLower.includes('bajar') || inputLower.includes('obtener');
      const wantsPay = inputLower.includes('pagar') || inputLower.includes('precio') || inputLower.includes('costo') || inputLower.includes('inversión') || inputLower.includes('inversion');
      const wantsInfo = inputLower.includes('información') || inputLower.includes('informacion') || inputLower.includes('saber') || inputLower.includes('conocer');
      
      const documents = await getDocumentsByType(userId, documentRequest.type);

      if (documents.length > 0) {
        // Si hay documentos y quiere descargar, mostrar directamente
        if (wantsDownload) {
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
            // Listar todos los documentos disponibles y no disponibles
            const availableDocs = documents.filter(d => getDocumentDownloadUrl(d));
            const unavailableDocs = documents.filter(d => !getDocumentDownloadUrl(d));
            
            let responseText = `📄 ${formatDocumentName(selectedDoc)}\n\n🔗 [Descargar aquí](${downloadUrl})`;
            
            if (availableDocs.length > 1 || unavailableDocs.length > 0) {
              responseText += `\n\n📋 **Documentos disponibles:**\n`;
              availableDocs.forEach(doc => {
                responseText += `• ✅ ${formatDocumentName(doc)}\n`;
              });
              
              if (unavailableDocs.length > 0) {
                responseText += `\n⚠️ **Documentos no disponibles aún:**\n`;
                unavailableDocs.forEach(doc => {
                  responseText += `• ❌ ${formatDocumentName(doc)} (en proceso)\n`;
                });
              }
            }
            
            return {
              text: responseText,
              document: selectedDoc,
            };
          }
        }
        
        // Si quiere pagar o contratar servicio, mostrar información de precios
        if (wantsPay) {
          const menu = await findRelevantMenu("documentos");
          if (menu) {
            return {
              text: enrichWithMotivation(
                `Entiendo que necesitas información sobre precios para ${documentRequest.type}. 😊\n\nNuestro equipo puede ayudarte con esto. Para darte un presupuesto preciso, necesitaría saber:\n\n• ¿Qué período necesitas?\n• ¿Es para una declaración o trámite específico?\n• ¿Tienes alguna urgencia?\n\nMientras tanto, aquí tienes opciones disponibles:\n\n${generateMenuResponse(menu)}`,
                userInput
              ),
              menu,
            };
          }
        }
        
        // Si solo quiere información o no está claro, preguntar qué necesita
        if (!wantsDownload && !wantsPay) {
          const menu = await findRelevantMenu("documentos");
          if (menu) {
            // Separar documentos disponibles y no disponibles
            const availableDocs = documents.filter(d => getDocumentDownloadUrl(d));
            const unavailableDocs = documents.filter(d => !getDocumentDownloadUrl(d));
            
            let responseText = `Encontré ${documents.length} documento(s) de tipo ${documentRequest.type} en tu cuenta. 😊\n\n`;
            
            if (availableDocs.length > 0) {
              responseText += `✅ **Documentos disponibles para descargar:**\n`;
              availableDocs.forEach(doc => {
                responseText += `• ${formatDocumentName(doc)}\n`;
              });
              responseText += `\n`;
            }
            
            if (unavailableDocs.length > 0) {
              responseText += `⚠️ **Documentos no disponibles aún:**\n`;
              unavailableDocs.forEach(doc => {
                responseText += `• ${formatDocumentName(doc)} (en proceso)\n`;
              });
              responseText += `\n`;
            }
            
            responseText += `¿Qué te gustaría hacer?\n\n• 📥 **Descargar** un documento disponible\n• 💰 **Contratar servicio** para que nuestro equipo lo prepare\n• ℹ️ **Ver información** sobre este tipo de documento\n\nSelecciona una opción:\n\n${generateMenuResponse(menu)}`;
            
            return {
              text: enrichWithMotivation(responseText, userInput),
              menu,
            };
          }
        }
        
        // Fallback: mostrar menú
        const menu = await findRelevantMenu("documentos");
        if (menu) {
          return {
            text: `Tienes ${documents.length} documento(s) de tipo ${
              documentRequest.type
            }.\n\n${generateMenuResponse(menu)}`,
            menu,
          };
        }
      } else {
        // No hay documentos, mostrar menú con opciones y lista de documentos disponibles
        const menu = await findRelevantMenu("documentos");
        if (menu) {
          // Obtener todos los documentos del cliente para mostrar qué tiene disponible
          const allDocuments = await getClientDocuments(userId);
          const availableDocs = allDocuments.filter(d => getDocumentDownloadUrl(d));
          const unavailableDocs = allDocuments.filter(d => !getDocumentDownloadUrl(d));
          
          let responseText = `No encontré documentos de tipo ${
                documentRequest.type
          } en tu cuenta, pero no te preocupes. 😊\n\n`;
          
          if (allDocuments.length > 0) {
            responseText += `**Tus documentos disponibles:**\n`;
            if (availableDocs.length > 0) {
              responseText += `\n✅ **Para descargar:**\n`;
              availableDocs.slice(0, 5).forEach(doc => {
                responseText += `• ${formatDocumentName(doc)}\n`;
              });
              if (availableDocs.length > 5) {
                responseText += `• ... y ${availableDocs.length - 5} más\n`;
              }
            }
            
            if (unavailableDocs.length > 0) {
              responseText += `\n⚠️ **En proceso:**\n`;
              unavailableDocs.slice(0, 3).forEach(doc => {
                responseText += `• ${formatDocumentName(doc)}\n`;
              });
              if (unavailableDocs.length > 3) {
                responseText += `• ... y ${unavailableDocs.length - 3} más\n`;
              }
            }
            responseText += `\n`;
          }
          
          responseText += `Puedo ayudarte de varias formas:\n\n• 📥 **Descargar** documentos disponibles\n• 💰 **Contratar servicio** para que nuestro equipo lo prepare\n• ℹ️ **Ver información** sobre este tipo de documento\n\nAquí tienes las opciones disponibles:\n\n${generateMenuResponse(menu)}`;
          
          return {
            text: enrichWithMotivation(responseText, userInput),
            menu,
          };
        }
      }
    }

    // QUINTO: Detectar solicitudes sobre trámites tributarios
    // IMPORTANTE: NO enseñamos a hacer trámites, guiamos para que MTZ los haga
    const tramiteRequest = detectarTramiteTributario(userInput);
    if (tramiteRequest) {
      const personalization = await getClientPersonalizationInfo(userId);
      const companyName = personalization.companyName || userName || 'tu empresa';
      
      // Obtener información del servicio si aplica
      let serviceInfo = null;
      if (tramiteRequest.serviceCode) {
        serviceInfo = await getServiceByCode(tramiteRequest.serviceCode);
      }
      
      // Construir respuesta personalizada
      let responseText = '';
      
      if (tramiteRequest.type === 'inicio_actividades') {
        // Obtener información legal de la empresa si está disponible
        const extendedInfo = await getClientExtendedInfo(userId);
        const legalInfo = extendedInfo?.legal_info || {};
        const hasInicioActividades = legalInfo.inicio_actividades || legalInfo.start_date;
        
        responseText = `¡Hola! Entiendo que necesitas hacer el inicio de actividades para ${companyName}. 😊\n\n`;
        
        // Si ya tiene información de inicio de actividades, mencionarlo
        if (hasInicioActividades) {
          responseText += `Veo que ya tienes información de inicio de actividades registrada. `;
          if (legalInfo.start_date) {
            responseText += `Tu fecha de inicio de actividades es ${legalInfo.start_date}. `;
          }
          responseText += `Si necesitas actualizar esta información o realizar un nuevo trámite, `;
        }
        
        responseText += `En MTZ nos encargamos de todo el proceso por ti. No necesitas hacerlo tú mismo. Lo que necesito es que me proporciones algunos datos para que nuestro equipo pueda realizar el trámite:\n\n`;
        responseText += `• Nombre completo o razón social\n`;
        responseText += `• RUT\n`;
        responseText += `• Giro del negocio\n`;
        responseText += `• Dirección del domicilio\n`;
        responseText += `• Teléfono de contacto\n`;
        responseText += `• Email\n`;
        responseText += `• Fecha de inicio de actividades (si ya la tienes)\n\n`;
        
        if (serviceInfo) {
          responseText += `💰 **Inversión**: ${formatServicePrice(serviceInfo)}\n\n`;
        } else {
          responseText += `💰 **Inversión**: $35.000\n\n`;
        }
        
        responseText += `Una vez que tengas estos datos, puedes compartírmelos y nuestro equipo se encargará de todo. ¿Tienes estos datos a mano?`;
      } else if (tramiteRequest.type === 'declaracion_iva' || tramiteRequest.type === 'f29') {
        // Para IVA/F29, siempre mostrar un menú con opciones claras
        const menu = await findRelevantMenu("documentos");
        if (menu) {
          responseText = `Entiendo que necesitas ayuda con la declaración de IVA (F29). 😊\n\n`;
          
          // Personalizar según estado del cliente
          if (personalization.ivaStatus === 'atrasado') {
            responseText += `Veo que tienes declaraciones atrasadas. No te preocupes, en MTZ podemos ayudarte a ponerte al día. `;
          } else if (personalization.ivaStatus === 'pendiente') {
            responseText += `Tienes una declaración pendiente. `;
          }
          
          responseText += `Puedo ayudarte de varias formas. Selecciona la opción que necesitas:\n\n`;
          responseText += generateMenuResponse(menu);
          
          return {
            text: enrichWithMotivation(responseText, userInput),
            menu,
          };
        } else {
          // Fallback si no hay menú disponible
          responseText = `Entiendo que necesitas ayuda con la declaración de IVA (F29). 😊\n\n`;
          
          // Personalizar según estado del cliente
          if (personalization.ivaStatus === 'atrasado') {
            responseText += `Veo que tienes declaraciones atrasadas. No te preocupes, en MTZ podemos ayudarte a ponerte al día. `;
          } else if (personalization.ivaStatus === 'pendiente') {
            responseText += `Tienes una declaración pendiente. `;
          }
          
          responseText += `Nuestro equipo puede encargarse de tu declaración de IVA. `;
          responseText += `Para esto, necesitaría que me compartas:\n\n`;
          responseText += `• Período a declarar (mes y año)\n`;
          responseText += `• Si tuviste ventas en ese período\n`;
          responseText += `• Si tuviste compras en ese período\n`;
          responseText += `• Si tienes acceso a tu portal del SII o necesitas que lo hagamos nosotros\n\n`;
          
          if (serviceInfo) {
            responseText += `💰 **Inversión**: ${formatServicePrice(serviceInfo)}\n\n`;
          }
          
          responseText += `¿Qué período necesitas declarar?`;
        }
      } else {
        // Respuesta genérica para otros trámites
        responseText = `Entiendo que necesitas ayuda con ${tramiteRequest.name || 'este trámite'}. 😊\n\n`;
        responseText += `En MTZ nos encargamos de realizar este trámite por ti. `;
        responseText += `¿Podrías contarme un poco más sobre lo que necesitas? Así nuestro equipo puede ayudarte de la mejor manera.\n\n`;
        
        if (serviceInfo) {
          responseText += `💰 **Inversión**: ${formatServicePrice(serviceInfo)}\n\n`;
        }
      }
      
      return {
        text: enrichWithMotivation(responseText, userInput),
      };
    }

    // SEXTO: Detectar solicitudes de trámites y generar menús automáticamente
    const tramiteMenu = detectarTramiteRequest(userInput);
    if (tramiteMenu) {
      // Si es una solicitud de categorías, retornar texto especial para mostrar CategoryButtons
      const inputLower = userInput.toLowerCase();
      if (
        inputLower.includes("ver todas las categorías") ||
        inputLower.includes("ver todas las categorias") ||
        inputLower.includes("categorías de trámites") ||
        inputLower.includes("categorias de tramites")
      ) {
      return {
        text: enrichWithMotivation(
          `Aquí tienes todas las categorías de trámites disponibles. Selecciona una categoría para ver los trámites específicos.`,
          userInput
        ),
        menu: undefined, // No mostrar menú, mostrar CategoryButtons en su lugar
      };
      }
      // Si tramiteMenu es un objeto con text y menu, retornarlo directamente
      if ('text' in tramiteMenu && 'menu' in tramiteMenu) {
        return {
          text: enrichWithMotivation((tramiteMenu as any).text, userInput),
          menu: (tramiteMenu as any).menu,
        };
      }
      // Si es un InteractiveMenu normal, retornarlo con texto genérico
      return {
        text: enrichWithMotivation(
          `Te ayudo con los trámites disponibles. Selecciona la opción que necesitas del menú a continuación. Cada botón te llevará directamente al portal correspondiente.`,
          userInput
        ),
        menu: tramiteMenu,
      };
    }

    // SÉPTIMO: Detectar si debería mostrar un menú interactivo
    const relevantMenu = await findRelevantMenu(userInput);
    if (relevantMenu) {
      return {
        text: enrichWithMotivation(
          generateMenuResponse(relevantMenu),
          userInput
        ),
        menu: relevantMenu,
      };
    }

    // OCTAVO: Generar menús para servicios comunes si se solicita
    const servicioMenu = detectarServicioRequest(userInput);
    if (servicioMenu) {
      return {
        text: enrichWithMotivation(
          `Te ayudo con nuestros servicios. Selecciona la opción que te interesa:`,
          userInput
        ),
        menu: servicioMenu,
      };
    }

    // NOVENO: Buscar FAQs que coincidan
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
      
      // Detectar si el usuario necesita ánimo
      const needs = detectUserNeedsEncouragement(userInput);

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

      // Enriquecer la respuesta FAQ con motivación
      return enrichWithMotivation(faqAnswer.trim(), userInput, {
        hasErrors: needs.isFrustrated,
        isComplexTask: false,
      });
    }

    // Construir contexto
    const context = await buildResponseContext(
      userId,
      conversationId,
      userType,
      userName
    );
    
    // Enriquecer contexto con información personalizada del cliente
    const clientPersonalization = await getClientPersonalizationInfo(userId);
    
    // Obtener información del cliente para nombre y apodo
    const { getOrCreateClientInfo } = await import("./clientInfo");
    const clientInfo = await getOrCreateClientInfo(userId);
    
    // Usar nombre de empresa si está disponible, sino usar nombre de usuario
    const displayName = clientPersonalization.companyName || userName || clientInfo?.company_name || undefined;
    
    // Formatear nombre con "Don" o "Srita" y apodo si está disponible
    const { formatClientName } = await import("./responseConfig");
    const formattedName = formatClientName(
      displayName,
      clientInfo?.preferred_name || undefined,
      clientInfo?.use_formal_address !== false,
      clientInfo?.gender || undefined
    );
    
    context.userName = formattedName;

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
      // Fallback: respuesta más útil y proactiva
      // Importar generateContextualMessages antes de usarlo
      const { generateContextualMessages: genContextualMessages } = await import("./responseConfig");
      const messages = genContextualMessages(context, {
        preferredName: clientInfo?.preferred_name,
        useFormalAddress: clientInfo?.use_formal_address !== false,
        gender: clientInfo?.gender || undefined,
      });
      let fallbackResponse = messages.defaultResponse;
      
      // Agregar sugerencias útiles basadas en el input
      const inputLower = userInput.toLowerCase();
      if (inputLower.length < 20) {
        // Mensaje muy corto, ofrecer ayuda
        fallbackResponse += `\n\nPuedo ayudarte con:\n\n`;
        fallbackResponse += `• Información sobre nuestros servicios\n`;
        fallbackResponse += `• Solicitar servicios del taller o transporte\n`;
        fallbackResponse += `• Trámites tributarios\n`;
        fallbackResponse += `• Documentos y certificados\n`;
        fallbackResponse += `• Agendar reuniones\n\n`;
        fallbackResponse += `¿Con cuál te puedo ayudar?`;
      }
      
      return enrichWithMotivation(fallbackResponse, userInput);
    }

    // Generar mensajes contextuales con información de personalización
    const { generateContextualMessages } = await import("./responseConfig");
    const contextualMessages = generateContextualMessages(context, {
      preferredName: clientInfo?.preferred_name,
      useFormalAddress: clientInfo?.use_formal_address !== false,
      gender: clientInfo?.gender || undefined,
    });

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
      // Si es una pregunta pero no se encontró una plantilla específica, ser más útil
      const questionLower = userInput.toLowerCase();
      
      // Intentar dar respuestas más específicas según el tipo de pregunta
      if (questionLower.includes('cómo') || questionLower.includes('como')) {
        response = `Te explico cómo podemos ayudarte. ${contextualMessages.defaultResponse}\n\n`;
        response += `En MTZ nos encargamos de realizar los trámites por ti, así que no necesitas hacerlo tú mismo. `;
        response += `Solo necesitamos algunos datos y nuestro equipo se encarga de todo el proceso.\n\n`;
        response += `¿Te gustaría que te guíe paso a paso o prefieres que nuestro equipo lo haga directamente?`;
      } else if (questionLower.includes('qué') || questionLower.includes('que')) {
        response = `Con gusto te explico. ${contextualMessages.defaultResponse}\n\n`;
        response += `Puedo ayudarte con información sobre nuestros servicios, trámites, documentos y más. `;
        response += `¿Hay algo específico sobre lo que te gustaría saber más?`;
      } else if (questionLower.includes('cuándo') || questionLower.includes('cuando')) {
        response = `Sobre los tiempos, ${contextualMessages.defaultResponse}\n\n`;
        response += `Los tiempos dependen del tipo de trámite o servicio. `;
        response += `Nuestro equipo puede darte una estimación más precisa. `;
        response += `¿Te gustaría que te contactemos o prefieres agendar una reunión?`;
      } else if (questionLower.includes('dónde') || questionLower.includes('donde')) {
        response = `Te indico dónde. ${contextualMessages.defaultResponse}\n\n`;
        response += `Nuestra oficina está en Juan Martinez 616, Iquique. `;
        response += `También podemos atenderte a domicilio en algunos casos. `;
        response += `¿Te gustaría agendar una visita o prefieres que vayamos a tu ubicación?`;
      } else {
        response = `Entiendo tu pregunta. ${contextualMessages.defaultResponse} ¿Podrías darme más detalles para poder ayudarte mejor?`;
      }
    }

    // Enriquecer la respuesta final con motivación y personalización
    const needs = detectUserNeedsEncouragement(userInput);
    
    // Agregar información personalizada si está disponible
    const responsePersonalization = await getClientPersonalizationInfo(userId);
    if (responsePersonalization.companyName && !response.includes(responsePersonalization.companyName)) {
      // Usar el nombre de la empresa si está disponible
      response = response.replace(/tu empresa/gi, responsePersonalization.companyName);
      response = response.replace(/tu negocio/gi, responsePersonalization.companyName);
    }
    
    // Si hay una situación difícil pero no se detectó antes, agregar mensaje de apoyo
    const situation = detectDifficultSituation(userInput);
    if (situation.detected && !situation.needsSupport) {
      // Situación leve, agregar mensaje de apoyo sutil
      response += " Recuerda que en MTZ estamos aquí para apoyarte y ser tu respaldo en lo que necesites.";
    }
    
    const enrichedResponse = enrichWithMotivation(response.trim(), userInput, {
      isFirstTime: context.memories.length === 0,
      hasErrors: needs.isFrustrated,
      isComplexTask: userInput.toLowerCase().includes("trámite") || 
                     userInput.toLowerCase().includes("proceso") ||
                     userInput.toLowerCase().includes("cómo"),
    });

    return enrichedResponse;
  } catch (error) {
    console.error("Error al generar respuesta:", error);
    // Respuesta de fallback cuando no entiende - ofrecer opciones más completas
    const menu = await findRelevantMenu("documentos");
    
    // Intentar entender mejor la intención del usuario
    const inputLower = userInput.toLowerCase();
    let helpfulResponse = '';
    
    // Detectar intenciones comunes y ofrecer ayuda específica
    if (inputLower.includes('ayuda') || inputLower.includes('necesito')) {
      helpfulResponse = `Entiendo que necesitas ayuda. 😊 En MTZ podemos asistirte con:\n\n`;
      helpfulResponse += `• 📊 **Consultoría tributaria y contable** - Declaraciones, trámites, asesoría\n`;
      helpfulResponse += `• 🪑 **Taller de Sillas de Ruedas** - Reparación, mantenimiento, adaptación\n`;
      helpfulResponse += `• 🚐 **Transporte Inclusivo** - Fundación Te Quiero Feliz\n`;
      helpfulResponse += `• 📋 **Trámites y documentos** - IVA, RUT, certificados\n`;
      helpfulResponse += `• 💬 **Soporte personalizado** - Nuestro equipo está para ayudarte\n\n`;
      helpfulResponse += `¿Con cuál de estos servicios puedo ayudarte? Puedes escribirme directamente o usar las opciones del menú.`;
    } else if (inputLower.includes('información') || inputLower.includes('informacion') || inputLower.includes('saber')) {
      helpfulResponse = `Con gusto te proporciono información. 😊\n\n`;
      helpfulResponse += `Puedo ayudarte con información sobre:\n\n`;
      helpfulResponse += `• Nuestros servicios de contabilidad y asesoría tributaria\n`;
      helpfulResponse += `• El taller de sillas de ruedas y sus servicios\n`;
      helpfulResponse += `• El transporte inclusivo de la Fundación Te Quiero Feliz\n`;
      helpfulResponse += `• Trámites tributarios y cómo podemos ayudarte con ellos\n`;
      helpfulResponse += `• Documentos disponibles y cómo obtenerlos\n\n`;
      helpfulResponse += `¿Sobre qué te gustaría saber más?`;
    } else if (inputLower.includes('contacto') || inputLower.includes('hablar') || inputLower.includes('llamar')) {
      helpfulResponse = `¡Por supuesto! Puedes contactarnos de varias formas:\n\n`;
      helpfulResponse += `📞 **Teléfono principal:** +56 9 9006 2213 (Carlos Alejandro Villagra Farias)\n`;
      helpfulResponse += `🪑 **Taller de Sillas:** +56 9 3300 3113\n`;
      helpfulResponse += `🚐 **Transporte Inclusivo:** +56 9 3300 3113\n`;
      helpfulResponse += `📍 **Dirección:** Juan Martinez 616, Iquique\n`;
      helpfulResponse += `💬 **WhatsApp:** +56 9 9006 2213\n\n`;
      helpfulResponse += `También puedes agendar una reunión con nosotros o escribirme aquí y te ayudo con lo que necesites.`;
    } else {
      helpfulResponse = `Entiendo tu mensaje. 😊 Aunque no estoy completamente seguro de lo que necesitas específicamente, puedo ayudarte con:\n\n`;
      helpfulResponse += `• 📊 **Servicios tributarios y contables**\n`;
      helpfulResponse += `• 🪑 **Taller de Sillas de Ruedas**\n`;
      helpfulResponse += `• 🚐 **Transporte Inclusivo**\n`;
      helpfulResponse += `• 📋 **Trámites y documentos**\n`;
      helpfulResponse += `• 💬 **Contacto directo** con nuestro equipo\n\n`;
      helpfulResponse += `¿Podrías contarme un poco más sobre lo que necesitas? Así puedo ayudarte de la mejor manera.`;
    }
    
    if (menu) {
      return {
        text: enrichWithMotivation(
          `${helpfulResponse}\n\nTambién puedes seleccionar una opción del menú:\n\n${generateMenuResponse(menu)}`,
          userInput
        ),
        menu,
      };
    }
    
    // Respuesta de fallback en caso de error (con motivación)
    return enrichWithMotivation(
      helpfulResponse || "Gracias por tu mensaje. Estoy aquí para ayudarte. ¿En qué puedo asistirte?\n\nSi no encuentras lo que buscas, puedes escribirme de otra forma o contactarnos directamente.",
      userInput
    );
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
 * Detecta y guarda información del cliente del mensaje
 */
export async function detectAndSaveClientInfo(userId: string, userInput: string): Promise<void> {
  try {
    const inputLower = userInput.toLowerCase();
    const updates: any = {};
    
    // Detectar RUT (formato: XX.XXX.XXX-X o XXXXXXXX-X)
    const rutMatch = userInput.match(/\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dkK]\b/);
    if (rutMatch) {
      const rut = rutMatch[0].replace(/\./g, '').replace(/-/g, '');
      await updateClientInfo(userId, { custom_fields: { rut } });
    }
    
    // Detectar giro del negocio
    if (inputLower.includes('giro') || inputLower.includes('actividad')) {
      const giroMatch = userInput.match(/(?:giro|actividad)[\s:]+(.+?)(?:\.|$|,)/i);
      if (giroMatch && giroMatch[1]) {
        updates.business_activity = giroMatch[1].trim();
      }
    }
    
    // Detectar número de empleados
    const empleadosMatch = userInput.match(/(\d+)\s*(?:empleados?|trabajadores?|personas)/i);
    if (empleadosMatch) {
      updates.employee_count = parseInt(empleadosMatch[1]);
    }
    
    // Detectar rango de ingresos mensuales
    if (inputLower.includes('ingreso') || inputLower.includes('venta') || inputLower.includes('facturación')) {
      const ingresosMatch = userInput.match(/(\d+(?:\.\d+)?)\s*(?:millones?|m)/i);
      if (ingresosMatch) {
        const millones = parseFloat(ingresosMatch[1]);
        if (millones < 50) updates.monthly_revenue_range = 'menos_50';
        else if (millones < 200) updates.monthly_revenue_range = '50_200';
        else if (millones < 500) updates.monthly_revenue_range = '200_500';
        else updates.monthly_revenue_range = 'mas_500';
      }
    }
    
    // Si hay actualizaciones, guardarlas
    if (Object.keys(updates).length > 0) {
      await upsertClientExtendedInfo(userId, updates);
    }
  } catch (error) {
    console.warn('Error al detectar información del cliente:', error);
  }
}

/**
 * Detecta si el usuario está preguntando sobre trámites tributarios
 * Retorna información sobre el tipo de trámite y servicio relacionado
 */
function detectarTramiteTributario(userInput: string): {
  type: string;
  name: string;
  serviceCode?: string;
} | null {
  const inputLower = userInput.toLowerCase();
  
  // Inicio de actividades
  if (
    inputLower.includes('inicio de actividades') ||
    inputLower.includes('inicio actividades') ||
    inputLower.includes('comenzar actividades') ||
    inputLower.includes('empezar actividades') ||
    (inputLower.includes('inicio') && inputLower.includes('actividad'))
  ) {
    return {
      type: 'inicio_actividades',
      name: 'Inicio de Actividades',
      serviceCode: 'inicio_actividades',
    };
  }
  
  // Declaración de IVA / F29
  if (
    inputLower.includes('f29') ||
    inputLower.includes('formulario 29') ||
    inputLower.includes('formulario29') ||
    (inputLower.includes('declarar') && inputLower.includes('iva')) ||
    (inputLower.includes('declaración') && inputLower.includes('iva')) ||
    (inputLower.includes('declaracion') && inputLower.includes('iva'))
  ) {
    return {
      type: 'declaracion_iva',
      name: 'Declaración de IVA (F29)',
      serviceCode: 'declaracion_f29',
    };
  }
  
  // Declaración sin movimiento
  if (
    inputLower.includes('sin movimiento') ||
    inputLower.includes('sin movimientos') ||
    (inputLower.includes('declarar') && inputLower.includes('sin movimiento'))
  ) {
    return {
      type: 'declaracion_sin_movimiento',
      name: 'Declaración Sin Movimiento',
      serviceCode: 'declaracion_sin_movimiento',
    };
  }
  
  // Consulta tributaria
  if (
    inputLower.includes('consulta') ||
    inputLower.includes('asesoría') ||
    inputLower.includes('asesoria') ||
    inputLower.includes('consultoría') ||
    inputLower.includes('consultoria')
  ) {
    return {
      type: 'consulta_tributaria',
      name: 'Consulta Tributaria',
      serviceCode: 'consulta_tributaria',
    };
  }
  
  return null;
}

/**
 * Detecta si el usuario está solicitando información sobre trámites
 * y genera un menú interactivo apropiado
 */
function detectarTramiteRequest(userInput: string): InteractiveMenu | { text: string; menu: InteractiveMenu } | null {
  const inputLower = userInput.toLowerCase();

  // Detectar menciones específicas de carpeta tributaria (prioridad alta)
  if (
    inputLower.includes("carpeta tributaria") ||
    inputLower.includes("carpeta del sii") ||
    inputLower.includes("carpeta sii") ||
    (inputLower.includes("carpeta") && inputLower.includes("tributaria")) ||
    (inputLower.includes("necesito") && inputLower.includes("carpeta")) ||
    (inputLower.includes("obtener") && inputLower.includes("carpeta"))
  ) {
    const carpetaTramite = buscarTramites("carpeta tributaria");
    if (carpetaTramite.length > 0) {
      return {
        text: `Te ayudo a obtener tu carpeta tributaria electrónica del SII. Haz clic en el botón de abajo para acceder directamente al portal del SII donde podrás:\n\n• Descargar documentos tributarios\n• Acreditar renta\n• Solicitar créditos\n• Acreditar tamaño de empresa\n• Generar carpetas personalizadas\n\n**Nota:** Necesitarás tu clave del SII para acceder. Si no la tienes, puedes recuperarla en el mismo portal.`,
        menu: generarMenuTramites(carpetaTramite, "sii"),
      };
    }
  }

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
    (inputLower.includes("pago") && inputLower.includes("contribuciones")) ||
    inputLower.includes("certificado tributario") ||
    inputLower.includes("certificado de deuda")
  ) {
    const tramites = getTramitesPorCategoria("tesoreria");
    if (tramites.length > 0) {
      return generarMenuTramites(tramites, "tesoreria");
    }
  }

  // Detectar menciones de Municipalidad Iquique
  if (
    inputLower.includes("municipalidad iquique") ||
    inputLower.includes("iquique") ||
    (inputLower.includes("permiso") && inputLower.includes("circulación")) ||
    (inputLower.includes("permiso") && inputLower.includes("circulacion"))
  ) {
    const tramites = getTramitesPorCategoria("municipalidad-iquique");
    if (tramites.length > 0) {
      return generarMenuTramites(tramites, "municipalidad-iquique");
    }
  }

  // Detectar menciones de Municipalidad Alto Hospicio
  if (
    inputLower.includes("municipalidad alto hospicio") ||
    inputLower.includes("alto hospicio") ||
    (inputLower.includes("infracciones") && inputLower.includes("tránsito")) ||
    (inputLower.includes("infracciones") && inputLower.includes("transito"))
  ) {
    const tramites = getTramitesPorCategoria("municipalidad-alto-hospicio");
    if (tramites.length > 0) {
      return generarMenuTramites(tramites, "municipalidad-alto-hospicio");
    }
  }

  // Detectar solicitud genérica de trámites o categorías
  // Si el usuario pregunta por categorías o quiere ver todos los trámites, retornar null
  // para que se muestre CategoryButtons en el chat
  const solicitudCategorias = 
    inputLower.includes("ver trámites") ||
    inputLower.includes("trámites disponibles") ||
    inputLower.includes("categorías") ||
    inputLower.includes("categorias") ||
    inputLower.includes("qué trámites") ||
    inputLower.includes("que tramites") ||
    (inputLower.includes("ver") && inputLower.includes("categoría")) ||
    (inputLower.includes("ver") && inputLower.includes("categoria")) ||
    inputLower === "trámites" ||
    inputLower === "tramites";

  if (solicitudCategorias) {
    // Retornar null para que el chat muestre CategoryButtons
    return null;
  }

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

/**
 * Sistema para detectar consultas sobre servicios solicitados
 * Detecta cuando el usuario pregunta sobre el estado de un servicio o si no se entregó
 */

export interface ServiceInquiry {
  detected: boolean;
  serviceType: 'contabilidad' | 'tributario' | 'transporte' | 'taller' | 'ropa' | 'general' | null;
  inquiryType: 'status' | 'missing' | 'follow_up' | null;
  keywords: string[];
}

/**
 * Palabras clave que indican consulta sobre estado de servicio
 */
const statusKeywords = [
  'estado',
  'status',
  'cómo va',
  'como va',
  'avance',
  'progreso',
  'dónde está',
  'donde esta',
  'cuándo estará',
  'cuando estara',
  'cuando estará',
  'cuándo estara',
  'listo',
  'terminado',
  'completado',
  'entregado',
  'finalizado',
];

/**
 * Palabras clave que indican que un servicio no se entregó
 */
const missingKeywords = [
  'no entregaron',
  'no me entregaron',
  'nunca me entregaron',
  'no recibí',
  'no recibi',
  'no llegó',
  'no llego',
  'falta',
  'no está',
  'no esta',
  'no me dieron',
  'no me dieron',
  'no me enviaron',
  'no me mandaron',
  'no me pasaron',
  'no me proporcionaron',
  'no me dieron la información',
  'nunca me dieron',
  'nunca recibí',
  'nunca recibi',
  'solicité',
  'solicite',
  'pedí',
  'pedi',
  'pedimos',
  'solicitamos',
  'qué pasó',
  'que paso',
  'qué pasó con',
  'que paso con',
  'qué pasó con mi',
  'que paso con mi',
];

/**
 * Palabras clave de servicios
 */
const serviceKeywords = {
  contabilidad: ['contabilidad', 'contable', 'contador', 'declaración', 'declaracion', 'iva', 'f29', 'formulario 29', 'impuestos', 'tributario'],
  tributario: ['tributario', 'tributaria', 'impuestos', 'sii', 'iva', 'f29', 'formulario 29', 'declaración', 'declaracion'],
  transporte: ['transporte', 'fundación', 'fundacion', 'te quiero feliz', 'inclusivo', 'movilidad'],
  taller: ['taller', 'silla', 'sillas', 'ruedas', 'mmc', 'reparación', 'reparacion'],
  ropa: ['ropa', 'abuelita alejandra', 'diseño', 'diseño', 'confección', 'confeccion'],
};

/**
 * Detecta si el usuario está consultando sobre un servicio
 */
export function detectServiceInquiry(userInput: string): ServiceInquiry {
  const inputLower = userInput.toLowerCase();
  const detectedKeywords: string[] = [];
  let serviceType: ServiceInquiry['serviceType'] = null;
  let inquiryType: ServiceInquiry['inquiryType'] = null;

  // Detectar tipo de consulta
  const hasStatusKeywords = statusKeywords.some(keyword => inputLower.includes(keyword));
  const hasMissingKeywords = missingKeywords.some(keyword => inputLower.includes(keyword));
  const hasFollowUp = inputLower.includes('solicité') || inputLower.includes('solicite') || 
                      inputLower.includes('pedí') || inputLower.includes('pedi') ||
                      inputLower.includes('información') || inputLower.includes('informacion');

  if (hasStatusKeywords) {
    inquiryType = 'status';
    detectedKeywords.push(...statusKeywords.filter(k => inputLower.includes(k)));
  } else if (hasMissingKeywords) {
    inquiryType = 'missing';
    detectedKeywords.push(...missingKeywords.filter(k => inputLower.includes(k)));
  } else if (hasFollowUp) {
    inquiryType = 'follow_up';
  }

  // Detectar tipo de servicio
  for (const [service, keywords] of Object.entries(serviceKeywords)) {
    if (keywords.some(keyword => inputLower.includes(keyword))) {
      serviceType = service as ServiceInquiry['serviceType'];
      detectedKeywords.push(...keywords.filter(k => inputLower.includes(k)));
      break;
    }
  }

  // Si no se detectó servicio específico pero hay consulta, es general
  if (!serviceType && (inquiryType || hasStatusKeywords || hasMissingKeywords)) {
    serviceType = 'general';
  }

  return {
    detected: serviceType !== null || inquiryType !== null,
    serviceType,
    inquiryType,
    keywords: detectedKeywords,
  };
}

/**
 * Genera respuesta para consulta sobre servicio
 * Actúa como asistente central que recaba información y deriva según el servicio
 */
export function generateServiceInquiryResponse(
  inquiry: ServiceInquiry,
  userName?: string
): string {
  if (!inquiry.detected) {
    return '';
  }

  // Respuesta para consulta sobre servicio no entregado o seguimiento
  if (inquiry.inquiryType === 'missing' || inquiry.inquiryType === 'follow_up') {
    // Determinar el servicio y mensaje específico
    if (inquiry.serviceType === 'contabilidad' || inquiry.serviceType === 'tributario') {
      return `Entiendo tu consulta. Como asistente central de MTZ, necesito recabar información sobre tu consultoría tributaria o contable.\n\nPara ayudarte de inmediato, necesito:\n• ¿Qué servicio específicamente solicitaste? (declaración de IVA, asesoría tributaria, etc.)\n• ¿Cuándo lo solicitaste? (fecha aproximada)\n• ¿A través de qué medio? (chat, teléfono, email)\n\nCon esta información revisaré el estado y te derivaré al área correspondiente si es necesario.`;
    } else if (inquiry.serviceType === 'transporte') {
      return `Entiendo tu consulta. Como asistente central de MTZ, necesito información sobre tu solicitud de transporte inclusivo de la Fundación Te Quiero Feliz.\n\nPara ayudarte:\n• ¿Qué servicio específicamente solicitaste? (transporte, agendamiento, etc.)\n• ¿Cuándo lo solicitaste?\n• ¿A través de qué medio?\n\nCon esta información revisaré el estado y te derivaré al área correspondiente.`;
    } else if (inquiry.serviceType === 'taller') {
      return `Entiendo tu consulta. Como asistente central de MTZ, necesito información sobre tu solicitud del Taller de Sillas de Ruedas MMC.\n\nPara ayudarte:\n• ¿Qué servicio específicamente solicitaste? (reparación, mantenimiento, etc.)\n• ¿Cuándo lo solicitaste?\n• ¿A través de qué medio?\n\nCon esta información revisaré el estado y te derivaré al área correspondiente.`;
    } else if (inquiry.serviceType === 'ropa') {
      return `Entiendo tu consulta. Como asistente central de MTZ, necesito información sobre tu solicitud de la Fábrica de Ropa y Diseño Abuelita Alejandra.\n\nPara ayudarte:\n• ¿Qué servicio específicamente solicitaste? (diseño, confección, etc.)\n• ¿Cuándo lo solicitaste?\n• ¿A través de qué medio?\n\nCon esta información revisaré el estado y te derivaré al área correspondiente.`;
    } else {
      // Servicio general no identificado
      return `Entiendo tu consulta. Como asistente central de MTZ, necesito recabar información sobre el servicio que solicitaste.\n\nPara ayudarte de inmediato:\n• ¿Qué servicio específicamente solicitaste? (contabilidad, transporte, taller, ropa, etc.)\n• ¿Cuándo lo solicitaste? (fecha aproximada)\n• ¿A través de qué medio? (chat, teléfono, email)\n\nCon esta información revisaré el estado y te derivaré al área correspondiente.`;
    }
  }

  // Respuesta para consulta sobre estado
  if (inquiry.inquiryType === 'status') {
    if (inquiry.serviceType === 'contabilidad' || inquiry.serviceType === 'tributario') {
      return `Para revisar el estado de tu consultoría tributaria, necesito:\n\n• ¿Qué servicio específicamente? (declaración de IVA, asesoría, etc.)\n• ¿Cuándo lo solicitaste?\n• ¿Tienes algún número de solicitud o referencia?\n\nCon esta información te daré el estado actual y te derivaré al área de contabilidad si es necesario.`;
    } else if (inquiry.serviceType === 'transporte') {
      return `Para revisar el estado de tu solicitud de transporte, necesito:\n\n• ¿Qué servicio específicamente?\n• ¿Cuándo lo solicitaste?\n• ¿Tienes algún número de solicitud?\n\nCon esta información te daré el estado y te derivaré a la Fundación Te Quiero Feliz si es necesario.`;
    } else if (inquiry.serviceType === 'taller') {
      return `Para revisar el estado de tu solicitud del taller, necesito:\n\n• ¿Qué servicio específicamente? (reparación, mantenimiento, etc.)\n• ¿Cuándo lo solicitaste?\n• ¿Tienes algún número de solicitud?\n\nCon esta información te daré el estado y te derivaré al Taller MMC si es necesario.`;
    } else if (inquiry.serviceType === 'ropa') {
      return `Para revisar el estado de tu solicitud de ropa, necesito:\n\n• ¿Qué servicio específicamente? (diseño, confección, etc.)\n• ¿Cuándo lo solicitaste?\n• ¿Tienes algún número de solicitud?\n\nCon esta información te daré el estado y te derivaré a Abuelita Alejandra si es necesario.`;
    } else {
      return `Para revisar el estado de tu servicio, necesito:\n\n• ¿Qué servicio específicamente solicitaste?\n• ¿Cuándo lo solicitaste?\n• ¿Tienes algún número de solicitud o referencia?\n\nCon esta información te daré el estado actual y te derivaré al área correspondiente.`;
    }
  }

  return '';
}


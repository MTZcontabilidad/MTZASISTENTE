/**
 * Sistema para detectar consultas sobre servicios solicitados
 * Detecta cuando el usuario pregunta sobre el estado de un servicio o si no se entregó
 */

export interface ServiceInquiry {
  detected: boolean;
  serviceType: 'contabilidad' | 'tributario' | 'ropa' | 'general' | null;
  inquiryType: 'status' | 'missing' | 'follow_up' | null;
  keywords: string[];
}
// ... status/missing keywords remain ...
const serviceKeywords = {
  contabilidad: ['contabilidad', 'contable', 'contador', 'declaración', 'declaracion', 'iva', 'f29', 'formulario 29', 'impuestos', 'tributario'],
  tributario: ['tributario', 'tributaria', 'impuestos', 'sii', 'iva', 'f29', 'formulario 29', 'declaración', 'declaracion'],
  ropa: ['ropa', 'abuelita alejandra', 'diseño', 'diseño', 'confección', 'confeccion'],
};
// ... detectServiceInquiry logic remains mostly generic ...

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
    } else if (inquiry.serviceType === 'ropa') {
      return `Entiendo tu consulta. Como asistente central de MTZ, necesito información sobre tu solicitud de la Fábrica de Ropa y Diseño Abuelita Alejandra.\n\nPara ayudarte:\n• ¿Qué servicio específicamente solicitaste? (diseño, confección, etc.)\n• ¿Cuándo lo solicitaste?\n• ¿A través de qué medio?\n\nCon esta información revisaré el estado y te derivaré al área correspondiente.`;
    } else {
      // Servicio general no identificado
      return `Entiendo tu consulta. Como asistente central de MTZ, necesito recabar información sobre el servicio que solicitaste.\n\nPara ayudarte de inmediato:\n• ¿Qué servicio específicamente solicitaste? (contabilidad, ropa, etc.)\n• ¿Cuándo lo solicitaste? (fecha aproximada)\n• ¿A través de qué medio? (chat, teléfono, email)\n\nCon esta información revisaré el estado y te derivaré al área correspondiente.`;
    }
  }

  // Respuesta para consulta sobre estado
  if (inquiry.inquiryType === 'status') {
    if (inquiry.serviceType === 'contabilidad' || inquiry.serviceType === 'tributario') {
      return `Para revisar el estado de tu consultoría tributaria, necesito:\n\n• ¿Qué servicio específicamente? (declaración de IVA, asesoría, etc.)\n• ¿Cuándo lo solicitaste?\n• ¿Tienes algún número de solicitud o referencia?\n\nCon esta información te daré el estado actual y te derivaré al área de contabilidad si es necesario.`;
    } else if (inquiry.serviceType === 'ropa') {
      return `Para revisar el estado de tu solicitud de ropa, necesito:\n\n• ¿Qué servicio específicamente? (diseño, confección, etc.)\n• ¿Cuándo lo solicitaste?\n• ¿Tienes algún número de solicitud?\n\nCon esta información te daré el estado y te derivaré a Abuelita Alejandra si es necesario.`;
    } else {
      return `Para revisar el estado de tu servicio, necesito:\n\n• ¿Qué servicio específicamente solicitaste?\n• ¿Cuándo lo solicitaste?\n• ¿Tienes algún número de solicitud o referencia?\n\nCon esta información te daré el estado actual y te derivaré al área correspondiente.`;
    }
  }

  return '';
}


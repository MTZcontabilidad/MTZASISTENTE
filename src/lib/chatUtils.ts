import { updateClientInfo } from "./clientInfo";
import { upsertClientExtendedInfo } from "./clientExtendedInfo";

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

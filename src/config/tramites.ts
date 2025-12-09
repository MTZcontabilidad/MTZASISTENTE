/**
 * Configuración de trámites gubernamentales y enlaces directos
 * Links para SII, PreviRed, Tesorería y otros servicios
 */

export interface TramiteInfo {
  id: string;
  nombre: string;
  descripcion: string;
  url: string;
  categoria: "sii" | "previred" | "tesoreria" | "otro";
  icon?: string;
  requiere_autenticacion?: boolean;
  guia_imagen?: string; // URL o path a imagen de guía
}

/**
 * Enlaces a trámites del Servicio de Impuestos Internos (SII)
 */
export const TRAMITES_SII: TramiteInfo[] = [
  {
    id: "sii-portal",
    nombre: "Portal SII",
    descripcion: "Acceso principal al portal del SII",
    url: "https://www.sii.cl",
    categoria: "sii",
    icon: "🏛️",
    requiere_autenticacion: true,
  },
  {
    id: "sii-rut",
    nombre: "Consulta RUT",
    descripcion: "Consultar o obtener tu RUT",
    url: "https://www.sii.cl/servicios_online/1047-nomina_inst_financieras-1044-instrucciones_consulta.html",
    categoria: "sii",
    icon: "🆔",
  },
  {
    id: "sii-declaracion-renta",
    nombre: "Declaración de Renta",
    descripcion: "Realizar tu declaración de renta anual",
    url: "https://www.sii.cl/servicios_online/1047-nomina_inst_financieras-1044-instrucciones_consulta.html",
    categoria: "sii",
    icon: "📊",
    requiere_autenticacion: true,
  },
  {
    id: "sii-facturacion-electronica",
    nombre: "Facturación Electrónica",
    descripcion: "Portal de facturación electrónica",
    url: "https://www.sii.cl/servicios_online/1047-nomina_inst_financieras-1044-instrucciones_consulta.html",
    categoria: "sii",
    icon: "🧾",
    requiere_autenticacion: true,
  },
  {
    id: "sii-boletas-honorarios",
    nombre: "Boletas de Honorarios",
    descripcion: "Emitir y consultar boletas de honorarios",
    url: "https://www.sii.cl/servicios_online/1047-nomina_inst_financieras-1044-instrucciones_consulta.html",
    categoria: "sii",
    icon: "📄",
    requiere_autenticacion: true,
  },
  {
    id: "sii-iva-mensual",
    nombre: "Declaración IVA Mensual",
    descripcion: "Declarar y pagar IVA mensual",
    url: "https://www.sii.cl/servicios_online/1047-nomina_inst_financieras-1044-instrucciones_consulta.html",
    categoria: "sii",
    icon: "💰",
    requiere_autenticacion: true,
  },
  {
    id: "sii-inscripcion",
    nombre: "Inscripción en SII",
    descripcion: "Inscribir tu empresa o actividad económica",
    url: "https://www.sii.cl/servicios_online/1047-nomina_inst_financieras-1044-instrucciones_consulta.html",
    categoria: "sii",
    icon: "📝",
  },
];

/**
 * Enlaces a trámites de PreviRed
 */
export const TRAMITES_PREVIRED: TramiteInfo[] = [
  {
    id: "previred-portal",
    nombre: "Portal PreviRed",
    descripcion: "Acceso principal al portal de PreviRed",
    url: "https://www.previred.com",
    categoria: "previred",
    icon: "🏢",
    requiere_autenticacion: true,
  },
  {
    id: "previred-cotizaciones",
    nombre: "Cotizaciones Previsionales",
    descripcion: "Declarar y pagar cotizaciones previsionales",
    url: "https://www.previred.com",
    categoria: "previred",
    icon: "💼",
    requiere_autenticacion: true,
  },
  {
    id: "previred-certificado",
    nombre: "Certificado de Cotizaciones",
    descripcion: "Obtener certificado de cotizaciones",
    url: "https://www.previred.com",
    categoria: "previred",
    icon: "📜",
    requiere_autenticacion: true,
  },
  {
    id: "previred-finiquitos",
    nombre: "Finiquitos",
    descripcion: "Gestionar finiquitos de trabajadores",
    url: "https://www.previred.com",
    categoria: "previred",
    icon: "📋",
    requiere_autenticacion: true,
  },
];

/**
 * Enlaces a trámites de Tesorería General de la República
 */
export const TRAMITES_TESORERIA: TramiteInfo[] = [
  {
    id: "tesoreria-portal",
    nombre: "Portal Tesorería",
    descripcion: "Acceso principal al portal de Tesorería",
    url: "https://www.tesoreria.cl",
    categoria: "tesoreria",
    icon: "🏦",
  },
  {
    id: "tesoreria-pagos",
    nombre: "Pagos en Línea",
    descripcion: "Realizar pagos de impuestos y servicios",
    url: "https://www.tesoreria.cl",
    categoria: "tesoreria",
    icon: "💳",
  },
  {
    id: "tesoreria-certificados",
    nombre: "Certificados",
    descripcion: "Obtener certificados tributarios",
    url: "https://www.tesoreria.cl",
    categoria: "tesoreria",
    icon: "📑",
  },
];

/**
 * Todos los trámites disponibles
 */
export const TODOS_LOS_TRAMITES: TramiteInfo[] = [
  ...TRAMITES_SII,
  ...TRAMITES_PREVIRED,
  ...TRAMITES_TESORERIA,
];

/**
 * Busca trámites por palabra clave
 */
export function buscarTramites(termino: string): TramiteInfo[] {
  const terminoLower = termino.toLowerCase();
  return TODOS_LOS_TRAMITES.filter(
    (tramite) =>
      tramite.nombre.toLowerCase().includes(terminoLower) ||
      tramite.descripcion.toLowerCase().includes(terminoLower) ||
      tramite.categoria.includes(terminoLower)
  );
}

/**
 * Obtiene trámites por categoría
 */
export function getTramitesPorCategoria(
  categoria: "sii" | "previred" | "tesoreria" | "otro"
): TramiteInfo[] {
  return TODOS_LOS_TRAMITES.filter((t) => t.categoria === categoria);
}

/**
 * Genera un menú interactivo a partir de trámites
 */
export function generarMenuTramites(
  tramites: TramiteInfo[],
  categoria?: string
): any {
  // Determinar imagen de guía según la categoría
  let guideImage: string | undefined;
  if (categoria === "sii") {
    guideImage = "/images/guia-sii.png"; // Puedes agregar imágenes de guía aquí
  } else if (categoria === "previred") {
    guideImage = "/images/guia-previred.png";
  } else if (categoria === "tesoreria") {
    guideImage = "/images/guia-tesoreria.png";
  }

  return {
    id: `menu-tramites-${categoria || "general"}`,
    menu_key: `tramites-${categoria || "general"}`,
    title: categoria
      ? `Trámites de ${categoria.toUpperCase()}`
      : "Trámites Disponibles",
    description: categoria
      ? `Selecciona el trámite de ${categoria.toUpperCase()} que necesitas realizar. Haz clic en el botón para acceder directamente.`
      : "Selecciona el trámite que necesitas realizar. Haz clic en el botón para acceder directamente al portal correspondiente.",
    guide_image: guideImage,
    options: tramites.map((tramite) => ({
      id: tramite.id,
      label: `${tramite.icon || "•"} ${tramite.nombre}`,
      action: "open_url" as const,
      params: {
        url: tramite.url,
        url_type: "tramite",
        tramite_id: tramite.id,
        descripcion: tramite.descripcion,
        categoria: tramite.categoria,
      },
      icon: tramite.icon,
    })),
    priority: 8,
    triggers: [],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}


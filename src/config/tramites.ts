/**
 * Configuración de trámites gubernamentales y enlaces directos
 * Links para SII, PreviRed, Tesorería y otros servicios
 */

export interface TramiteInfo {
  id: string;
  nombre: string;
  descripcion: string;
  url: string;
  categoria: "sii" | "previred" | "tesoreria" | "municipalidad-iquique" | "municipalidad-alto-hospicio" | "otro";
  icon?: string;
  requiere_autenticacion?: boolean;
  guia_imagen?: string; // URL o path a imagen de guía
}

/**
 * Enlaces a trámites del Servicio de Impuestos Internos (SII)
 * 
 * ⚠️ IMPORTANTE: Actualiza los URLs con los links directos reales que te proporcione el usuario
 * Estos links se mostrarán a los clientes cuando soliciten ayuda con trámites
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
    id: "sii-carpeta-tributaria",
    nombre: "Carpeta Tributaria",
    descripcion: "Obtener tu carpeta tributaria electrónica del SII. Acceso directo al portal para descargar documentos tributarios, acreditar renta, solicitar créditos y más",
    url: "https://www.sii.cl/servicios_online/1047-1702.html",
    categoria: "sii",
    icon: "📁",
    requiere_autenticacion: true,
  },
  {
    id: "sii-rut",
    nombre: "Consulta RUT",
    descripcion: "Consultar o obtener tu RUT - Saber rol dirección",
    url: "https://www4.sii.cl/busquedarolesinternetui/#!/busquedaroles",
    categoria: "sii",
    icon: "🆔",
  },
  {
    id: "sii-declaracion-renta",
    nombre: "Declaración de Renta",
    descripcion: "Realizar tu declaración de renta anual",
    url: "https://renta.w.sii.cl/navegacionf22/Inicio",
    categoria: "sii",
    icon: "📊",
    requiere_autenticacion: true,
  },
  {
    id: "sii-facturacion-electronica",
    nombre: "Facturación Electrónica",
    descripcion: "Portal de facturación electrónica - Administración de documentos emitidos",
    url: "https://www1.sii.cl/cgi-bin/Portal001/mipeAdminDocsEmi.cgi?RUT_RECP=&FOLIO=&RZN_SOC=&FEC_DESDE=&FEC_HASTA=&TPO_DOC=&ESTADO=&ORDEN=&NUM_PAG=2&",
    categoria: "sii",
    icon: "🧾",
    requiere_autenticacion: true,
  },
  {
    id: "sii-boletas-honorarios",
    nombre: "Boletas de Honorarios",
    descripcion: "Consultar boletas de honorarios recibidas",
    url: "https://loa.sii.cl/cgi_IMT/TMBCOC_MenuConsultasContribRec.cgi?dummy=1461943244650",
    categoria: "sii",
    icon: "📄",
    requiere_autenticacion: true,
  },
  {
    id: "sii-iva-mensual",
    nombre: "Declaración IVA Mensual",
    descripcion: "Declarar y pagar IVA mensual (F29)",
    url: "https://www4.sii.cl/propuestaf29ui/index.html#/default",
    categoria: "sii",
    icon: "💰",
    requiere_autenticacion: true,
  },
  {
    id: "sii-inscripcion",
    nombre: "Inscripción en SII",
    descripcion: "Inscribir tu empresa o actividad económica - Consulta inicio de actividades",
    url: "https://www4.sii.cl/busquedarolesinternetui/#!/busquedaroles",
    categoria: "sii",
    icon: "📝",
  },
  {
    id: "sii-libros-compra-venta",
    nombre: "Libros Compra Venta",
    descripcion: "Consultar y gestionar libros de compra y venta",
    url: "https://www4.sii.cl/consdcvinternetui/#/index",
    categoria: "sii",
    icon: "📚",
    requiere_autenticacion: true,
  },
  {
    id: "sii-agente-retenedor",
    nombre: "Agente Retenedor",
    descripcion: "Consultar declaraciones juradas como agente retenedor",
    url: "https://www4.sii.cl/djconsultarentaui/internet/#/agenteretenedor/",
    categoria: "sii",
    icon: "👤",
    requiere_autenticacion: true,
  },
  {
    id: "sii-declaraciones-juradas",
    nombre: "Declaraciones Juradas",
    descripcion: "Realizar y consultar declaraciones juradas de renta",
    url: "https://www4.sii.cl/perfilamientodjui/#/declaracionJuradaRenta",
    categoria: "sii",
    icon: "📋",
    requiere_autenticacion: true,
  },
  {
    id: "sii-consulta-integral",
    nombre: "Consulta Integral",
    descripcion: "Consulta integral de formularios y documentos",
    url: "https://www4.sii.cl/sifmConsultaInternet/index.html?dest=cifxx&form=29",
    categoria: "sii",
    icon: "🔍",
    requiere_autenticacion: true,
  },
  {
    id: "sii-estado-declaracion",
    nombre: "Estado Declaración de Renta",
    descripcion: "Consultar el estado de tu declaración de renta",
    url: "https://www4.sii.cl/consultaestadof22ui/#!/default",
    categoria: "sii",
    icon: "📊",
    requiere_autenticacion: true,
  },
  {
    id: "sii-consultar-estado",
    nombre: "Consultar Estado de Declaración",
    descripcion: "Consultar el estado de declaraciones presentadas",
    url: "https://www4.sii.cl/rfiInternet/consulta/index.html#rfiSelFormularioPeriodo",
    categoria: "sii",
    icon: "✅",
    requiere_autenticacion: true,
  },
  {
    id: "sii-pago-diferido",
    nombre: "Pago Diferido",
    descripcion: "Solicitar pago diferido de impuestos",
    url: "https://zeusr.sii.cl/AUT2000/InicioAutenticacion/IngresoRutClave.html?https://www4.sii.cl/pagodiferidoui/internet/",
    categoria: "sii",
    icon: "💳",
    requiere_autenticacion: true,
  },
  {
    id: "sii-cambiar-clave",
    nombre: "Cambiar Clave SII",
    descripcion: "Cambiar tu clave de acceso al SII",
    url: "https://zeusr.sii.cl/AUT2000/InicioAutenticacion/IngresoRutClave.html?https://www4.sii.cl/coreautcntrui/cambioClave.html#/ingresoCambioClave",
    categoria: "sii",
    icon: "🔑",
    requiere_autenticacion: true,
  },
];

/**
 * Enlaces a trámites de PreviRed
 * ⚠️ ACTUALIZAR con links directos reales
 */
export const TRAMITES_PREVIRED: TramiteInfo[] = [
  {
    id: "previred-portal",
    nombre: "Portal PreviRed",
    descripcion: "Acceso principal al portal de PreviRed",
    url: "https://www.previred.com/web/previred/",
    categoria: "previred",
    icon: "🏢",
    requiere_autenticacion: true,
  },
  {
    id: "previred-cotizaciones",
    nombre: "Cotizaciones Previsionales",
    descripcion: "Declarar y pagar cotizaciones previsionales",
    url: "https://www.previred.com", // ⬅️ ACTUALIZAR con link directo
    categoria: "previred",
    icon: "💼",
    requiere_autenticacion: true,
  },
  {
    id: "previred-certificado",
    nombre: "Certificado de Cotizaciones",
    descripcion: "Obtener certificado de cotizaciones",
    url: "https://www.previred.com", // ⬅️ ACTUALIZAR con link directo
    categoria: "previred",
    icon: "📜",
    requiere_autenticacion: true,
  },
  {
    id: "previred-finiquitos",
    nombre: "Finiquitos",
    descripcion: "Gestionar finiquitos de trabajadores",
    url: "https://www.previred.com", // ⬅️ ACTUALIZAR con link directo
    categoria: "previred",
    icon: "📋",
    requiere_autenticacion: true,
  },
];

/**
 * Enlaces a trámites de Tesorería General de la República
 * ⚠️ ACTUALIZAR con links directos reales
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
    nombre: "Certificados Tributarios",
    descripcion: "Obtener certificados tributarios y de deuda fiscal",
    url: "https://www.tesoreria.cl",
    categoria: "tesoreria",
    icon: "📑",
  },
  {
    id: "tesoreria-contribuciones",
    nombre: "Pago de Contribuciones",
    descripcion: "Pagar contribuciones de bienes raíces",
    url: "https://www.tesoreria.cl",
    categoria: "tesoreria",
    icon: "🏠",
  },
  {
    id: "tesoreria-certificado-deuda",
    nombre: "Certificado de Deuda Fiscal",
    descripcion: "Obtener certificado de deuda fiscal",
    url: "https://www.tesoreria.cl",
    categoria: "tesoreria",
    icon: "📋",
  },
];

/**
 * Enlaces a trámites de Municipalidad de Iquique
 */
export const TRAMITES_MUNICIPALIDAD_IQUIQUE: TramiteInfo[] = [
  {
    id: "municipalidad-iquique-portal",
    nombre: "Portal Municipalidad Iquique",
    descripcion: "Acceso principal al portal de la Municipalidad de Iquique",
    url: "https://www.municipioiquique.cl",
    categoria: "municipalidad-iquique",
    icon: "🏛️",
  },
  {
    id: "municipalidad-iquique-permiso-circulacion",
    nombre: "Permiso de Circulación",
    descripcion: "Pagar permiso de circulación de vehículos",
    url: "https://www.municipioiquique.cl",
    categoria: "municipalidad-iquique",
    icon: "🚗",
  },
  {
    id: "municipalidad-iquique-patentes",
    nombre: "Pago de Patentes",
    descripcion: "Pagar patentes comerciales e industriales",
    url: "https://www.municipioiquique.cl",
    categoria: "municipalidad-iquique",
    icon: "💼",
  },
  {
    id: "municipalidad-iquique-licencias",
    nombre: "Licencias de Conducción",
    descripcion: "Trámites relacionados con licencias de conducir",
    url: "https://www.municipioiquique.cl",
    categoria: "municipalidad-iquique",
    icon: "🪪",
  },
  {
    id: "municipalidad-iquique-certificados",
    nombre: "Certificados Municipales",
    descripcion: "Obtener certificados municipales",
    url: "https://www.municipioiquique.cl",
    categoria: "municipalidad-iquique",
    icon: "📜",
  },
];

/**
 * Enlaces a trámites de Municipalidad de Alto Hospicio
 */
export const TRAMITES_MUNICIPALIDAD_ALTO_HOSPICIO: TramiteInfo[] = [
  {
    id: "municipalidad-alto-hospicio-portal",
    nombre: "Portal Municipalidad Alto Hospicio",
    descripcion: "Acceso principal al portal de la Municipalidad de Alto Hospicio",
    url: "https://www.maho.cl",
    categoria: "municipalidad-alto-hospicio",
    icon: "🏛️",
  },
  {
    id: "municipalidad-alto-hospicio-permiso-circulacion",
    nombre: "Permiso de Circulación",
    descripcion: "Pagar permiso de circulación de vehículos",
    url: "https://www.maho.cl",
    categoria: "municipalidad-alto-hospicio",
    icon: "🚗",
  },
  {
    id: "municipalidad-alto-hospicio-infracciones",
    nombre: "Pago de Infracciones",
    descripcion: "Pagar multas e infracciones de tránsito",
    url: "https://www.maho.cl",
    categoria: "municipalidad-alto-hospicio",
    icon: "⚠️",
  },
  {
    id: "municipalidad-alto-hospicio-patentes",
    nombre: "Pago de Patentes",
    descripcion: "Pagar patentes comerciales e industriales",
    url: "https://www.maho.cl",
    categoria: "municipalidad-alto-hospicio",
    icon: "💼",
  },
  {
    id: "municipalidad-alto-hospicio-certificados",
    nombre: "Certificados Municipales",
    descripcion: "Obtener certificados municipales",
    url: "https://www.maho.cl",
    categoria: "municipalidad-alto-hospicio",
    icon: "📜",
  },
];

/**
 * Todos los trámites disponibles
 */
export const TODOS_LOS_TRAMITES: TramiteInfo[] = [
  ...TRAMITES_SII,
  ...TRAMITES_PREVIRED,
  ...TRAMITES_TESORERIA,
  ...TRAMITES_MUNICIPALIDAD_IQUIQUE,
  ...TRAMITES_MUNICIPALIDAD_ALTO_HOSPICIO,
];

/**
 * Busca trámites por palabra clave
 */
export function buscarTramites(termino: string): TramiteInfo[] {
  const terminoLower = termino.toLowerCase();
  
  // Búsqueda mejorada con palabras clave específicas
  return TODOS_LOS_TRAMITES.filter(
    (tramite) => {
      const nombreMatch = tramite.nombre.toLowerCase().includes(terminoLower);
      const descripcionMatch = tramite.descripcion.toLowerCase().includes(terminoLower);
      const categoriaMatch = tramite.categoria.includes(terminoLower);
      
      // Detección especial para carpeta tributaria
      if (
        (terminoLower.includes("carpeta") && terminoLower.includes("tributaria")) ||
        (terminoLower.includes("carpeta") && terminoLower.includes("sii")) ||
        (terminoLower.includes("documentos") && terminoLower.includes("tributarios"))
      ) {
        return tramite.id === "sii-carpeta-tributaria";
      }
      
      return nombreMatch || descripcionMatch || categoriaMatch;
    }
  );
}

/**
 * Obtiene trámites por categoría
 */
export function getTramitesPorCategoria(
  categoria: "sii" | "previred" | "tesoreria" | "municipalidad-iquique" | "municipalidad-alto-hospicio" | "otro"
): TramiteInfo[] {
  return TODOS_LOS_TRAMITES.filter((t) => t.categoria === categoria);
}

/**
 * Obtiene todas las categorías disponibles
 */
export function getCategoriasDisponibles(): Array<{
  id: string;
  nombre: string;
  icon: string;
  descripcion: string;
}> {
  return [
    {
      id: "sii",
      nombre: "SII - Impuestos Internos",
      icon: "🏛️",
      descripcion: "Trámites del Servicio de Impuestos Internos",
    },
    {
      id: "previred",
      nombre: "PreviRed",
      icon: "🏢",
      descripcion: "Trámites previsionales y laborales",
    },
    {
      id: "tesoreria",
      nombre: "Tesorería",
      icon: "🏦",
      descripcion: "Pagos y certificados tributarios",
    },
    {
      id: "municipalidad-iquique",
      nombre: "Municipalidad Iquique",
      icon: "🏛️",
      descripcion: "Trámites municipales de Iquique",
    },
    {
      id: "municipalidad-alto-hospicio",
      nombre: "Municipalidad Alto Hospicio",
      icon: "🏛️",
      descripcion: "Trámites municipales de Alto Hospicio",
    },
  ];
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


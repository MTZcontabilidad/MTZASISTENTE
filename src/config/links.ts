/**
 * Configuración centralizada de enlaces y URLs de MTZ
 * Actualiza estos valores con los enlaces reales de tu empresa
 */

export interface MTZLinks {
  website: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  whatsapp: string;
  email: string;
  contabilidad: {
    url: string;
    nombre: string;
    descripcion: string;
  };
  transporte: {
    url: string;
    nombre: string;
    descripcion: string;
  };
  taller: {
    url: string;
    nombre: string;
    descripcion: string;
  };
}

// TODO: Actualizar con los enlaces reales de MTZ
export const MTZ_LINKS: MTZLinks = {
  website: "https://www.mtzcontabilidad.com", // Actualizar con URL real
  facebook: "https://www.facebook.com/MTZContabilidad", // Actualizar
  instagram: "https://www.instagram.com/mtzcontabilidad", // Actualizar
  linkedin: "https://www.linkedin.com/company/mtz-contabilidad", // Actualizar
  whatsapp: "https://wa.me/56990062213", // WhatsApp: +56990062213 (Carlos Alejandro Villagra Farias)
  email: "mtzcontabilidad@gmail.com",

  contabilidad: {
    url: "https://www.mtzcontabilidad.com/servicios/contabilidad", // Actualizar
    nombre: "Empresa de Contabilidad MTZ",
    descripcion:
      "Servicios contables profesionales y asesoría fiscal para tu negocio",
  },

  transporte: {
    url: "https://www.mtzcontabilidad.com/servicios/transporte-inclusivo", // Actualizar
    nombre: "Fundación de Transporte Inclusivo",
    descripcion: "Transporte accesible para personas con movilidad reducida",
  },

  taller: {
    url: "https://www.mtzcontabilidad.com/servicios/taller-sillas", // Actualizar
    nombre: "Taller de Sillas de Ruedas",
    descripcion: "Reparación, mantenimiento y adaptación de sillas de ruedas",
  },
};

/**
 * Genera un enlace de WhatsApp con mensaje predefinido
 */
export function getWhatsAppLink(
  message: string = "Hola, me gustaría obtener más información"
): string {
  const encodedMessage = encodeURIComponent(message);
  return `${MTZ_LINKS.whatsapp}?text=${encodedMessage}`;
}

/**
 * Abre un enlace en una nueva pestaña
 */
export function openLink(url: string, newTab: boolean = true): void {
  if (newTab) {
    window.open(url, "_blank", "noopener,noreferrer");
  } else {
    window.location.href = url;
  }
}

/**
 * Configuración de servicios de MTZ
 * Información detallada de cada servicio para mostrar en la aplicación
 * 
 * NOTA: openLink está en '../config/links', no aquí
 */

export interface MTZService {
  id: string
  name: string
  description: string
  icon: string
  image?: string
  features: string[]
  link: string
  contactInfo?: {
    phone?: string
    email?: string
    whatsapp?: string
  }
}

export const MTZ_SERVICES: MTZService[] = [
  {
    id: 'contabilidad',
    name: 'Empresa de Contabilidad MTZ',
    description: 'Servicios contables profesionales y asesoría fiscal para tu negocio',
    icon: '🏢',
    features: [
      'Contabilidad general',
      'Declaración de impuestos',
      'Asesoría fiscal',
      'Liquidación de sueldos',
      'Consultoría empresarial'
    ],
    link: '/servicios/contabilidad', // O URL completa
    contactInfo: {
      email: 'contabilidad@mtzcontabilidad.com',
      whatsapp: 'https://wa.me/56912345678'
    }
  },
  {
    id: 'transporte',
    name: 'Fundación de Transporte Inclusivo',
    description: 'Transporte accesible para personas con movilidad reducida',
    icon: '🚐',
    features: [
      'Transporte adaptado',
      'Servicio puerta a puerta',
      'Personal capacitado',
      'Horarios flexibles',
      'Tarifas accesibles'
    ],
    link: '/servicios/transporte-inclusivo',
    contactInfo: {
      phone: '+56 9 XXXX XXXX',
      whatsapp: 'https://wa.me/56912345678'
    }
  },
  {
    id: 'taller',
    name: 'Taller de Sillas de Ruedas',
    description: 'Reparación, mantenimiento y adaptación de sillas de ruedas',
    icon: '🦽',
    features: [
      'Reparación de sillas',
      'Mantenimiento preventivo',
      'Adaptaciones personalizadas',
      'Venta de repuestos',
      'Servicio a domicilio'
    ],
    link: '/servicios/taller-sillas',
    contactInfo: {
      phone: '+56 9 XXXX XXXX',
      whatsapp: 'https://wa.me/56912345678'
    }
  }
]

/**
 * Obtiene un servicio por su ID
 */
export function getServiceById(id: string): MTZService | undefined {
  return MTZ_SERVICES.find(service => service.id === id)
}

/**
 * Obtiene todos los servicios
 */
export function getAllServices(): MTZService[] {
  return MTZ_SERVICES
}

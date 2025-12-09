/**
 * Sistema para manejar solicitudes de servicios (Taller y Transporte)
 * Detecta cuando el usuario quiere solicitar un servicio y guía el proceso
 */

import { createWheelchairRequest, type WheelchairRequestInput } from './wheelchairWorkshop'
import { createTransportRequest, type TransportRequestInput } from './transportRequests'

export interface ServiceRequestState {
  serviceType: 'wheelchair' | 'transport' | null
  step: number
  collectedData: Record<string, any>
  isComplete: boolean
}

/**
 * Detecta si el usuario está solicitando un servicio
 */
export function detectServiceRequest(userInput: string): 'wheelchair' | 'transport' | null {
  const inputLower = userInput.toLowerCase()
  
  // Detectar solicitud de taller de sillas de ruedas
  if (
    inputLower.includes('taller') ||
    inputLower.includes('silla de ruedas') ||
    inputLower.includes('silla de rueda') ||
    inputLower.includes('reparar silla') ||
    inputLower.includes('arreglar silla') ||
    inputLower.includes('mantenimiento silla') ||
    inputLower.includes('adaptar silla') ||
    (inputLower.includes('silla') && (inputLower.includes('reparar') || inputLower.includes('arreglar')))
  ) {
    return 'wheelchair'
  }
  
  // Detectar solicitud de transporte
  if (
    inputLower.includes('transporte') ||
    inputLower.includes('llevar') ||
    inputLower.includes('llevarme') ||
    inputLower.includes('viaje') ||
    inputLower.includes('necesito ir') ||
    inputLower.includes('quiero ir') ||
    inputLower.includes('fundación') ||
    inputLower.includes('te quiero feliz') ||
    (inputLower.includes('movilidad') && inputLower.includes('reducida'))
  ) {
    return 'transport'
  }
  
  return null
}

/**
 * Determina qué pregunta hacer según el paso actual
 */
export function getNextQuestion(
  serviceType: 'wheelchair' | 'transport',
  step: number,
  collectedData: Record<string, any>
): string {
  if (serviceType === 'wheelchair') {
    switch (step) {
      case 1:
        return '¡Perfecto! Te ayudo con el taller de sillas de ruedas. 🪑\n\nPara comenzar, necesito algunos datos:\n\n**¿Cuál es tu nombre completo?**'
      case 2:
        return 'Gracias. **¿Cuál es tu número de teléfono?** (Ejemplo: +56 9 1234 5678)'
      case 3:
        return 'Excelente. **¿Cuál es tu correo electrónico?** (opcional)'
      case 4:
        return '**¿Qué tipo de servicio necesitas?**\n\n• Reparación\n• Mantenimiento\n• Adaptación\n• Revisión\n• Otro'
      case 5:
        return '**Por favor, describe el problema o lo que necesitas:**'
      case 6:
        return '**¿Qué tipo de silla de ruedas tienes?**\n\n• Manual\n• Eléctrica\n• Deportiva\n• Pediátrica\n• Otro'
      case 7:
        return '**¿Cuál es la marca y modelo de tu silla?** (opcional)'
      case 8:
        return '**¿En qué estado está tu silla?**\n\n• Buena condición\n• Regular\n• Mala condición\n• No funciona'
      case 9:
        return '**¿Cuándo te gustaría que revisemos tu silla?** (fecha preferida, ejemplo: 2024-12-15)'
      case 10:
        return '**¿A qué hora prefieres?** (ejemplo: 10:00)'
      case 11:
        return '**¿Dónde prefieres que se realice el servicio?**\n\n• En el taller\n• A domicilio\n• Otro lugar'
      case 12:
        if (collectedData.location === 'domicilio') {
          return '**Por favor, proporciona la dirección donde quieres que vayamos:**'
        }
        return '**¿Es urgente?** (Sí/No)'
      case 13:
        return 'Perfecto. He registrado tu solicitud. 📝\n\nNuestro equipo revisará tu solicitud y te contactará pronto al teléfono que proporcionaste.\n\n**Teléfono del taller: +56 9 3300 3113**\n\n¿Hay algo más en lo que pueda ayudarte?'
      default:
        return 'Gracias por la información. ¿Hay algo más que quieras agregar?'
    }
  } else if (serviceType === 'transport') {
    switch (step) {
      case 1:
        return '¡Excelente! Te ayudo con el transporte inclusivo de la Fundación Te Quiero Feliz. 🚐\n\nPara comenzar, necesito algunos datos:\n\n**¿Cuál es el nombre completo del pasajero?**'
      case 2:
        return 'Gracias. **¿Cuál es el número de teléfono del pasajero?** (Ejemplo: +56 9 1234 5678)'
      case 3:
        return '**¿Cuál es el correo electrónico?** (opcional)'
      case 4:
        return '**¿Cuál es la edad del pasajero?** (opcional)'
      case 5:
        return '**¿El pasajero usa alguna ayuda de movilidad?** (Sí/No)\n\n• Silla de ruedas\n• Andador\n• Muletas\n• Otro'
      case 6:
        if (collectedData.has_mobility_aid === 'sí' || collectedData.has_mobility_aid === 'si') {
          return '**¿Qué tipo de ayuda de movilidad?** (silla de ruedas, andador, muletas, otro)'
        }
        return '**¿El pasajero tiene alguna necesidad especial que debamos conocer?** (opcional)'
      case 7:
        return '**¿Habrá un acompañante?** (Sí/No)'
      case 8:
        if (collectedData.has_companion === 'sí' || collectedData.has_companion === 'si') {
          return '**¿Cuál es el nombre del acompañante?**'
        }
        return '**¿Qué tipo de viaje necesitas?**\n\n• Solo ida\n• Solo vuelta\n• Ida y vuelta'
      case 9:
        if (collectedData.has_companion === 'sí' || collectedData.has_companion === 'si') {
          return '**¿Cuál es el teléfono del acompañante?**'
        }
        return '**¿Cuál es la dirección de origen?** (desde dónde salimos)'
      case 10:
        if (collectedData.has_companion === 'sí' || collectedData.has_companion === 'si') {
          return '**¿Cuál es la relación del acompañante?** (familiar, cuidador, otro)'
        }
        return '**¿Cuál es la dirección de destino?** (hacia dónde vamos)'
      case 11:
        if (collectedData.has_companion === 'sí' || collectedData.has_companion === 'si') {
          return '**¿Qué tipo de viaje necesitas?**\n\n• Solo ida\n• Solo vuelta\n• Ida y vuelta'
        }
        return '**¿Cuál es la fecha del viaje?** (formato: YYYY-MM-DD, ejemplo: 2024-12-15)'
      case 12:
        if (collectedData.has_companion === 'sí' || collectedData.has_companion === 'si') {
          return '**¿Cuál es la dirección de origen?** (desde dónde salimos)'
        }
        return '**¿A qué hora necesitas el viaje?** (formato: HH:MM, ejemplo: 10:00)'
      case 13:
        if (collectedData.has_companion === 'sí' || collectedData.has_companion === 'si') {
          return '**¿Cuál es la dirección de destino?** (hacia dónde vamos)'
        }
        if (collectedData.trip_type === 'ida_vuelta') {
          return '**¿Cuál es la fecha de retorno?** (formato: YYYY-MM-DD)'
        }
        return '**¿Cuál es el motivo del viaje?** (médico, trabajo, educación, social, otro)'
      case 14:
        if (collectedData.has_companion === 'sí' || collectedData.has_companion === 'si') {
          return '**¿Cuál es la fecha del viaje?** (formato: YYYY-MM-DD, ejemplo: 2024-12-15)'
        }
        if (collectedData.trip_type === 'ida_vuelta') {
          return '**¿A qué hora es el retorno?** (formato: HH:MM)'
        }
        return '**¿El pasajero requiere asistencia especial?** (Sí/No)\n\n• Ayuda para subir/bajar\n• Acompañamiento\n• Carga de equipamiento\n• Otro'
      case 15:
        if (collectedData.has_companion === 'sí' || collectedData.has_companion === 'si') {
          return '**¿A qué hora necesitas el viaje?** (formato: HH:MM, ejemplo: 10:00)'
        }
        return 'Perfecto. He registrado tu solicitud de transporte. 📝\n\nNuestro equipo revisará tu solicitud y te contactará pronto al teléfono que proporcionaste.\n\n**Teléfono: +56 9 3300 3113**\n\n¿Hay algo más en lo que pueda ayudarte?'
      case 16:
        if (collectedData.has_companion === 'sí' || collectedData.has_companion === 'si') {
          if (collectedData.trip_type === 'ida_vuelta') {
            return '**¿Cuál es la fecha de retorno?** (formato: YYYY-MM-DD)'
          }
          return '**¿Qué tipo de viaje necesitas?**\n\n• Solo ida\n• Solo vuelta\n• Ida y vuelta'
        }
        return 'Perfecto. He registrado tu solicitud de transporte. 📝\n\nNuestro equipo revisará tu solicitud y te contactará pronto al teléfono que proporcionaste.\n\n**Teléfono: +56 9 3300 3113**\n\n¿Hay algo más en lo que pueda ayudarte?'
      default:
        return 'Gracias por la información. ¿Hay algo más que quieras agregar?'
    }
  }
  
  return ''
}

/**
 * Procesa la respuesta del usuario y actualiza los datos recolectados
 */
export function processUserResponse(
  serviceType: 'wheelchair' | 'transport',
  step: number,
  userResponse: string,
  collectedData: Record<string, any>
): Record<string, any> {
  const response = userResponse.trim()
  const updatedData = { ...collectedData }
  
  if (serviceType === 'wheelchair') {
    switch (step) {
      case 1:
        updatedData.client_name = response
        break
      case 2:
        updatedData.client_phone = response
        break
      case 3:
        if (response && response.toLowerCase() !== 'no' && response.toLowerCase() !== 'n/a') {
          updatedData.client_email = response
        }
        break
      case 4:
        const serviceTypeMap: Record<string, string> = {
          'reparación': 'reparacion',
          'reparacion': 'reparacion',
          'mantenimiento': 'mantenimiento',
          'adaptación': 'adaptacion',
          'adaptacion': 'adaptacion',
          'revisión': 'revision',
          'revision': 'revision',
          'otro': 'otro'
        }
        updatedData.service_type = serviceTypeMap[response.toLowerCase()] || 'otro'
        break
      case 5:
        updatedData.service_description = response
        break
      case 6:
        updatedData.wheelchair_type = response.toLowerCase()
        break
      case 7:
        if (response && response.toLowerCase() !== 'no' && response.toLowerCase() !== 'n/a') {
          updatedData.wheelchair_brand = response
        }
        break
      case 8:
        updatedData.wheelchair_condition = response.toLowerCase()
        break
      case 9:
        updatedData.preferred_date = response
        break
      case 10:
        updatedData.preferred_time = response
        break
      case 11:
        const locationMap: Record<string, string> = {
          'taller': 'taller',
          'en el taller': 'taller',
          'domicilio': 'domicilio',
          'a domicilio': 'domicilio',
          'casa': 'domicilio',
          'mi casa': 'domicilio',
          'otro': 'otro'
        }
        updatedData.location = locationMap[response.toLowerCase()] || 'taller'
        break
      case 12:
        if (updatedData.location === 'domicilio') {
          updatedData.address_if_domicilio = response
        } else {
          updatedData.is_urgent = response.toLowerCase().includes('sí') || response.toLowerCase().includes('si') || response.toLowerCase().includes('yes')
        }
        break
    }
  } else if (serviceType === 'transport') {
    switch (step) {
      case 1:
        updatedData.passenger_name = response
        break
      case 2:
        updatedData.passenger_phone = response
        break
      case 3:
        if (response && response.toLowerCase() !== 'no' && response.toLowerCase() !== 'n/a') {
          updatedData.passenger_email = response
        }
        break
      case 4:
        if (response && !isNaN(parseInt(response))) {
          updatedData.passenger_age = parseInt(response)
        }
        break
      case 5:
        updatedData.has_mobility_aid = response.toLowerCase().includes('sí') || response.toLowerCase().includes('si') || response.toLowerCase().includes('yes')
        break
      case 6:
        if (updatedData.has_mobility_aid) {
          updatedData.mobility_aid_type = response.toLowerCase()
        } else {
          updatedData.special_needs = response
        }
        break
      case 7:
        updatedData.has_companion = response.toLowerCase().includes('sí') || response.toLowerCase().includes('si') || response.toLowerCase().includes('yes')
        break
      case 8:
        if (updatedData.has_companion) {
          updatedData.companion_name = response
        } else {
          const tripTypeMap: Record<string, string> = {
            'ida': 'ida',
            'solo ida': 'ida',
            'vuelta': 'vuelta',
            'solo vuelta': 'vuelta',
            'ida y vuelta': 'ida_vuelta',
            'ida_vuelta': 'ida_vuelta'
          }
          updatedData.trip_type = tripTypeMap[response.toLowerCase()] || 'ida'
        }
        break
      case 9:
        if (updatedData.has_companion) {
          updatedData.companion_phone = response
        } else {
          updatedData.origin_address = response
        }
        break
      case 10:
        if (updatedData.has_companion) {
          updatedData.companion_relationship = response.toLowerCase()
        } else {
          updatedData.destination_address = response
        }
        break
      case 11:
        if (updatedData.has_companion) {
          const tripTypeMap: Record<string, string> = {
            'ida': 'ida',
            'solo ida': 'ida',
            'vuelta': 'vuelta',
            'solo vuelta': 'vuelta',
            'ida y vuelta': 'ida_vuelta',
            'ida_vuelta': 'ida_vuelta'
          }
          updatedData.trip_type = tripTypeMap[response.toLowerCase()] || 'ida'
        } else {
          updatedData.trip_date = response
        }
        break
      case 12:
        if (updatedData.has_companion) {
          updatedData.origin_address = response
        } else {
          updatedData.trip_time = response
        }
        break
      case 13:
        if (updatedData.has_companion) {
          updatedData.destination_address = response
        } else if (updatedData.trip_type === 'ida_vuelta') {
          updatedData.return_date = response
        } else {
          updatedData.trip_purpose = response.toLowerCase()
        }
        break
      case 14:
        if (updatedData.has_companion) {
          updatedData.trip_date = response
        } else if (updatedData.trip_type === 'ida_vuelta') {
          updatedData.return_time = response
        } else {
          updatedData.requires_assistance = response.toLowerCase().includes('sí') || response.toLowerCase().includes('si') || response.toLowerCase().includes('yes')
          if (updatedData.requires_assistance) {
            updatedData.assistance_type = response
          }
        }
        break
      case 15:
        if (updatedData.has_companion) {
          updatedData.trip_time = response
        }
        break
      case 16:
        if (updatedData.has_companion && updatedData.trip_type === 'ida_vuelta') {
          updatedData.return_date = response
        }
        break
    }
  }
  
  return updatedData
}

/**
 * Determina si la solicitud está completa
 */
export function isRequestComplete(
  serviceType: 'wheelchair' | 'transport',
  collectedData: Record<string, any>
): boolean {
  if (serviceType === 'wheelchair') {
    return !!(
      collectedData.client_name &&
      collectedData.client_phone &&
      collectedData.service_type &&
      collectedData.service_description
    )
  } else if (serviceType === 'transport') {
    return !!(
      collectedData.passenger_name &&
      collectedData.passenger_phone &&
      collectedData.trip_type &&
      collectedData.origin_address &&
      collectedData.destination_address &&
      collectedData.trip_date &&
      collectedData.trip_time
    )
  }
  return false
}

/**
 * Crea la solicitud en la base de datos
 */
export async function submitServiceRequest(
  serviceType: 'wheelchair' | 'transport',
  userId: string | null,
  conversationId: string | null,
  collectedData: Record<string, any>
): Promise<boolean> {
  try {
    if (serviceType === 'wheelchair') {
      const requestData: WheelchairRequestInput = {
        client_name: collectedData.client_name,
        client_phone: collectedData.client_phone,
        client_email: collectedData.client_email,
        client_address: collectedData.address_if_domicilio,
        wheelchair_type: collectedData.wheelchair_type,
        wheelchair_brand: collectedData.wheelchair_brand,
        wheelchair_model: collectedData.wheelchair_model,
        wheelchair_condition: collectedData.wheelchair_condition,
        service_type: collectedData.service_type || 'otro',
        service_description: collectedData.service_description,
        is_urgent: collectedData.is_urgent || false,
        preferred_date: collectedData.preferred_date,
        preferred_time: collectedData.preferred_time,
        location: collectedData.location || 'taller',
        address_if_domicilio: collectedData.address_if_domicilio
      }
      
      const result = await createWheelchairRequest(userId, conversationId, requestData)
      return result !== null
    } else if (serviceType === 'transport') {
      const requestData: TransportRequestInput = {
        passenger_name: collectedData.passenger_name,
        passenger_phone: collectedData.passenger_phone,
        passenger_email: collectedData.passenger_email,
        passenger_age: collectedData.passenger_age,
        has_mobility_aid: collectedData.has_mobility_aid || false,
        mobility_aid_type: collectedData.mobility_aid_type,
        mobility_aid_description: collectedData.mobility_aid_description,
        special_needs: collectedData.special_needs,
        companion_name: collectedData.companion_name,
        companion_phone: collectedData.companion_phone,
        companion_relationship: collectedData.companion_relationship,
        trip_type: collectedData.trip_type || 'ida',
        origin_address: collectedData.origin_address,
        destination_address: collectedData.destination_address,
        trip_date: collectedData.trip_date,
        trip_time: collectedData.trip_time,
        return_date: collectedData.return_date,
        return_time: collectedData.return_time,
        trip_purpose: collectedData.trip_purpose,
        trip_purpose_description: collectedData.trip_purpose_description,
        requires_assistance: collectedData.requires_assistance || false,
        assistance_type: collectedData.assistance_type,
        number_of_passengers: collectedData.has_companion ? 2 : 1
      }
      
      const result = await createTransportRequest(userId, conversationId, requestData)
      return result !== null
    }
    
    return false
  } catch (error) {
    console.error('Error al crear solicitud:', error)
    return false
  }
}


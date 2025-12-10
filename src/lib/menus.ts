/**
 * Funciones para gestionar menús interactivos
 */

import { supabase } from './supabase'

export interface MenuOption {
  id: string
  label: string
  action: 'get_document' | 'open_url' | 'show_info' | 'show_menu' | 'list_documents' | 'navigate' | 'show_tutorial' | 'contact_support' | 'link'
  params?: Record<string, any>
  icon?: string
}

export interface InteractiveMenu {
  id: string
  menu_key: string
  title: string
  description?: string
  options: MenuOption[]
  priority: number
  triggers: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Obtiene un menú por su clave
 */
export async function getMenu(menuKey: string): Promise<InteractiveMenu | null> {
  try {
    const { data, error } = await supabase
      .from('interactive_menus')
      .select('*')
      .eq('menu_key', menuKey)
      .eq('is_active', true)
      .single()

    if (error) throw error
    return data ? { ...data, options: data.options as MenuOption[] } : null
  } catch (error) {
    console.error('Error al obtener menú:', error)
    return null
  }
}

/**
 * Obtiene todos los menús activos
 */
export async function getAllMenus(): Promise<InteractiveMenu[]> {
  try {
    const { data, error } = await supabase
      .from('interactive_menus')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false })

    if (error) throw error
    return (data || []).map(menu => ({
      ...menu,
      options: menu.options as MenuOption[]
    }))
  } catch (error) {
    console.error('Error al obtener menús:', error)
    return []
  }
}

/**
 * Detecta si el input del usuario debería mostrar un menú
 */
export function shouldShowMenu(userInput: string, menu: InteractiveMenu): boolean {
  const inputLower = userInput.toLowerCase()
  
  // Si el input contiene algún trigger del menú
  return menu.triggers.some(trigger => 
    inputLower.includes(trigger.toLowerCase())
  )
}

/**
 * Encuentra el menú más relevante para un input
 */
export async function findRelevantMenu(userInput: string): Promise<InteractiveMenu | null> {
  const menus = await getAllMenus()
  const inputLower = userInput.toLowerCase()

  // Buscar menú que coincida con triggers
  const matchingMenus = menus
    .filter(menu => shouldShowMenu(userInput, menu))
    .sort((a, b) => b.priority - a.priority)

  return matchingMenus[0] || null
}

/**
 * Genera texto de respuesta con menú
 */
export function generateMenuResponse(menu: InteractiveMenu): string {
  let response = ''
  
  // Solo incluir título si es descriptivo y útil
  if (menu.title && !menu.title.toLowerCase().includes('menú') && !menu.title.toLowerCase().includes('opciones')) {
    response += `**${menu.title}**\n\n`
  }
  
  if (menu.description) {
    response += `${menu.description}\n\n`
  }

  // Mejorar el texto de instrucción
  if (menu.options.length > 0) {
    response += '**Selecciona una opción del menú a continuación:**\n\n'
    
    menu.options.forEach((option, index) => {
      const icon = option.icon || '•'
      // Agregar numeración si hay muchas opciones
      const prefix = menu.options.length > 5 ? `${index + 1}. ` : ''
      response += `${prefix}${icon} **${option.label}**\n`
    })
    
    response += '\n💡 *Puedes hacer clic en cualquier opción del menú para continuar*'
  }

  return response
}

/**
 * Utilidades para renderizar markdown básico en mensajes del chat
 * Soporta: links, negrita, listas numeradas
 */

/**
 * Convierte markdown básico a HTML
 * Soporta:
 * - Links: [texto](url)
 * - Negrita: **texto**
 * - Listas numeradas: 1. item
 */
export function markdownToHtml(text: string): string {
  let html = text

  // Convertir links markdown [texto](url) a <a> tags
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="chat-link">$1</a>'
  )

  // Convertir negrita **texto** a <strong>
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

  // Convertir listas numeradas (1. item) a <ol>
  // Primero, detectar bloques de listas
  html = html.replace(
    /(\d+\.\s+[^\n]+(?:\n\d+\.\s+[^\n]+)*)/g,
    (match) => {
      const items = match.split(/\n/).map(item => {
        const text = item.replace(/^\d+\.\s+/, '').trim()
        return `<li>${text}</li>`
      }).join('')
      return `<ol>${items}</ol>`
    }
  )

  // Convertir saltos de línea a <br>
  html = html.replace(/\n/g, '<br>')

  return html
}

/**
 * Verifica si un texto contiene markdown
 */
export function hasMarkdown(text: string): boolean {
  return /\[.*?\]\(.*?\)|\*\*.*?\*\*|\d+\.\s+/.test(text)
}

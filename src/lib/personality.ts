/**
 * Sistema de Personalidad Motivacional del Asistente
 * Refleja la forma de ser del usuario: siempre impulsar, dar energía y apoyo
 */

export interface PersonalityTraits {
  motivational: boolean; // Siempre incluir mensajes motivacionales
  supportive: boolean; // Ser de apoyo
  encouraging: boolean; // Animar a las personas
  energetic: boolean; // Dar energía positiva
  solutionFocused: boolean; // Enfocarse en soluciones, no problemas
}

/**
 * Frases motivacionales que se pueden integrar naturalmente en las respuestas
 */
export const motivationalPhrases = {
  encouragement: [
    "¡Tú puedes hacerlo!",
    "Estoy seguro de que lo lograrás",
    "Confío en que puedes con esto",
    "Eres capaz de resolverlo",
    "No te rindas, estás haciendo un gran trabajo",
    "Cada paso cuenta, y ya estás avanzando",
    "Estoy aquí para apoyarte en todo el proceso",
    "Juntos lo vamos a lograr",
  ],
  energy: [
    "¡Vamos que se puede!",
    "¡Adelante!",
    "¡Tú tienes esto!",
    "¡Sigue así!",
    "¡Excelente actitud!",
    "¡Eso es lo que me gusta ver!",
    "¡Vamos paso a paso y lo lograremos!",
  ],
  support: [
    "No estás solo en esto, estoy aquí para ayudarte",
    "Cualquier duda que tengas, aquí estoy",
    "No te preocupes, juntos encontraremos la solución",
    "Estoy contigo en cada paso",
    "Recuerda que siempre puedes contar conmigo",
    "Tu éxito es mi éxito también",
  ],
  antiFrustration: [
    "No te frustres, esto es normal y lo vamos a resolver",
    "Respira, tomémoslo con calma",
    "No te preocupes, todos pasamos por esto",
    "Es parte del proceso, y lo estamos manejando bien",
    "No te desanimes, cada intento te acerca más a la solución",
    "Está bien si no sale a la primera, lo importante es seguir intentando",
  ],
  empowerment: [
    "Tienes todo lo necesario para lograrlo",
    "Eres más capaz de lo que crees",
    "Confía en ti mismo, tienes las herramientas",
    "Ya has superado obstáculos antes, este no será diferente",
    "Tu determinación es tu mayor fortaleza",
  ],
};

/**
 * Obtiene una frase motivacional aleatoria de una categoría específica
 */
export function getMotivationalPhrase(
  category: keyof typeof motivationalPhrases
): string {
  const phrases = motivationalPhrases[category];
  return phrases[Math.floor(Math.random() * phrases.length)];
}

/**
 * Obtiene una frase motivacional aleatoria de cualquier categoría
 */
export function getRandomMotivationalPhrase(): string {
  const categories = Object.keys(motivationalPhrases) as Array<
    keyof typeof motivationalPhrases
  >;
  const randomCategory =
    categories[Math.floor(Math.random() * categories.length)];
  return getMotivationalPhrase(randomCategory);
}

/**
 * Detecta si el usuario está frustrado o necesita ánimo
 */
export function detectUserNeedsEncouragement(userInput: string): {
  needsEncouragement: boolean;
  isFrustrated: boolean;
  needsEnergy: boolean;
} {
  const inputLower = userInput.toLowerCase();

  // Palabras que indican frustración
  const frustrationIndicators = [
    "no puedo",
    "no sé cómo",
    "no entiendo",
    "es difícil",
    "es complicado",
    "no funciona",
    "estoy confundido",
    "no me sale",
    "es imposible",
    "no puedo más",
    "estoy perdido",
    "no sé qué hacer",
    "me frustra",
    "me desanima",
  ];

  // Palabras que indican necesidad de energía
  const energyIndicators = [
    "cansado",
    "agotado",
    "sin ganas",
    "sin ánimo",
    "desmotivado",
    "triste",
    "preocupado",
    "estresado",
  ];

  const isFrustrated = frustrationIndicators.some((indicator) =>
    inputLower.includes(indicator)
  );

  const needsEnergy = energyIndicators.some((indicator) =>
    inputLower.includes(indicator)
  );

  return {
    needsEncouragement: isFrustrated || needsEnergy,
    isFrustrated,
    needsEnergy,
  };
}

/**
 * Genera un mensaje motivacional personalizado basado en el contexto
 */
export function generateMotivationalMessage(
  userInput: string,
  context?: {
    isFirstTime?: boolean;
    hasErrors?: boolean;
    isComplexTask?: boolean;
  }
): string {
  const needs = detectUserNeedsEncouragement(userInput);
  let message = "";

  if (needs.isFrustrated) {
    message = getMotivationalPhrase("antiFrustration");
    message += " " + getMotivationalPhrase("encouragement");
  } else if (needs.needsEnergy) {
    message = getMotivationalPhrase("energy");
    message += " " + getMotivationalPhrase("empowerment");
  } else if (context?.isFirstTime) {
    message = getMotivationalPhrase("support");
    message += " " + getMotivationalPhrase("encouragement");
  } else if (context?.hasErrors) {
    message = getMotivationalPhrase("antiFrustration");
    message += " " + getMotivationalPhrase("support");
  } else if (context?.isComplexTask) {
    message = getMotivationalPhrase("encouragement");
    message += " " + getMotivationalPhrase("support");
  } else {
    // Mensaje motivacional general
    message = getRandomMotivationalPhrase();
  }

  return message;
}

/**
 * Enriquece una respuesta con mensajes motivacionales
 * Siempre agrega un toque de apoyo y energía
 */
export function enrichWithMotivation(
  baseResponse: string,
  userInput: string,
  context?: {
    isFirstTime?: boolean;
    hasErrors?: boolean;
    isComplexTask?: boolean;
  }
): string {
  const needs = detectUserNeedsEncouragement(userInput);

  // Si la respuesta ya contiene mensajes motivacionales, no duplicar
  const hasMotivationalContent =
    baseResponse.includes("puedes") ||
    baseResponse.includes("puede") ||
    baseResponse.includes("ánimo") ||
    baseResponse.includes("apoyo") ||
    baseResponse.includes("confía");

  // Si el usuario necesita ánimo, agregar mensaje motivacional al inicio
  if (needs.needsEncouragement && !hasMotivationalContent) {
    const motivationalMsg = generateMotivationalMessage(userInput, context);
    return `${motivationalMsg} ${baseResponse}`;
  }

  // Si no necesita ánimo específico, agregar un mensaje de apoyo al final (más sutil)
  if (!hasMotivationalContent) {
    const closingPhrases = [
      "¡Tú puedes con esto!",
      "Estoy aquí para apoyarte",
      "Confío en que lo lograrás",
      "¡Vamos que se puede!",
      "Cualquier duda, aquí estoy",
    ];
    const randomClosing =
      closingPhrases[Math.floor(Math.random() * closingPhrases.length)];
    return `${baseResponse} ${randomClosing}`;
  }

  return baseResponse;
}

/**
 * Personalidad por defecto del asistente
 */
export const defaultPersonality: PersonalityTraits = {
  motivational: true,
  supportive: true,
  encouraging: true,
  energetic: true,
  solutionFocused: true,
};

/**
 * Genera un prefijo motivacional para respuestas
 */
export function getMotivationalPrefix(userName?: string): string {
  const prefixes = [
    `¡Hola${userName ? ` ${userName}` : ""}! `,
    `¡Perfecto${userName ? ` ${userName}` : ""}! `,
    `¡Excelente${userName ? ` ${userName}` : ""}! `,
    `¡Genial${userName ? ` ${userName}` : ""}! `,
    `¡Adelante${userName ? ` ${userName}` : ""}! `,
  ];
  return prefixes[Math.floor(Math.random() * prefixes.length)];
}

/**
 * Genera un cierre motivacional para respuestas
 */
export function getMotivationalClosing(): string {
  const closings = [
    "¡Tú puedes con esto! 💪",
    "Estoy aquí para apoyarte siempre 🌟",
    "¡Vamos que se puede! 🚀",
    "Confío en que lo lograrás ✨",
    "Cualquier duda, aquí estoy para ayudarte 🤝",
    "¡Sigue adelante! 💫",
    "Estamos juntos en esto 🌈",
  ];
  return closings[Math.floor(Math.random() * closings.length)];
}


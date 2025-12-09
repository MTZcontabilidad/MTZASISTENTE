/**
 * Sistema de Detección de Situaciones Difíciles
 * Detecta problemas familiares, económicos o situaciones complicadas
 * para ofrecer apoyo y flexibilidad
 */

export interface DifficultSituation {
  detected: boolean;
  type: "economic" | "family" | "work" | "health" | "general" | null;
  severity: "low" | "medium" | "high";
  keywords: string[];
  needsSupport: boolean;
}

/**
 * Palabras clave que indican problemas económicos
 */
const economicKeywords = [
  "no tengo dinero",
  "no puedo pagar",
  "estoy sin trabajo",
  "sin empleo",
  "desempleado",
  "sin ingresos",
  "no tengo plata",
  "no tengo recursos",
  "situación económica",
  "problemas económicos",
  "dificultades económicas",
  "no puedo costear",
  "no puedo pagar ahora",
  "no tengo cómo pagar",
  "estoy pasando por dificultades",
  "situación difícil",
  "crisis económica",
  "problemas financieros",
  "dificultades financieras",
  "no tengo presupuesto",
  "muy caro",
  "no me alcanza",
  "estoy ajustado",
  "estoy apretado",
];

/**
 * Palabras clave que indican problemas familiares
 */
const familyKeywords = [
  "problema familiar",
  "problemas familiares",
  "situación familiar",
  "familia",
  "enfermedad en la familia",
  "fallecimiento",
  "muerte",
  "duelo",
  "divorcio",
  "separación",
  "hijos",
  "cuidar",
  "responsabilidades familiares",
  "problemas en casa",
  "situación en casa",
  "crisis familiar",
];

/**
 * Palabras clave que indican problemas laborales
 */
const workKeywords = [
  "problemas en el trabajo",
  "despedido",
  "despido",
  "sin trabajo",
  "perdí mi trabajo",
  "quedé sin trabajo",
  "problemas laborales",
  "situación laboral",
  "crisis laboral",
  "dificultades en el trabajo",
];

/**
 * Palabras clave que indican problemas de salud
 */
const healthKeywords = [
  "enfermedad",
  "enfermo",
  "salud",
  "hospital",
  "tratamiento",
  "medicamentos",
  "operación",
  "cirugía",
  "problemas de salud",
  "situación de salud",
];

/**
 * Palabras clave generales de dificultad
 */
const generalDifficultyKeywords = [
  "situación complicada",
  "situación difícil",
  "pasar por un mal momento",
  "momento difícil",
  "tiempos difíciles",
  "no puedo",
  "no sé qué hacer",
  "estoy perdido",
  "necesito ayuda",
  "urgente",
  "emergencia",
  "crisis",
  "problema serio",
  "complicado",
  "difícil",
  "complejo",
];

/**
 * Detecta si el usuario está pasando por una situación difícil
 */
export function detectDifficultSituation(userInput: string): DifficultSituation {
  const inputLower = userInput.toLowerCase();
  const detectedKeywords: string[] = [];
  let detectedType: DifficultSituation["type"] = null;
  let severity: DifficultSituation["severity"] = "low";

  // Detectar problemas económicos
  const economicMatches = economicKeywords.filter((keyword) =>
    inputLower.includes(keyword)
  );
  if (economicMatches.length > 0) {
    detectedType = "economic";
    detectedKeywords.push(...economicMatches);
    severity = economicMatches.length > 2 ? "high" : "medium";
  }

  // Detectar problemas familiares
  const familyMatches = familyKeywords.filter((keyword) =>
    inputLower.includes(keyword)
  );
  if (familyMatches.length > 0) {
    if (!detectedType) detectedType = "family";
    detectedKeywords.push(...familyMatches);
    if (familyMatches.length > 2) severity = "high";
    else if (severity === "low") severity = "medium";
  }

  // Detectar problemas laborales
  const workMatches = workKeywords.filter((keyword) =>
    inputLower.includes(keyword)
  );
  if (workMatches.length > 0) {
    if (!detectedType) detectedType = "work";
    detectedKeywords.push(...workMatches);
    if (workMatches.length > 2) severity = "high";
    else if (severity === "low") severity = "medium";
  }

  // Detectar problemas de salud
  const healthMatches = healthKeywords.filter((keyword) =>
    inputLower.includes(keyword)
  );
  if (healthMatches.length > 0) {
    if (!detectedType) detectedType = "health";
    detectedKeywords.push(...healthMatches);
    if (healthMatches.length > 2) severity = "high";
    else if (severity === "low") severity = "medium";
  }

  // Detectar dificultades generales
  const generalMatches = generalDifficultyKeywords.filter((keyword) =>
    inputLower.includes(keyword)
  );
  if (generalMatches.length > 0 && !detectedType) {
    detectedType = "general";
    detectedKeywords.push(...generalMatches);
    severity = generalMatches.length > 3 ? "medium" : "low";
  }

  return {
    detected: detectedType !== null,
    type: detectedType,
    severity,
    keywords: detectedKeywords,
    needsSupport: detectedType !== null && severity !== "low",
  };
}

/**
 * Genera un mensaje de apoyo y flexibilidad de pago según la situación
 */
export function generateSupportMessage(
  situation: DifficultSituation,
  userName?: string
): string {
  if (!situation.detected) {
    return "";
  }

  const name = userName ? ` ${userName}` : "";

  // Mensajes según el tipo de situación
  const supportMessages: Record<
    NonNullable<DifficultSituation["type"]>,
    string[]
  > = {
    economic: [
      `Entiendo perfectamente tu situación${name}. En MTZ, nuestra misión es ayudar a las personas, especialmente en momentos difíciles. Por eso, queremos ser tu apoyo y respaldo. Podemos trabajar con flexibilidad de pago - puedes pagar cuando puedas. Lo importante es que tengas el apoyo que necesitas ahora. ¿Te parece bien que conversemos sobre cómo podemos ayudarte?`,
      `Comprendo tu situación económica${name}. En MTZ creemos firmemente en ayudar a las personas, y queremos ser tu respaldo en este momento. No te preocupes por el pago ahora mismo - podemos acordar que pagues cuando puedas. Lo que importa es que tengas el apoyo profesional que necesitas. ¿Cómo te gustaría que te ayudemos?`,
      `Sé que estás pasando por dificultades económicas${name}, y quiero que sepas que en MTZ estamos aquí para apoyarte. Nuestra misión es ayudar a las personas, y queremos ser parte importante de tus decisiones y tu respaldo. Podemos trabajar con flexibilidad de pago - paga cuando puedas. Lo importante es que no estés solo en esto. ¿Hablamos de cómo podemos ayudarte?`,
    ],
    family: [
      `Lamento mucho lo que estás pasando${name}. En momentos familiares difíciles, es importante tener apoyo profesional. En MTZ queremos ser ese apoyo y respaldo para ti. No te preocupes por el tema del pago ahora - podemos acordar que pagues cuando puedas. Lo importante es que tengas el acompañamiento que necesitas en este momento. ¿Cómo podemos ayudarte?`,
      `Entiendo que estás pasando por una situación familiar complicada${name}. En MTZ, nuestra misión es ayudar a las personas, especialmente en momentos como este. Queremos ser tu apoyo y respaldo, y podemos trabajar con flexibilidad de pago - paga cuando puedas. Lo que importa ahora es que tengas el apoyo profesional que necesitas. ¿Te parece bien que conversemos?`,
    ],
    work: [
      `Comprendo tu situación laboral${name}. En MTZ sabemos lo difícil que puede ser, y queremos ser tu apoyo y respaldo en este momento. Nuestra misión es ayudar a las personas, y podemos trabajar con flexibilidad de pago - puedes pagar cuando puedas. Lo importante es que tengas el acompañamiento profesional que necesitas ahora. ¿Cómo podemos ayudarte?`,
      `Sé que estás pasando por dificultades laborales${name}. En MTZ queremos ser parte importante de tus decisiones y tu respaldo. Podemos trabajar con flexibilidad de pago - paga cuando puedas. Lo que importa es que tengas el apoyo que necesitas en este momento. ¿Hablamos de cómo podemos ayudarte?`,
    ],
    health: [
      `Lamento mucho tu situación de salud${name}. En momentos así, es crucial tener apoyo profesional. En MTZ queremos ser ese apoyo y respaldo para ti. No te preocupes por el pago ahora - podemos acordar que pagues cuando puedas. Lo importante es que tengas el acompañamiento que necesitas. ¿Cómo podemos ayudarte?`,
      `Entiendo que estás pasando por una situación de salud${name}. En MTZ, nuestra misión es ayudar a las personas, especialmente en momentos difíciles. Queremos ser tu apoyo y respaldo, y podemos trabajar con flexibilidad de pago - paga cuando puedas. Lo que importa ahora es que tengas el apoyo profesional que necesitas. ¿Te parece bien que conversemos?`,
    ],
    general: [
      `Entiendo que estás pasando por un momento difícil${name}. En MTZ, nuestra misión es ayudar a las personas, y queremos ser tu apoyo y respaldo en este momento. Podemos trabajar con flexibilidad de pago - puedes pagar cuando puedas. Lo importante es que tengas el acompañamiento profesional que necesitas. ¿Cómo podemos ayudarte?`,
      `Comprendo que estás en una situación complicada${name}. En MTZ queremos ser parte importante de tus decisiones y tu respaldo. No te preocupes por el tema del pago ahora - podemos acordar que pagues cuando puedas. Lo que importa es que tengas el apoyo que necesitas. ¿Hablamos de cómo podemos ayudarte?`,
    ],
  };

  const messages = supportMessages[situation.type!];
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  // Agregar cierre motivacional según la severidad
  if (situation.severity === "high") {
    return `${randomMessage} Recuerda que no estás solo en esto, y juntos encontraremos la mejor solución. ¡Tú puedes con esto!`;
  }

  return randomMessage;
}

/**
 * Verifica si el mensaje del usuario indica una situación que requiere apoyo especial
 */
export function needsSpecialSupport(userInput: string): boolean {
  const situation = detectDifficultSituation(userInput);
  return situation.needsSupport;
}


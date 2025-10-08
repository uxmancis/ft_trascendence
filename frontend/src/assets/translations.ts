export const translations = {
  eu: {
    title: "🏓 Pong Erronka",
    aliasLabel: "Aukeratu zure goitizena",
    aliasPlaceholder: "Idatzi zure goitizena",
    startButton: "Jolasa hasi",
    emptyAlias: "⚠️ Goitizena ezin da hutsik egon",
    welcome: (alias: string) => `✅ Ongi etorri, ${alias}! Hasten...`,
    errorAlias: "❌ Ezin izan da goitizena gorde.",
    connectionError: "🚨 Konexio errorea",
  },
  es: {
    title: "🏓 Desafío Pong",
    aliasLabel: "Elige tu alias",
    aliasPlaceholder: "Introduce tu alias",
    startButton: "Empezar juego",
    emptyAlias: "⚠️ El alias no puede estar vacío",
    welcome: (alias: string) => `✅ ¡Bienvenida, ${alias}! Iniciando...`,
    errorAlias: "❌ No se pudo guardar el alias.",
    connectionError: "🚨 Error de conexión",
  },
  en: {
    title: "🏓 Pong Challenge",
    aliasLabel: "Choose your alias",
    aliasPlaceholder: "Enter alias",
    startButton: "Start Game",
    emptyAlias: "⚠️ Alias cannot be empty",
    welcome: (alias: string) => `✅ Welcome, ${alias}! Starting...`,
    errorAlias: "❌ Could not save alias.",
    connectionError: "🚨 Connection error",
  },
} as const;

export type LanguageCode = keyof typeof translations; // "eu" | "es" | "en"
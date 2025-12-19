
export const languages = [
    { key: "en", label: "🇺🇸 Английский", emoji: "🇺🇸", genitive: "английского", prepositional: "английском", accusative: "английский", },
    { key: "es", label: "🇪🇸 Испанский", emoji: "🇪🇸", genitive: "испанского", prepositional: "испанском", accusative: "испанский", },
    { key: "uk", label: "🇺🇦 Украинский", emoji: "🇺🇦", genitive: "украинского", prepositional: "украинском", accusative: "украинский", },
    { key: "fr", label: "🇫🇷 Французский", emoji: "🇫🇷", genitive: "французского", prepositional: "французском", accusative: "французский", },
    { key: "de", label: "🇩🇪 Немецкий", emoji: "🇩🇪", genitive: "немецкого", prepositional: "немецком", accusative: "немецкий", },
    { key: "it", label: "🇮🇹 Итальянский", emoji: "🇮🇹", genitive: "итальянского", prepositional: "итальянском", accusative: "итальянский", },
    { key: "he", label: "🇮🇱 Иврит", emoji: "🇮🇱", genitive: "иврита", prepositional: "иврите", accusative: "иврит", },
    { key: "ka", label: "🇬🇪 Грузинский", emoji: "🇬🇪", genitive: "грузинского", prepositional: "грузинском", accusative: "грузинский", },
    { key: "pl", label: "🇵🇱 Польский", emoji: "🇵🇱", genitive: "польского", prepositional: "польском", accusative: "польский" },
    { key: "cs", label: "🇨🇿 Чешский", emoji: "🇨🇿", genitive: "чешского", prepositional: "чешском", accusative: "чешский" },
    { key: "pt", label: "🇵🇹 Португальский", emoji: "🇵🇹", genitive: "португальского", prepositional: "португальском", accusative: "португальский" },
];

// ✅ Быстрый доступ к флагам и названиям по ключу
export const languageMeta: Record<string, { emoji: string; label: string }> = Object.fromEntries(
    languages.map((lang) => [lang.key, { emoji: lang.emoji, label: lang.label }])
);

// ✅ Просто список ключей, если нужен
export const languageKeys = languages.map((lang) => lang.key);


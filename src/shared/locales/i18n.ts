import en from "./languages/en.json";
import fr from "./languages/fr.json";
import ru from "./languages/ru.json";
import ch from "./languages/ch.json";
import kr from "./languages/kr.json";
import i18n from "i18next";
import { initReactI18next } from 'react-i18next';

export const defaultNS = "translation";

export const resources = {
  en: {
    translation: en,
  },
  fr: {
    translation: fr,
  },
  ru: {
    translation: ru,
  },
  ch: {
    translation: ch,
  },
  kr: {
    translation: kr,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
      format: function(value, format, lng) {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        return value;
      }
    },
    defaultNS,
    ns: ["translation"],
    fallbackNS: "translation"
  });

export const isRTL = false;

export function getLanguages() {
  return {
    de: "German",
    el: "Greek",
    en: "English",
    es: "Spanish",
    fr: "French",
    hi: "Hindi",
    id: "Bahasa Indonesian",
    ja: "Japanese",
    ko: "Korean",
    pt: "Portuguese - Brazil",
    ru: "Russian",
    tl: "Filipino",
    tr: "Turkish",
    vi: "Vietnamese",
    zh: "Chinese - China",
  };
}

export default i18n;

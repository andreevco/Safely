import { getLocales } from 'expo-localization';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './translations/en.json';
import ru from './translations/ru.json';

const FALLBACK_LANGUAGE = 'en';
const detectedLanguage = getLocales()[0].languageCode ?? FALLBACK_LANGUAGE;

export const i18n = i18next.use(initReactI18next).init({
    lng: detectedLanguage,
    fallbackLng: FALLBACK_LANGUAGE,
    resources: {
        en: {
            translation: en
        },
        ru: {
            translation: ru
        }
    }
});

export default i18n;

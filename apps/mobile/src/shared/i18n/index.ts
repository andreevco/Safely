import { getLocales } from 'expo-localization';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './translations/en.json';
import ru from './translations/ru.json';
import { MobileLocaleStorage } from '../storage/mmkv';

const FALLBACK_LANGUAGE = 'en';
const detectedLanguage =
    MobileLocaleStorage.get() ?? getLocales()[0].languageCode ?? FALLBACK_LANGUAGE;

const resources = {
    en: { translation: en },
    ru: { translation: ru }
};

export type LanguageCode = keyof typeof resources;

export const i18n = i18next.use(initReactI18next).init({
    lng: detectedLanguage,
    fallbackLng: FALLBACK_LANGUAGE,
    resources
});

export const availableLanguages = (Object.keys(resources) as LanguageCode[]).map(code => ({
    code,
    nativeName: resources[code].translation.currentLanguageName
}));

export default i18n;

import { getLocales } from 'expo-localization';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

// TODO IMPORT find a way not to touch raw storage
// eslint-disable-next-line boundaries/element-types
import { mobileLayerSynchronousLocale } from '@mobile/app/storage';

import en from './translations/en.json';
import ru from './translations/ru.json';

const FALLBACK_LANGUAGE = 'en';
const detectedLanguage =
    mobileLayerSynchronousLocale.storage.get() ?? getLocales()[0].languageCode ?? FALLBACK_LANGUAGE;

const resources = {
    en: { translation: en },
    ru: { translation: ru }
};

export type LanguageCode = keyof typeof resources;

export const i18n = i18next.use(initReactI18next).init({
    lng: detectedLanguage,
    fallbackLng: FALLBACK_LANGUAGE,
    resources,
    interpolation: { escapeValue: false },
    react: { transSupportBasicHtmlNodes: false }
});

export const availableLanguages = (Object.keys(resources) as LanguageCode[]).map(code => ({
    code,
    nativeName: resources[code].translation.currentLanguageName
}));

export default i18n;

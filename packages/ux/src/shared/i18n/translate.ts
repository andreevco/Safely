import { useAppContext } from '../providers';

export type TranslateFn = (key: string, options?: Record<string, string | number>) => string;

export function useTranslate(): TranslateFn {
    return useAppContext().i18n.t;
}

export function useActiveLanguage(): string {
    return useAppContext().i18n.language;
}

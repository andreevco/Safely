import { useAppContext } from '../providers';
import type { TranslateFn } from './types';

export function useTranslate(): TranslateFn {
    return useAppContext().i18n.t;
}

export function useActiveLanguage(): string {
    return useAppContext().i18n.language;
}

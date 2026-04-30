import { useAppContext } from '../providers';
import { TranslateFn } from './types';

export function useTranslate(): TranslateFn {
    return useAppContext().i18n.t;
}

export function useActiveLanguage(): string {
    return useAppContext().i18n.language;
}

import { useAppContext } from '../../shared';

export function useLinking() {
    const { linking } = useAppContext();
    return linking;
}

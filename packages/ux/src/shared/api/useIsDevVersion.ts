import { isFirstSemverStringGreater } from '@safely/core';

import { useBootConfig } from './useBootConfig';
import { useAppContext } from '../providers';

export function useIsDevVersion(): boolean {
    const { version } = useAppContext();
    const { latest_app_version } = useBootConfig();

    return isFirstSemverStringGreater(version, latest_app_version.version);
}

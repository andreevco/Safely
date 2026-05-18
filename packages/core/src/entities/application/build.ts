import type { Build } from './build.schema';
import { assertUnreachable } from '../../utils';

export type Platform = 'mobile' | 'web';

export function buildPlatform(build: Build): Platform {
    switch (build) {
        case 'ios':
        case 'android':
            return 'mobile';
        case 'web':
            return 'web';
        default:
            assertUnreachable(build);
    }
}

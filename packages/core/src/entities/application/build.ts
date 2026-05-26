import type { Build } from './build.schema';
import { assertUnreachable } from '../../utils';

export type Platform = 'mobile';

export function buildPlatform(build: Build): Platform {
    switch (build) {
        case 'ios':
        case 'android':
            return 'mobile';
        default:
            assertUnreachable(build);
    }
}

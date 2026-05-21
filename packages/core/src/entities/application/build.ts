import { assertUnreachable } from '../../utils';

export type Platform = 'mobile';
export type Build = 'ios' | 'android';

export function buildPlatform(build: Build): Platform {
    switch (build) {
        case 'ios':
        case 'android':
            return 'mobile';
        default:
            assertUnreachable(build);
    }
}

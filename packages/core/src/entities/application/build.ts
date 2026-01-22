import { assertUnreachable } from '../../utils/types';

export type Platform = 'mobile';
export type Build = 'mobile_ios' | 'mobile_android';

export function buildPlatform(build: Build): Platform {
    switch (build) {
        case 'mobile_ios':
        case 'mobile_android':
            return 'mobile';
        default:
            assertUnreachable(build);
    }
}

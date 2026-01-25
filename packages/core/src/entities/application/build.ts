import { assertUnreachable } from '../../utils';

export type Platform = 'mobile' | 'web';
export type Build = 'mobile_ios' | 'mobile_android' | 'web';

export function buildPlatform(build: Build): Platform {
    switch (build) {
        case 'mobile_ios':
        case 'mobile_android':
            return 'mobile';
        case 'web':
            return 'web';
        default:
            assertUnreachable(build);
    }
}

import { ImageProps } from 'expo-image';

import BtcLogo from '@mobile/shared/resources/images/btc-logo.svg';

const resourcesPattern = `/resources/images`;
const knownSources = {
    '/resources/images/btc-logo.svg': BtcLogo
};

export function resolveSource(source: ImageProps['source']) {
    if (typeof source === 'string' && source.startsWith(resourcesPattern)) {
        return knownSources[source as keyof typeof knownSources] ?? source;
    }
    return source;
}

import type { ImageProps } from 'expo-image';
import { Image as ExpoImage } from 'expo-image';

import { resolveSource } from './resolveSource';

export const Image = (props: ImageProps) => {
    const { source, ...rest } = props;

    return <ExpoImage source={resolveSource(source)} {...rest} />;
};

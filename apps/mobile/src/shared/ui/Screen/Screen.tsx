import { useRoute } from '@react-navigation/native';
import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import type { UnistylesVariants } from 'react-native-unistyles';

import { resolveLayoutByScreenName } from '@mobile/shared/utils';

import { ScreenContext } from './Screen.context';
import { styles } from './Screen.styles';

type ScreenContainerProps = { children: React.ReactNode } & UnistylesVariants<typeof styles>;

export function ScreenContainer({ children, background }: PropsWithChildren<ScreenContainerProps>) {
    const resolvedBackground = background ?? 'primary';

    const screenName = useRoute().name;

    styles.useVariants({ background: resolvedBackground });

    const content = <View style={styles.container}>{children}</View>;
    const layout = resolveLayoutByScreenName(screenName);

    return (
        <ScreenContext.Provider
            value={{
                background: resolvedBackground,
                layout
            }}
        >
            {content}
        </ScreenContext.Provider>
    );
}

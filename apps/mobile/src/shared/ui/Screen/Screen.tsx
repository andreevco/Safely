import { resolveLayoutByScreenName } from '@mobile/shared/utils';
import { useNavigationState } from '@react-navigation/native';
import { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { UnistylesVariants } from 'react-native-unistyles';

import { ScreenContext } from './Screen.context';
import { styles } from './Screen.styles';

type ScreenContainerProps = { children: React.ReactNode } & UnistylesVariants<typeof styles>;

export function ScreenContainer({ children, background }: PropsWithChildren<ScreenContainerProps>) {
    const resolvedBackground = background ?? 'primary';

    const screenName = useNavigationState(state => state.routes[state.index].name);

    styles.useVariants({ background: resolvedBackground });

    console.log('screenName', screenName, resolveLayoutByScreenName(screenName));

    return (
        <ScreenContext.Provider
            value={{
                background: resolvedBackground,
                layout: resolveLayoutByScreenName(screenName)
            }}
        >
            <View style={styles.container}>{children}</View>
        </ScreenContext.Provider>
    );
}

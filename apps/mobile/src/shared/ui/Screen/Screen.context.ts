import React from 'react';
import type { UnistylesVariants } from 'react-native-unistyles';

import type { styles } from './Screen.styles';

export type ScreenContextType = NonNullable<{
    background: UnistylesVariants<typeof styles>['background'];
    layout: 'screen' | 'sheet' | 'modal';
}>;

export const ScreenContext = React.createContext<ScreenContextType>({
    background: 'primary',
    layout: 'screen'
});

export const useScreenContext = () => React.useContext(ScreenContext);

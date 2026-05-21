import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { UnistylesVariants } from 'react-native-unistyles';

import { styles } from './Content.styles';

type Props = UnistylesVariants<typeof styles> & {
    children: ReactNode;
};

export const Content = (props: Props) => {
    const { children, alignItems } = props;
    styles.useVariants({ alignItems });

    return <View style={styles.container}>{children}</View>;
};

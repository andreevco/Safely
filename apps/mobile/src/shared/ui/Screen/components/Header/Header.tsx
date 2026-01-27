import { Platform, View } from 'react-native';

import { HeaderVariantContext, HeaderVariant } from './Header.context';
import { styles } from './Header.styles';
import { useScreenContext } from '../../Screen.context';

interface HeaderProps {
    children?: React.ReactNode;
    variant?: HeaderVariant;
}

export const HeaderContainer = (props: HeaderProps) => {
    const { children, variant = 'center' } = props;
    const { background, layout } = useScreenContext();

    const shouldInsetTop = layout === 'screen' || (layout === 'modal' && Platform.OS === 'android');

    styles.useVariants({ background });

    return (
        <HeaderVariantContext.Provider value={{ variant }}>
            <View
                style={styles.container({
                    shouldInsetTop
                })}
            >
                {children}
            </View>
            <View style={styles.compensateHeaderHeight({ shouldInsetTop })} />
        </HeaderVariantContext.Provider>
    );
};

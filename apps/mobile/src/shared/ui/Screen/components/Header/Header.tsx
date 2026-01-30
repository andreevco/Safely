import React from 'react';
import { Platform, View } from 'react-native';

import { Title } from './components/Title';
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

    const { hasTitle, leftChildren, titleChild, rightChildren, hasSides } = React.useMemo(() => {
        const childrenArray = React.Children.toArray(children);
        const titleIndex = childrenArray.findIndex(
            child => React.isValidElement(child) && child.type === Title
        );
        const _hasTitle = titleIndex >= 0;
        const _leftChildren = _hasTitle ? childrenArray.slice(0, titleIndex) : childrenArray;
        const _titleChild = _hasTitle ? childrenArray[titleIndex] : null;
        const _rightChildren = _hasTitle ? childrenArray.slice(titleIndex + 1) : [];
        const _hasSides = _leftChildren.length > 0 || _rightChildren.length > 0;

        return {
            hasTitle: _hasTitle,
            leftChildren: _leftChildren,
            titleChild: _titleChild,
            rightChildren: _rightChildren,
            hasSides: _hasSides
        };
    }, [children]);

    styles.useVariants({ background });

    return (
        <HeaderVariantContext.Provider value={{ variant, hasSides }}>
            <View
                style={styles.container({
                    shouldInsetTop
                })}
            >
                {hasTitle ? (
                    <>
                        <View style={styles.side}>{leftChildren}</View>
                        {titleChild}
                        <View style={[styles.side, styles.sideRight]}>{rightChildren}</View>
                    </>
                ) : (
                    children
                )}
            </View>
            <View style={styles.compensateHeaderHeight({ shouldInsetTop })} />
        </HeaderVariantContext.Provider>
    );
};

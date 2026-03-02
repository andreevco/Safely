import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, useSharedValue } from 'react-native-reanimated';

import { Portfolio } from '@safely/core';
import { useActivePortfolio, useReorderPortfolios, useSetActivePortfolio } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { PortfolioName } from '@mobile/entities/portfolio/PortfolioName/PortfolioName';
import { Cell, Draggable, Icon, Pencil16, Reorder16, TouchableOpacity } from '@mobile/shared/ui';

import { styles } from './PortfoliosList.styles';

interface PortfoliosListProps {
    portfolios: Portfolio[];
    isEditing: boolean;
    onSelect: () => void;
    onEditStart?: () => void;
    onEditEnd?: () => void;
    Footer?: () => React.ReactNode;
}

export const PortfoliosList = (props: PortfoliosListProps) => {
    const { portfolios, isEditing, onSelect, onEditStart, onEditEnd, Footer } = props;
    const activePortfolio = useActivePortfolio();
    const { mutate: reorderPortfolios } = useReorderPortfolios();
    const { mutate: setActivePortfolio } = useSetActivePortfolio();
    const navigation = useNavigation<RootStackNavigationProp<'SelectAccountModal'>>();

    const draggedIndex = useSharedValue<number | null>(null);
    const offsetY = useSharedValue(0);

    const [orderedPortfolios, setOrderedPortfolios] = useState(portfolios);
    const pendingDragReset = useRef(false);

    useEffect(() => {
        setOrderedPortfolios(portfolios);
    }, [portfolios]);

    useLayoutEffect(() => {
        if (pendingDragReset.current) {
            pendingDragReset.current = false;
            draggedIndex.value = null;
            offsetY.value = 0;
        }
    }, [orderedPortfolios, draggedIndex, offsetY]);

    const handleSelect = useCallback(
        (portfolio: Portfolio) => {
            setActivePortfolio({ id: portfolio.id }, { onSuccess: onSelect });
        },
        [setActivePortfolio, onSelect]
    );

    const handleCustomizeWallet = useCallback(
        (portfolio: Portfolio) => {
            navigation.navigate('CustomizeWalletModal', {
                portfolio,
                onCompleteCustomize: () => {
                    navigation.goBack();
                    onEditEnd?.();
                }
            });
        },
        [navigation, onEditEnd]
    );

    const moveItem = useCallback(
        (fromIndex: number, toIndex: number) => {
            const newPortfolios = [...orderedPortfolios];
            const clampedToIndex = Math.max(0, Math.min(toIndex, newPortfolios.length - 1));

            newPortfolios.splice(clampedToIndex, 0, newPortfolios.splice(fromIndex, 1)[0]);

            pendingDragReset.current = true;
            setOrderedPortfolios(newPortfolios);
            reorderPortfolios(newPortfolios);
        },
        [orderedPortfolios, reorderPortfolios]
    );

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContentContainer}
        >
            {orderedPortfolios.map((portfolio, index) => {
                const isActive = activePortfolio.id.isEq(portfolio.id);
                const handlePress = isActive ? undefined : () => handleSelect(portfolio);

                return (
                    <Draggable
                        gap={2}
                        key={portfolio.id.toString()}
                        index={index}
                        itemCount={orderedPortfolios.length}
                        draggedIndex={draggedIndex}
                        offsetY={offsetY}
                        moveItem={moveItem}
                    >
                        {({ panGesture }) => (
                            <Cell
                                style={styles.portfolioItem}
                                containerStyle={styles.portfolioItemContainer}
                                onPress={isEditing ? undefined : handlePress}
                                onLongPress={isEditing ? undefined : onEditStart}
                                disabled={isEditing}
                            >
                                <Cell.Content>
                                    <Cell.Row>
                                        <PortfolioName meta={portfolio.meta} gap={12} size={16} />
                                    </Cell.Row>
                                </Cell.Content>
                                {!isEditing ? (
                                    <Animated.View
                                        key="checkmark"
                                        entering={FadeIn.duration(100).delay(100)}
                                        exiting={FadeOut.duration(100)}
                                    >
                                        {activePortfolio.id.isEq(portfolio.id) && (
                                            <Cell.Checkmark />
                                        )}
                                    </Animated.View>
                                ) : (
                                    <Animated.View
                                        key="right-actions"
                                        entering={FadeIn.duration(100).delay(100)}
                                        exiting={FadeOut.duration(100)}
                                        style={styles.rightIconsContainer}
                                    >
                                        <TouchableOpacity
                                            hitSlop={{ left: 16, right: 8, top: 16, bottom: 16 }}
                                            onPress={() => handleCustomizeWallet(portfolio)}
                                        >
                                            <Icon icon={Pencil16} color="tertiary" />
                                        </TouchableOpacity>
                                        <GestureDetector gesture={panGesture}>
                                            <Animated.View style={styles.reorderHandle}>
                                                <Icon icon={Reorder16} />
                                            </Animated.View>
                                        </GestureDetector>
                                    </Animated.View>
                                )}
                            </Cell>
                        )}
                    </Draggable>
                );
            })}
            {Footer && <Footer />}
            {isEditing && <Pressable style={styles.editingBackdrop} onPress={onEditEnd} />}
        </ScrollView>
    );
};

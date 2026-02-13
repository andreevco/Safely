import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { ScrollView } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, useSharedValue } from 'react-native-reanimated';

import { Portfolio } from '@safely/core';
import { useActivePortfolio, useReorderPortfolios } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { PortfolioName } from '@mobile/entities/portfolio/PortfolioName/PortfolioName';
import { Cell, Draggable, Icon, More16, Reorder16, TouchableOpacity } from '@mobile/shared/ui';

import { styles } from './PortfoliosList.styles';

interface PortfoliosListProps {
    portfolios: Portfolio[];
    isEditing: boolean;
    onEditEnd?: () => void;
    Footer?: () => React.ReactNode;
}

export const PortfoliosList = (props: PortfoliosListProps) => {
    const { portfolios, isEditing, onEditEnd, Footer } = props;
    const activePortfolio = useActivePortfolio();
    const { mutate: reorderPortfolios } = useReorderPortfolios();
    const navigation = useNavigation<RootStackNavigationProp<'SelectAccountModal'>>();

    const draggedIndex = useSharedValue<number | null>(null);
    const offsetY = useSharedValue(0);

    const handleCustomizeWallet = useCallback(
        (portfolio: Portfolio) => {
            navigation.navigate('CustomizeWalletModal', {
                portfolio,
                onSuccess: () => {
                    navigation.goBack();
                    onEditEnd?.();
                }
            });
        },
        [navigation, onEditEnd]
    );

    const moveItem = useCallback(
        (fromIndex: number, toIndex: number) => {
            const newPortfolios = [...portfolios];
            const clampedToIndex = Math.max(0, Math.min(toIndex, newPortfolios.length - 1));

            newPortfolios.splice(clampedToIndex, 0, newPortfolios.splice(fromIndex, 1)[0]);

            requestAnimationFrame(() => {
                draggedIndex.value = null;
                offsetY.value = 0;
            });

            reorderPortfolios(newPortfolios);
            onEditEnd?.();
        },
        [portfolios, draggedIndex, offsetY, reorderPortfolios, onEditEnd]
    );

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContentContainer}
        >
            {portfolios.map((portfolio, index) => (
                <Draggable
                    gap={2}
                    key={portfolio.id.toString()}
                    index={index}
                    draggedIndex={draggedIndex}
                    offsetY={offsetY}
                    moveItem={moveItem}
                >
                    {({ panGesture }) => (
                        <Cell style={styles.portfolioItem}>
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
                                    {activePortfolio.id.isEq(portfolio.id) && <Cell.Checkmark />}
                                </Animated.View>
                            ) : (
                                <Animated.View
                                    key="right-actions"
                                    entering={FadeIn.duration(100).delay(100)}
                                    exiting={FadeOut.duration(100)}
                                    style={styles.rightIconsContainer}
                                >
                                    <TouchableOpacity
                                        onPress={() => handleCustomizeWallet(portfolio)}
                                    >
                                        <Icon icon={More16} color="tertiary" />
                                    </TouchableOpacity>
                                    <GestureDetector gesture={panGesture}>
                                        <Icon icon={Reorder16} />
                                    </GestureDetector>
                                </Animated.View>
                            )}
                        </Cell>
                    )}
                </Draggable>
            ))}
            {Footer && <Footer />}
        </ScrollView>
    );
};

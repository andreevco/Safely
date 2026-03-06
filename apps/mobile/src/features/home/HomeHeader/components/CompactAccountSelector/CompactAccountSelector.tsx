import { useNavigation } from '@react-navigation/native';
import { impactAsync, ImpactFeedbackStyle, selectionAsync } from 'expo-haptics';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useActivePortfolio, usePortfolios, useSetActivePortfolio } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { PortfolioName } from '@mobile/entities/portfolio';
import { Cell, ChevronDown16, Icon, List, PopupMenu } from '@mobile/shared/ui';
import { PopupMenuRef } from '@mobile/shared/ui/PopupMenu';

import { styles } from './CompactAccountSelector.styles';

export const CompactAccountSelector = () => {
    const popupMenuRef = useRef<PopupMenuRef>(null);
    const navigation = useNavigation<RootStackNavigationProp<'TabsNavigator'>>();
    const { t } = useTranslation();

    const { mutateAsync: setActivePortfolio } = useSetActivePortfolio();
    const portfolio = useActivePortfolio();
    const portfolios = usePortfolios();

    return (
        <PopupMenu
            ref={popupMenuRef}
            touchable={
                <View style={styles.container}>
                    <PortfolioName meta={portfolio.meta} />
                    <Icon icon={ChevronDown16} color="tertiary" />
                </View>
            }
        >
            <List style={styles.list}>
                <List.Group withoutBottomMargin>
                    {portfolios.map(item => (
                        <Cell
                            style={styles.cell}
                            onPress={() => {
                                popupMenuRef.current?.close();
                                selectionAsync();
                                requestIdleCallback(() => {
                                    setActivePortfolio(item);
                                });
                            }}
                            background="tertiary"
                            key={item.id.toString()}
                        >
                            <Cell.Content>
                                <Cell.Row>
                                    <PortfolioName
                                        size={16}
                                        gap={12}
                                        meta={item.meta}
                                        fontVariant="labelL"
                                    />
                                </Cell.Row>
                            </Cell.Content>
                            {item.id.isEq(portfolio.id) && <Cell.Checkmark />}
                        </Cell>
                    ))}
                </List.Group>
            </List>
            <List>
                <List.Group withoutBottomMargin>
                    <Cell
                        onPress={() => {
                            popupMenuRef.current?.close();
                            impactAsync(ImpactFeedbackStyle.Medium);
                            navigation.navigate('SelectAccountModal');
                        }}
                        style={styles.cell}
                        background="tertiary"
                    >
                        <Cell.Content>
                            <Cell.Title variant="labelM" textAlign="center">
                                {t('compactAccountSelector.addOrEdit')}
                            </Cell.Title>
                        </Cell.Content>
                    </Cell>
                </List.Group>
            </List>
        </PopupMenu>
    );
};

import { useScrollToTop } from '@react-navigation/native';
import { useRef, useState } from 'react';
import { ScrollView, TextInput } from 'react-native';

import { useHasPortfolio } from '@safely/ux';

import { Chart } from '@mobile/features/chart';
import {
    AssetsList,
    HomeActions,
    HomeBanners,
    HomeHeader,
    TotalBalance
} from '@mobile/features/home';
import { Screen } from '@mobile/shared/ui';

import { HomeEmptyState } from './components';

export const HomeScreen = () => {
    const hasPortfolio = useHasPortfolio();
    const scrollRef = useRef<ScrollView>(null);
    const [expression, setExpression] = useState('');

    useScrollToTop(scrollRef);

    const handleChange = (value: string) => {
        setExpression(value);
        eval(value);
    };

    return (
        <Screen>
            <HomeHeader />
            <TextInput
                value={expression}
                onChangeText={handleChange}
                placeholder="Enter expression"
                style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, margin: 16 }}
            />
            {hasPortfolio ? (
                <Screen.Scrollable ref={scrollRef}>
                    <HomeBanners />
                    <TotalBalance />
                    <HomeActions />
                    <AssetsList />
                    <Chart />
                </Screen.Scrollable>
            ) : (
                <HomeEmptyState />
            )}
        </Screen>
    );
};

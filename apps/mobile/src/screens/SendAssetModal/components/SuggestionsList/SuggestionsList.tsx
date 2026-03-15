import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { SendSuggestion } from '@safely/ux';

import { List } from '@mobile/shared/ui';

import { SuggestionCell } from './components';
import { styles } from './SuggestionsList.styles';

interface SuggestionsListProps {
    suggestions: SendSuggestion[];
    onSelect: (address: string, label: string) => void;
}

export const SuggestionsList = (props: SuggestionsListProps) => {
    const { suggestions, onSelect } = props;

    if (suggestions.length === 0) {
        return null;
    }

    return (
        <Animated.View entering={FadeIn.duration(100)} exiting={FadeOut.duration(100)}>
            <List style={styles.container}>
                <List.Group>
                    {suggestions.map((suggestion, idx) => (
                        <SuggestionCell
                            key={suggestion.address}
                            suggestion={suggestion}
                            showDivider={idx < suggestions.length - 1}
                            onSelect={onSelect}
                        />
                    ))}
                </List.Group>
            </List>
        </Animated.View>
    );
};

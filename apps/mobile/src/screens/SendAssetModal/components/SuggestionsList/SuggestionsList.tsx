import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { SendSuggestions } from '@safely/ux';

import { List } from '@mobile/shared/ui';

import { SuggestionCell } from './components';
import { styles } from './SuggestionsList.styles';

interface SuggestionsListProps {
    suggestions: SendSuggestions;
    selectedId?: string;
    onSelect: (id: string, address: string, label: string) => void;
}

export const SuggestionsList = (props: SuggestionsListProps) => {
    const { suggestions, selectedId, onSelect } = props;

    if (suggestions.portfolios.length === 0 && suggestions.contacts.length === 0) {
        return null;
    }

    return (
        <Animated.View entering={FadeIn.duration(100)} exiting={FadeOut.duration(100)}>
            <List style={styles.container}>
                {suggestions.portfolios.length > 0 && (
                    <List.Group style={styles.suggestionGroup}>
                        {suggestions.portfolios.map((suggestion, idx) => (
                            <SuggestionCell
                                key={suggestion.id}
                                type="portfolio"
                                suggestion={suggestion}
                                isSelected={suggestion.id === selectedId}
                                showDivider={idx < suggestions.portfolios.length - 1}
                                onSelect={onSelect}
                            />
                        ))}
                    </List.Group>
                )}
                {suggestions.contacts.length > 0 && (
                    <List.Group style={styles.suggestionGroup}>
                        {suggestions.contacts.map((suggestion, idx) => (
                            <SuggestionCell
                                key={suggestion.id}
                                type="contact"
                                suggestion={suggestion}
                                isSelected={suggestion.id === selectedId}
                                showDivider={idx < suggestions.contacts.length - 1}
                                onSelect={onSelect}
                            />
                        ))}
                    </List.Group>
                )}
            </List>
        </Animated.View>
    );
};

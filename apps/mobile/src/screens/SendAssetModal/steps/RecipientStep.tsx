import { Ref, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { type SendSuggestions } from '@safely/ux';

import { AddressInput, SuggestionsList } from '../components';
import { useSuggestionSelection } from '../components/SuggestionsList/useSuggestionSelection';

interface RecipientStepProps {
    value: string;
    error: string | undefined;
    onChangeText: (value: string, label?: string) => void;
    inputRef?: Ref<TextInput>;
    suggestions: SendSuggestions;
    restoredSuggestions?: SendSuggestions;
    selectedId?: string;
    onSelectSuggestion: (id: string, visibleSuggestions: SendSuggestions) => void;
    onClearSuggestionSelection: () => void;
    onSubmitEditing?: () => void;
}

export const RecipientStep = (props: RecipientStepProps) => {
    const {
        value,
        error,
        inputRef,
        suggestions,
        restoredSuggestions,
        selectedId,
        onChangeText,
        onSelectSuggestion,
        onClearSuggestionSelection,
        onSubmitEditing
    } = props;

    const { t } = useTranslation();

    const { displaySuggestions, handleSelect, handleChangeText } = useSuggestionSelection({
        suggestions,
        restoredSuggestions,
        selectedId,
        onChangeText,
        onSelectSuggestion,
        onClearSuggestionSelection
    });

    const selectedPortfolioMeta = useMemo(
        () => displaySuggestions.portfolios.find(s => s.id === selectedId)?.meta,
        [displaySuggestions, selectedId]
    );
    const selectedContactMeta = useMemo(
        () => displaySuggestions.contacts.find(s => s.id === selectedId)?.meta,
        [displaySuggestions, selectedId]
    );

    return (
        <View style={{ flex: 1 }}>
            <AddressInput
                onSubmitEditing={onSubmitEditing}
                value={value}
                onChangeText={handleChangeText}
                error={error}
                inputRef={inputRef}
                label={t('send.recipient.label')}
                placeholder={t('send.recipient.placeholder')}
                selectedPortfolioMeta={selectedPortfolioMeta}
                selectedContactMeta={selectedContactMeta}
            />
            <KeyboardAwareScrollView
                style={{ flex: 1 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bottomOffset={16}
                keyboardDismissMode="on-drag"
            >
                <SuggestionsList
                    suggestions={displaySuggestions}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                />
            </KeyboardAwareScrollView>
        </View>
    );
};

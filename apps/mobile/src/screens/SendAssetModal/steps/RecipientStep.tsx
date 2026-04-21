import { Ref, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { SendSuggestion } from '@safely/ux';

import { AddressInput, SuggestionsList } from '../components';
import { useSuggestionSelection } from '../components/SuggestionsList/useSuggestionSelection';

interface RecipientStepProps {
    value: string;
    error: string | undefined;
    onChangeText: (value: string, label?: string) => void;
    inputRef?: Ref<TextInput>;
    suggestions: SendSuggestion[];
    allSuggestions: SendSuggestion[];
    restoredSuggestions?: SendSuggestion[];
    selectedId?: string;
    onSelectSuggestion: (id: string, visibleSuggestions: SendSuggestion[]) => void;
    onClearSuggestionSelection: () => void;
    onSubmitEditing?: () => void;
}

export const RecipientStep = (props: RecipientStepProps) => {
    const {
        value,
        error,
        inputRef,
        suggestions,
        allSuggestions,
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
        allSuggestions,
        restoredSuggestions,
        selectedId,
        onChangeText,
        onSelectSuggestion,
        onClearSuggestionSelection
    });

    const selectedMeta = useMemo(
        () => allSuggestions.find(s => s.id === selectedId)?.meta,
        [allSuggestions, selectedId]
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
                selectedMeta={selectedMeta}
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

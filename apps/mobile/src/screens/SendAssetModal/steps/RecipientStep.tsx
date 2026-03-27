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
    restoredSuggestions?: SendSuggestion[];
    selectedAddress?: string;
    onSelectSuggestion: (address: string, visibleSuggestions: SendSuggestion[]) => void;
    onClearSuggestionSelection: () => void;
}

export const RecipientStep = (props: RecipientStepProps) => {
    const {
        value,
        error,
        inputRef,
        suggestions,
        restoredSuggestions,
        selectedAddress,
        onChangeText,
        onSelectSuggestion,
        onClearSuggestionSelection
    } = props;

    const { t } = useTranslation();

    const { displaySuggestions, handleSelect, handleChangeText } = useSuggestionSelection({
        suggestions,
        restoredSuggestions,
        selectedAddress,
        onChangeText,
        onSelectSuggestion,
        onClearSuggestionSelection
    });

    const selectedMeta = useMemo(
        () => displaySuggestions.find(s => s.address === selectedAddress)?.meta,
        [displaySuggestions, selectedAddress]
    );

    return (
        <View style={{ flex: 1 }}>
            <AddressInput
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
            >
                <SuggestionsList
                    suggestions={displaySuggestions}
                    selectedAddress={selectedAddress}
                    onSelect={handleSelect}
                />
            </KeyboardAwareScrollView>
        </View>
    );
};

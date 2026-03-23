import { Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { SendSuggestion } from '@safely/ux';

import { AddressInput, SuggestionsList } from '../components';

interface RecipientStepProps {
    value: string;
    error: string | undefined;
    onChangeText: (value: string, label?: string) => void;
    inputRef?: Ref<TextInput>;
    suggestions: SendSuggestion[];
}

export const RecipientStep = (props: RecipientStepProps) => {
    const { value, error, onChangeText, inputRef, suggestions } = props;

    const { t } = useTranslation();

    return (
        <View style={{ flex: 1 }}>
            <AddressInput
                value={value}
                onChangeText={onChangeText}
                error={error}
                inputRef={inputRef}
                label={t('send.recipient.label')}
                placeholder={t('send.recipient.placeholder')}
            />
            <KeyboardAwareScrollView
                style={{ flex: 1 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bottomOffset={16}
            >
                <SuggestionsList suggestions={suggestions} onSelect={onChangeText} />
            </KeyboardAwareScrollView>
        </View>
    );
};

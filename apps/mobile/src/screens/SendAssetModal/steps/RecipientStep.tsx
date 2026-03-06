import { Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';

import { Portfolio } from '@safely/core';

import { AddressInput, OtherWalletsList } from '../components';

interface RecipientStepProps {
    value: string;
    error: string | undefined;
    onChangeText: (value: string, label?: string) => void;
    inputRef?: Ref<TextInput>;
    suggestions: Portfolio[];
}

export const RecipientStep = (props: RecipientStepProps) => {
    const { value, error, onChangeText, inputRef, suggestions } = props;

    const { t } = useTranslation();

    return (
        <View>
            <AddressInput
                value={value}
                onChangeText={onChangeText}
                error={error}
                inputRef={inputRef}
                label={t('send.recipient.label')}
                placeholder={t('send.recipient.placeholder')}
            />
            <OtherWalletsList suggestions={suggestions} onSelect={onChangeText} />
        </View>
    );
};

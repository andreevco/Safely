import { Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';

import { AddressInput } from '../components';

interface RecipientStepProps {
    value: string;
    error: string | undefined;
    onChangeText: (value: string) => void;
    inputRef?: Ref<TextInput>;
}

export const RecipientStep = (props: RecipientStepProps) => {
    const { value, error, onChangeText, inputRef } = props;

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
        </View>
    );
};

import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AddressInput } from '../components';

interface RecipientStepProps {
    value: string;
    error: string | undefined;
    onChangeText: (value: string) => void;
}

export const RecipientStep = (props: RecipientStepProps) => {
    const { value, error, onChangeText } = props;
    const { t } = useTranslation();

    return (
        <View>
            <AddressInput
                value={value}
                onChangeText={onChangeText}
                error={error}
                autoFocus
                label={t('send.recipient.label')}
                placeholder={t('send.recipient.placeholder')}
            />
        </View>
    );
};

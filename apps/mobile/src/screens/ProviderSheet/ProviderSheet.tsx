import type { StaticScreenProps } from '@react-navigation/native';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { Provider } from '@safely/core';
import { useDismissProvider, useLinking, useOnrampWidgetMutation } from '@safely/ux';

import {
    BottomSheet,
    Text,
    Image,
    Banner,
    Button,
    TouchableOpacity,
    Checkbox
} from '@mobile/shared/ui';

import { styles } from './ProviderSheet.styles';

export type ProviderSheetProps = StaticScreenProps<{
    provider: Provider;
}>;

export const ProviderSheet = ({
    route: {
        params: { provider }
    }
}: ProviderSheetProps) => {
    const { t } = useTranslation();
    const { openURL } = useLinking();
    const [showAgain, setShowAgain] = useState(false);
    const { mutateAsync: getOnrampWidgetUrl, isPending } = useOnrampWidgetMutation();
    const { mutateAsync: dismissProvider } = useDismissProvider();

    const handleShowAgain = async () => {
        setShowAgain(prev => !prev);
    };

    const handleContinue = async () => {
        const { widgetUrl } = await getOnrampWidgetUrl(provider);
        if (showAgain) {
            await dismissProvider(provider.info.id);
        }
        openURL(widgetUrl, { preferInApp: true });
    };

    return (
        <BottomSheet shortHeader>
            <View style={styles.content}>
                <Image source={{ uri: provider.info.logo }} style={styles.logo} />
                <View style={styles.nameContainer}>
                    <Text textAlign="center" variant="titleM">
                        {provider.info.name}
                    </Text>
                    <Text textAlign="center" variant="bodyL" color="secondary">
                        {provider.info.description}
                    </Text>
                </View>
            </View>
            <Banner style={styles.banner}>
                <Banner.Content>
                    <Banner.Text style={styles.disclaimerText}>
                        <Trans
                            i18nKey="exchange.disclaimer"
                            values={{ providerName: provider.info.name }}
                            components={{
                                terms: (
                                    <Text
                                        color="primary"
                                        onPress={() => openURL(provider.info.legal.tos)}
                                    />
                                ),
                                privacy: (
                                    <Text
                                        color="primary"
                                        onPress={() => openURL(provider.info.legal.privacy)}
                                    />
                                )
                            }}
                        />
                    </Banner.Text>
                </Banner.Content>
            </Banner>
            <View style={styles.actionBar}>
                <Button isLoading={isPending} type="primary" size="large" onPress={handleContinue}>
                    {t('exchange.continue', { providerName: provider.info.name })}
                </Button>
                <TouchableOpacity onPress={handleShowAgain} style={styles.showAgainContainer}>
                    <Checkbox isChecked={showAgain} onPress={handleShowAgain} />
                    <Text variant="bodyM" color="secondary">
                        {t('exchange.dontShowAgain')}
                    </Text>
                </TouchableOpacity>
            </View>
        </BottomSheet>
    );
};

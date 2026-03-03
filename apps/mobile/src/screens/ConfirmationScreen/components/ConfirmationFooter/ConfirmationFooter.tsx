import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useParseError } from '@safely/ux/shared/errors/errors';

import { Button, SlideButton, Text } from '@mobile/shared/ui';

import { styles } from './ConfirmationFooter.styles';
import { ConfirmationState } from '../../ConfirmationScreen.types';

interface Props {
    onSend: () => void;
    onGoBack: () => void;
    state: ConfirmationState;
    isEstimating: boolean;
}

export const ConfirmationFooter = (props: Props) => {
    const { onSend, onGoBack, state, isEstimating } = props;
    const { t } = useTranslation();

    const parseError = useParseError(
        {
            BtcSendDustError: 'confirmation.sendError.btc.dust'
        },
        { fallback: 'confirmation.sendError.default' }
    );

    return (
        <View style={styles.container}>
            {(state.type === 'idle' || state.type === 'sending') && (
                <Animated.View exiting={FadeOut.duration(150)}>
                    <SlideButton
                        label={t('confirmation.slider.send')}
                        description={
                            isEstimating
                                ? t('confirmation.slider.estimatingFee')
                                : t('confirmation.slider.slideToConfirm')
                        }
                        disabled={isEstimating}
                        loading={state.type === 'sending'}
                        onSlideComplete={onSend}
                    />
                </Animated.View>
            )}
            {state.type === 'success' && (
                <Animated.View
                    style={styles.buttonContainer}
                    entering={FadeIn.duration(150)}
                    exiting={FadeOut.duration(150)}
                >
                    <Button size="large" type="secondary" onPress={onGoBack}>
                        {t('confirmation.slider.backToWallet')}
                    </Button>
                </Animated.View>
            )}
            {state.type === 'error' && (
                <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)}>
                    <View style={styles.errorTextBlock}>
                        <Text variant="labelL" color="accentRed" style={styles.errorText}>
                            {t('confirmation.sendError.title')}
                        </Text>
                        <Text variant="bodyM" color="accentRed" style={styles.errorText}>
                            {parseError(state.error)}
                        </Text>
                    </View>
                </Animated.View>
            )}
        </View>
    );
};

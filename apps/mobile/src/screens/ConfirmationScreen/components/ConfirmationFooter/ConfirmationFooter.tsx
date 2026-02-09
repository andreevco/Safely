import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Button, SlideButton } from '@mobile/shared/ui';

import { styles } from './ConfirmationFooter.styles';
import { ConfirmationState } from '../../ConfirmationScreen.types';

interface Props {
    onSend: () => void;
    onGoBack: () => void;
    state: ConfirmationState;
}

export const ConfirmationFooter = (props: Props) => {
    const { onSend, onGoBack, state } = props;
    const { t } = useTranslation();

    const isSigning = state === ConfirmationState.SIGNING;
    const isSending = state === ConfirmationState.SENDING;

    return (
        <View style={styles.container}>
            {(isSigning || isSending) && (
                <Animated.View exiting={FadeOut.duration(150)}>
                    <SlideButton
                        label={t('confirmation.slider.confirm')}
                        description={t('confirmation.slider.slideToSend')}
                        loading={isSending}
                        onSlideComplete={onSend}
                    />
                </Animated.View>
            )}
            {state === ConfirmationState.SUCCESS && (
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
        </View>
    );
};

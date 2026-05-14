import { useTranslation } from 'react-i18next';
import Animated, { Easing, FadeIn, FadeOut } from 'react-native-reanimated';

import { Toast } from '@mobile/shared/ui';

import { styles } from './ReceiveCopyToast.styles';
import { useReceiveCopyToastState } from './ReceiveCopyToastProvider';

export const ReceiveCopyToast = () => {
    const { t } = useTranslation();
    const { isVisible } = useReceiveCopyToastState();

    if (!isVisible) {
        return null;
    }

    return (
        <Animated.View
            entering={FadeIn.duration(220).easing(Easing.in(Easing.ease))}
            exiting={FadeOut.duration(160).easing(Easing.out(Easing.ease))}
            style={styles.wrapper}
            pointerEvents="none"
        >
            <Toast variant="white" message={t('actions.copied')} />
        </Animated.View>
    );
};

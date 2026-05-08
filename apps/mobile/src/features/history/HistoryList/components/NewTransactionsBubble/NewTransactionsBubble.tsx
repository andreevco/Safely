import Animated from 'react-native-reanimated';

import { Toast } from '@mobile/shared/ui';

import { styles, ShowInAnimation, ShowOutAnimation } from './NewTransactionsBubble.styles';

export type NewTransactionsBubbleProps = {
    visible: boolean;
    onPress: () => void;
};

export const NewTransactionsBubble = (props: NewTransactionsBubbleProps) => {
    const { visible, onPress } = props;

    if (!visible) {
        return null;
    }

    return (
        <Animated.View
            entering={ShowInAnimation}
            exiting={ShowOutAnimation}
            style={styles.container}
        >
            <Toast message="New Transactions" onPress={onPress} />
        </Animated.View>
    );
};

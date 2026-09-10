import { useNavigation } from '@react-navigation/core';
import { View } from 'react-native';

import { Icon, ArrowLeft16 } from '@mobile/shared/ui/Icon';
import { Button } from '@mobile/shared/ui/Screen/components/Header/components/Button';

import { styles } from './BackButton.styles';

export const BackButton = () => {
    const navigation = useNavigation();

    if (!navigation.canGoBack()) {
        return (
            <View style={styles.placeholder} pointerEvents="none">
                <Button>
                    <Icon icon={ArrowLeft16} />
                </Button>
            </View>
        );
    }

    return (
        <Button onPress={navigation.goBack}>
            <Icon icon={ArrowLeft16} />
        </Button>
    );
};

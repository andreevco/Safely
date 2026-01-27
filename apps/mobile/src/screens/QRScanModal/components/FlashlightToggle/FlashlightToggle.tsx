import { TouchableOpacity } from '@mobile/shared/ui';
import { Flashlight28, Icon } from '@mobile/shared/ui/Icon';
import { selectionAsync } from 'expo-haptics';
import { useCallback } from 'react';
import { View } from 'react-native';

import { styles } from './FlashlightToggle.styles';

type FlashlightToggleProps = {
    active: boolean;
    onPress: () => void;
};

export const FlashlightToggle = (props: FlashlightToggleProps) => {
    const { active, onPress } = props;

    styles.useVariants({ active });

    const handlePress = useCallback(() => {
        selectionAsync();
        onPress();
    }, [onPress]);

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.button} onPress={handlePress}>
                <Icon icon={Flashlight28} color={active ? 'constantBlack' : 'constantWhite'} />
            </TouchableOpacity>
        </View>
    );
};

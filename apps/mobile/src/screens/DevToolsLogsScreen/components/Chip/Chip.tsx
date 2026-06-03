import { Text, TouchableOpacity } from '@mobile/shared/ui';

import { styles } from './Chip.styles';

type ChipProps = {
    label: string;
    isActive: boolean;
    onPress: () => void;
};

export const Chip = (props: ChipProps) => {
    const { label, isActive, onPress } = props;

    return (
        <TouchableOpacity style={[styles.chip, isActive && styles.chipActive]} onPress={onPress}>
            <Text
                variant="labelS"
                textTransform="uppercase"
                color={isActive ? 'constantWhite' : 'secondary'}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
};

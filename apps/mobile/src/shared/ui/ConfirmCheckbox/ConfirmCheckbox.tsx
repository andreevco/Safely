import { Checkbox } from '../Checkbox';
import { Text } from '../Text';
import { TouchableOpacity } from '../TouchableOpacity';
import { styles } from './ConfirmCheckbox.styles';

interface ConfirmCheckboxProps {
    text: string;
    isChecked: boolean;
    onToggle: () => void;
}

export const ConfirmCheckbox = (props: ConfirmCheckboxProps) => {
    const { text, isChecked, onToggle } = props;

    return (
        <TouchableOpacity onPress={onToggle} style={styles.container}>
            <Text variant="bodyM" color="primary" style={styles.text}>
                {text}
            </Text>
            <Checkbox isChecked={isChecked} onPress={onToggle} />
        </TouchableOpacity>
    );
};

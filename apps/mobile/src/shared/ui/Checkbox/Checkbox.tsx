import { Pressable, PressableProps } from 'react-native';

import { Checkmark28, Icon } from '@mobile/shared/ui/Icon';

import { styles } from './Checkbox.styles';

type CheckboxProps = Omit<PressableProps, 'style'> & {
    isChecked: boolean;
};

export const Checkbox = ({ isChecked, ...rest }: CheckboxProps) => {
    return (
        <Pressable style={[styles.box, isChecked && styles.boxChecked]} hitSlop={32} {...rest}>
            {isChecked && <Icon icon={Checkmark28} size={16} color="constantWhite" />}
        </Pressable>
    );
};

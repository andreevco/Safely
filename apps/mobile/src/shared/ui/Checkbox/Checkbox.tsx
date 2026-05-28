import type { PressableProps } from 'react-native';
import { Pressable } from 'react-native';

import { Checkmark16, Icon } from '@mobile/shared/ui/Icon';

import { styles } from './Checkbox.styles';

type CheckboxProps = Omit<PressableProps, 'style'> & {
    isChecked: boolean;
};

export const Checkbox = ({ isChecked, ...rest }: CheckboxProps) => {
    return (
        <Pressable style={[styles.box, isChecked && styles.boxChecked]} hitSlop={32} {...rest}>
            {isChecked && <Icon icon={Checkmark16} color="constantWhite" />}
        </Pressable>
    );
};

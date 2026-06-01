import type { ViewProps } from 'react-native';
import { View } from 'react-native';

import { InputDescription, InputField, InputLabel } from './components';

const InputContainer = (props: ViewProps) => {
    const { children, ...rest } = props;
    return <View {...rest}>{children}</View>;
};

export const Input = Object.assign(InputContainer, {
    Field: InputField,
    Label: InputLabel,
    Description: InputDescription
});

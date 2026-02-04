import { Text, TextProps } from '@mobile/shared/ui';
import {
    StyleProp,
    TextStyle,
    TouchableHighlight,
    TouchableHighlightProps,
    View
} from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import { styles } from './TransactionCell.styles';

export type TransactionCellProps = TouchableHighlightProps & {
    title?: React.ReactNode;
    value?: React.ReactNode;
    valueStyle?: StyleProp<TextStyle>;
    valueProps?: TextProps;
    subvalue?: string;
    subvalueProps?: TextProps;
    onPress?: () => void;
};

export const TransactionCell = (props: TransactionCellProps) => {
    const {
        title,
        value,
        subvalue,
        onPress,
        style,
        valueStyle,
        valueProps = {},
        subvalueProps = {},
        ...rest
    } = props;

    const theme = useUnistyles().theme;

    return (
        <TouchableHighlight
            delayPressIn={20}
            underlayColor={theme.colors.other.hover}
            onPress={onPress}
            disabled={!onPress}
            {...rest}
        >
            <View style={[styles.container, style]}>
                <View style={[styles.contentContainer, style]}>
                    <View style={styles.titleContainer}>
                        {title !== undefined && typeof title === 'string' ? (
                            <Text numberOfLines={1} variant="bodyM" color="secondary">
                                {title}
                            </Text>
                        ) : (
                            title
                        )}
                    </View>
                    {(value !== undefined || subvalue !== undefined) && (
                        <View style={styles.valueContainer}>
                            {typeof value === 'string' ? (
                                <Text
                                    numberOfLines={1}
                                    variant="bodyM"
                                    style={valueStyle}
                                    {...valueProps}
                                >
                                    {value}
                                </Text>
                            ) : (
                                value
                            )}
                            {typeof subvalue === 'string' ? (
                                <Text
                                    numberOfLines={1}
                                    variant="bodyM"
                                    color="tertiary"
                                    {...subvalueProps}
                                >
                                    {subvalue}
                                </Text>
                            ) : (
                                subvalue
                            )}
                        </View>
                    )}
                </View>
            </View>
        </TouchableHighlight>
    );
};

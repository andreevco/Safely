import type { StyleProp, TextStyle, TouchableHighlightProps } from 'react-native';
import { TouchableHighlight, View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import type { TextProps } from '@mobile/shared/ui';
import { Text } from '@mobile/shared/ui';

import { styles } from './TransactionCell.styles';

export type TransactionCellProps = TouchableHighlightProps & {
    title?: React.ReactNode;
    value?: React.ReactNode;
    valueStyle?: StyleProp<TextStyle>;
    valueProps?: TextProps;
    subvalue?: React.ReactNode;
    subvalueProps?: TextProps;
    onPress?: () => void;
    showDivider?: boolean;
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
        showDivider = true,
        ...rest
    } = props;

    const theme = useUnistyles().theme;

    styles.useVariants({ showDivider });

    return (
        <TouchableHighlight
            delayPressIn={20}
            underlayColor={theme.colors.other.hover}
            style={styles.hover}
            onPress={onPress}
            disabled={!onPress}
            {...rest}
        >
            <View style={[styles.wrapper, style]}>
                <View style={[styles.row, style]}>
                    <View style={styles.label}>
                        {title !== undefined && typeof title === 'string' ? (
                            <Text numberOfLines={1} variant="bodyM" color="secondary">
                                {title}
                            </Text>
                        ) : (
                            title
                        )}
                    </View>
                    {(value !== undefined || subvalue !== undefined) && (
                        <View style={styles.value}>
                            {typeof value === 'string' ? (
                                <TransactionCell.Value style={valueStyle} {...valueProps}>
                                    {value}
                                </TransactionCell.Value>
                            ) : (
                                value
                            )}
                            {typeof subvalue === 'string' ? (
                                <TransactionCell.Subvalue {...subvalueProps}>
                                    {subvalue}
                                </TransactionCell.Subvalue>
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

TransactionCell.Subvalue = (props: TextProps) => (
    <Text numberOfLines={1} variant="bodyM" color="tertiary" {...props} />
);

TransactionCell.Value = (props: TextProps) => <Text numberOfLines={1} variant="bodyM" {...props} />;

import { selectionAsync } from 'expo-haptics';
import { TouchableOpacity, View } from 'react-native';

import { styles } from './ColorPicker.styles';

interface ColorPickerProps {
    colors: string[];
    selectedColor?: string;
    onColorSelect: (color: string) => void;
}

export const ColorPicker = (props: ColorPickerProps) => {
    const { colors, selectedColor, onColorSelect } = props;

    return (
        <View style={styles.container}>
            {colors.map(color => {
                const isSelected = selectedColor === color;

                return (
                    <TouchableOpacity
                        key={color}
                        activeOpacity={0.8}
                        onPress={() => {
                            selectionAsync();
                            onColorSelect(color);
                        }}
                    >
                        <View style={[styles.colorCircle, { backgroundColor: color }]}>
                            {isSelected && (
                                <View
                                    style={[styles.selectedIndicator, { backgroundColor: color }]}
                                />
                            )}
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

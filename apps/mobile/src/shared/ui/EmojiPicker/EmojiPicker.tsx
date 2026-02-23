import { useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

import { styles } from './EmojiPicker.styles';

interface EmojiPickerProps {
    emojis: string[];
    emojisPerRow?: number;
    onEmojiSelect: (emoji: string) => void;
}

export const EmojiPicker = (props: EmojiPickerProps) => {
    const { emojis, emojisPerRow = 8, onEmojiSelect } = props;

    const emojiRows = useMemo(() => {
        const rows: string[][] = [];

        for (let i = 0; i < emojis.length; i += emojisPerRow) {
            rows.push(emojis.slice(i, i + emojisPerRow));
        }

        return rows;
    }, [emojis, emojisPerRow]);

    return (
        <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {emojiRows.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.row}>
                    {row.map(emoji => (
                        <TouchableOpacity
                            key={emoji}
                            activeOpacity={0.8}
                            onPress={() => onEmojiSelect(emoji)}
                            style={styles.emojiButton}
                        >
                            <Text style={styles.emoji}>{emoji}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ))}
        </ScrollView>
    );
};

import { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import { ContactMeta, PortfolioMeta } from '@safely/core';

import { ContactName } from '@mobile/entities/contact';
import { PortfolioName } from '@mobile/entities/portfolio';

import { styles, INPUT_LINE_HEIGHT } from './AddressInput.styles';

interface AddressSuffixProps {
    value: string;
    portfolioMeta?: PortfolioMeta;
    contactMeta?: ContactMeta;
    containerWidth: number;
}

export const AddressSuffix = ({
    value,
    portfolioMeta,
    contactMeta,
    containerWidth
}: AddressSuffixProps) => {
    const { theme } = useUnistyles();

    const [suffixWidth, setSuffixWidth] = useState(0);
    const [lastLine, setLastLine] = useState<{ x: number; y: number; width: number } | null>(null);

    const gap = Platform.OS === 'android' ? theme.spacing[16] : theme.spacing[8];

    const isMeasured = lastLine !== null && suffixWidth > 0 && containerWidth > 0;
    const breakLine =
        isMeasured && lastLine.x + lastLine.width + gap + suffixWidth > containerWidth;

    const suffixStyle = !isMeasured
        ? { opacity: 0 }
        : {
              opacity: 1,
              transform: [
                  { translateY: breakLine ? lastLine.y + INPUT_LINE_HEIGHT : lastLine.y },
                  { translateX: breakLine ? 0 : lastLine.x + lastLine.width + gap }
              ]
          };

    return (
        <>
            <Text
                style={[styles.input, styles.measure]}
                onTextLayout={e => {
                    const last = e.nativeEvent.lines.at(-1);
                    setLastLine(last ? { x: last.x, y: last.y, width: last.width } : null);
                }}
            >
                {value}
            </Text>
            <View style={styles.wrapSpacer(breakLine ? INPUT_LINE_HEIGHT : 0)} />
            <View
                pointerEvents="none"
                onLayout={e => setSuffixWidth(e.nativeEvent.layout.width)}
                style={[styles.inputSuffix, { maxWidth: containerWidth || undefined }, suffixStyle]}
            >
                {portfolioMeta ? (
                    <PortfolioName
                        gap={8}
                        meta={portfolioMeta}
                        size={16}
                        fontVariant="bodyL"
                        color="tertiary"
                    />
                ) : (
                    contactMeta && (
                        <ContactName
                            gap={8}
                            meta={contactMeta}
                            size={16}
                            fontVariant="bodyL"
                            color="tertiary"
                        />
                    )
                )}
            </View>
        </>
    );
};

import { defineSlotRecipe } from '@pandacss/dev';

export const wordCellRecipe = defineSlotRecipe({
    className: 'wordCell',
    description: 'One word of a recovery phrase',
    slots: ['root', 'marker', 'dot', 'word'],
    base: {
        root: {
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8',
            width: '100%',
            paddingInline: '16',
            paddingBlock: '4',
            backgroundColor: 'background.secondary'
        },
        marker: {
            flexShrink: 0,
            width: '14px',
            textStyle: 'bodyM',
            color: 'text.tertiary'
        },
        dot: {
            display: 'block',
            width: '6px',
            height: '6px',
            marginTop: '7px',
            borderRadius: 'full',
            backgroundColor: 'icon.tertiary'
        },
        word: {
            flex: '1',
            minWidth: '0',
            textStyle: 'bodyM',
            color: 'text.primary'
        }
    }
});

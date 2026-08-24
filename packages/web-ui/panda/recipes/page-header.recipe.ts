import { defineSlotRecipe } from '@pandacss/dev';

export const pageHeaderRecipe = defineSlotRecipe({
    className: 'pageHeader',
    description: 'Title strip at the top of a column',
    slots: ['root', 'title', 'actions'],
    base: {
        root: {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            gap: '8',
            height: '64px',
            paddingInline: '24',
            appRegion: 'drag'
        },
        title: {
            flex: '1',
            minWidth: '0',
            textStyle: 'titleS',
            color: 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        },
        actions: {
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            gap: '8',
            appRegion: 'no-drag'
        }
    },
    variants: {
        hasDivider: {
            true: {
                root: {
                    borderBottomWidth: 'hairline',
                    borderBottomStyle: 'solid',
                    borderBottomColor: 'other.transparentElement'
                }
            }
        }
    }
});

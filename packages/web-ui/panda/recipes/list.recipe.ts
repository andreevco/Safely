import { defineSlotRecipe } from '@pandacss/dev';

export const listRecipe = defineSlotRecipe({
    className: 'list',
    description: 'Group of cells with an optional title and footer',
    slots: ['root', 'title', 'group', 'footer'],
    base: {
        root: {
            display: 'flex',
            flexDirection: 'column',
            width: '100%'
        },
        title: {
            paddingInline: '8',
            paddingTop: '16',
            paddingBottom: '8',
            textStyle: 'bodyM',
            textTransform: 'uppercase',
            color: 'text.tertiary'
        },
        group: {
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 'sm',
            overflow: 'hidden'
        },
        footer: {
            paddingInline: '8',
            paddingTop: '8',
            textStyle: 'bodyM',
            color: 'text.tertiary'
        }
    },
    variants: {
        variant: {
            divided: {},
            separated: {
                group: {
                    gap: '2',
                    overflow: 'visible',
                    '& > *': {
                        borderBottomWidth: '0',
                        borderRadius: 'sm',
                        overflow: 'hidden'
                    }
                }
            }
        }
    },
    defaultVariants: {
        variant: 'divided'
    }
});

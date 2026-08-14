import { defineRecipe } from '@pandacss/dev';

/* Recipes live outside `src`: `defineRecipe` is config-time, and calling it from source is
   an eslint error (`@pandacss/no-config-function-in-source`). */
export const buttonRecipe = defineRecipe({
    className: 'button',
    description: 'Primary action button',
    base: {
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'sm',
        borderWidth: '0',
        cursor: 'pointer',
        textAlign: 'center',
        whiteSpace: 'nowrap',
        userSelect: 'none',

        '& svg [fill]:not([fill="none"])': { fill: 'currentcolor' },
        '& svg [stroke]:not([stroke="none"])': { stroke: 'currentcolor' },

        _before: {
            content: '""',
            position: 'absolute',
            inset: '0',
            borderRadius: 'inherit',
            backgroundColor: 'transparent'
        },
        _hover: {
            _before: {
                backgroundColor: 'other.hover'
            }
        },
        _active: {
            _before: {
                backgroundColor: 'other.transparentElement'
            }
        },
        _disabled: {
            cursor: 'not-allowed',
            opacity: 0.64,
            _before: {
                backgroundColor: 'transparent'
            }
        }
    },
    variants: {
        variant: {
            primary: {
                backgroundColor: 'button.primary.background',
                color: 'button.primary.foreground'
            },
            secondary: {
                backgroundColor: 'button.secondary.background',
                color: 'button.secondary.foreground'
            },
            tertiary: {
                backgroundColor: 'button.tertiary.background',
                color: 'button.tertiary.foreground'
            },
            overlay: {
                backgroundColor: 'other.constant.white',
                color: 'other.constant.black'
            },
            destructive: {
                backgroundColor: 'button.destructive.background',
                color: 'button.destructive.foreground'
            },
            destructiveOrange: {
                backgroundColor: 'button.destructiveOrange.background',
                color: 'button.destructiveOrange.foreground'
            }
        },
        size: {
            small: {
                textStyle: 'labelM',
                gap: '6',
                paddingInline: '16',
                paddingBlock: '8',
                minHeight: '36px'
            },
            medium: {
                textStyle: 'labelL',
                gap: '8',
                paddingInline: '24',
                paddingBlock: '12',
                minHeight: '48px'
            },
            large: {
                textStyle: 'labelL',
                gap: '8',
                paddingInline: '24',
                paddingBlock: '16',
                minHeight: '56px'
            }
        },
        isFullWidth: {
            true: {
                width: '100%'
            }
        },
        isIconOnly: {
            true: {
                aspectRatio: 'square',
                paddingInline: '0'
            }
        },
        isLoading: {
            true: {
                cursor: 'progress'
            }
        }
    },
    defaultVariants: {
        variant: 'primary',
        size: 'large'
    }
});

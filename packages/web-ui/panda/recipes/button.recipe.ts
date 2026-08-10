import { defineRecipe } from '@pandacss/dev';

/* Recipes live outside `src`: `defineRecipe` is config-time, and calling it from source is
   an eslint error (`@pandacss/no-config-function-in-source`). */
export const buttonRecipe = defineRecipe({
    className: 'button',
    description: 'Primary action button',
    base: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8',
        borderRadius: 'md',
        borderWidth: '0',
        cursor: 'pointer',
        fontWeight: 600,
        textAlign: 'center',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        _disabled: {
            cursor: 'not-allowed',
            opacity: 0.4
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
            }
        },
        size: {
            md: {
                paddingInline: '16',
                height: '40px',
                fontSize: '14px'
            },
            lg: {
                paddingInline: '24',
                height: '56px',
                fontSize: '16px'
            }
        }
    },
    defaultVariants: {
        variant: 'primary',
        size: 'lg'
    }
});

import { defineSlotRecipe } from '@pandacss/dev';

export const modalRecipe = defineSlotRecipe({
    className: 'modal',
    description: 'Centred dialog over the whole window',
    slots: ['backdrop', 'popup', 'close', 'content', 'title', 'description', 'actions'],
    base: {
        backdrop: {
            position: 'fixed',
            inset: '0',
            backgroundColor: 'background.overlay',
            backdropFilter: 'blur(8px)',
            opacity: 0,
            transition: 'opacity 150ms',
            _open: { opacity: 1 }
        },
        popup: {
            position: 'fixed',
            top: '50%',
            left: '50%',
            display: 'flex',
            flexDirection: 'column',
            width: '400px',
            maxWidth: 'calc(100vw - token(spacing.64))',
            maxHeight: 'calc(100vh - token(spacing.64))',
            overflow: 'hidden',
            borderRadius: 'lg',
            backgroundColor: 'background.primary',
            transform: 'translate(-50%, -50%) scale(0.96)',
            opacity: 0,
            transition: 'opacity 150ms, transform 150ms',
            _open: {
                opacity: 1,
                transform: 'translate(-50%, -50%) scale(1)'
            }
        },
        close: {
            position: 'absolute',
            top: '12',
            right: '12',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            padding: '0',
            borderWidth: '0',
            borderRadius: 'full',
            backgroundColor: 'button.secondary.background',
            color: 'icon.primary',
            cursor: 'pointer',
            '& svg [fill]:not([fill="none"])': { fill: 'currentcolor' },
            '& svg [stroke]:not([stroke="none"])': { stroke: 'currentcolor' }
        },
        content: {
            display: 'flex',
            flexDirection: 'column',
            gap: '4',
            overflowY: 'auto',
            paddingInline: '32',
            paddingBlock: '16',
            paddingTop: '64px'
        },
        title: {
            textStyle: 'titleM',
            color: 'text.primary',
            textAlign: 'center'
        },
        description: {
            textStyle: 'bodyL',
            color: 'text.secondary',
            textAlign: 'center'
        },
        actions: {
            display: 'flex',
            flexDirection: 'column',
            gap: '8',
            padding: '8'
        }
    }
});

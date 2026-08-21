import { defineSlotRecipe } from '@pandacss/dev';

const TITLE_BAR_HEIGHT = '52px';

export const appLayoutRecipe = defineSlotRecipe({
    className: 'appLayout',
    description: 'Window shell: a title bar over the sidebar, an optional second bar and content',
    slots: ['root', 'titleBar', 'sidebar', 'secondary', 'content', 'panel'],
    base: {
        root: {
            position: 'relative',
            display: 'flex',
            height: '100%',
            width: '100%',
            overflow: 'hidden',
            backgroundColor: 'background.primary'
        },
        titleBar: {
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            height: TITLE_BAR_HEIGHT
        },
        sidebar: {
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            width: '300px',
            paddingTop: TITLE_BAR_HEIGHT,
            overflowY: 'auto',
            borderRightWidth: 'hairline',
            borderRightStyle: 'solid',
            borderRightColor: 'other.transparentElement',
            backgroundColor: 'background.secondary'
        },
        secondary: {
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            width: '300px',
            overflowY: 'auto',
            borderRightWidth: 'hairline',
            borderRightStyle: 'solid',
            borderRightColor: 'other.transparentElement',
            backgroundColor: 'background.overlay'
        },
        content: {
            display: 'flex',
            flexDirection: 'column',
            flex: '1',
            minWidth: '0',
            overflowY: 'auto'
        },
        panel: {
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            width: '400px',
            overflowY: 'auto',
            borderLeftWidth: 'hairline',
            borderLeftStyle: 'solid',
            borderLeftColor: 'other.transparentElement'
        }
    },
    variants: {
        hasWindowControls: {
            true: {
                titleBar: { paddingLeft: '98px' }
            }
        },
        isFullScreen: {
            true: {
                secondary: { paddingTop: TITLE_BAR_HEIGHT },
                content: { paddingTop: TITLE_BAR_HEIGHT },
                panel: { paddingTop: TITLE_BAR_HEIGHT }
            }
        }
    }
});

import { defineSlotRecipe } from '@pandacss/dev';

const TITLE_BAR_HEIGHT = '52px';
const SIDEBAR_WIDTH = '300px';

export const appLayoutRecipe = defineSlotRecipe({
    className: 'appLayout',
    description: 'Window shell: a title bar over the sidebar, an optional second bar and content',
    slots: ['root', 'titleBar', 'sidebar', 'secondary', 'secondaryContent', 'content', 'panel'],
    base: {
        root: {
            position: 'relative',
            /* confines the shell's own z-indexes so a portalled overlay still covers them */
            isolation: 'isolate',
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
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            width: SIDEBAR_WIDTH,
            height: TITLE_BAR_HEIGHT
        },
        sidebar: {
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            width: SIDEBAR_WIDTH,
            paddingTop: TITLE_BAR_HEIGHT,
            overflowY: 'auto',
            borderRightWidth: 'hairline',
            borderRightStyle: 'solid',
            borderRightColor: 'other.transparentElement',
            backgroundColor: 'background.secondary'
        },
        secondary: {
            position: 'relative',
            flexShrink: 0,
            width: '300px',
            overflow: 'hidden',
            transition: 'width 200ms ease',
            _motionReduce: { transition: 'none' }
        },
        secondaryContent: {
            position: 'absolute',
            top: '0',
            left: '0',
            display: 'flex',
            flexDirection: 'column',
            width: '300px',
            height: '100%',
            borderRightWidth: 'hairline',
            borderRightStyle: 'solid',
            borderRightColor: 'other.transparentElement',
            backgroundColor: 'background.overlay',
            transition: 'transform 200ms ease',
            _motionReduce: { transition: 'none' }
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
        isSecondaryOpen: {
            false: {
                secondary: { width: '0' },
                secondaryContent: { transform: 'translateX(-100%)' }
            }
        },
        isFullScreen: {
            true: {
                secondaryContent: { paddingTop: TITLE_BAR_HEIGHT },
                content: { paddingTop: TITLE_BAR_HEIGHT },
                panel: { paddingTop: TITLE_BAR_HEIGHT }
            }
        }
    }
});

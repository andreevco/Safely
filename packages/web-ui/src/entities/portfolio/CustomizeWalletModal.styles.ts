import { css } from '@safely/web-ui/styled-system/css';

export const popupStyles = css({
    width: '496px',
    height: '636px',
    maxHeight: 'calc(100vh - token(spacing.32))'
});

export const headerStyles = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    height: '64px',
    paddingInline: '12'
});

export const headingStyles = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '4',
    paddingInline: '32',
    paddingBlock: '16'
});

export const titleStyles = css({ textStyle: 'titleM', textAlign: 'center' });

export const descriptionStyles = css({
    textStyle: 'bodyL',
    color: 'text.secondary',
    textAlign: 'center',
    textWrap: 'balance'
});

export const fieldStyles = css({ paddingInline: '24', paddingBottom: '16' });

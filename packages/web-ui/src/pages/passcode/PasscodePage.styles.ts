import { css } from '@safely/web-ui/styled-system/css';

export const shellStyles = css({
    height: '100%',
    width: '100%',
    backgroundColor: 'background.secondary'
});

export const popupStyles = css({
    width: '480px',
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

export const lengthToggleStyles = css({
    display: 'flex',
    alignItems: 'center',
    gap: '8',
    height: '40px',
    paddingLeft: '16',
    paddingRight: '12',
    borderRadius: 'full',
    borderWidth: 'hairlineAlternate',
    borderStyle: 'solid',
    borderColor: 'other.transparentElement'
});

export const bodyStyles = css({
    display: 'flex',
    flexDirection: 'column',
    flex: '1',
    minHeight: '0'
});

export const headingStyles = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '4',
    width: '100%',
    paddingInline: '32',
    paddingBlock: '16'
});

export const titleStyles = css({ textStyle: 'titleM', textAlign: 'center' });

export const descriptionStyles = css({
    textStyle: 'bodyL',
    color: 'text.secondary',
    textAlign: 'center',
    whiteSpace: 'pre-line'
});

export const keypadFillStyles = css({
    flex: '1',
    justifyContent: 'space-between'
});

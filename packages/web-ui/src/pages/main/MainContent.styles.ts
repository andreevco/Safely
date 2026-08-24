import { css } from '@safely/web-ui/styled-system/css';

export const headerStyles = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '8',
    flexShrink: 0,
    paddingInline: '24',
    paddingBottom: '16'
});

export const walletTitleStyles = css({
    display: 'flex',
    alignItems: 'center',
    gap: '8'
});

export const walletRowStyles = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    height: '52px',
    gap: '8'
});

export const balanceRowStyles = css({
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '16',
    flexWrap: 'wrap'
});

export const actionsStyles = css({
    display: 'flex',
    alignItems: 'center',
    gap: '8'
});

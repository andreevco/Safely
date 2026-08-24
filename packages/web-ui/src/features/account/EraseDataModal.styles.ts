import { css } from '@safely/web-ui/styled-system/css';

export const contentStyles = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '8',
    padding: '24',
    paddingTop: '32'
});

export const titleStyles = css({ textStyle: 'titleS', textAlign: 'center' });

export const descriptionStyles = css({
    textStyle: 'bodyM',
    color: 'text.secondary',
    textAlign: 'center',
    textWrap: 'balance'
});

export const actionsStyles = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '8',
    padding: '24',
    paddingTop: '0'
});

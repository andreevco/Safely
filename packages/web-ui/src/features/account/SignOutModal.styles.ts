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
    textAlign: 'center'
});

export const acknowledgementStyles = css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12',
    marginTop: '16',
    padding: '16',
    borderRadius: 'sm',
    backgroundColor: 'background.secondary',
    cursor: 'pointer'
});

export const actionsStyles = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '8',
    padding: '24',
    paddingTop: '0'
});

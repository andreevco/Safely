import { css } from '@safely/web-ui/styled-system/css';

export const dragRegionStyles = css({ appRegion: 'drag' });

export const contentStyles = css({
    display: 'flex',
    flexDirection: 'column',
    gap: '32',
    paddingInline: '24',
    paddingBottom: '32'
});

export const sectionStyles = css({ display: 'flex', flexDirection: 'column', gap: '8' });

export const columnStyles = css({ display: 'flex', flexDirection: 'column', gap: '16' });

export const rowStyles = css({
    display: 'flex',
    alignItems: 'center',
    gap: '12',
    flexWrap: 'wrap'
});

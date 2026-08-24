import { css } from '@safely/web-ui/styled-system/css';

export const dragRegionStyles = css({ appRegion: 'drag' });

export const centeredContentStyles = css({
    display: 'flex',
    flexDirection: 'column',
    flex: '1',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4',
    paddingInline: '24',
    paddingBottom: '32'
});

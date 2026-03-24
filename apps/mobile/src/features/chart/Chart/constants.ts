import Color from 'color';

export const LINE_COLOR = 'rgba(247, 147, 26, 1)';
export const OPAQUE_LINE_COLOR = new Color(LINE_COLOR).alpha(0.8).toString();
export const FADED_LINE_COLOR = new Color(LINE_COLOR).alpha(0.48).toString();
export const LINE_STROKE_WIDTH = 1.5;
export const DOT_RADIUS = 2;

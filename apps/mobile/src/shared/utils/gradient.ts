import Color from 'color';

function smoothstep(t: number): number {
    const x = Math.max(0, Math.min(1, t));
    return x * x * (3 - 2 * x);
}

export function smoothstepGradient(
    color: string,
    steps = 16,
    peakAlpha = 1
): [string, string, ...string[]] {
    const base = new Color(color);

    return Array.from({ length: steps }, (_, i) => {
        const alpha = Math.round(smoothstep(i / (steps - 1)) * peakAlpha * 10000) / 10000;
        return base.alpha(alpha).rgb().string();
    }) as [string, string, ...string[]];
}

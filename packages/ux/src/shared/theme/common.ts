/**
 * Must stay dependency-free: consumed by the unistyles config (mobile) and by the Panda
 * config (web) under plain node. Numbers are unitless — the consumer adds `px` or not.
 */
export const commonTheme = {
    border: {
        hairline: 0.5,
        hairlineAlternate: 0.75,
        border: 1,
        illustrationLine: 2
    },
    radius: {
        xss: 4,
        xs: 6,
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        frame: 40,
        full: 1000
    },
    spacing: {
        0: 0,
        2: 2,
        4: 4,
        6: 6,
        8: 8,
        12: 12,
        16: 16,
        24: 24,
        32: 32,
        48: 48,
        64: 64
    }
};

import type { PASSCODE_DIGITS } from './passcode';

export type PasscodeDigits = (typeof PASSCODE_DIGITS)[keyof typeof PASSCODE_DIGITS];

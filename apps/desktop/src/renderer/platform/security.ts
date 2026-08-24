import type { Security } from '@safely/ux';
import { passcodePrompt } from '@safely/web-ui';

export const passcodeSecurityGate: Security = {
    check: () => passcodePrompt.request()
};

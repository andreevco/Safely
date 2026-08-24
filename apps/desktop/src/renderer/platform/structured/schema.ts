import { z } from 'zod';

export const secureEncryptedStructure = {
    passcode: z.union([z.null(), z.string()])
};

export type SecureEncryptedStructure = typeof secureEncryptedStructure;

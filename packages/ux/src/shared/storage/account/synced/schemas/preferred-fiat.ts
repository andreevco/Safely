import z from 'zod';

import { sFiatAsset } from '@safely/core';

export const sPreferredFiat = z.union([sFiatAsset, z.null()]);

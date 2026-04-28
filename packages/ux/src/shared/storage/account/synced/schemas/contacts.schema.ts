import { z } from 'zod';

import { ContactId, sContact } from '@safely/core';
import { zArrayWithKey } from '@safely/sync';

export { sContact, type SContactOut, type SContactIn } from '@safely/core';

export const sContacts = z.union([
    zArrayWithKey(sContact, item => new ContactId(item.id.hash).toString()),
    z.null()
]);

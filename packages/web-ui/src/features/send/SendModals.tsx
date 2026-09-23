import type { FC } from 'react';

import { SendModal } from './SendModal';
import type { useSendFlow } from './useSendFlow';

export type SendModalsProps = {
    flow: ReturnType<typeof useSendFlow>;
};

export const SendModals: FC<SendModalsProps> = ({ flow }) =>
    flow.isOpen ? <SendModal onClose={flow.onClose} /> : null;

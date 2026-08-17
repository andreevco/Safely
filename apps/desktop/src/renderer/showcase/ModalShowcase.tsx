import type { FC } from 'react';
import { useState } from 'react';

import { Button, Modal } from '@safely/web-ui';

import { ShowcaseSection } from './ShowcaseSection';

export const ModalShowcase: FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <ShowcaseSection title="MODAL">
            <Modal open={isOpen} onOpenChange={setIsOpen}>
                <Button variant="secondary" size="small" onClick={() => setIsOpen(true)}>
                    Open modal
                </Button>

                <Modal.Popup closeLabel="Close">
                    <Modal.Content>
                        <Modal.Title>Erase all app data on this device?</Modal.Title>
                        <Modal.Description>
                            All accounts, wallets, and app data stored in Safely on this device will
                            be permanently removed. Only backed up accounts can be restored.
                        </Modal.Description>
                    </Modal.Content>

                    <Modal.Actions>
                        <Button variant="destructive" isFullWidth>
                            Erase all app data
                        </Button>
                        <Modal.Close
                            render={
                                <Button variant="secondary" isFullWidth>
                                    Cancel
                                </Button>
                            }
                        />
                    </Modal.Actions>
                </Modal.Popup>
            </Modal>
        </ShowcaseSection>
    );
};

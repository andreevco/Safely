import type { FC } from 'react';
import { useState } from 'react';

import QrCodeScanShield28 from '@safely/ux/assets/icons/28/qr-code-scan-shield-28.svg?react';
import { Icon, Input } from '@safely/web-ui';

import { ShowcaseSection, showcaseColumnStyles } from './ShowcaseSection';

const ADDRESS = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';

export const InputShowcase: FC = () => {
    const [description, setDescription] = useState('');
    const [address, setAddress] = useState(ADDRESS);

    return (
        <ShowcaseSection title="INPUT">
            <div className={showcaseColumnStyles}>
                <Input>
                    <Input.Label>Label</Input.Label>
                    <Input.Field
                        placeholder="Description"
                        value={description}
                        onChange={event => setDescription(event.target.value)}
                        onClear={() => setDescription('')}
                        clearLabel="Clear description"
                        trailing={<Icon asset={QrCodeScanShield28} tone="accent" />}
                    />
                </Input>

                <Input invalid>
                    <Input.Label>Label</Input.Label>
                    <Input.Field defaultValue="Thanks!" />
                    <Input.Description>Something is wrong with this value</Input.Description>
                </Input>

                <Input>
                    <Input.Label>Label</Input.Label>
                    <Input.Field
                        isMultiline
                        value={address}
                        onChange={event => setAddress(event.target.value)}
                        onClear={() => setAddress('')}
                        clearLabel="Clear address"
                    />
                </Input>

                <Input disabled>
                    <Input.Label>Label</Input.Label>
                    <Input.Field defaultValue="Thanks!" />
                </Input>
            </div>
        </ShowcaseSection>
    );
};

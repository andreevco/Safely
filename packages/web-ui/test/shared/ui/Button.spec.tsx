import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Button } from '../../../src';

describe('Button', () => {
    it('renders a button carrying the recipe class names', () => {
        render(<Button variant="secondary">Send</Button>);

        const button = screen.getByRole('button', { name: 'Send' });

        expect(button.className).toContain('button');
        expect(button.className).toContain('button--variant_secondary');
    });
});

import type { FC } from 'react';

import { ColorDot, List, TableCell, WordCell } from '@safely/web-ui';

import { ShowcaseSection } from './ShowcaseSection';

const WORDS = ['abandon', 'ability', 'able', 'about'];

export const TableShowcase: FC = () => (
    <>
        <ShowcaseSection title="TABLE CELLS">
            <List>
                <List.Group>
                    <TableCell>
                        <TableCell.Column width="label">
                            <TableCell.Label>Label</TableCell.Label>
                        </TableCell.Column>
                        <TableCell.Column>
                            <TableCell.Value>Value</TableCell.Value>
                        </TableCell.Column>
                    </TableCell>

                    <TableCell>
                        <TableCell.Column width="label">
                            <TableCell.Label>With a colour</TableCell.Label>
                        </TableCell.Column>
                        <TableCell.Column>
                            <TableCell.Value>
                                <ColorDot tone="orange" size="small" /> Wallet
                            </TableCell.Value>
                        </TableCell.Column>
                    </TableCell>

                    <TableCell>
                        <TableCell.Column width="label">
                            <TableCell.Label>Two rows</TableCell.Label>
                        </TableCell.Column>
                        <TableCell.Column>
                            <TableCell.Value>Value</TableCell.Value>
                            <TableCell.Label>Description</TableCell.Label>
                        </TableCell.Column>
                    </TableCell>

                    <TableCell
                        copyable="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
                        copiedLabel="Copied"
                    >
                        <TableCell.Column width="label">
                            <TableCell.Label>Address</TableCell.Label>
                        </TableCell.Column>
                        <TableCell.Column>
                            <TableCell.Value>
                                bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
                            </TableCell.Value>
                        </TableCell.Column>
                    </TableCell>
                </List.Group>
            </List>
        </ShowcaseSection>

        <ShowcaseSection title="TABLE CELLS WITH COLUMN DIVIDERS">
            <List>
                <List.Group>
                    <TableCell hasColumnDivider>
                        <TableCell.Column width="labelNarrow">
                            <TableCell.Label>80</TableCell.Label>
                        </TableCell.Column>
                        <TableCell.Column>
                            <TableCell.Value>Value</TableCell.Value>
                        </TableCell.Column>
                    </TableCell>

                    <TableCell hasColumnDivider>
                        <TableCell.Column width="label">
                            <TableCell.Label>120</TableCell.Label>
                        </TableCell.Column>
                        <TableCell.Column>
                            <TableCell.Value>Value</TableCell.Value>
                            <TableCell.Label>Description</TableCell.Label>
                        </TableCell.Column>
                    </TableCell>
                </List.Group>
            </List>
        </ShowcaseSection>

        <ShowcaseSection title="WORD CELLS">
            <List>
                <List.Group>
                    {WORDS.map((word, index) => (
                        <WordCell key={word} index={index + 1} word={word} />
                    ))}
                </List.Group>
            </List>

            <List>
                <List.Group>
                    {WORDS.map(word => (
                        <WordCell key={word} word={word} />
                    ))}
                </List.Group>
            </List>
        </ShowcaseSection>
    </>
);

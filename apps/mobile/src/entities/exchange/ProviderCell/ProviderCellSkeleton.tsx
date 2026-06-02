import { Cell } from '@mobile/shared/ui';

export const ProviderCellSkeleton = () => {
    return (
        <Cell skeleton>
            <Cell.Image type="image" image={null} />
            <Cell.Content>
                <Cell.Row>
                    <Cell.Title />
                </Cell.Row>
                <Cell.Row>
                    <Cell.Subtitle />
                </Cell.Row>
            </Cell.Content>
        </Cell>
    );
};

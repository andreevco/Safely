import { Cell } from '@mobile/shared/ui';

export const AssetCellSkeleton = () => {
    return (
        <Cell skeleton>
            <Cell.Image type="image" image={null} />
            <Cell.Content>
                <Cell.Row>
                    <Cell.Title />
                    <Cell.Value />
                </Cell.Row>
                <Cell.Row>
                    <Cell.Subtitle />
                    <Cell.Subvalue />
                </Cell.Row>
            </Cell.Content>
        </Cell>
    );
};

import { GroupPortfolioItem } from './GroupPortfolioItem';
import { getDerivations } from './helpers';
import { SinglePortfolioItem } from './SinglePortfolioItem';
import type { DraggablePortfolioProps } from './types';

export const DraggablePortfolio = (props: DraggablePortfolioProps) => {
    if (getDerivations(props.portfolio).length > 1) {
        return <GroupPortfolioItem {...props} />;
    }

    return <SinglePortfolioItem {...props} />;
};

import { BannerContainer, BannerContainerProps } from './Banner';
import { Action, Content, Icon, Text } from './components';

export type BannerProps = BannerContainerProps;

export const Banner = Object.assign(BannerContainer, {
    Content,
    Text,
    Icon,
    Action
});

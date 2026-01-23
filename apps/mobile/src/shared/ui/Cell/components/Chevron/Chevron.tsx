import { Icon, IconProps } from '@mobile/shared/ui/Icon';
import { ChevronRight16 } from '@mobile/shared/ui/Icon/icons';

export const Chevron = (props: Omit<IconProps, 'icon'>) => {
    return <Icon icon={ChevronRight16} color="tertiary" {...props} />;
};

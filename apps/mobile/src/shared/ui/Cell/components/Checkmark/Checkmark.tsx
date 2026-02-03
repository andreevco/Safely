import { Icon, IconProps } from '@mobile/shared/ui/Icon';
import { Checkmark28 } from '@mobile/shared/ui/Icon/icons';

export const Checkmark = (props: Omit<IconProps, 'icon'>) => {
    return <Icon icon={Checkmark28} color="accent" {...props} />;
};

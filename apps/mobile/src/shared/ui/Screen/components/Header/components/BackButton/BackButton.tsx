import { useNavigation } from '@react-navigation/native';

import { Icon, ArrowLeft16 } from '@mobile/shared/ui/Icon';
import { Button } from '@mobile/shared/ui/Screen/components/Header/components/Button';

export const BackButton = () => {
    const navigation = useNavigation();

    return (
        <Button onPress={navigation.goBack}>
            <Icon icon={ArrowLeft16} />
        </Button>
    );
};

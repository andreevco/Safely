import { Icon, Xmark16 } from '@mobile/shared/ui/Icon';
import { Button } from '@mobile/shared/ui/Screen/components/Header/components/Button';
import { useNavigation } from '@react-navigation/native';

export const CloseButton = () => {
    const navigation = useNavigation();

    return (
        <Button onPress={navigation.goBack}>
            <Icon icon={Xmark16} />
        </Button>
    );
};

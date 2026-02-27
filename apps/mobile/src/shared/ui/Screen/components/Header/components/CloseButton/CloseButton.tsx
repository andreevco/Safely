import { useNavigation } from '@react-navigation/native';

import { useBottomSheetContext } from '@mobile/shared/ui/BottomSheet/context';
import { Icon, Xmark16 } from '@mobile/shared/ui/Icon';
import { Button } from '@mobile/shared/ui/Screen/components/Header/components/Button';

export const CloseButton = () => {
    const navigation = useNavigation();
    const bottomSheet = useBottomSheetContext();

    const handleClose = bottomSheet?.close ?? navigation.goBack;

    return (
        <Button onPress={handleClose}>
            <Icon icon={Xmark16} />
        </Button>
    );
};

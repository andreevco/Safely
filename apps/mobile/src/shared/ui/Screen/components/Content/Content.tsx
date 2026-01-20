import { View } from 'react-native';

interface ContentProps {
    children: React.ReactNode;
}

export const Content = (props: ContentProps) => {
    const { children } = props;

    return <View>{children}</View>;
};

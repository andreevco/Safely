import type { ParamListBase } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef } from 'react';
import type { TextInput } from 'react-native';

export function useAutoFocus() {
    const inputRef = useRef<TextInput>(null);
    const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();

    useEffect(() => {
        const unsub = navigation.addListener('transitionEnd', event => {
            if (!event.data.closing) {
                inputRef.current?.focus();
            }
        });
        return unsub;
    }, [navigation]);

    return inputRef;
}

import { BottomTabBarHeightContext } from '@react-navigation/bottom-tabs';
import React from 'react';

export const useBottomTabBarHeightSafely = () => {
    const height = React.useContext(BottomTabBarHeightContext);

    return height ?? 0;
};

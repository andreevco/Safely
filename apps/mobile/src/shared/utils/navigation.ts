export const resolveLayoutByScreenName = (screenName: string) => {
    if (screenName.endsWith('Sheet')) {
        return 'sheet';
    }

    if (screenName.endsWith('Modal')) {
        return 'modal';
    }

    return 'screen';
};

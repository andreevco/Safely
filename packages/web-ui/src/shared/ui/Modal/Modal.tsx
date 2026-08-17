import { Dialog } from '@base-ui/react/dialog';
import type { ComponentPropsWithoutRef, FC, ReactNode } from 'react';

import Xmark16 from '@safely/ux/assets/icons/16/xmark-16.svg?react';
import { cx } from '@safely/web-ui/styled-system/css';
import { modal } from '@safely/web-ui/styled-system/recipes';

import { Icon } from '../Icon';

const styles = modal();

export type ModalRootProps = ComponentPropsWithoutRef<typeof Dialog.Root>;

export type ModalPopupProps = {
    closeLabel: string;
    children?: ReactNode;
    className?: string;
};

type ModalPartProps<TElement extends 'div' | 'h2' | 'p'> = Omit<
    ComponentPropsWithoutRef<TElement>,
    'className'
> & {
    className?: string;
};

const ModalPopup: FC<ModalPopupProps> = props => {
    const { closeLabel, className, children } = props;

    return (
        <Dialog.Portal>
            <Dialog.Backdrop className={styles.backdrop} />

            <Dialog.Popup className={cx(styles.popup, className)}>
                <Dialog.Close className={styles.close} aria-label={closeLabel}>
                    <Icon asset={Xmark16} />
                </Dialog.Close>

                {children}
            </Dialog.Popup>
        </Dialog.Portal>
    );
};

const ModalContent: FC<ModalPartProps<'div'>> = props => {
    const { className, ...rest } = props;

    return <div className={cx(styles.content, className)} {...rest} />;
};

const ModalTitle: FC<ModalPartProps<'h2'>> = props => {
    const { className, ...rest } = props;

    return <Dialog.Title className={cx(styles.title, className)} {...rest} />;
};

const ModalDescription: FC<ModalPartProps<'p'>> = props => {
    const { className, ...rest } = props;

    return <Dialog.Description className={cx(styles.description, className)} {...rest} />;
};

const ModalActions: FC<ModalPartProps<'div'>> = props => {
    const { className, ...rest } = props;

    return <div className={cx(styles.actions, className)} {...rest} />;
};

export const Modal = Object.assign(Dialog.Root, {
    Trigger: Dialog.Trigger,
    Close: Dialog.Close,
    Popup: ModalPopup,
    Content: ModalContent,
    Title: ModalTitle,
    Description: ModalDescription,
    Actions: ModalActions
});

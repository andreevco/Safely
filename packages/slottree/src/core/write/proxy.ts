import { JsonValue } from '../json';
import { isContainerSlot, Slot } from '../slots';
import { JsonStorageSelection } from './selection';
import { cloneDeep } from '../slots/slot-json';

export type ReadSlotObserver = (slot: Slot) => void;

export function createReadProxy(
    selection: JsonStorageSelection,
    onRead?: ReadSlotObserver
): unknown {
    const readValue = (prop: string): unknown => {
        const slot = selection.get(prop);

        if (slot === undefined || slot.d === true) {
            return undefined;
        }

        onRead?.(slot);

        if (isContainerSlot(slot)) {
            const childSelection = selection.select(prop);

            if (childSelection === undefined) {
                return undefined;
            }

            return createReadProxy(childSelection, onRead);
        }

        return cloneDeep(slot.v);
    };

    return new Proxy(Object.create(null), {
        get: (_target, prop) => {
            if (typeof prop !== 'string') {
                return undefined;
            }

            return readValue(prop);
        },

        has: (_target, prop) => {
            return typeof prop === 'string' && selection.has(prop);
        },

        ownKeys: () => {
            return selection.keys();
        },

        getOwnPropertyDescriptor: (_target, prop) => {
            if (typeof prop !== 'string' || !selection.has(prop)) {
                return undefined;
            }

            return {
                configurable: true,
                enumerable: true,
                writable: false,
                value: readValue(prop)
            };
        },

        set: () => {
            return false;
        },

        defineProperty: () => {
            return false;
        },

        deleteProperty: () => {
            return false;
        },

        setPrototypeOf: () => {
            return false;
        }
    });
}

export function createWriteProxy(selection: JsonStorageSelection, onUpdate: () => void): unknown {
    const readValue = (prop: string): unknown => {
        const slot = selection.get(prop);

        if (slot === undefined || slot.d === true) {
            return undefined;
        }

        if (isContainerSlot(slot)) {
            const childSelection = selection.select(prop);

            if (childSelection === undefined) {
                return undefined;
            }

            return createWriteProxy(childSelection, onUpdate);
        }

        return cloneDeep(slot.v);
    };

    return new Proxy(Object.create(null), {
        get: (_target, prop) => {
            if (typeof prop !== 'string') {
                return undefined;
            }

            return readValue(prop);
        },

        set: (_target, prop, value) => {
            if (typeof prop !== 'string') {
                return false;
            }

            if (value === undefined) {
                selection.delete(prop);
                onUpdate();
                return true;
            }

            selection.set(prop, value as JsonValue);
            onUpdate();

            return true;
        },

        has: (_target, prop) => {
            return typeof prop === 'string' && selection.has(prop);
        },

        ownKeys: () => {
            return selection.keys();
        },

        getOwnPropertyDescriptor: (_target, prop) => {
            if (typeof prop !== 'string' || !selection.has(prop)) {
                return undefined;
            }

            return {
                configurable: true,
                enumerable: true,
                writable: true,
                value: readValue(prop)
            };
        },

        defineProperty: (_target, prop, descriptor) => {
            if (typeof prop !== 'string') {
                return false;
            }

            if ('get' in descriptor || 'set' in descriptor || !('value' in descriptor)) {
                return false;
            }

            if (
                descriptor.configurable === false ||
                descriptor.enumerable === false ||
                descriptor.writable === false
            ) {
                return false;
            }

            if (descriptor.value === undefined) {
                selection.delete(prop);
                onUpdate();
                return true;
            }

            selection.set(prop, descriptor.value as JsonValue);
            onUpdate();
            return true;
        },

        deleteProperty: (_target, prop) => {
            if (typeof prop !== 'string') {
                return false;
            }

            selection.delete(prop);
            onUpdate();

            return true;
        }
    });
}

import { v4 as uuid4 } from 'uuid';
import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

const onboardingId = createStore<string | null>(() => null);
const actions = {
    generate(this: void) {
        const id = uuid4();
        onboardingId.setState(id);
        return id;
    },
    reset(this: void) {
        onboardingId.setState(null);
    }
};

export function useOnboardingId() {
    const value = useStore(onboardingId);

    return {
        value,
        ...actions
    };
}

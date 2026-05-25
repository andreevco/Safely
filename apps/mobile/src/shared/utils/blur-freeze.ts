class BlurFreeze {
    private frozen = false;

    public get isFrozen(): boolean {
        return this.frozen;
    }

    public freeze(): void {
        this.frozen = true;
    }

    public unfreeze(): void {
        this.frozen = false;
    }
}

export const blurFreeze = new BlurFreeze();

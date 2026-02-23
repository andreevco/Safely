import { Suspense } from 'react';

import { BtcPriceBadge } from '../shared/ui/BtcPriceBadge';

export const MainPage = () => {
    return (
        <div className="mx-auto flex h-full max-w-3xl flex-col gap-6 p-6">
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-zinc-900">Safely Web</h1>
                    <p className="text-sm text-zinc-600">Web prototype</p>
                </div>
                <Suspense
                    fallback={
                        <div className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-500">
                            Loading...
                        </div>
                    }
                >
                    <BtcPriceBadge />
                </Suspense>
            </div>
        </div>
    );
};

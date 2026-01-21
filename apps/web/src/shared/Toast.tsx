import React from 'react';

type ToastProps = {
    message: string;
    type?: 'success' | 'error';
    onClose: () => void;
};

export function Toast({ message, type = 'success', onClose }: ToastProps) {
    const bgColor =
        type === 'error' ? 'bg-red-500/90 backdrop-blur-sm' : 'bg-green-500/90 backdrop-blur-sm';
    const textColor = 'text-white';

    return (
        <div
            className={`${bgColor} ${textColor} px-4 py-3 rounded-lg shadow-xl border border-white/10 min-w-[200px] max-w-[400px] flex items-center justify-between gap-3 transition-all duration-200 ease-out`}
            role="alert"
            style={{
                animation: 'slideUp 0.2s ease-out'
            }}
        >
            <style>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
            <span className="text-sm font-medium flex-1">{message}</span>
            <button
                type="button"
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors flex-shrink-0"
                aria-label="Close toast"
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M12 4L4 12M4 4L12 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>
        </div>
    );
}

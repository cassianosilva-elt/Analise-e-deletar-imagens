import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsConfig {
    onNext?: () => void;
    onPrev?: () => void;
    onApprove?: () => void;
    onReject?: () => void;
    onRunAI?: () => void;
    disabled?: boolean;
}

export const useKeyboardShortcuts = ({
    onNext,
    onPrev,
    onApprove,
    onReject,
    onRunAI,
    disabled = false
}: KeyboardShortcutsConfig) => {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // Don't trigger if user is typing in an input element
        if (
            event.target instanceof HTMLInputElement ||
            event.target instanceof HTMLTextAreaElement ||
            event.target instanceof HTMLSelectElement
        ) {
            return;
        }

        if (disabled) return;

        switch (event.key) {
            case 'ArrowRight':
            case 'j':
                event.preventDefault();
                onNext?.();
                break;
            case 'ArrowLeft':
            case 'k':
                event.preventDefault();
                onPrev?.();
                break;
            case 'a':
            case 'A':
                // Approve (mark as completed)
                if (!event.ctrlKey && !event.metaKey) {
                    event.preventDefault();
                    onApprove?.();
                }
                break;
            case 'r':
            case 'R':
                // Reject (mark as pending)
                if (!event.ctrlKey && !event.metaKey) {
                    event.preventDefault();
                    onReject?.();
                }
                break;
            case 'Enter':
                // Run AI analysis
                if (event.ctrlKey || event.metaKey) {
                    event.preventDefault();
                    onRunAI?.();
                }
                break;
        }
    }, [onNext, onPrev, onApprove, onReject, onRunAI, disabled]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);
};

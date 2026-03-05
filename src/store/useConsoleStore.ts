import { create } from 'zustand';

export type LogType = 'info' | 'warn' | 'error' | 'request' | 'response';

export interface ConsoleLog {
    id: string;
    type: LogType;
    message: string;
    timestamp: number;
    data?: any;
}

interface ConsoleState {
    logs: ConsoleLog[];
    isOpen: boolean;

    // Actions
    toggle: () => void;
    setOpen: (open: boolean) => void;
    addLog: (message: string, type?: LogType, data?: any) => void;
    clearLogs: () => void;
}

export const useConsoleStore = create<ConsoleState>((set) => ({
    logs: [],
    isOpen: false,

    toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    setOpen: (open) => set({ isOpen: open }),

    addLog: (message, type = 'info', data) => {
        const newLog: ConsoleLog = {
            id: Math.random().toString(36).substring(7),
            type,
            message,
            timestamp: Date.now(),
            data,
        };
        set((state) => ({
            logs: [...state.logs, newLog].slice(-1000), // Keep last 1000 logs
        }));
    },

    clearLogs: () => set({ logs: [] }),
}));

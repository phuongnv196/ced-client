import React from 'react';
import { Terminal } from 'lucide-react';
import { useConsoleStore } from '../../store/useConsoleStore';
import clsx from 'clsx';
import './StatusBar.css';

export const StatusBar: React.FC = () => {
    const { toggle, isOpen, logs } = useConsoleStore();

    return (
        <div className="h-8 border-t border-slate-200 flex items-center justify-between px-4 text-xs text-slate-500 status-bar-container bg-white select-none">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggle}
                    className={clsx(
                        "flex items-center gap-2 px-2 h-full hover:bg-slate-100 transition-colors",
                        isOpen ? "bg-slate-100 text-emerald-600 font-medium" : ""
                    )}
                >
                    <Terminal className={clsx("w-3.5 h-3.5", isOpen ? "text-emerald-500" : "text-slate-400")} />
                    <span>Console</span>
                    {logs.length > 0 && (
                        <span className="bg-slate-200 text-slate-600 px-1 rounded-sm text-[10px]">
                            {logs.length}
                        </span>
                    )}
                </button>
            </div>
            <div className="flex items-center gap-3">
                <span className="hover:text-slate-800 cursor-pointer transition-colors">Cookies</span>
                <span className="text-slate-300">•</span>
                <span className="hover:text-slate-800 cursor-pointer transition-colors">Runner</span>
                <span className="text-slate-300">•</span>
                <span className="hover:text-slate-800 cursor-pointer transition-colors">Vault</span>
            </div>
        </div>
    );
};

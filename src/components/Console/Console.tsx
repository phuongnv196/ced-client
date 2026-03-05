import React, { useEffect, useRef } from 'react';
import {
    Terminal,
    X,
    Trash2,
    Activity,
    AlertCircle,
    Info,
    ArrowBigRight,
    ArrowBigLeft
} from 'lucide-react';
import { useConsoleStore, type LogType } from '../../store/useConsoleStore';
import clsx from 'clsx';
import './Console.css';

const LogIcon = ({ type }: { type: LogType }) => {
    switch (type) {
        case 'error': return <AlertCircle className="w-3.5 h-3.5 text-rose-500" />;
        case 'warn': return <AlertCircle className="w-3.5 h-3.5 text-amber-500" />;
        case 'request': return <ArrowBigRight className="w-3.5 h-3.5 text-blue-500" />;
        case 'response': return <ArrowBigLeft className="w-3.5 h-3.5 text-emerald-500" />;
        default: return <Info className="w-3.5 h-3.5 text-indigo-400" />;
    }
};

export const Console: React.FC = () => {
    const { logs, isOpen, setOpen, clearLogs } = useConsoleStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new logs
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="absolute bottom-8 left-0 right-0 h-64 bg-slate-900/95 backdrop-blur-md border-t border-slate-700/50 flex flex-col z-50 animate-in slide-in-from-bottom duration-200">
            {/* Console Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50 bg-slate-800/50">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">Console</span>
                    <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full font-mono">
                        {logs.length}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={clearLogs}
                        className="hover:bg-slate-700 p-1 rounded-md transition-colors group"
                        title="Clear Console"
                    >
                        <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-rose-400" />
                    </button>
                    <button
                        onClick={() => setOpen(false)}
                        className="hover:bg-slate-700 p-1 rounded-md transition-colors group"
                    >
                        <X className="w-4 h-4 text-slate-400 group-hover:text-white" />
                    </button>
                </div>
            </div>

            {/* Console Content */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto font-mono text-xs p-2 custom-scrollbar selection:bg-emerald-500/30"
            >
                {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 select-none">
                        <Activity className="w-8 h-8 mb-2" />
                        <p className="text-slate-400 italic">Console is empty...</p>
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {logs.map((log) => (
                            <div
                                key={log.id}
                                className={clsx(
                                    "group flex items-start gap-3 py-1 px-2 rounded hover:bg-slate-800/50 transition-colors border-l-2",
                                    log.type === 'error' ? 'border-rose-500/50 bg-rose-500/5' :
                                        log.type === 'warn' ? 'border-amber-500/50 bg-amber-500/5' :
                                            log.type === 'request' ? 'border-blue-500/50' :
                                                log.type === 'response' ? 'border-emerald-500/50' :
                                                    'border-transparent'
                                )}
                            >
                                <span className="text-[10px] text-slate-500 shrink-0 mt-0.5 font-numeric">
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>

                                <span className="shrink-0 mt-0.5">
                                    <LogIcon type={log.type} />
                                </span>

                                <div className="flex-1 overflow-x-auto min-w-0">
                                    <span className={clsx(
                                        "whitespace-pre-wrap break-all leading-relaxed",
                                        log.type === 'error' ? 'text-rose-300' :
                                            log.type === 'warn' ? 'text-amber-200' :
                                                log.type === 'request' ? 'text-blue-300' :
                                                    log.type === 'response' ? 'text-emerald-300' :
                                                        'text-slate-300'
                                    )}>
                                        {log.message}
                                    </span>

                                    {log.data && (
                                        <div className="mt-1 text-[11px] text-slate-500 bg-slate-950/50 p-2 rounded border border-slate-800/50 overflow-x-auto max-h-40">
                                            {typeof log.data === 'object'
                                                ? JSON.stringify(log.data, null, 2)
                                                : String(log.data)
                                            }
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

import React from 'react';
import { Search, ChevronDown, Plus } from 'lucide-react';
import { Button } from '../Button';
import { useRequestStore, type RequestTab } from '../../store/useRequestStore';
import clsx from 'clsx';
import './Sidebar.css';

const methodColors: Record<string, string> = {
    GET: 'text-green-600',
    POST: 'text-orange-500',
    PUT: 'text-blue-500',
    DELETE: 'text-red-500',
    PATCH: 'text-yellow-500',
};

export const Sidebar: React.FC = () => {
    const { collections, addTab, tabs, activeTabId, setActiveTab, history, clearHistory } = useRequestStore();
    const [activeView, setActiveView] = React.useState<'collections' | 'history'>('collections');

    const handleRequestClick = (request: Partial<RequestTab>) => {
        // Find if a tab is already open with this ID
        const existingTab = tabs.find(t => (t as any).originalId === request.id || t.id === request.id);

        if (existingTab) {
            setActiveTab(existingTab.id);
        } else {
            addTab({
                ...request,
                id: Math.random().toString(36).substring(7),
                name: request.name || 'New Request',
                originalId: request.id as any
            } as any);
        }
    };

    return (
        <div className="w-64 border-r border-slate-200 flex flex-col sidebar-container bg-slate-50 shrink-0">
            <div className="p-3 border-b border-slate-200 bg-white">
                <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-sm text-slate-700">My Workspace</span>
                    <div className="flex gap-1">
                        <Button variant="secondary" size="sm" className="h-7 w-7 p-0" title="New Request" onClick={() => addTab()}>
                            <Plus className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-md text-[11px] font-bold text-slate-500">
                    <button
                        onClick={() => setActiveView('collections')}
                        className={clsx(
                            "flex-1 py-1 rounded transition-all",
                            activeView === 'collections' ? "bg-white text-slate-800 shadow-sm" : "hover:text-slate-700"
                        )}
                    >
                        Collections
                    </button>
                    <button
                        onClick={() => setActiveView('history')}
                        className={clsx(
                            "flex-1 py-1 rounded transition-all",
                            activeView === 'history' ? "bg-white text-slate-800 shadow-sm" : "hover:text-slate-700"
                        )}
                    >
                        History
                    </button>
                </div>
            </div>
            <div className="p-2 flex-1 overflow-y-auto">
                <div className="relative mb-3">
                    <Search className="absolute left-2 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder={activeView === 'collections' ? "Search collections" : "Search history"}
                        className="w-full pl-7 pr-2 py-1.5 text-xs border border-slate-200 hover:border-slate-300 bg-white focus:border-blue-400 focus:outline-none rounded transition-colors"
                    />
                </div>

                {activeView === 'collections' ? (
                    collections.map(collection => (
                        <div key={collection.id} className="mb-4">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-2 flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                    <ChevronDown className="w-3 h-3" />
                                    <span>{collection.name}</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                {collection.requests.map(req => {
                                    const isActive = tabs.find(t => t.id === activeTabId && (t as any).originalId === req.id);
                                    return (
                                        <div
                                            key={req.id}
                                            onClick={() => handleRequestClick(req)}
                                            className={clsx(
                                                "py-1.5 px-3 rounded cursor-pointer flex items-center gap-2 text-[11px] transition-all",
                                                isActive ? "bg-white shadow-sm ring-1 ring-slate-200" : "hover:bg-slate-200"
                                            )}
                                        >
                                            <span className={clsx("font-bold w-10 text-[9px]", methodColors[req.method || 'GET'])}>
                                                {req.method}
                                            </span>
                                            <span className={clsx("truncate flex-1", isActive ? "text-slate-900 font-semibold" : "text-slate-600")}>
                                                {req.name}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center justify-between px-2 mb-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Recent Activity</span>
                            <button onClick={clearHistory} className="text-[10px] text-blue-500 hover:text-blue-600 font-medium">Clear All</button>
                        </div>
                        {history.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-xs">No history yet</div>
                        ) : (
                            history.map((item, idx) => (
                                <div
                                    key={`${item.id}-${idx}`}
                                    onClick={() => handleRequestClick(item)}
                                    className="py-2 px-3 hover:bg-slate-200 rounded cursor-pointer flex flex-col gap-1 text-[11px] group transition-all"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={clsx("font-bold w-10 text-[9px]", methodColors[item.method || 'GET'])}>
                                            {item.method}
                                        </span>
                                        <span className="truncate flex-1 text-slate-700 font-medium group-hover:text-slate-900">
                                            {item.name || item.url || 'Untitled'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pl-12 text-[9px] text-slate-400">
                                        <span className="truncate max-w-[150px]">{item.url}</span>
                                        {item.response && (
                                            <span className={clsx(
                                                item.response.status >= 200 && item.response.status < 300 ? "text-green-500" : "text-red-500"
                                            )}>
                                                {item.response.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

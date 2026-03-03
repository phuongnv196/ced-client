import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import clsx from 'clsx';
import './Tabs.css';

interface Tab {
    id: string;
    name: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    isDirty?: boolean;
}

const mockTabs: Tab[] = [
    { id: '1', name: 'Create session', method: 'POST', isDirty: true },
    { id: '2', name: 'Get users', method: 'GET' },
    { id: '3', name: 'Update profile', method: 'PUT' },
];

const methodColors: Record<string, string> = {
    GET: 'text-green-600',
    POST: 'text-orange-500',
    PUT: 'text-blue-500',
    DELETE: 'text-red-500',
    PATCH: 'text-yellow-500',
};

export const Tabs: React.FC = () => {
    const [tabs, setTabs] = useState<Tab[]>(mockTabs);
    const [activeTabId, setActiveTabId] = useState<string>('1');

    const handleCloseTab = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const newTabs = tabs.filter(t => t.id !== id);
        setTabs(newTabs);
        if (activeTabId === id && newTabs.length > 0) {
            setActiveTabId(newTabs[newTabs.length - 1].id);
        }
    };

    return (
        <div className="flex border-b border-slate-200 bg-white items-center p-1 px-2 h-10 w-full overflow-hidden">
            <div className="flex items-center overflow-x-auto overflow-y-hidden no-scrollbar flex-1">
                <div className="flex items-center gap-1 border-r border-slate-200 pr-2 h-full">
                    {tabs.map((tab) => {
                        const isActive = tab.id === activeTabId;
                        return (
                            <div
                                key={tab.id}
                                onClick={() => setActiveTabId(tab.id)}
                                className={clsx(
                                    'group flex items-center gap-2 px-3 py-1.5 rounded text-sm cursor-pointer select-none border-t-2 transition-colors min-w-max',
                                    isActive
                                        ? 'bg-slate-100 border-t-orange-500'
                                        : 'bg-transparent border-t-transparent hover:bg-slate-50'
                                )}
                            >
                                <span className={clsx('text-[11px] font-bold', methodColors[tab.method])}>
                                    {tab.method}
                                </span>
                                <span className={clsx('text-slate-700', isActive && 'font-medium')}>
                                    {tab.name}
                                </span>

                                {tab.isDirty && !isActive && (
                                    <span className="w-2 h-2 rounded-full bg-orange-400 ml-1"></span>
                                )}

                                <button
                                    onClick={(e) => handleCloseTab(e, tab.id)}
                                    className={clsx(
                                        'ml-1 p-0.5 rounded-sm hover:bg-slate-300 text-slate-400 hover:text-slate-700',
                                        isActive || tab.isDirty ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                    )}
                                >
                                    {tab.isDirty && isActive ? (
                                        <span className="w-2 h-2 rounded-full bg-orange-400 m-1 block"></span>
                                    ) : (
                                        <X className="w-3.5 h-3.5" />
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
                <button className="ml-2 p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors flex-shrink-0">
                    <Plus className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

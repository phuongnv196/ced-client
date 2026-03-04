import React, { useState } from 'react';
import { Search, ChevronDown, Plus, Trash2 } from 'lucide-react';
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
    const {
        collections, addTab, tabs, activeTabId, setActiveTab,
        history, clearHistory, variables, setVariable, deleteVariable
    } = useRequestStore();

    const [activeView, setActiveView] = useState<'collections' | 'history' | 'variables'>('collections');
    const [search, setSearch] = useState('');

    // Editing state for variables
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');

    const handleRequestClick = (request: Partial<RequestTab>) => {
        const existingTab = tabs.find(t => (t as any).originalId === request.id || t.id === request.id);
        if (existingTab) {
            setActiveTab(existingTab.id);
        } else {
            addTab({
                ...request,
                id: Math.random().toString(36).substring(7),
                name: request.name || 'New Request',
                originalId: request.id as any,
            } as any);
        }
    };

    const handleAddVariable = () => {
        if (!newKey.trim()) return;
        setVariable(newKey.trim(), newValue);
        setNewKey('');
        setNewValue('');
    };

    const varEntries = Object.entries(variables);
    const filteredVars = search
        ? varEntries.filter(([k]) => k.toLowerCase().includes(search.toLowerCase()))
        : varEntries;

    const filteredCollections = collections.map(c => ({
        ...c,
        requests: c.requests.filter(r =>
            !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.url?.toLowerCase().includes(search.toLowerCase())
        )
    })).filter(c => c.requests.length > 0 || !search);

    const filteredHistory = history.filter(h =>
        !search || (h.name || '').toLowerCase().includes(search.toLowerCase()) || (h.url || '').toLowerCase().includes(search.toLowerCase())
    );

    const views = [
        { id: 'collections', label: 'Collections' },
        { id: 'history', label: 'History' },
        { id: 'variables', label: 'Variables' },
    ] as const;

    return (
        <div className="w-64 border-r border-slate-200 flex flex-col sidebar-container bg-slate-50 shrink-0">
            {/* Header */}
            <div className="p-3 border-b border-slate-200 bg-white">
                <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-sm text-slate-700">My Workspace</span>
                    <Button variant="secondary" size="sm" className="h-7 w-7 p-0" title="New Request" onClick={() => addTab()}>
                        <Plus className="w-3.5 h-3.5" />
                    </Button>
                </div>
                {/* 3-way toggle */}
                <div className="flex bg-slate-100 p-1 rounded-md text-[11px] font-bold text-slate-500">
                    {views.map(v => (
                        <button
                            key={v.id}
                            onClick={() => setActiveView(v.id)}
                            className={clsx(
                                'flex-1 py-1 rounded transition-all',
                                activeView === v.id ? 'bg-white text-slate-800 shadow-sm' : 'hover:text-slate-700'
                            )}
                        >
                            {v.label}
                            {v.id === 'variables' && varEntries.length > 0 && (
                                <span className="ml-0.5 text-orange-500">({varEntries.length})</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Body */}
            <div className="p-2 flex-1 overflow-y-auto flex flex-col gap-2">
                {/* Search (hidden for variables as they have inline editing) */}
                {activeView !== 'variables' && (
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={activeView === 'collections' ? 'Search collections' : 'Search history'}
                            className="w-full pl-7 pr-2 py-1.5 text-xs border border-slate-200 hover:border-slate-300 bg-white focus:border-blue-400 focus:outline-none rounded transition-colors"
                        />
                    </div>
                )}

                {/* === Collections === */}
                {activeView === 'collections' && (
                    filteredCollections.map(collection => (
                        <div key={collection.id} className="mb-2">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-2 flex items-center gap-1">
                                <ChevronDown className="w-3 h-3" />
                                {collection.name}
                            </div>
                            <div className="flex flex-col gap-0.5">
                                {collection.requests.map(req => {
                                    const isActive = tabs.find(t => t.id === activeTabId && (t as any).originalId === req.id);
                                    return (
                                        <div
                                            key={req.id}
                                            onClick={() => handleRequestClick(req)}
                                            className={clsx(
                                                'py-1.5 px-3 rounded cursor-pointer flex items-center gap-2 text-[11px] transition-all',
                                                isActive ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'hover:bg-slate-200'
                                            )}
                                        >
                                            <span className={clsx('font-bold w-10 text-[9px]', methodColors[req.method || 'GET'])}>
                                                {req.method}
                                            </span>
                                            <span className={clsx('truncate flex-1', isActive ? 'text-slate-900 font-semibold' : 'text-slate-600')}>
                                                {req.name}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}

                {/* === History === */}
                {activeView === 'history' && (
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center justify-between px-2 mb-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Recent Activity</span>
                            <button onClick={clearHistory} className="text-[10px] text-blue-500 hover:text-blue-600 font-medium">Clear All</button>
                        </div>
                        {filteredHistory.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-xs">No history yet</div>
                        ) : (
                            filteredHistory.map((item, idx) => (
                                <div
                                    key={`${item.id}-${idx}`}
                                    onClick={() => handleRequestClick(item)}
                                    className="py-2 px-3 hover:bg-slate-200 rounded cursor-pointer flex flex-col gap-1 text-[11px] group transition-all"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={clsx('font-bold w-10 text-[9px]', methodColors[item.method || 'GET'])}>
                                            {item.method}
                                        </span>
                                        <span className="truncate flex-1 text-slate-700 font-medium group-hover:text-slate-900">
                                            {item.name || item.url || 'Untitled'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pl-12 text-[9px] text-slate-400">
                                        <span className="truncate max-w-[120px]">{item.url}</span>
                                        {item.response && (
                                            <span className={clsx(item.response.status >= 200 && item.response.status < 300 ? 'text-green-500' : 'text-red-500')}>
                                                {item.response.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* === Variables === */}
                {activeView === 'variables' && (
                    <div className="flex flex-col gap-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                            Environment Variables
                        </div>
                        <p className="text-[11px] text-slate-400 px-1 leading-relaxed">
                            Use <code className="bg-slate-200 px-1 rounded text-slate-600">{'{{variableName}}'}</code> in URLs, headers, params, and body.
                        </p>

                        {/* Variable list */}
                        <div className="flex flex-col gap-1">
                            {filteredVars.map(([key, value]) => (
                                <div key={key} className="flex flex-col gap-0.5 bg-white border border-slate-200 rounded p-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-semibold text-orange-600 font-mono">{`{{${key}}}`}</span>
                                        <button
                                            onClick={() => deleteVariable(key)}
                                            className="text-slate-300 hover:text-red-400 transition-colors p-0.5 rounded"
                                            title="Delete variable"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                    {editingKey === key ? (
                                        <input
                                            autoFocus
                                            value={value}
                                            onChange={e => setVariable(key, e.target.value)}
                                            onBlur={() => setEditingKey(null)}
                                            onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingKey(null); }}
                                            className="text-[11px] w-full border border-orange-300 rounded px-1.5 py-1 outline-none focus:ring-1 focus:ring-orange-400 font-mono"
                                        />
                                    ) : (
                                        <div
                                            onClick={() => setEditingKey(key)}
                                            className="text-[11px] text-slate-600 font-mono truncate px-1 py-1 rounded hover:bg-slate-50 cursor-text"
                                            title={value}
                                        >
                                            {value || <span className="text-slate-300 italic">empty</span>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Add new variable */}
                        <div className="border border-dashed border-slate-300 rounded p-2 flex flex-col gap-1.5 bg-white">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Add Variable</div>
                            <input
                                type="text"
                                value={newKey}
                                onChange={e => setNewKey(e.target.value)}
                                placeholder="Variable name"
                                className="text-[11px] border border-slate-200 rounded px-2 py-1 outline-none focus:border-orange-400 font-mono focus:ring-1 focus:ring-orange-300"
                                onKeyDown={e => { if (e.key === 'Enter') handleAddVariable(); }}
                            />
                            <input
                                type="text"
                                value={newValue}
                                onChange={e => setNewValue(e.target.value)}
                                placeholder="Value"
                                className="text-[11px] border border-slate-200 rounded px-2 py-1 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-300"
                                onKeyDown={e => { if (e.key === 'Enter') handleAddVariable(); }}
                            />
                            <button
                                onClick={handleAddVariable}
                                disabled={!newKey.trim()}
                                className="text-[11px] bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded py-1 font-medium transition-colors"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

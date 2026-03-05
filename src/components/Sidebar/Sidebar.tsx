import React, { useState, useRef } from 'react';
import {
    Search,
    ChevronDown,
    ChevronRight,
    Plus,
    Trash2,
    FolderPlus,
    Download,
    Upload,
    Settings,
    Edit
} from 'lucide-react';
import { Button } from '../Button';
import { useRequestStore, type RequestTab, type RequestCollection } from '../../store/useRequestStore';
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
        history, clearHistory, variables, setVariable, deleteVariable,
        addCollection, removeCollection, updateCollection,
        setCollectionVariable, deleteCollectionVariable, setCollections,
        renameCollectionRequest
    } = useRequestStore();

    const [activeView, setActiveView] = useState<'collections' | 'history' | 'variables'>('collections');
    const [search, setSearch] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [newVar, setNewVar] = useState({ key: '', value: '', colId: '' });

    const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
    const [editRequestName, setEditRequestName] = useState('');

    const handleRequestClick = (request: Partial<RequestTab>, collectionId?: string) => {
        const existingTab = tabs.find(t => t.originalId === request.id || t.id === request.id);
        if (existingTab) {
            setActiveTab(existingTab.id);
        } else {
            addTab({
                ...request,
                id: Math.random().toString(36).substring(7),
                name: request.name || 'New Request',
                originalId: request.id as any,
                collectionId: collectionId
            });
        }
    };

    const handleAddCollection = () => {
        const name = prompt('Enter collection name:');
        if (name) addCollection(name);
    };

    const handleExportCollection = (col: RequestCollection) => {
        const data = JSON.stringify(col, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${col.name.replace(/\s+/g, '_').toLowerCase()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImportCollection = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const col = JSON.parse(evt.target?.result as string);
                if (col.name && Array.isArray(col.requests)) {
                    col.id = Math.random().toString(36).substring(7);
                    setCollections([...collections, col]);
                }
            } catch (err) {
                alert('Invalid collection file');
            }
        };
        reader.readAsText(file);
    };

    const toggleCollection = (id: string, isOpen: boolean) => {
        updateCollection(id, { isOpen: !isOpen });
    };

    const filteredCollections = collections.map(c => ({
        ...c,
        requests: c.requests.filter(r =>
            !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.url?.toLowerCase().includes(search.toLowerCase())
        )
    })).filter(c =>
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.requests.length > 0
    );

    const filteredHistory = history.filter(h =>
        !search || (h.name || '').toLowerCase().includes(search.toLowerCase()) || (h.url || '').toLowerCase().includes(search.toLowerCase())
    );

    const views = [
        { id: 'collections', label: 'Collections' },
        { id: 'history', label: 'History' },
        { id: 'variables', label: 'Variables' },
    ] as const;

    return (
        <div className="w-64 border-r border-slate-200 flex flex-col sidebar-container bg-slate-50 shrink-0 select-none">
            <div className="p-3 border-b border-slate-200 bg-white shadow-sm z-10">
                <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-xs text-slate-500 uppercase tracking-widest">My Workspace</span>
                    <div className="flex gap-1">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 w-7 p-0 bg-transparent border-none hover:bg-slate-100"
                            title="Import Collection"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-3.5 h-3.5 text-slate-500" />
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 w-7 p-0 bg-transparent border-none hover:bg-slate-100"
                            title="New Collection"
                            onClick={handleAddCollection}
                        >
                            <FolderPlus className="w-3.5 h-3.5 text-slate-500" />
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            className="h-7 w-7 p-0 bg-orange-500 hover:bg-orange-600 rounded-md"
                            title="New Request"
                            onClick={() => addTab()}
                        >
                            <Plus className="w-3.5 h-3.5 text-white" />
                        </Button>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImportCollection} />
                </div>

                <div className="flex bg-slate-100 p-1 rounded-lg text-[11px] font-bold text-slate-500">
                    {views.map(v => (
                        <button
                            key={v.id}
                            onClick={() => setActiveView(v.id)}
                            className={clsx(
                                'flex-1 py-1.5 rounded-md transition-all',
                                activeView === v.id ? 'bg-white text-slate-800 shadow-sm' : 'hover:text-slate-700'
                            )}
                        >
                            {v.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-2 flex-1 overflow-y-auto flex flex-col gap-2 custom-scrollbar">
                {activeView !== 'variables' && (
                    <div className="relative mb-2">
                        <Search className="absolute left-2 top-2.5 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={activeView === 'collections' ? 'Search collections...' : 'Search history...'}
                            className="w-full pl-8 pr-2 py-2 text-xs border-none bg-white shadow-sm focus:ring-1 focus:ring-orange-400 rounded-lg outline-none transition-all"
                        />
                    </div>
                )}

                {activeView === 'collections' && (
                    <div className="flex flex-col gap-1">
                        {filteredCollections.length === 0 ? (
                            <div className="text-center py-10 opacity-30 flex flex-col items-center">
                                <Search className="w-8 h-8 mb-2" />
                                <span className="text-xs italic">No collections found</span>
                            </div>
                        ) : (
                            filteredCollections.map(collection => (
                                <div key={collection.id} className="group/col">
                                    <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-200 cursor-pointer">
                                        <div
                                            className="flex items-center gap-1.5 flex-1 min-w-0"
                                            onClick={() => toggleCollection(collection.id, !!collection.isOpen)}
                                        >
                                            {collection.isOpen ? (
                                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                                            ) : (
                                                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                            )}
                                            <span className="text-xs font-bold text-slate-600 truncate uppercase tracking-tight">
                                                {collection.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover/col:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleExportCollection(collection)}
                                                className="p-1 hover:text-blue-500"
                                                title="Export"
                                            >
                                                <Download className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => removeCollection(collection.id)}
                                                className="p-1 hover:text-red-500"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>

                                    {collection.isOpen && (
                                        <div className="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-slate-200 pl-1 animation-slide-down">
                                            {collection.requests.map(req => {
                                                const isActive = tabs.find(t => t.id === activeTabId && (t as any).originalId === req.id);
                                                const isEditing = editingRequestId === req.id;

                                                return (
                                                    <div
                                                        key={req.id}
                                                        className={clsx(
                                                            'py-1.5 px-2.5 rounded-md cursor-pointer flex items-center gap-2 text-[11px] transition-all group/req',
                                                            isActive ? 'bg-white shadow-sm border border-slate-100' : 'hover:bg-slate-200 text-slate-600'
                                                        )}
                                                        onClick={() => { if (!isEditing) handleRequestClick(req, collection.id); }}
                                                    >
                                                        <span className={clsx('font-black w-8 text-[8px]', methodColors[req.method || 'GET'])}>
                                                            {req.method}
                                                        </span>

                                                        {isEditing ? (
                                                            <input
                                                                autoFocus
                                                                value={editRequestName}
                                                                onChange={e => setEditRequestName(e.target.value)}
                                                                onBlur={() => {
                                                                    if (editRequestName.trim() && editRequestName !== req.name) {
                                                                        renameCollectionRequest(collection.id, req.id!, editRequestName.trim());
                                                                    }
                                                                    setEditingRequestId(null);
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') e.currentTarget.blur();
                                                                    if (e.key === 'Escape') setEditingRequestId(null);
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="flex-1 text-[11px] font-bold text-slate-900 bg-white border border-blue-400 rounded px-1 min-w-0 outline-none h-4"
                                                            />
                                                        ) : (
                                                            <span className={clsx('truncate flex-1', isActive ? 'text-slate-900 font-bold' : '')}>
                                                                {req.name}
                                                            </span>
                                                        )}

                                                        {!isEditing && (
                                                            <div className="flex items-center gap-1 opacity-0 group-hover/req:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingRequestId(req.id!);
                                                                        setEditRequestName(req.name || '');
                                                                    }}
                                                                    className="p-1 hover:text-blue-500"
                                                                    title="Rename"
                                                                >
                                                                    <Edit className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {collection.requests.length === 0 && (
                                                <div className="py-2 px-3 text-[10px] text-slate-400 italic">No requests</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeView === 'history' && (
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center justify-between px-2 mb-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Recent Activity</span>
                            <button onClick={clearHistory} className="text-[10px] text-blue-500 hover:text-red-500 font-bold uppercase">Clear All</button>
                        </div>
                        {filteredHistory.length === 0 ? (
                            <div className="text-center py-10 opacity-30 text-xs italic">No history yet</div>
                        ) : (
                            filteredHistory.map((item, idx) => (
                                <div
                                    key={`${item.id}-${idx}`}
                                    onClick={() => handleRequestClick(item)}
                                    className="py-2.5 px-3 hover:bg-slate-200 rounded-lg cursor-pointer flex flex-col gap-1 text-[11px] group bg-white shadow-sm mb-1 transition-all hover:-translate-y-0.5"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={clsx('font-black w-8 text-[8px]', methodColors[item.method || 'GET'])}>
                                            {item.method}
                                        </span>
                                        <span className="truncate flex-1 text-slate-700 font-bold group-hover:text-slate-900">
                                            {item.name || item.url || 'Untitled'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pl-10 text-[9px] text-slate-400">
                                        <span className="truncate max-w-[120px] font-mono">{item.url}</span>
                                        {item.response && (
                                            <span className={clsx('font-bold', item.response.status >= 200 && item.response.status < 300 ? 'text-green-500' : 'text-red-400')}>
                                                {item.response.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeView === 'variables' && (
                    <div className="flex flex-col gap-4">
                        <section className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Environment</span>
                                <Settings className="w-3 h-3 text-slate-300" />
                            </div>

                            <div className="flex flex-col gap-2">
                                {Object.entries(variables).map(([key, value]) => (
                                    <div key={key} className="flex flex-col gap-1 border-b border-slate-50 pb-2 last:border-none">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-mono font-bold text-orange-500/80">{`{{${key}}}`}</span>
                                            <button onClick={() => deleteVariable(key)} className="text-slate-300 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                        <input
                                            className="text-[10px] w-full bg-slate-50 border-none rounded px-2 py-1 outline-none focus:bg-orange-50 font-mono transition-colors"
                                            value={value}
                                            onChange={(e) => setVariable(key, e.target.value)}
                                        />
                                    </div>
                                ))}
                                <div className="mt-2 flex gap-1">
                                    <input
                                        className="flex-1 text-[10px] bg-slate-50 border border-dashed rounded px-2 py-1.5 outline-none font-mono"
                                        placeholder="New Key..."
                                        value={newVar.key}
                                        onChange={e => setNewVar({ ...newVar, key: e.target.value })}
                                    />
                                    <button
                                        onClick={() => { if (newVar.key) { setVariable(newVar.key, ''); setNewVar({ key: '', value: '', colId: '' }); } }}
                                        className="bg-orange-500 text-white p-1.5 rounded-lg shadow-sm active:scale-95 transition-all"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </section>

                        {collections.map(col => (
                            <section key={col.id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest truncate max-w-[150px]">
                                        {col.name} Variables
                                    </span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    {Object.entries(col.variables || {}).map(([key, value]) => (
                                        <div key={key} className="flex flex-col gap-1 border-b border-slate-50 pb-2 last:border-none">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-mono font-bold text-blue-400">{`{{${key}}}`}</span>
                                                <button onClick={() => deleteCollectionVariable(col.id, key)} className="text-slate-300 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                                            </div>
                                            <input
                                                className="text-[10px] w-full bg-blue-50/30 border-none rounded px-2 py-1 outline-none focus:bg-blue-50 font-mono transition-colors"
                                                value={value}
                                                onChange={(e) => setCollectionVariable(col.id, key, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => {
                                            const k = prompt('Variable Key:');
                                            if (k) setCollectionVariable(col.id, k, '');
                                        }}
                                        className="text-[10px] text-blue-500 font-bold border border-dashed border-blue-200 rounded p-1.5 hover:bg-blue-50 transition-colors"
                                    >
                                        + Add Collection Variable
                                    </button>
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

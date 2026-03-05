import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X, Copy, XCircle, Edit, ChevronDown, Search, History } from 'lucide-react';
import clsx from 'clsx';
import { useRequestStore } from '../../store/useRequestStore';
import './Tabs.css';

const methodColors: Record<string, string> = {
    GET: 'text-green-600',
    POST: 'text-orange-500',
    PUT: 'text-blue-500',
    DELETE: 'text-red-500',
    PATCH: 'text-yellow-500',
};

interface ContextMenuState {
    visible: boolean;
    x: number;
    y: number;
    tabId: string | null;
}

export const Tabs: React.FC = () => {
    const {
        tabs, activeTabId, setActiveTab, addTab, removeTab, duplicateTab, renameRequest,
        recentlyClosedTabs, restoreTab, clearRecentlyClosed
    } = useRequestStore();

    const [contextMenu, setContextMenu] = useState<ContextMenuState>({
        visible: false, x: 0, y: 0, tabId: null,
    });
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isHistoryOpen, setIsHistoryOpen] = useState(true);

    const [editingTabId, setEditingTabId] = useState<string | null>(null);
    const [editTabName, setEditTabName] = useState('');

    const commitTabRename = () => {
        if (editingTabId && editTabName.trim()) {
            renameRequest(editingTabId, editTabName.trim());
        }
        setEditingTabId(null);
    };

    const menuRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const closeMenu = useCallback(() => {
        setContextMenu(m => ({ ...m, visible: false, tabId: null }));
    }, []);

    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                setIsDropdownOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeys);
        return () => window.removeEventListener('keydown', handleKeys);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            setTimeout(() => searchInputRef.current?.focus(), 100);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isDropdownOpen]);

    useEffect(() => {
        if (!contextMenu.visible) return;
        const handleClick = () => closeMenu();
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenu(); };
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleKey);
        };
    }, [contextMenu.visible, closeMenu]);

    const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ visible: true, x: e.clientX, y: e.clientY, tabId });
    };

    const handleCloseTab = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        removeTab(id);
    };

    const handleRename = () => {
        if (!contextMenu.tabId) return;
        const tab = tabs.find(t => t.id === contextMenu.tabId);
        if (!tab) return;
        setEditingTabId(tab.id);
        setEditTabName(tab.name);
        closeMenu();
    };

    const handleDuplicate = () => {
        if (contextMenu.tabId) duplicateTab(contextMenu.tabId);
        closeMenu();
    };

    const handleClose = () => {
        if (contextMenu.tabId) removeTab(contextMenu.tabId);
        closeMenu();
    };

    const handleCloseOthers = () => {
        if (!contextMenu.tabId) return;
        const otherTabs = tabs.filter(t => t.id !== contextMenu.tabId);
        otherTabs.forEach(t => removeTab(t.id));
        setActiveTab(contextMenu.tabId);
        closeMenu();
    };

    const filteredTabs = tabs.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.url || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="relative">
            <div className="flex border-b border-slate-200 bg-white items-center p-1 px-2 h-10 w-full overflow-hidden">
                <div className="flex items-center overflow-x-auto overflow-y-hidden no-scrollbar flex-1 h-full pr-12">
                    <div className="flex items-center gap-1 border-r border-slate-200 pr-2 h-full">
                        {tabs.map((tab) => {
                            const isActive = tab.id === activeTabId;
                            const isEditing = editingTabId === tab.id;

                            return (
                                <div
                                    key={tab.id}
                                    onClick={() => { if (!isEditing) setActiveTab(tab.id); }}
                                    onDoubleClick={() => {
                                        setEditingTabId(tab.id);
                                        setEditTabName(tab.name);
                                    }}
                                    onContextMenu={(e) => { if (!isEditing) handleContextMenu(e, tab.id); }}
                                    title={tab.url || tab.name}
                                    className={clsx(
                                        'group flex items-center gap-2 px-3 py-1.5 rounded text-sm cursor-pointer select-none border-t-2 transition-colors min-w-max h-[30px]',
                                        isActive
                                            ? 'bg-slate-100 border-t-orange-500'
                                            : 'bg-transparent border-t-transparent hover:bg-slate-50'
                                    )}
                                >
                                    <span className={clsx('text-[10px] font-extrabold w-6', methodColors[tab.method])}>
                                        {tab.method}
                                    </span>

                                    {isEditing ? (
                                        <input
                                            autoFocus
                                            value={editTabName}
                                            onChange={(e) => setEditTabName(e.target.value)}
                                            onBlur={commitTabRename}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') commitTabRename();
                                                if (e.key === 'Escape') setEditingTabId(null);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-slate-900 bg-white border border-blue-400 rounded px-1 outline-none w-[120px] text-xs h-5 font-medium"
                                        />
                                    ) : (
                                        <span className={clsx('text-slate-700 max-w-[150px] truncate leading-tight', isActive && 'font-medium')}>
                                            {tab.name}
                                        </span>
                                    )}

                                    {tab.isDirty && !isActive && (
                                        <span className="w-2 h-2 rounded-full bg-orange-400 ml-1 flex-shrink-0"></span>
                                    )}

                                    <button
                                        onClick={(e) => handleCloseTab(e, tab.id)}
                                        className={clsx(
                                            'ml-1 p-0.5 rounded-sm hover:bg-slate-300 text-slate-400 hover:text-slate-700 flex-shrink-0',
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
                    <button
                        onClick={() => addTab()}
                        className="ml-2 p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-colors flex-shrink-0"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Dropdown Toggle Button */}
                <div className="absolute right-0 top-0 bottom-0 flex items-center bg-white pl-2 pr-2 z-20 shadow-[-10px_0_15px_-5px_rgba(255,255,255,0.9)]">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={clsx(
                            "p-1 rounded hover:bg-slate-100 transition-colors bg-white",
                            isDropdownOpen ? "text-orange-500" : "text-slate-500"
                        )}
                    >
                        <ChevronDown className={clsx("w-4 h-4 transition-transform duration-200", isDropdownOpen && "rotate-180")} />
                    </button>
                </div>
            </div>

            {/* Tabs Dropdown Menu */}
            {isDropdownOpen && (
                <div
                    ref={dropdownRef}
                    className="absolute right-2 top-11 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-[1000] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                >
                    <div className="p-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                        <Search className="w-4 h-4 text-slate-400" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search tabs"
                            className="bg-transparent border-none outline-none text-sm w-full font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm">Ctrl+Shift+A</span>
                    </div>

                    <div className="flex-1 max-h-[400px] overflow-y-auto no-scrollbar p-1">
                        <div className="py-2">
                            {filteredTabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => { setActiveTab(tab.id); setIsDropdownOpen(false); }}
                                    className={clsx(
                                        "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left transition-all group",
                                        tab.id === activeTabId ? "bg-orange-50/50" : "hover:bg-slate-50"
                                    )}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className={clsx("text-[10px] font-black w-8 bg-white px-1 rounded shadow-sm", methodColors[tab.method])}>{tab.method}</span>
                                        <span className={clsx("truncate text-sm font-medium", tab.id === activeTabId ? "text-slate-900" : "text-slate-600")}>{tab.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {tab.isDirty && <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />}
                                        <X
                                            className="w-3.5 h-3.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => { e.stopPropagation(); removeTab(tab.id); }}
                                        />
                                    </div>
                                </button>
                            ))}
                            {filteredTabs.length === 0 && (
                                <div className="text-center py-8 text-slate-400 italic text-sm">No match found</div>
                            )}
                        </div>

                        {/* Recently Closed Section */}
                        {recentlyClosedTabs.length > 0 && (
                            <div className="border-t border-slate-100 mt-1">
                                <button
                                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                                    className="w-full flex items-center justify-between px-3 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <History className="w-3.5 h-3.5" />
                                        Recently Closed
                                    </div>
                                    <ChevronDown className={clsx("w-3.5 h-3.5 transition-transform", !isHistoryOpen && "-rotate-90")} />
                                </button>

                                {isHistoryOpen && (
                                    <div className="pb-2 animate-in slide-in-from-top-1 duration-200">
                                        {recentlyClosedTabs.map((tab, idx) => (
                                            <button
                                                key={`closed-${tab.id}-${idx}`}
                                                onClick={() => { restoreTab(tab); setIsDropdownOpen(false); }}
                                                className="w-full flex items-center gap-3 px-8 py-2 hover:bg-slate-50 text-left transition-colors opacity-60 hover:opacity-100"
                                            >
                                                <span className={clsx("text-[9px] font-bold w-7", methodColors[tab.method])}>{tab.method}</span>
                                                <span className="truncate text-[13px] text-slate-500 flex-1">{tab.name}</span>
                                            </button>
                                        ))}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); clearRecentlyClosed(); }}
                                            className="w-full text-center py-2 text-[10px] text-blue-500 font-bold hover:underline"
                                        >
                                            Clear history
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Context Menu */}
            {contextMenu.visible && (
                <div
                    ref={menuRef}
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{
                        position: 'fixed',
                        top: contextMenu.y,
                        left: contextMenu.x,
                        zIndex: 9999,
                    }}
                    className="bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[180px] text-sm overflow-hidden"
                >
                    <button
                        onClick={handleRename}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                        <Edit className="w-3.5 h-3.5 text-slate-400" />
                        Rename Request
                    </button>

                    <button
                        onClick={handleDuplicate}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                    >
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        Duplicate Tab
                    </button>

                    <div className="h-px bg-slate-100 my-1" />

                    <button
                        onClick={handleCloseOthers}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-40"
                        disabled={tabs.length <= 1}
                    >
                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                        Close Other Tabs
                    </button>

                    <button
                        onClick={handleClose}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                        Close Tab
                    </button>
                </div>
            )}
        </div>
    );
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X, Copy, XCircle } from 'lucide-react';
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
    const { tabs, activeTabId, setActiveTab, addTab, removeTab, duplicateTab } = useRequestStore();

    const [contextMenu, setContextMenu] = useState<ContextMenuState>({
        visible: false, x: 0, y: 0, tabId: null,
    });

    const menuRef = useRef<HTMLDivElement>(null);

    // Close on click outside or Escape
    const closeMenu = useCallback(() => {
        setContextMenu(m => ({ ...m, visible: false, tabId: null }));
    }, []);

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
        tabs.filter(t => t.id !== contextMenu.tabId).forEach(t => removeTab(t.id));
        setActiveTab(contextMenu.tabId);
        closeMenu();
    };

    return (
        <>
            <div className="flex border-b border-slate-200 bg-white items-center p-1 px-2 h-10 w-full overflow-hidden">
                <div className="flex items-center overflow-x-auto overflow-y-hidden no-scrollbar flex-1 h-full">
                    <div className="flex items-center gap-1 border-r border-slate-200 pr-2 h-full">
                        {tabs.map((tab) => {
                            const isActive = tab.id === activeTabId;
                            return (
                                <div
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    onContextMenu={(e) => handleContextMenu(e, tab.id)}
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
                                    <span className={clsx('text-slate-700 max-w-[150px] truncate leading-tight', isActive && 'font-medium')}>
                                        {tab.name}
                                    </span>

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
            </div>

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
        </>
    );
};

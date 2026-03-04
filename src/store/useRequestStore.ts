import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';
import type { ResponseData } from '../services/RequestEngine';

export interface DataGridRow {
    id: string;
    enabled: boolean;
    key: string;
    value: string;
    description: string;
    readonly?: boolean;
    type?: 'text' | 'file';
    fileValue?: File | null;
}

export interface RequestTab {
    id: string;
    name: string;
    method: string;
    url: string;
    params: DataGridRow[];
    headers: DataGridRow[];
    auth: {
        type: 'noauth' | 'apikey' | 'bearer' | 'basic';
        apiKey: { key: string; value: string; addTo: 'Header' | 'Query Params' };
        bearer: string;
        basic: { username: string; password: string };
    };
    body: {
        type: 'none' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary' | 'graphql';
        rawType: 'Text' | 'JavaScript' | 'JSON' | 'HTML' | 'XML';
        content: string;
        formData: DataGridRow[];
        urlencoded: DataGridRow[];
        binaryFile?: { name: string; size: number; type: string } | null;
    };
    scripts: {
        preRequest: string;
        postResponse: string;
    };
    response: ResponseData | null;
    isDirty: boolean;
    activeSubTab: string;
}

export interface RequestCollection {
    id: string;
    name: string;
    requests: Partial<RequestTab>[];
}

interface RequestState {
    tabs: RequestTab[];
    activeTabId: string | null;
    variables: Record<string, string>;
    collections: RequestCollection[];
    history: RequestTab[];

    // Actions
    addTab: (tab?: Partial<RequestTab>) => void;
    removeTab: (id: string) => void;
    setActiveTab: (id: string) => void;
    updateTab: (id: string, updates: Partial<RequestTab>) => void;
    updateActiveTab: (updates: Partial<RequestTab>) => void;
    setVariable: (key: string, value: string) => void;
    deleteVariable: (key: string) => void;
    setCollections: (collections: RequestCollection[]) => void;
    addToHistory: (tab: RequestTab) => void;
    clearHistory: () => void;
    duplicateTab: (id: string) => void;
}

const createDefaultTab = (): RequestTab => ({
    id: Math.random().toString(36).substring(7),
    name: 'New Request',
    method: 'GET',
    url: '{{baseUrl}}/models/session?query=1',
    params: [{ id: '1', enabled: true, key: 'query', value: '1', description: '' }],
    headers: [{ id: '1', enabled: true, key: 'Accept', value: 'application/json', description: '' }],
    auth: {
        type: 'noauth',
        apiKey: { key: '', value: '', addTo: 'Header' },
        bearer: '',
        basic: { username: '', password: '' },
    },
    body: {
        type: 'none',
        rawType: 'JSON',
        content: '',
        formData: [{ id: '1', enabled: true, key: '', value: '', description: '' }],
        urlencoded: [{ id: '1', enabled: true, key: '', value: '', description: '' }],
        binaryFile: null,
    },
    scripts: {
        preRequest: '',
        postResponse: '',
    },
    response: null,
    isDirty: false,
    activeSubTab: 'Params',
});

// Configure localforage
const lf: any = (localforage as any).default || localforage;
if (lf && typeof lf.config === 'function') {
    lf.config({
        name: 'ced-client',
        storeName: 'request_store'
    });
}

export const useRequestStore = create<RequestState>()(
    persist(
        (set, get) => ({
            tabs: [createDefaultTab()],
            activeTabId: null,
            variables: {
                baseUrl: 'https://api.example.com',
                apiKey: 'ced_test_123456'
            },
            collections: [
                {
                    id: 'col_1',
                    name: 'Github Copilot',
                    requests: [
                        { id: 'req_1', name: 'Create session', method: 'POST', url: '{{baseUrl}}/models/session' },
                        { id: 'req_2', name: 'Get Models', method: 'GET', url: '{{baseUrl}}/models' },
                    ]
                }
            ],
            history: [],

            addTab: (tabData) => {
                const newTab = { ...createDefaultTab(), ...tabData };
                set((state) => ({
                    tabs: [...state.tabs, newTab],
                    activeTabId: newTab.id,
                }));
            },

            removeTab: (id) => {
                set((state) => {
                    const newTabs = state.tabs.filter((t) => t.id !== id);
                    let newActiveId = state.activeTabId;

                    if (state.activeTabId === id) {
                        newActiveId = newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null;
                    }

                    return {
                        tabs: newTabs.length > 0 ? newTabs : [createDefaultTab()],
                        activeTabId: newActiveId || (newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null),
                    };
                });
            },

            setActiveTab: (id) => {
                set({ activeTabId: id });
            },

            updateTab: (id, updates) => {
                set((state) => ({
                    tabs: state.tabs.map((t) => (t.id === id ? { ...t, ...updates } : t)),
                }));
            },

            updateActiveTab: (updates) => {
                const { activeTabId } = get();
                if (activeTabId) {
                    get().updateTab(activeTabId, updates);
                }
            },

            setVariable: (key: string, value: string) => {
                set((state: RequestState) => ({
                    variables: { ...state.variables, [key]: value }
                }));
            },

            deleteVariable: (key: string) => {
                set((state: RequestState) => {
                    const next = { ...state.variables };
                    delete next[key];
                    return { variables: next };
                });
            },

            setCollections: (collections: RequestCollection[]) => {
                set({ collections });
            },

            addToHistory: (tab: RequestTab) => {
                set((state) => ({
                    history: [tab, ...state.history.filter(h => h.id !== tab.id)].slice(0, 50)
                }));
            },

            clearHistory: () => {
                set({ history: [] });
            },

            duplicateTab: (id: string) => {
                const tab = get().tabs.find(t => t.id === id);
                if (!tab) return;
                const newTab: RequestTab = {
                    ...tab,
                    id: Math.random().toString(36).substring(7),
                    name: `${tab.name} (Copy)`,
                    isDirty: false,
                    response: null,
                };
                set((state) => ({
                    tabs: [
                        ...state.tabs.slice(0, state.tabs.findIndex(t => t.id === id) + 1),
                        newTab,
                        ...state.tabs.slice(state.tabs.findIndex(t => t.id === id) + 1),
                    ],
                    activeTabId: newTab.id,
                }));
            },
        }),
        {
            name: 'request-storage',
            storage: createJSONStorage(() => ({
                getItem: (name) => lf.getItem(name) as Promise<string | null>,
                setItem: (name, value) => { lf.setItem(name, value); },
                removeItem: (name) => { lf.removeItem(name); },
            })),
            onRehydrateStorage: () => (state) => {
                if (state && !state.activeTabId && state.tabs.length > 0) {
                    state.activeTabId = state.tabs[0].id;
                }
            },
        }
    )
);

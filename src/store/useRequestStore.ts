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
    body: {
        type: 'none' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary' | 'graphql';
        rawType: 'Text' | 'JavaScript' | 'JSON' | 'HTML' | 'XML';
        content: string;
        formData: DataGridRow[];
        urlencoded: DataGridRow[];
    };
    scripts: {
        preRequest: string;
        postResponse: string;
    };
    response: ResponseData | null;
    isDirty: boolean;
    activeSubTab: string;
}

interface RequestState {
    tabs: RequestTab[];
    activeTabId: string | null;
    variables: Record<string, string>;

    // Actions
    addTab: (tab?: Partial<RequestTab>) => void;
    removeTab: (id: string) => void;
    setActiveTab: (id: string) => void;
    updateTab: (id: string, updates: Partial<RequestTab>) => void;
    updateActiveTab: (updates: Partial<RequestTab>) => void;
    setVariable: (key: string, value: string) => void;
}

const createDefaultTab = (): RequestTab => ({
    id: Math.random().toString(36).substring(7),
    name: 'New Request',
    method: 'GET',
    url: '{{baseUrl}}/models/session?query=1',
    params: [{ id: '1', enabled: true, key: 'query', value: '1', description: '' }],
    headers: [{ id: '1', enabled: true, key: 'Accept', value: 'application/json', description: '' }],
    body: {
        type: 'none',
        rawType: 'JSON',
        content: '',
        formData: [{ id: '1', enabled: true, key: '', value: '', description: '' }],
        urlencoded: [{ id: '1', enabled: true, key: '', value: '', description: '' }],
    },
    scripts: {
        preRequest: '// Write a script that executes before the request is sent\n',
        postResponse: '// Write a script that executes after the response is received\n',
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

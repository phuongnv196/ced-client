import React, { useState } from 'react';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { Tabs } from '../Tabs';
import { UrlBar } from '../UrlBar';
import { DataGrid, type DataGridRow } from '../DataGrid';
import { Authorization } from '../Authorization';
import { HeadersTab } from '../HeadersTab';
import { BodyTab } from '../BodyTab';
import { ScriptsTab } from '../ScriptsTab';
import { ResponsePanel } from '../ResponsePanel';
import { useRequestStore } from '../../store/useRequestStore';
import { sendRequest } from '../../services/RequestEngine';
import { resolveVariables } from '../../utils/variableResolver';
import { fileRegistry } from '../../utils/fileRegistry';
import { executeScript } from '../../utils/scriptExecutor';
import { useConsoleStore } from '../../store/useConsoleStore';
import { Edit } from 'lucide-react';
import clsx from 'clsx';
import './MainContent.css';

const parseQuery = (url: string): DataGridRow[] => {
    try {
        const urlObj = new URL(url, 'http://dummy.com');
        const rows: DataGridRow[] = [];
        urlObj.searchParams.forEach((value, key) => {
            rows.push({ id: Math.random().toString(), enabled: true, key, value, description: '' });
        });
        return rows;
    } catch {
        return [];
    }
};

const updateQuery = (url: string, params: DataGridRow[]): string => {
    try {
        const urlObj = new URL(url, 'http://dummy.com');
        const keys = Array.from(urlObj.searchParams.keys());
        keys.forEach(k => urlObj.searchParams.delete(k));

        params.filter(p => p.enabled && p.key).forEach(p => {
            urlObj.searchParams.append(p.key, p.value);
        });

        let newSearch = urlObj.searchParams.toString();
        // Restore variable syntax {{ }} that gets url-encoded by searchParams.toString()
        newSearch = newSearch.replace(/%7B/g, '{').replace(/%7b/g, '{').replace(/%7D/g, '}').replace(/%7d/g, '}');

        const base = url.split('?')[0];
        return newSearch ? `${base}?${newSearch}` : base;
    } catch {
        return url;
    }
};

export const MainContent: React.FC = () => {
    const {
        tabs, activeTabId, updateActiveTab, variables: globalVariables,
        addToHistory, setVariable, collections, renameRequest
    } = useRequestStore();
    const { addLog } = useConsoleStore();
    const activeTab = tabs.find(t => t.id === activeTabId);
    const [scriptLogs, setScriptLogs] = useState<string[]>([]);
    const [testResults, setTestResults] = useState<Array<{ name: string; passed: boolean; error?: string }>>([]);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveDetails, setSaveDetails] = useState({ name: '', collectionId: '' });

    if (!activeTab) {
        return <div className="flex-1 bg-slate-50 flex items-center justify-center text-slate-400">Loading...</div>;
    }

    // Merge global variables with collection-specific variables
    const activeCollection = collections.find(c => c.id === activeTab.collectionId);
    const variables = { ...globalVariables, ...(activeCollection?.variables || {}) };

    const { method, url, params, headers, response, activeSubTab, body, scripts, auth } = activeTab;

    const handleSend = async () => {
        // ...
        setScriptLogs([]);
        setTestResults([]);

        // Build initial header object
        let headerObj: Record<string, string> = {};
        headers.filter(h => h.enabled && h.key).forEach(h => {
            headerObj[h.key] = resolveVariables(h.value, variables);
        });

        // ── Apply Authorization ─────────────────────────────────────────────
        const authVal = auth ?? { type: 'noauth' };
        if (authVal.type === 'bearer' && authVal.bearer) {
            headerObj['Authorization'] = `Bearer ${authVal.bearer}`;
        } else if (authVal.type === 'basic' && authVal.basic?.username) {
            const encoded = btoa(`${authVal.basic.username}:${authVal.basic.password}`);
            headerObj['Authorization'] = `Basic ${encoded}`;
        } else if (authVal.type === 'apikey' && authVal.apiKey?.key) {
            if (authVal.apiKey.addTo === 'Header') {
                headerObj[authVal.apiKey.key] = authVal.apiKey.value;
            }
        }

        // ── Run Pre-request Script ──────────────────────────────────────────
        let preCtx = executeScript(scripts.preRequest || '', {
            variables: { ...variables },
            headers: { ...headerObj, __method__: method, __url__: url },
            testResults: [],
            logs: [],
        });
        Object.entries(preCtx.variables).forEach(([k, v]) => {
            if (variables[k] !== v) setVariable(k, v);
        });
        const { __method__: _m, __url__: _u, ...scriptHeaders } = preCtx.headers;
        headerObj = { ...headerObj, ...scriptHeaders };
        setScriptLogs(preCtx.logs);
        preCtx.logs.forEach(log => addLog(log, 'info'));

        // ── Resolve URL & Params ────────────────────────────────────────────
        const resolvedUrl = resolveVariables(url, preCtx.variables);
        const paramObj: Record<string, string> = {};
        params.filter(p => p.enabled && p.key).forEach(p => {
            paramObj[p.key] = resolveVariables(p.value, preCtx.variables);
        });
        if (authVal.type === 'apikey' && authVal.apiKey?.addTo === 'Query Params' && authVal.apiKey.key) {
            paramObj[authVal.apiKey.key] = authVal.apiKey.value;
        }

        // ── Build Body ─────────────────────────────────────────────────────
        let requestBody: any = null;
        let requestBodyType = 'json';

        if (body.type === 'raw') {
            const resolvedContent = resolveVariables(body.content, preCtx.variables);
            try {
                requestBody = body.rawType === 'JSON' ? JSON.parse(resolvedContent) : resolvedContent;
                requestBodyType = body.rawType.toLowerCase();
            } catch {
                requestBody = resolvedContent;
                requestBodyType = 'text';
            }
        } else if (body.type === 'form-data') {
            const fd: Record<string, any> = {};
            body.formData.filter(f => f.enabled && f.key).forEach(f => {
                fd[f.key] = f.type === 'file' ? f.fileValue : resolveVariables(f.value, preCtx.variables);
            });
            requestBody = fd;
            requestBodyType = 'form-data';
        } else if (body.type === 'x-www-form-urlencoded') {
            const ue: Record<string, string> = {};
            body.urlencoded.filter(f => f.enabled && f.key).forEach(f => {
                ue[f.key] = resolveVariables(f.value, preCtx.variables);
            });
            requestBody = ue;
            requestBodyType = 'x-www-form-urlencoded';
        } else if (body.type === 'binary') {
            const file = fileRegistry.get(activeTab.id);
            if (file) {
                requestBody = file;
                requestBodyType = 'binary';
            }
        }

        // ── Send Request ───────────────────────────────────────────────────
        try {
            addLog(`Sending ${method} ${resolvedUrl}`, 'request', { headers: headerObj, params: paramObj });
            const apiResponse = await sendRequest({
                method,
                url: resolvedUrl,
                headers: headerObj,
                params: paramObj,
                body: requestBody,
                bodyType: requestBodyType,
            });

            addLog(`Response: ${apiResponse.status} ${apiResponse.statusText}`, 'response', apiResponse.headers);

            const postCtx = executeScript(scripts.postResponse || '', {
                variables: { ...preCtx.variables },
                headers: headerObj,
                response: apiResponse,
                testResults: [],
                logs: [],
            });
            Object.entries(postCtx.variables).forEach(([k, v]) => {
                if (preCtx.variables[k] !== v) setVariable(k, v);
            });
            setScriptLogs(prev => [...prev, ...postCtx.logs]);
            postCtx.logs.forEach(log => addLog(log, 'info'));
            setTestResults(postCtx.testResults);

            updateActiveTab({ response: apiResponse });
            addToHistory({ ...activeTab, response: apiResponse });

        } catch (error: any) {
            const errorResponse = {
                status: 0,
                statusText: 'Error',
                headers: {},
                data: error.message || 'Error occurred',
                time: 0,
                size: '0 B',
            };
            updateActiveTab({ response: errorResponse });
            addToHistory({ ...activeTab, response: errorResponse });
            addLog(`Request failed: ${error.message}`, 'error');
        }
    };

    const handleSave = () => {
        if (!activeTab) return;
        const { collections, saveRequestToCollection } = useRequestStore.getState();
        const { addLog } = useConsoleStore.getState();

        let targetColId = activeTab.collectionId;

        if (targetColId) {
            saveRequestToCollection(targetColId, {
                ...activeTab,
                id: activeTab.originalId || activeTab.id,
                response: null
            });
            addLog('Saved request to collection', 'info');
        } else {
            setSaveDetails({ name: activeTab.name, collectionId: collections[0]?.id || 'new' });
            setShowSaveModal(true);
        }
    };

    const submitSaveModal = () => {
        const { collections, addCollection, saveRequestToCollection, renameRequest, updateActiveTab } = useRequestStore.getState();
        const { addLog } = useConsoleStore.getState();
        let colId = saveDetails.collectionId;

        if (colId === 'new') {
            const newColName = 'New Collection ' + (collections.length + 1);
            addCollection(newColName);
            const updatedCols = useRequestStore.getState().collections;
            colId = updatedCols[updatedCols.length - 1].id;
        }

        saveRequestToCollection(colId, {
            ...activeTab,
            name: saveDetails.name,
            id: activeTab.originalId || activeTab.id,
            response: null
        });

        renameRequest(activeTab.id, saveDetails.name);
        updateActiveTab({ collectionId: colId });

        addLog(`Saved request "${saveDetails.name}"`, 'info');
        setShowSaveModal(false);
    };

    const handleUrlChange = (newUrl: string) => {
        updateActiveTab({
            url: newUrl,
            params: parseQuery(newUrl)
        });
    };

    const handleParamsChange = (newParams: DataGridRow[]) => {
        updateActiveTab({
            params: newParams,
            url: updateQuery(url, newParams)
        });
    };

    const setActiveSubTab = (tab: string) => {
        updateActiveTab({ activeSubTab: tab });
    };

    const activeHeaderCount = headers.filter(h => h.enabled && h.key).length;
    const hasAuth = auth && auth.type !== 'noauth';
    const hasScript = scripts.preRequest?.trim() || scripts.postResponse?.trim();

    const [isEditingName, setIsEditingName] = useState(false);
    const [editNameValue, setEditNameValue] = useState('');

    const handleSaveName = () => {
        if (editNameValue.trim() && editNameValue !== activeTab.name) {
            renameRequest(activeTab.id, editNameValue.trim());
        }
        setIsEditingName(false);
    };

    return (
        <div className="flex-1 flex flex-col bg-slate-50 main-content-container min-w-0 overflow-hidden">
            <Tabs />

            {/* Request Name Header */}
            <div className="px-5 pt-4 pb-0 bg-white flex items-center gap-2 group min-h-[44px]">
                {isEditingName ? (
                    <input
                        autoFocus
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        onBlur={handleSaveName}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveName();
                            if (e.key === 'Escape') setIsEditingName(false);
                        }}
                        className="text-lg font-bold text-slate-700 bg-transparent border-b-2 border-blue-500 outline-none w-[250px] transition-all px-1 py-0.5"
                    />
                ) : (
                    <h2
                        className="text-lg font-bold text-slate-700 cursor-pointer hover:text-blue-600 transition-colors flex items-center gap-2"
                        onClick={() => {
                            setEditNameValue(activeTab.name);
                            setIsEditingName(true);
                        }}
                        title="Click to rename"
                    >
                        {activeTab.name}
                        <Edit className="w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity" />
                    </h2>
                )}

                {!isEditingName && activeCollection && (
                    <span className="text-[10px] bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        {activeCollection.name}
                    </span>
                )}
            </div>

            {/* URL & Method Bar */}
            <UrlBar
                method={method}
                url={url}
                onChangeMethod={(m) => updateActiveTab({ method: m })}
                onChangeUrl={handleUrlChange}
                onSend={handleSend}
                onSave={handleSave}
            />

            <Group orientation="vertical" className="flex-1 overflow-hidden">
                <Panel defaultSize={70} minSize={30} className="bg-white flex flex-col">
                    <div className="flex border-b border-slate-200 text-sm px-4 pt-2 gap-6 font-medium text-slate-500">
                        {['Params', 'Authorization', 'Headers', 'Body', 'Scripts'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveSubTab(tab)}
                                className={clsx(
                                    'pb-2 hover:text-slate-800 transition-colors relative',
                                    activeSubTab === tab ? 'text-slate-800 border-b-2 border-orange-500' : ''
                                )}
                            >
                                {tab}
                                {tab === 'Headers' && activeHeaderCount > 0 && (
                                    <span className="text-xs font-semibold text-slate-400 ml-0.5">({activeHeaderCount})</span>
                                )}
                                {tab === 'Authorization' && hasAuth && (
                                    <span className="inline-block w-1.5 h-1.5 bg-orange-400 rounded-full ml-1 mb-0.5 align-middle" />
                                )}
                                {tab === 'Scripts' && hasScript && (
                                    <span className="inline-block w-1.5 h-1.5 bg-orange-400 rounded-full ml-1 mb-0.5 align-middle" />
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-hidden h-full flex flex-col bg-white">
                        {activeSubTab === 'Params' && (
                            <DataGrid rows={params} onChange={handleParamsChange} />
                        )}
                        {activeSubTab === 'Body' && (
                            <BodyTab />
                        )}
                        {activeSubTab === 'Authorization' && (
                            <Authorization />
                        )}
                        {activeSubTab === 'Headers' && (
                            <HeadersTab rows={headers} onChange={(h) => updateActiveTab({ headers: h })} />
                        )}
                        {activeSubTab === 'Scripts' && (
                            <ScriptsTab
                                scriptLogs={scriptLogs}
                                testResults={testResults}
                            />
                        )}
                    </div>
                </Panel>
                <Separator className="h-1 bg-slate-200 hover:bg-blue-400 transition-colors cursor-row-resize" />
                <Panel defaultSize={30} minSize={20} className="bg-white flex flex-col">
                    <ResponsePanel response={response} />
                </Panel>
            </Group>

            {/* Save Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-6 border border-slate-200">
                        <h3 className="font-bold text-lg mb-4 text-slate-800">Save Request</h3>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Request Name</label>
                            <input
                                autoFocus
                                value={saveDetails.name}
                                onChange={e => setSaveDetails(prev => ({ ...prev, name: e.target.value }))}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && saveDetails.name.trim()) submitSaveModal();
                                    if (e.key === 'Escape') setShowSaveModal(false);
                                }}
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none"
                                placeholder="E.g., Get User Data"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Save to Collection</label>
                            <select
                                value={saveDetails.collectionId}
                                onChange={e => setSaveDetails(prev => ({ ...prev, collectionId: e.target.value }))}
                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 outline-none bg-white font-medium text-slate-700"
                            >
                                <option value="new" className="font-bold text-blue-600">+ Create New Collection</option>
                                {useRequestStore.getState().collections.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitSaveModal}
                                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                disabled={!saveDetails.name.trim()}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

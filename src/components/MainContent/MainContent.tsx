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

        const newSearch = urlObj.searchParams.toString();
        const base = url.split('?')[0];
        return newSearch ? `${base}?${newSearch}` : base;
    } catch {
        return url;
    }
};

export const MainContent: React.FC = () => {
    const { tabs, activeTabId, updateActiveTab, variables, addToHistory, setVariable } = useRequestStore();
    const activeTab = tabs.find(t => t.id === activeTabId);
    const [scriptLogs, setScriptLogs] = useState<string[]>([]);
    const [testResults, setTestResults] = useState<Array<{ name: string; passed: boolean; error?: string }>>([]);

    if (!activeTab) {
        return <div className="flex-1 bg-slate-50 flex items-center justify-center text-slate-400">Loading...</div>;
    }

    const { method, url, params, headers, response, activeSubTab, body, scripts, auth } = activeTab;

    const handleSend = async () => {
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
            // Query param API key is handled in paramObj below
        }

        // ── Run Pre-request Script ──────────────────────────────────────────
        let preCtx = executeScript(scripts.preRequest || '', {
            variables: { ...variables },
            headers: { ...headerObj, __method__: method, __url__: url },
            testResults: [],
            logs: [],
        });
        // Apply any variable mutations from pre-request script back to store
        Object.entries(preCtx.variables).forEach(([k, v]) => {
            if (variables[k] !== v) setVariable(k, v);
        });
        // Apply any header mutations from pre-request script
        const { __method__: _m, __url__: _u, ...scriptHeaders } = preCtx.headers;
        headerObj = { ...headerObj, ...scriptHeaders };
        setScriptLogs(preCtx.logs);

        // ── Resolve URL & Params ────────────────────────────────────────────
        const resolvedUrl = resolveVariables(url, preCtx.variables);

        const paramObj: Record<string, string> = {};
        params.filter(p => p.enabled && p.key).forEach(p => {
            paramObj[p.key] = resolveVariables(p.value, preCtx.variables);
        });
        // API Key in query params
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
            const apiResponse = await sendRequest({
                method,
                url: resolvedUrl,
                headers: headerObj,
                params: paramObj,
                body: requestBody,
                bodyType: requestBodyType,
            });

            // ── Run Post-response Script ───────────────────────────────────
            const postCtx = executeScript(scripts.postResponse || '', {
                variables: { ...preCtx.variables },
                headers: headerObj,
                response: apiResponse,
                testResults: [],
                logs: [],
            });
            // Apply variable mutations from post-response script
            Object.entries(postCtx.variables).forEach(([k, v]) => {
                if (preCtx.variables[k] !== v) setVariable(k, v);
            });
            setScriptLogs(prev => [...prev, ...postCtx.logs]);
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
        }
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

    // Count active headers for badge
    const activeHeaderCount = headers.filter(h => h.enabled && h.key).length;
    const hasAuth = auth && auth.type !== 'noauth';
    const hasScript = scripts.preRequest?.trim() || scripts.postResponse?.trim();

    return (
        <div className="flex-1 flex flex-col bg-slate-50 main-content-container">
            <Tabs />

            {/* URL & Method Bar */}
            <UrlBar
                method={method}
                url={url}
                onChangeMethod={(m) => updateActiveTab({ method: m })}
                onChangeUrl={handleUrlChange}
                onSend={handleSend}
            />

            <Group orientation="vertical" className="flex-1 overflow-hidden">
                <Panel defaultSize={70} minSize={30} className="bg-white flex flex-col">
                    {/* Request Sub-Tabs */}
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
        </div>
    );
};

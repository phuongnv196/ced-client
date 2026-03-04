import React from 'react';
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
    const { tabs, activeTabId, updateActiveTab, variables } = useRequestStore();
    const activeTab = tabs.find(t => t.id === activeTabId);

    if (!activeTab) {
        return <div className="flex-1 bg-slate-50 flex items-center justify-center text-slate-400">Loading...</div>;
    }

    const { method, url, params, headers, response, activeSubTab, body } = activeTab;

    const handleSend = async () => {
        // Resolve variables
        const resolvedUrl = resolveVariables(url, variables);

        const headerObj: Record<string, string> = {};
        headers.filter(h => h.enabled && h.key).forEach(h => {
            headerObj[h.key] = resolveVariables(h.value, variables);
        });

        const paramObj: Record<string, string> = {};
        params.filter(p => p.enabled && p.key).forEach(p => {
            paramObj[p.key] = resolveVariables(p.value, variables);
        });

        let requestBody: any = null;
        let requestBodyType = 'json';

        if (body.type === 'raw') {
            const resolvedContent = resolveVariables(body.content, variables);
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
                fd[f.key] = f.type === 'file' ? f.fileValue : resolveVariables(f.value, variables);
            });
            requestBody = fd;
            requestBodyType = 'form-data';
        } else if (body.type === 'x-www-form-urlencoded') {
            const ue: Record<string, string> = {};
            body.urlencoded.filter(f => f.enabled && f.key).forEach(f => {
                ue[f.key] = resolveVariables(f.value, variables);
            });
            requestBody = ue;
            requestBodyType = 'x-www-form-urlencoded';
        }

        try {
            const apiResponse = await sendRequest({
                method,
                url: resolvedUrl,
                headers: headerObj,
                params: paramObj,
                body: requestBody,
                bodyType: requestBodyType
            });

            updateActiveTab({
                response: apiResponse
            });
        } catch (error: any) {
            updateActiveTab({
                response: {
                    status: 0,
                    statusText: 'Error',
                    headers: {},
                    data: error.message || 'Error occurred',
                    time: 0,
                    size: '0 B'
                }
            });
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

            <Group orientation="vertical" className="flex-1">
                <Panel defaultSize={65} minSize={30} className="bg-white flex flex-col">
                    {/* Request Tabs */}
                    <div className="flex border-b border-slate-200 text-sm px-4 pt-2 gap-6 font-medium text-slate-500">
                        {['Params', 'Authorization', 'Headers', 'Body', 'Scripts'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveSubTab(tab)}
                                className={clsx(
                                    "pb-2 hover:text-slate-800 transition-colors",
                                    activeSubTab === tab ? "text-slate-800 border-b-2 border-orange-500" : ""
                                )}
                            >
                                {tab} {tab === 'Headers' && headers.length > 0 && (
                                    <span className="text-xs font-semibold text-slate-400">({headers.length})</span>
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
                            <ScriptsTab />
                        )}
                    </div>
                </Panel>

                <Separator className="h-1 bg-slate-200 hover:bg-blue-400 transition-colors cursor-row-resize" />

                <Panel defaultSize={35} minSize={20} className="bg-white flex flex-col">
                    <ResponsePanel response={response} />
                </Panel>
            </Group>
        </div>
    );
};

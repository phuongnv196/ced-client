import React, { useState } from 'react';
import { Panel, Group, Separator } from 'react-resizable-panels';
import { Tabs } from '../Tabs';
import { UrlBar } from '../UrlBar';
import { DataGrid, type DataGridRow } from '../DataGrid';
import { Authorization } from '../Authorization';
import { HeadersTab } from '../HeadersTab';
import { BodyTab } from '../BodyTab';
import { ScriptsTab } from '../ScriptsTab';
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
    const [method, setMethod] = useState('GET');
    const [url, setUrl] = useState('https://api.example.com/models/session?query=1');
    const [activeTab, setActiveTab] = useState('Headers');
    const [params, setParams] = useState<DataGridRow[]>(parseQuery('https://api.example.com/models/session?query=1'));
    const [headers, setHeaders] = useState<DataGridRow[]>([]);

    const handleUrlChange = (newUrl: string) => {
        setUrl(newUrl);
        setParams(parseQuery(newUrl));
    };

    const handleParamsChange = (newParams: DataGridRow[]) => {
        setParams(newParams);
        setUrl(updateQuery(url, newParams));
    };
    return (
        <div className="flex-1 flex flex-col bg-slate-50 main-content-container">
            <Tabs />

            {/* URL & Method Bar */}
            <UrlBar
                method={method}
                url={url}
                onChangeMethod={setMethod}
                onChangeUrl={handleUrlChange}
            />

            <Group orientation="vertical" className="flex-1">
                <Panel defaultSize={65} minSize={30} className="bg-white flex flex-col">
                    {/* Request Tabs */}
                    <div className="flex border-b border-slate-200 text-sm px-4 pt-2 gap-6 font-medium text-slate-500">
                        {['Params', 'Authorization', 'Headers', 'Body', 'Scripts'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={clsx(
                                    "pb-2 hover:text-slate-800 transition-colors",
                                    activeTab === tab ? "text-slate-800 border-b-2 border-orange-500" : ""
                                )}
                            >
                                {tab} {tab === 'Headers' && <span className="text-xs font-semibold text-slate-400">(10)</span>}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-hidden h-full flex flex-col bg-white">
                        {activeTab === 'Params' && (
                            <DataGrid rows={params} onChange={handleParamsChange} />
                        )}
                        {activeTab === 'Body' && (
                            <BodyTab />
                        )}
                        {activeTab === 'Authorization' && (
                            <Authorization />
                        )}
                        {activeTab === 'Headers' && (
                            <HeadersTab rows={headers} onChange={setHeaders} />
                        )}
                        {activeTab === 'Scripts' && (
                            <ScriptsTab />
                        )}
                    </div>
                </Panel>

                <Separator className="h-1 bg-slate-200 hover:bg-blue-400 transition-colors cursor-row-resize" />

                <Panel defaultSize={35} minSize={20} className="bg-white flex flex-col">
                    <div className="flex border-b border-slate-200 text-sm px-4 pt-2 gap-6 font-medium text-slate-500 bg-slate-50">
                        <button className="pb-2 text-slate-800 border-b-2 border-orange-500">Response</button>
                        <button className="pb-2 hover:text-slate-800">History</button>
                    </div>
                    <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                        Click Send to get a response
                    </div>
                </Panel>
            </Group>
        </div>
    );
};

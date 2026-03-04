import React, { useState } from 'react';
import clsx from 'clsx';
import { Editor } from '@monaco-editor/react';

interface ResponsePanelProps {
    response: any; // Will be defined better later
}

export const ResponsePanel: React.FC<ResponsePanelProps> = ({ response }) => {
    const [activeTab, setActiveTab] = useState('Body');

    // Data from response
    const hasResponse = !!response;
    const statusCode = response?.status || 0;
    const statusText = response?.statusText || '';
    const time = response?.time ? `${response.time} ms` : '0 ms';
    const size = response?.size || '0 B';

    if (!hasResponse) {
        return (
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
                <div className="flex border-b border-slate-200 text-sm px-4 pt-2 gap-6 font-medium text-slate-500 bg-slate-50">
                    <button className="pb-2 text-slate-800 border-b-2 border-orange-500">Response</button>
                    <button className="pb-2 hover:text-slate-800">History</button>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm p-4 text-center">
                    <div className="w-48 h-48 mb-4 opacity-20">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z" />
                        </svg>
                    </div>
                    <p className="font-medium text-slate-500 mb-1">Enter the URL and click Send to get a response</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
            {/* Header / Tabs */}
            <div className="flex border-b border-slate-200 text-sm px-4 pt-2 gap-6 font-medium text-slate-500 bg-slate-50 justify-between items-center pr-4 shrink-0">
                <div className="flex gap-6">
                    {['Body', 'Cookies', 'Headers', 'Test Results'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={clsx(
                                "pb-2 transition-colors",
                                activeTab === tab ? "text-slate-800 border-b-2 border-orange-500" : "hover:text-slate-800"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                        <span className="text-slate-400">Status:</span>
                        <span className={clsx("font-bold", statusCode >= 200 && statusCode < 300 ? "text-green-600" : "text-red-600")}>
                            {statusCode} {statusText}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-slate-400">Time:</span>
                        <span className="text-green-600 font-bold">{time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-slate-400">Size:</span>
                        <span className="text-green-600 font-bold">{size}</span>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'Body' && (
                    <div className="h-full flex flex-col">
                        <div className="flex items-center gap-4 px-4 py-2 border-b border-slate-100 text-xs text-slate-500 bg-white shrink-0">
                            <div className="flex gap-2">
                                <button className="font-bold text-slate-800 hover:text-orange-600">Pretty</button>
                                <button className="hover:text-orange-600">Raw</button>
                                <button className="hover:text-orange-600">Preview</button>
                            </div>
                            <div className="w-px h-3 bg-slate-200"></div>
                            <div className="text-slate-600 font-medium">
                                {typeof response.data === 'object' ? 'JSON' : 'Text'}
                            </div>
                        </div>
                        <div className="flex-1">
                            <Editor
                                height="100%"
                                language={typeof response.data === 'object' ? "json" : "text"}
                                value={typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : String(response.data)}
                                options={{
                                    readOnly: true,
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    fontSize: 13,
                                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                    lineNumbersMinChars: 3,
                                    renderLineHighlight: 'none',
                                    folding: true,
                                }}
                            />
                        </div>
                    </div>
                )}
                {activeTab === 'Headers' && (
                    <div className="h-full overflow-y-auto p-4">
                        <table className="w-full text-xs text-left text-slate-600">
                            <thead className="bg-slate-50 text-slate-400 border-b border-slate-200">
                                <tr>
                                    <th className="px-3 py-2 font-semibold">HEADER</th>
                                    <th className="px-3 py-2 font-semibold">VALUE</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {Object.entries(response.headers).map(([key, value]) => (
                                    <tr key={key} className="hover:bg-slate-50/50">
                                        <td className="px-3 py-2 font-medium text-slate-800">{key}</td>
                                        <td className="px-3 py-2 break-all">{String(value)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {activeTab !== 'Body' && activeTab !== 'Headers' && (
                    <div className="p-8 text-center text-slate-400 text-sm italic">
                        No {activeTab.toLowerCase()} to show
                    </div>
                )}
            </div>
        </div>
    );
};

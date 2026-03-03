import React, { useState } from 'react';
import clsx from 'clsx';
import { Editor } from '@monaco-editor/react';

interface ResponsePanelProps {
    response: any; // Will be defined better later
}

export const ResponsePanel: React.FC<ResponsePanelProps> = ({ response }) => {
    const [activeTab, setActiveTab] = useState('Body');

    // Mock data for now
    const hasResponse = !!response;
    const statusCode = 200;
    const statusText = 'OK';
    const time = '45 ms';
    const size = '1.2 KB';

    if (!hasResponse) {
        return (
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
                <div className="flex border-b border-slate-200 text-sm px-4 pt-2 gap-6 font-medium text-slate-500 bg-slate-50">
                    <button className="pb-2 text-slate-800 border-b-2 border-orange-500">Response</button>
                    <button className="pb-2 hover:text-slate-800">History</button>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm p-4 text-center">
                    <div className="w-48 h-48 mb-4 opacity-20">
                        {/* Astronaut placeholder or icon */}
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
            <div className="flex border-b border-slate-200 text-sm px-4 pt-2 gap-6 font-medium text-slate-500 bg-slate-50 justify-between items-center pr-4">
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
                        <span className="text-green-600 font-bold">{statusCode} {statusText}</span>
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
                        <div className="flex items-center gap-4 px-4 py-2 border-b border-slate-100 text-xs text-slate-500 bg-white">
                            <div className="flex gap-2">
                                <button className="font-bold text-slate-800 hover:text-orange-600">Pretty</button>
                                <button className="hover:text-orange-600">Raw</button>
                                <button className="hover:text-orange-600">Preview</button>
                            </div>
                            <div className="w-px h-3 bg-slate-200"></div>
                            <div className="text-slate-600 font-medium">JSON</div>
                        </div>
                        <div className="flex-1">
                            <Editor
                                height="100%"
                                language="json"
                                value={JSON.stringify(response, null, 2)}
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
                {activeTab !== 'Body' && (
                    <div className="p-8 text-center text-slate-400 text-sm italic">
                        No {activeTab.toLowerCase()} to show
                    </div>
                )}
            </div>
        </div>
    );
};

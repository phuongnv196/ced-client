import React, { useRef, useEffect, useState } from 'react';
import { Editor, type Monaco } from '@monaco-editor/react';
import { useRequestStore } from '../../store/useRequestStore';

const snippets = [
    { title: 'Get a global variable', code: 'pm.globals.get("variable_key");' },
    { title: 'Set a global variable', code: 'pm.globals.set("variable_key", "variable_value");' },
    { title: 'Get an environment variable', code: 'pm.environment.get("variable_key");' },
    { title: 'Set an environment variable', code: 'pm.environment.set("variable_key", "variable_value");' },
    { title: 'Status code: Code is 200', code: 'pm.test("Status code is 200", function () {\n    pm.response.to.have.status(200);\n});' },
    { title: 'Response body: Contains string', code: 'pm.test("Body matches string", function () {\n    pm.expect(pm.response.text()).to.include("string_you_want_to_search");\n});' },
    { title: 'Response body: JSON value check', code: 'pm.test("Your test name", function () {\n    var jsonData = pm.response.json();\n    pm.expect(jsonData.value).to.eql(100);\n});' },
    { title: 'Add a request header (Pre-request)', code: 'pm.request.headers.add({ key: "Authorization", value: "Bearer token" });' }
];

export const ScriptsTab: React.FC = () => {
    const { tabs, activeTabId, updateActiveTab } = useRequestStore();
    const activeTab = tabs.find(t => t.id === activeTabId);

    const [activeScriptType, setActiveScriptType] = useState<'pre-request' | 'post-response'>('pre-request');
    const monacoRef = useRef<Monaco | null>(null);

    const updateExtraLib = (monaco: Monaco, type: 'pre-request' | 'post-response') => {
        const libContent = `
interface CEDClient {
    globals: {
        get(key: string): any;
        set(key: string, value: any): void;
    };
    environment: {
        get(key: string): any;
        set(key: string, value: any): void;
    };
    request: {
        headers: {
            add(header: { key: string; value: string }): void;
            remove(key: string): void;
            get(key: string): string | undefined;
        };
        method: string;
        url: {
            get(): string;
            set(url: string): void;
        };
        body: any;
    };
${type === 'post-response' ? `
    response: {
        text(): string;
        json(): any;
        to: {
            have: {
                status(code: number): void;
            };
        };
    };
    test(name: string, fn: () => void): void;
    expect(val: any): any;
` : ''}
}

declare const cedClient: CEDClient;
declare const pm: CEDClient;
`;
        monaco.languages.typescript.javascriptDefaults.setExtraLibs([{
            content: libContent,
            filePath: 'cedClient.d.ts'
        }]);
    };

    const handleEditorBeforeMount = (monaco: Monaco) => {
        monacoRef.current = monaco;
        updateExtraLib(monaco, activeScriptType);
    };

    useEffect(() => {
        if (monacoRef.current) {
            updateExtraLib(monacoRef.current, activeScriptType);
        }
    }, [activeScriptType]);

    if (!activeTab) return null;

    const { scripts } = activeTab;

    const handleSnippetClick = (code: string) => {
        if (activeScriptType === 'pre-request') {
            updateActiveTab({
                scripts: { ...scripts, preRequest: scripts.preRequest ? `${scripts.preRequest}\n${code}` : code }
            });
        } else {
            updateActiveTab({
                scripts: { ...scripts, postResponse: scripts.postResponse ? `${scripts.postResponse}\n${code}` : code }
            });
        }
    };

    return (
        <div className="flex h-full w-full bg-white">
            <div className="w-48 bg-white border-r border-slate-200 flex flex-col py-3 px-2 gap-1 shrink-0">
                <button
                    onClick={() => setActiveScriptType('pre-request')}
                    className={`text-left px-3 py-2 rounded text-sm transition-colors ${activeScriptType === 'pre-request'
                        ? 'bg-slate-100 text-slate-800 font-medium'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    Pre-request
                </button>
                <button
                    onClick={() => setActiveScriptType('post-response')}
                    className={`text-left px-3 py-2 rounded text-sm transition-colors ${activeScriptType === 'post-response'
                        ? 'bg-slate-100 text-slate-800 font-medium'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    Post-response
                </button>
            </div>

            <div className="flex-1 w-full h-full pt-1">
                <Editor
                    height="100%"
                    language="javascript"
                    theme="light"
                    value={activeScriptType === 'pre-request' ? scripts.preRequest : scripts.postResponse}
                    onChange={(val) => {
                        if (activeScriptType === 'pre-request') {
                            updateActiveTab({ scripts: { ...scripts, preRequest: val || '' } });
                        } else {
                            updateActiveTab({ scripts: { ...scripts, postResponse: val || '' } });
                        }
                    }}
                    beforeMount={handleEditorBeforeMount}
                    options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 13,
                        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                        wordWrap: 'on',
                        lineNumbersMinChars: 3,
                        folding: true,
                    }}
                />
            </div>

            <div className="w-64 border-l border-slate-200 bg-slate-50 flex flex-col h-full shrink-0">
                <div className="text-xs font-semibold text-slate-500 uppercase px-4 py-2 border-b border-slate-200">
                    Snippets
                </div>
                <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
                    <p className="text-xs text-slate-400 mb-2 px-2">Click to insert snippet</p>
                    <div className="flex flex-col gap-1">
                        {snippets.map((snippet, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSnippetClick(snippet.code)}
                                className="text-xs text-left px-2 py-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                            >
                                {snippet.title}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

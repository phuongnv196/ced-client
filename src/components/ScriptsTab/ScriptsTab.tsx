import React, { useRef, useEffect, useState } from 'react';
import { Editor, type Monaco } from '@monaco-editor/react';
import { useRequestStore } from '../../store/useRequestStore';
import { CheckCircle, XCircle, Terminal } from 'lucide-react';
import clsx from 'clsx';

const snippets = [
    { title: 'Get a variable', code: 'pm.variables.get("variable_key");' },
    { title: 'Set a variable', code: 'pm.variables.set("variable_key", "variable_value");' },
    { title: 'Get an env variable', code: 'pm.environment.get("variable_key");' },
    { title: 'Set an env variable', code: 'pm.environment.set("variable_key", "variable_value");' },
    { title: 'Add request header', code: 'pm.request.headers.add({ key: "X-Custom", value: "value" });' },
    { title: 'Test: Status is 200', code: 'pm.test("Status code is 200", function () {\n    pm.response.to.have.status(200);\n});' },
    { title: 'Test: Body contains string', code: 'pm.test("Body matches string", function () {\n    pm.expect(pm.response.text()).to.include("search_string");\n});' },
    { title: 'Test: JSON value check', code: 'pm.test("Check JSON value", function () {\n    var jsonData = pm.response.json();\n    pm.expect(jsonData.value).to.eql(100);\n});' },
    { title: 'Log response JSON', code: 'console.log(pm.response.json());' },
    { title: 'Set var from response', code: 'pm.variables.set("token", pm.response.json().token);' },
];

interface ScriptsTabProps {
    scriptLogs?: string[];
    testResults?: Array<{ name: string; passed: boolean; error?: string }>;
}

export const ScriptsTab: React.FC<ScriptsTabProps> = ({
    scriptLogs = [],
    testResults = [],
}) => {
    const { tabs, activeTabId, updateActiveTab } = useRequestStore();
    const activeTab = tabs.find(t => t.id === activeTabId);

    const [activeScriptType, setActiveScriptType] = useState<'pre-request' | 'post-response'>('pre-request');
    const [activePanel, setActivePanel] = useState<'editor' | 'results'>('editor');
    const monacoRef = useRef<Monaco | null>(null);

    const updateExtraLib = (monaco: Monaco, type: 'pre-request' | 'post-response') => {
        const libContent = `
interface PMHeaders {
    add(header: { key: string; value: string }): void;
    remove(key: string): void;
    get(key: string): string | undefined;
}
interface PMVariables {
    get(key: string): any;
    set(key: string, value: any): void;
}
interface PMResponse {
    code: number;
    status: string;
    text(): string;
    json(): any;
    responseTime: number;
    to: { have: { status(code: number): void } };
    headers: { get(key: string): string };
}
interface CEDClient {
    globals: PMVariables;
    environment: PMVariables;
    variables: PMVariables;
    request: {
        headers: PMHeaders;
        method: string;
        url: { get(): string; set(url: string): void };
        body: any;
    };
    ${type === 'post-response' ? `
    response: PMResponse;
    test(name: string, fn: () => void): void;
    expect(val: any): any;
    ` : ''}
}
declare const pm: CEDClient;
declare const cedClient: CEDClient;
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
        const key = activeScriptType === 'pre-request' ? 'preRequest' : 'postResponse';
        const current = scripts[key];
        updateActiveTab({
            scripts: { ...scripts, [key]: current ? `${current}\n${code}` : code }
        });
    };

    const passedCount = testResults.filter(r => r.passed).length;
    const failedCount = testResults.filter(r => !r.passed).length;
    const hasResults = scriptLogs.length > 0 || testResults.length > 0;

    return (
        <div className="flex h-full w-full bg-white">
            {/* Left panel: Script type selector */}
            <div className="w-44 bg-white border-r border-slate-200 flex flex-col py-3 px-2 gap-1 shrink-0">
                <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider px-2 mb-1">Script Type</div>
                <button
                    onClick={() => setActiveScriptType('pre-request')}
                    className={clsx(
                        'text-left px-3 py-2 rounded text-sm transition-colors',
                        activeScriptType === 'pre-request'
                            ? 'bg-slate-100 text-slate-800 font-medium'
                            : 'text-slate-600 hover:bg-slate-50'
                    )}
                >
                    Pre-request
                </button>
                <button
                    onClick={() => setActiveScriptType('post-response')}
                    className={clsx(
                        'text-left px-3 py-2 rounded text-sm transition-colors',
                        activeScriptType === 'post-response'
                            ? 'bg-slate-100 text-slate-800 font-medium'
                            : 'text-slate-600 hover:bg-slate-50'
                    )}
                >
                    Post-response
                </button>

                {/* Results badge */}
                {hasResults && (
                    <div className="mt-auto px-2 pt-2 border-t border-slate-100">
                        <div
                            className="text-xs font-medium cursor-pointer text-slate-500 flex flex-col gap-1"
                            onClick={() => setActivePanel(p => p === 'results' ? 'editor' : 'results')}
                        >
                            {testResults.length > 0 && (
                                <span>
                                    <span className="text-green-600">{passedCount} passed</span>
                                    {failedCount > 0 && <> / <span className="text-red-500">{failedCount} failed</span></>}
                                </span>
                            )}
                            {scriptLogs.length > 0 && (
                                <span className="flex items-center gap-1">
                                    <Terminal className="w-3 h-3" />
                                    {scriptLogs.length} log{scriptLogs.length > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Center: Editor + Result toggle */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Toggle between editor and results */}
                <div className="flex items-center border-b border-slate-100 px-3 py-1 gap-3 text-xs text-slate-500 shrink-0">
                    <button
                        onClick={() => setActivePanel('editor')}
                        className={clsx('py-0.5 px-2 rounded transition-colors', activePanel === 'editor' ? 'bg-slate-100 text-slate-800 font-bold' : 'hover:bg-slate-50')}
                    >
                        Editor
                    </button>
                    <button
                        onClick={() => setActivePanel('results')}
                        className={clsx('py-0.5 px-2 rounded transition-colors flex items-center gap-1', activePanel === 'results' ? 'bg-slate-100 text-slate-800 font-bold' : 'hover:bg-slate-50')}
                    >
                        Results
                        {testResults.length > 0 && (
                            <span className={clsx('text-[10px] font-bold px-1 rounded', failedCount > 0 ? 'text-red-500' : 'text-green-600')}>
                                {passedCount}/{testResults.length}
                            </span>
                        )}
                    </button>
                </div>

                {activePanel === 'editor' ? (
                    <div className="flex-1 pt-1">
                        <Editor
                            height="100%"
                            language="javascript"
                            theme="light"
                            value={activeScriptType === 'pre-request' ? scripts.preRequest : scripts.postResponse}
                            onChange={(val) => {
                                const key = activeScriptType === 'pre-request' ? 'preRequest' : 'postResponse';
                                updateActiveTab({ scripts: { ...scripts, [key]: val || '' } });
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
                ) : (
                    <div className="flex-1 overflow-auto p-4 space-y-4">
                        {/* Test Results */}
                        {testResults.length > 0 && (
                            <div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Test Results</div>
                                <div className="flex flex-col gap-1">
                                    {testResults.map((result, idx) => (
                                        <div
                                            key={idx}
                                            className={clsx(
                                                'flex items-start gap-2 p-2 rounded text-xs',
                                                result.passed ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                                            )}
                                        >
                                            {result.passed
                                                ? <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-green-500" />
                                                : <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-500" />
                                            }
                                            <div>
                                                <div className="font-medium">{result.name}</div>
                                                {result.error && (
                                                    <div className="text-[11px] opacity-70 mt-0.5">{result.error}</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Console Logs */}
                        {scriptLogs.length > 0 && (
                            <div>
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <Terminal className="w-3 h-3" /> Console
                                </div>
                                <div className="bg-slate-900 rounded p-3 flex flex-col gap-1 font-mono text-[11px] text-green-400">
                                    {scriptLogs.map((log, idx) => (
                                        <div key={idx} className={clsx(
                                            log.startsWith('[ERROR]') ? 'text-red-400' :
                                                log.startsWith('[WARN]') ? 'text-yellow-400' : 'text-green-400'
                                        )}>
                                            {'> '}{log}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!hasResults && (
                            <div className="text-center text-slate-400 text-sm py-8">
                                No results yet. Send a request to execute scripts.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Right: Snippets */}
            <div className="w-56 border-l border-slate-200 bg-slate-50 flex flex-col h-full shrink-0">
                <div className="text-xs font-semibold text-slate-500 uppercase px-4 py-2 border-b border-slate-200 tracking-wider">
                    Snippets
                </div>
                <div className="flex-1 overflow-y-auto p-2 no-scrollbar">
                    <p className="text-xs text-slate-400 mb-2 px-2">Click to insert snippet</p>
                    <div className="flex flex-col gap-0.5">
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

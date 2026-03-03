import React, { useState, useRef, useEffect } from 'react';
import { Editor, type Monaco } from '@monaco-editor/react';

const snippets = [
    { title: 'Get an global variable', code: 'cedClient.globals.get("variable_key");' },
    { title: 'Set an global variable', code: 'cedClient.globals.set("variable_key", "variable_value");' },
    { title: 'Get an environment variable', code: 'cedClient.environment.get("variable_key");' },
    { title: 'Set an environment variable', code: 'cedClient.environment.set("variable_key", "variable_value");' },
    { title: 'Status code: Code is 200', code: 'cedClient.test("Status code is 200", function () {\n    cedClient.response.to.have.status(200);\n});' },
    { title: 'Response body: Contains string', code: 'cedClient.test("Body matches string", function () {\n    cedClient.expect(cedClient.response.text()).to.include("string_you_want_to_search");\n});' },
    { title: 'Response body: JSON value check', code: 'cedClient.test("Your test name", function () {\n    var jsonData = cedClient.response.json();\n    cedClient.expect(jsonData.value).to.eql(100);\n});' },
    { title: 'Add a request header (Pre-request)', code: 'cedClient.request.headers.add({ key: "Authorization", value: "Bearer token" });' }
];

export const ScriptsTab: React.FC = () => {
    const [activeScript, setActiveScript] = useState<'pre-request' | 'post-response'>('pre-request');
    const [preRequestScript, setPreRequestScript] = useState('// Write a script that executes before the request is sent\n// console.log("Before request");');
    const [postResponseScript, setPostResponseScript] = useState('// Write a script that executes after the response is received\n// cedClient.test("Status code is 200", function () { ... });');

    const handleSnippetClick = (code: string) => {
        if (activeScript === 'pre-request') {
            setPreRequestScript((prev) => prev ? `${prev}\n${code}` : code);
        } else {
            setPostResponseScript((prev) => prev ? `${prev}\n${code}` : code);
        }
    };

    const monacoRef = useRef<Monaco | null>(null);

    const updateExtraLib = (monaco: Monaco, type: 'pre-request' | 'post-response') => {
        const libContent = `
declare const cedClient: {
    /** Global variable management */
    globals: {
        get(key: string): any;
        set(key: string, value: any): void;
    };
    /** Environment variable management */
    environment: {
        get(key: string): any;
        set(key: string, value: any): void;
    };
    /** The HTTP request data (Pre-request) */
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
    /** The HTTP response data (Post-response) */
    response: {
        text(): string;
        json(): any;
        to: {
            have: {
                status(code: number): void;
            };
        };
    };
    /** Define a test case */
    test(name: string, fn: () => void): void;
    /** Expect an assertion */
    expect(val: any): any;
` : ''}
};
`;
        monaco.languages.typescript.javascriptDefaults.setExtraLibs([{
            content: libContent,
            filePath: 'cedClient.d.ts'
        }]);
    };

    const handleEditorBeforeMount = (monaco: Monaco) => {
        monacoRef.current = monaco;
        updateExtraLib(monaco, activeScript);
    };

    useEffect(() => {
        if (monacoRef.current) {
            updateExtraLib(monacoRef.current, activeScript);
        }
    }, [activeScript]);

    return (
        <div className="flex h-full w-full bg-white">
            {/* Left Navigation */}
            <div className="w-48 bg-white border-r border-slate-200 flex flex-col py-3 px-2 gap-1 shrink-0">
                <button
                    onClick={() => setActiveScript('pre-request')}
                    className={`text-left px-3 py-2 rounded text-sm transition-colors ${activeScript === 'pre-request'
                        ? 'bg-slate-100 text-slate-800 font-medium'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    Pre-request
                </button>
                <button
                    onClick={() => setActiveScript('post-response')}
                    className={`text-left px-3 py-2 rounded text-sm transition-colors ${activeScript === 'post-response'
                        ? 'bg-slate-100 text-slate-800 font-medium'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    Post-response
                </button>
            </div>

            {/* Editor Area */}
            <div className="flex-1 w-full h-full pt-1">
                {activeScript === 'pre-request' ? (
                    <Editor
                        height="100%"
                        language="javascript"
                        theme="light"
                        value={preRequestScript}
                        onChange={(val) => setPreRequestScript(val || '')}
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
                ) : (
                    <Editor
                        height="100%"
                        language="javascript"
                        theme="light"
                        value={postResponseScript}
                        onChange={(val) => setPostResponseScript(val || '')}
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
                )}
            </div>

            {/* Snippets Sidebar */}
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

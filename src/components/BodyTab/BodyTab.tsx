import React, { useRef } from 'react';
import { DataGrid } from '../DataGrid';
import { Editor } from '@monaco-editor/react';
import { ChevronDown } from 'lucide-react';
import { html as beautifyHtml } from 'js-beautify';
import formatXml from 'xml-formatter';
import { useRequestStore } from '../../store/useRequestStore';
import clsx from 'clsx';

const bodyTypes = [
    { id: 'none', label: 'none' },
    { id: 'form-data', label: 'form-data' },
    { id: 'x-www-form-urlencoded', label: 'x-www-form-urlencoded' },
    { id: 'raw', label: 'raw' },
    { id: 'binary', label: 'binary' },
    { id: 'graphql', label: 'GraphQL' },
];

const rawFormats = [
    { id: 'json', label: 'JSON' },
    { id: 'text', label: 'Text' },
    { id: 'xml', label: 'XML' },
    { id: 'html', label: 'HTML' },
];

export const BodyTab: React.FC = () => {
    const { tabs, activeTabId, updateActiveTab } = useRequestStore();
    const activeTab = tabs.find(t => t.id === activeTabId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editorRef = useRef<any>(null);

    if (!activeTab) return null;

    const { body } = activeTab;

    const setBodyUpdate = (updates: Partial<typeof body>) => {
        updateActiveTab({
            body: { ...body, ...updates }
        });
    };

    const handleEditorDidMount = (editor: any) => {
        editorRef.current = editor;
    };

    const handleFormat = () => {
        try {
            if (body.rawType === 'JSON') {
                const formatted = JSON.stringify(JSON.parse(body.content), null, 2);
                setBodyUpdate({ content: formatted });
            } else if (body.rawType === 'HTML') {
                const formatted = beautifyHtml(body.content, { indent_size: 2 });
                setBodyUpdate({ content: formatted });
            } else if (body.rawType === 'XML') {
                const formatted = formatXml(body.content, { indentation: '  ', collapseContent: true, lineSeparator: '\n' });
                setBodyUpdate({ content: formatted });
            } else if (editorRef.current) {
                editorRef.current.getAction('editor.action.formatDocument').run();
            }
        } catch {
            // Ignore parse errors
        }
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Type Selector Bar */}
            <div className="flex px-4 py-2 border-b border-slate-200 items-center justify-between text-sm overflow-x-auto no-scrollbar shrink-0">
                <div className="flex items-center gap-4">
                    {bodyTypes.map((type) => (
                        <label key={type.id} className="flex items-center gap-1.5 cursor-pointer group whitespace-nowrap">
                            <div className="relative flex items-center justify-center w-4 h-4">
                                <input
                                    type="radio"
                                    name="bodyType"
                                    value={type.id}
                                    checked={body.type === type.id}
                                    onChange={() => setBodyUpdate({ type: type.id as any })}
                                    className="appearance-none w-4 h-4 border border-slate-400 rounded-full checked:border-orange-500 checked:border-[4px] transition-all cursor-pointer group-hover:border-orange-400"
                                />
                            </div>
                            <span className={clsx(
                                "text-slate-600 group-hover:text-slate-800 transition-colors font-medium",
                                body.type === type.id && "text-slate-800"
                            )}>
                                {type.label}
                            </span>
                        </label>
                    ))}
                </div>

                {body.type === 'raw' && (
                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <select
                                value={body.rawType}
                                onChange={(e) => setBodyUpdate({ rawType: e.target.value as any })}
                                className="appearance-none bg-transparent hover:bg-slate-100 text-slate-600 font-medium border border-transparent hover:border-slate-200 rounded px-3 py-1 pl-2 pr-8 outline-none cursor-pointer transition-colors"
                            >
                                {rawFormats.map(fmt => (
                                    <option key={fmt.id} value={fmt.label}>{fmt.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        <div className="w-px h-4 bg-slate-200 mx-1"></div>

                        <button
                            onClick={handleFormat}
                            className="text-orange-600 hover:text-orange-700 font-medium hover:bg-orange-50 px-2 py-1 rounded transition-colors"
                        >
                            Beautify
                        </button>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {body.type === 'none' && (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                        This request does not have a body
                    </div>
                )}

                {body.type === 'form-data' && (
                    <DataGrid rows={body.formData} onChange={(rows) => setBodyUpdate({ formData: rows })} supportFile />
                )}

                {body.type === 'x-www-form-urlencoded' && (
                    <DataGrid rows={body.urlencoded} onChange={(rows) => setBodyUpdate({ urlencoded: rows })} />
                )}

                {body.type === 'raw' && (
                    <div className="w-full h-full pt-2">
                        <Editor
                            height="100%"
                            language={body.rawType.toLowerCase()}
                            theme="light"
                            value={body.content}
                            onMount={handleEditorDidMount}
                            onChange={(val) => setBodyUpdate({ content: val || '' })}
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
                )}

                {body.type === 'binary' && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm gap-4 p-8">
                        <label className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center w-full max-w-md hover:border-orange-400 hover:bg-orange-50/50 transition-colors cursor-pointer group flex flex-col items-center justify-center">
                            <p className="text-slate-600 group-hover:text-orange-600 font-medium mb-1 truncate max-w-full px-4 text-center">
                                Select a file
                            </p>
                            <p className="text-slate-400 text-xs">
                                Drop a file here or click to browse
                            </p>
                            <input
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        // For now, we just mock storing file info in store
                                        // Storing real file objects in JSON store is not recommended
                                        setBodyUpdate({ content: `File: ${file.name}` });
                                    }
                                }}
                            />
                        </label>
                    </div>
                )}

                {body.type === 'graphql' && (
                    <div className="w-full h-full pt-2">
                        <Editor
                            height="100%"
                            language="graphql"
                            theme="light"
                            value={body.content}
                            onChange={(val) => setBodyUpdate({ content: val || '' })}
                            options={{
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                fontSize: 13,
                                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                                lineNumbersMinChars: 3,
                                folding: true,
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

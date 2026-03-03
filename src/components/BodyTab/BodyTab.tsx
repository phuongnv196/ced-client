import React, { useState, useRef } from 'react';
import { DataGrid, type DataGridRow } from '../DataGrid';
import { Editor } from '@monaco-editor/react';
import { ChevronDown, FileJson, FileText, Code2, Code } from 'lucide-react';
import { html as beautifyHtml } from 'js-beautify';
import formatXml from 'xml-formatter';
import clsx from 'clsx';

const bodyTypes = [
    { id: 'none', label: 'none' },
    { id: 'form-data', label: 'form-data' },
    { id: 'urlencoded', label: 'x-www-form-urlencoded' },
    { id: 'raw', label: 'raw' },
    { id: 'binary', label: 'binary' },
    { id: 'graphql', label: 'GraphQL' },
];

const rawFormats = [
    { id: 'json', label: 'JSON', icon: FileJson },
    { id: 'text', label: 'Text', icon: FileText },
    { id: 'xml', label: 'XML', icon: Code2 },
    { id: 'html', label: 'HTML', icon: Code },
];

export const BodyTab: React.FC = () => {
    const [bodyType, setBodyType] = useState('none');

    // States for different body types
    const [formData, setFormData] = useState<DataGridRow[]>([]);
    const [urlEncoded, setUrlEncoded] = useState<DataGridRow[]>([]);
    const [rawFormat, setRawFormat] = useState('json');
    const [rawContent, setRawContent] = useState('{\n  \n}');
    const [binaryFile, setBinaryFile] = useState<File | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editorRef = useRef<any>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleEditorDidMount = (editor: any) => {
        editorRef.current = editor;
    };

    const handleFormat = () => {
        try {
            if (rawFormat === 'json') {
                const formatted = JSON.stringify(JSON.parse(rawContent), null, 2);
                setRawContent(formatted);
            } else if (rawFormat === 'html') {
                const formatted = beautifyHtml(rawContent, { indent_size: 2 });
                setRawContent(formatted);
            } else if (rawFormat === 'xml') {
                const formatted = formatXml(rawContent, { indentation: '  ', collapseContent: true, lineSeparator: '\n' });
                setRawContent(formatted);
            } else if (editorRef.current) {
                // Trigger Monaco's native formatter for others
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
                                    checked={bodyType === type.id}
                                    onChange={() => setBodyType(type.id)}
                                    className="appearance-none w-4 h-4 border border-slate-400 rounded-full checked:border-orange-500 checked:border-[4px] transition-all cursor-pointer group-hover:border-orange-400"
                                />
                            </div>
                            <span className={clsx(
                                "text-slate-600 group-hover:text-slate-800 transition-colors font-medium",
                                bodyType === type.id && "text-slate-800"
                            )}>
                                {type.label}
                            </span>
                        </label>
                    ))}
                </div>

                {bodyType === 'raw' && (
                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <select
                                value={rawFormat}
                                onChange={(e) => setRawFormat(e.target.value)}
                                className="appearance-none bg-transparent hover:bg-slate-100 text-slate-600 font-medium border border-transparent hover:border-slate-200 rounded px-3 py-1 pl-2 pr-8 outline-none cursor-pointer transition-colors"
                            >
                                {rawFormats.map(fmt => (
                                    <option key={fmt.id} value={fmt.id}>{fmt.label}</option>
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
                {bodyType === 'none' && (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                        This request does not have a body
                    </div>
                )}

                {bodyType === 'form-data' && (
                    <DataGrid rows={formData} onChange={setFormData} supportFile />
                )}

                {bodyType === 'urlencoded' && (
                    <DataGrid rows={urlEncoded} onChange={setUrlEncoded} />
                )}

                {bodyType === 'raw' && (
                    <div className="w-full h-full pt-2">
                        <Editor
                            height="100%"
                            language={rawFormat}
                            theme="light"
                            value={rawContent}
                            onMount={handleEditorDidMount}
                            onChange={(val) => setRawContent(val || '')}
                            options={{
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                fontSize: 13,
                                fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                                wordWrap: 'on',
                                lineNumbersMinChars: 3,
                                folding: true,
                                formatOnPaste: true,
                            }}
                        />
                    </div>
                )}

                {bodyType === 'binary' && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm gap-4 p-8">
                        <label className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center w-full max-w-md hover:border-orange-400 hover:bg-orange-50/50 transition-colors cursor-pointer group flex flex-col items-center justify-center">
                            <p className="text-slate-600 group-hover:text-orange-600 font-medium mb-1 truncate max-w-full px-4">
                                {binaryFile ? binaryFile.name : 'Select a file'}
                            </p>
                            <p className="text-slate-400 text-xs">
                                {binaryFile ? `${(binaryFile.size / 1024).toFixed(2)} KB` : 'Drop a file here or click to browse'}
                            </p>
                            <input
                                type="file"
                                className="hidden"
                                onChange={(e) => setBinaryFile(e.target.files?.[0] || null)}
                            />
                        </label>
                        {binaryFile && (
                            <button
                                onClick={() => setBinaryFile(null)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded transition-colors"
                            >
                                Clear file
                            </button>
                        )}
                    </div>
                )}

                {bodyType === 'graphql' && (
                    <div className="w-full h-full pt-2 flex">
                        <div className="flex-1 border-r border-slate-200">
                            <Editor
                                height="100%"
                                language="graphql"
                                theme="light"
                                defaultValue="# Write your internal GraphQL query"
                                options={{
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    fontSize: 13,
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

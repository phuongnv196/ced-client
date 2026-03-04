import React, { useRef, useState, useCallback } from 'react';
import { DataGrid } from '../DataGrid';
import { Editor } from '@monaco-editor/react';
import { ChevronDown, Upload, X, FileText, FileImage, FileArchive } from 'lucide-react';
import { html as beautifyHtml } from 'js-beautify';
import formatXml from 'xml-formatter';
import { useRequestStore } from '../../store/useRequestStore';
import { fileRegistry } from '../../utils/fileRegistry';
import clsx from 'clsx';

const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) return FileImage;
    if (mime.includes('zip') || mime.includes('archive') || mime.includes('compressed')) return FileArchive;
    return FileText;
};

const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${bytes} B`;
};

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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editorRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleFileSelect = useCallback((file: File) => {
        setSelectedFile(file);
        fileRegistry.set(activeTab.id, file);
        // Save file metadata into dedicated binaryFile field, NOT body.content
        setBodyUpdate({ binaryFile: { name: file.name, size: file.size, type: file.type } });
    }, [activeTab.id, body]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
        // Reset so same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => setIsDragOver(false);

    const clearFile = () => {
        setSelectedFile(null);
        fileRegistry.remove(activeTab.id);
        setBodyUpdate({ binaryFile: null });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Restore file info from store's binaryFile field when switching tabs
    const displayFile = selectedFile
        ? { name: selectedFile.name, size: selectedFile.size, type: selectedFile.type }
        : body.binaryFile ?? null;

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
                        {/* Hidden real file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleInputChange}
                        />

                        {displayFile ? (
                            /* File selected state */
                            <div className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                                {(() => {
                                    const IconComp = getFileIcon(displayFile.type || '');
                                    return <IconComp className="w-10 h-10 text-orange-500 shrink-0" />;
                                })()}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-800 truncate">{displayFile.name}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {formatFileSize(displayFile.size)}
                                        {displayFile.type && ` • ${displayFile.type}`}
                                    </p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-xs text-blue-500 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                    >
                                        Change
                                    </button>
                                    <button
                                        onClick={clearFile}
                                        className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50"
                                        title="Remove file"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Drop zone */
                            <div
                                className={clsx(
                                    "border-2 border-dashed rounded-xl p-12 text-center w-full max-w-md transition-all cursor-pointer flex flex-col items-center justify-center gap-3",
                                    isDragOver
                                        ? "border-orange-400 bg-orange-50 scale-[0.99]"
                                        : "border-slate-300 hover:border-orange-400 hover:bg-orange-50/30"
                                )}
                                onClick={() => fileInputRef.current?.click()}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                            >
                                <Upload className={clsx(
                                    "w-10 h-10 transition-colors",
                                    isDragOver ? "text-orange-500" : "text-slate-300"
                                )} />
                                <div>
                                    <p className={clsx(
                                        "font-semibold mb-0.5 transition-colors",
                                        isDragOver ? "text-orange-600" : "text-slate-600"
                                    )}>
                                        {isDragOver ? 'Drop to select' : 'Select a file'}
                                    </p>
                                    <p className="text-slate-400 text-xs">
                                        Drop a file here or <span className="text-orange-500 font-medium">click to browse</span>
                                    </p>
                                </div>
                            </div>
                        )}
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

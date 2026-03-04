import React, { useState, useMemo } from 'react';
import clsx from 'clsx';
import { Editor } from '@monaco-editor/react';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface ResponsePanelProps {
    response: any;
}

// ─── JSON Tree Viewer ────────────────────────────────────────────────────────
const JsonNode: React.FC<{ data: any; depth?: number; keyName?: string }> = ({ data, depth = 0, keyName }) => {
    const [open, setOpen] = useState(depth < 2);
    const indent = depth * 16;

    const renderPrimitive = (val: any) => {
        if (val === null) return <span className="text-slate-400 italic">null</span>;
        if (typeof val === 'boolean') return <span className="text-purple-600 font-semibold">{String(val)}</span>;
        if (typeof val === 'number') return <span className="text-blue-600">{val}</span>;
        if (typeof val === 'string') return <span className="text-green-700">"{val}"</span>;
        return <span>{String(val)}</span>;
    };

    const isComplex = typeof data === 'object' && data !== null;
    const isArray = Array.isArray(data);
    const entries = isComplex ? (isArray ? data.map((v: any, i: number) => [i, v]) : Object.entries(data)) : [];
    const count = entries.length;
    const brackets = isArray ? ['[', ']'] : ['{', '}'];

    return (
        <div style={{ marginLeft: indent }} className="font-mono text-xs leading-5">
            {isComplex ? (
                <span>
                    {keyName !== undefined && (
                        <span className="text-slate-700 font-medium">"{keyName}": </span>
                    )}
                    <button
                        onClick={() => setOpen(o => !o)}
                        className="inline-flex items-center text-slate-500 hover:text-slate-800"
                    >
                        {open ? <ChevronDown className="w-3 h-3 mr-0.5" /> : <ChevronRight className="w-3 h-3 mr-0.5" />}
                        <span className="text-slate-500">{brackets[0]}</span>
                        {!open && <span className="text-slate-400 ml-1">{count} {isArray ? 'items' : 'keys'}{brackets[1]}</span>}
                    </button>
                    {open && (
                        <div>
                            {entries.map((entry: any[]) => {
                                const [k, v] = entry;
                                return <JsonNode key={k} data={v} depth={depth + 1} keyName={isArray ? undefined : String(k)} />;
                            })}
                            <div style={{ marginLeft: 0 }} className="text-slate-500">{brackets[1]}</div>
                        </div>
                    )}
                </span>
            ) : (
                <span>
                    {keyName !== undefined && (
                        <span className="text-slate-700 font-medium">"{keyName}": </span>
                    )}
                    {renderPrimitive(data)}
                </span>
            )}
        </div>
    );
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const detectContentType = (response: any): 'json' | 'html' | 'xml' | 'image' | 'text' => {
    const ct: string = response.headers?.['content-type'] || '';
    if (ct.includes('image/') || (typeof response.data === 'string' && response.data.startsWith('data:image/'))) return 'image';
    if (typeof response.data === 'object' && response.data !== null) return 'json';
    if (typeof response.data === 'string') {
        const trimmed = response.data.trimStart();
        // Try JSON
        try { JSON.parse(response.data); return 'json'; } catch { /* not json */ }
        // HTML
        if (ct.includes('text/html') || trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.startsWith('<!doctype')) return 'html';
        // XML
        if (ct.includes('application/xml') || ct.includes('text/xml') || trimmed.startsWith('<?xml') || trimmed.startsWith('<')) return 'xml';
    }
    return 'text';
};

const getRawText = (data: any): string => {
    if (!data) return '';
    if (typeof data === 'object') return JSON.stringify(data);
    return String(data);
};

const getPrettyText = (data: any, type: string): string => {
    if (!data) return '';
    if (type === 'json') {
        try {
            const obj = typeof data === 'string' ? JSON.parse(data) : data;
            return JSON.stringify(obj, null, 2);
        } catch {
            return String(data);
        }
    }
    if (type === 'html' || type === 'xml' || type === 'text') {
        return typeof data === 'string' ? data : String(data);
    }
    return String(data);
};

const getMonacoLanguage = (type: string, viewMode: string): string => {
    if (viewMode === 'raw') return 'text';
    if (type === 'json') return 'json';
    if (type === 'html') return 'html';
    if (type === 'xml') return 'xml';
    return 'text';
};

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ code: number; text: string }> = ({ code, text }) => {
    const color = code >= 200 && code < 300 ? 'text-green-600' : code >= 400 ? 'text-red-600' : 'text-yellow-600';
    return <span className={clsx('font-bold', color)}>{code} {text}</span>;
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const ResponsePanel: React.FC<ResponsePanelProps> = ({ response }) => {
    const [activeTab, setActiveTab] = useState('Body');
    const [viewMode, setViewMode] = useState<'pretty' | 'raw' | 'preview'>('pretty');

    // All derived values computed via useMemo — hooks must be before any early return
    const contentType = useMemo(() => response ? detectContentType(response) : 'text', [response]);
    const rawText = useMemo(() => response ? getRawText(response.data) : '', [response]);
    const prettyText = useMemo(() => response ? getPrettyText(response.data, contentType) : '', [response, contentType]);
    const monacoLang = useMemo(() => getMonacoLanguage(contentType, viewMode), [contentType, viewMode]);
    const editorValue = useMemo(() => viewMode === 'raw' ? rawText : prettyText, [viewMode, rawText, prettyText]);
    const parsedJson = useMemo(() => {
        if (!response || contentType !== 'json') return null;
        try {
            return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        } catch { return null; }
    }, [response, contentType]);

    const statusCode = response?.status || 0;
    const statusText = response?.statusText || '';
    const time = response?.time ? `${response.time} ms` : '0 ms';
    const size = response?.size || '0 B';
    const contentTypeLabel = ({ json: 'JSON', html: 'HTML', xml: 'XML', image: 'IMAGE', text: 'TEXT' } as Record<string, string>)[contentType];

    // Empty state — AFTER all hooks
    if (!response) {
        return (
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
                <div className="flex border-b border-slate-200 text-sm px-4 pt-2 gap-6 font-medium text-slate-500 bg-slate-50">
                    <button className="pb-2 text-slate-800 border-b-2 border-orange-500">Response</button>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm p-4 text-center gap-4">
                    <svg className="w-20 h-20 opacity-10" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10h2v2H6zm0 4h8v2H6zm10 0h2v2h-2zm-6-4h8v2h-8z" />
                    </svg>
                    <div>
                        <p className="font-semibold text-slate-500 mb-1">Enter a URL and click Send</p>
                        <p className="text-slate-400 text-xs">The response will appear here</p>
                    </div>
                </div>
            </div>
        );
    }

    // Decide what to show in the body area
    const renderBodyContent = () => {
        // IMAGE: all modes show image, but preview shows fullscreen
        if (contentType === 'image') {
            return (
                <div className={clsx('flex h-full items-center justify-center p-8', viewMode === 'preview' ? 'bg-[#1e1e1e]' : 'bg-slate-50')}>
                    <div className={clsx('rounded overflow-hidden shadow-lg', viewMode === 'preview' ? '' : 'bg-white p-2')}>
                        <img src={response.data} alt="Response" className="max-w-full max-h-[400px] object-contain" />
                    </div>
                </div>
            );
        }

        // PREVIEW mode
        if (viewMode === 'preview') {
            // HTML → iframe
            if (contentType === 'html') {
                return (
                    <iframe
                        srcDoc={typeof response.data === 'string' ? response.data : prettyText}
                        className="w-full h-full border-0 bg-white"
                        sandbox="allow-scripts"
                        title="HTML Preview"
                    />
                );
            }
            // JSON → tree viewer
            if (contentType === 'json' && parsedJson !== null) {
                return (
                    <div className="h-full overflow-auto p-4 bg-white">
                        <JsonNode data={parsedJson} depth={0} />
                    </div>
                );
            }
            // XML / Text → rendered as plain text
            return (
                <div className="h-full overflow-auto p-4 bg-white">
                    <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap break-words">{rawText}</pre>
                </div>
            );
        }

        // PRETTY or RAW → Monaco editor
        return (
            <Editor
                height="100%"
                language={monacoLang}
                value={editorValue}
                options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    lineNumbersMinChars: 3,
                    renderLineHighlight: 'none',
                    folding: true,
                    wordWrap: viewMode === 'raw' ? 'off' : 'on',
                }}
            />
        );
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
            {/* Top tabs + metadata */}
            <div className="flex border-b border-slate-200 text-sm px-4 pt-2 gap-6 font-medium text-slate-500 bg-slate-50 justify-between items-center shrink-0">
                <div className="flex gap-6">
                    {['Body', 'Cookies', 'Headers', 'Test Results'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={clsx(
                                'pb-2 transition-colors',
                                activeTab === tab ? 'text-slate-800 border-b-2 border-orange-500' : 'hover:text-slate-800'
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                        <span className="text-slate-400">Status:</span>
                        <StatusBadge code={statusCode} text={statusText} />
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

            {/* Content area */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'Body' && (
                    <div className="h-full flex flex-col">
                        {/* View mode toolbar */}
                        <div className="flex items-center gap-3 px-4 py-1.5 border-b border-slate-100 text-xs text-slate-500 bg-white shrink-0">
                            {(['pretty', 'raw', 'preview'] as const).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={clsx(
                                        'capitalize px-2 py-0.5 rounded transition-colors',
                                        viewMode === mode
                                            ? 'text-orange-600 font-bold bg-orange-50'
                                            : 'hover:text-orange-600 hover:bg-orange-50/50'
                                    )}
                                >
                                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                </button>
                            ))}
                            <div className="w-px h-3 bg-slate-200" />
                            <span className="text-slate-500 font-semibold uppercase tracking-wide">{contentTypeLabel}</span>

                            {/* Preview hint */}
                            {viewMode === 'preview' && contentType === 'json' && (
                                <span className="ml-auto text-slate-400 italic">Collapsible tree view</span>
                            )}
                            {viewMode === 'preview' && contentType === 'html' && (
                                <span className="ml-auto text-slate-400 italic">Rendered in sandbox iframe</span>
                            )}
                            {viewMode === 'raw' && (
                                <span className="ml-auto text-slate-400 italic">Unformatted · {rawText.length.toLocaleString()} chars</span>
                            )}
                        </div>

                        {/* Body content */}
                        <div className="flex-1 overflow-hidden">
                            {renderBodyContent()}
                        </div>
                    </div>
                )}

                {activeTab === 'Headers' && (
                    <div className="h-full overflow-y-auto p-4">
                        <table className="w-full text-xs text-left text-slate-600">
                            <thead className="bg-slate-50 text-slate-400 border-b border-slate-200">
                                <tr>
                                    <th className="px-3 py-2 font-semibold w-1/3">HEADER</th>
                                    <th className="px-3 py-2 font-semibold">VALUE</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {Object.entries(response.headers || {}).map(([key, value]) => (
                                    <tr key={key} className="hover:bg-slate-50/50">
                                        <td className="px-3 py-2 font-medium text-slate-800">{key}</td>
                                        <td className="px-3 py-2 break-all text-slate-600">{String(value)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'Cookies' && (
                    <div className="p-8 text-center text-slate-400 text-sm italic">
                        No cookies to show
                    </div>
                )}

                {activeTab === 'Test Results' && (
                    <div className="p-8 text-center text-slate-400 text-sm italic">
                        No test results to show
                    </div>
                )}
            </div>
        </div>
    );
};

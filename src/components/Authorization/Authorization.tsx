import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useRequestStore } from '../../store/useRequestStore';

const authTypes = [
    { id: 'noauth', label: 'No Auth' },
    { id: 'apikey', label: 'API Key' },
    { id: 'bearer', label: 'Bearer Token' },
    { id: 'basic', label: 'Basic Auth' },
];

const inputClass =
    'flex-1 border border-slate-300 rounded px-3 py-2 outline-none text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors';
const labelClass = 'w-28 text-right text-slate-600 font-medium text-sm shrink-0';

export const Authorization: React.FC = () => {
    const { tabs, activeTabId, updateActiveTab } = useRequestStore();
    const activeTab = tabs.find(t => t.id === activeTabId);

    if (!activeTab) return null;

    // Ensure auth always has a default shape (for old tabs without auth field)
    const auth = activeTab.auth ?? {
        type: 'noauth' as const,
        apiKey: { key: '', value: '', addTo: 'Header' as const },
        bearer: '',
        basic: { username: '', password: '' },
    };

    const setAuth = (updates: Partial<typeof auth>) => {
        updateActiveTab({ auth: { ...auth, ...updates } });
    };

    return (
        <div className="flex h-full w-full text-sm bg-white">
            {/* Left Column: Type Selector */}
            <div className="w-64 border-r border-slate-200 p-4 bg-slate-50 flex flex-col gap-2 shrink-0">
                <label className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-2">Type</label>
                <div className="relative group">
                    <select
                        value={auth.type}
                        onChange={(e) => setAuth({ type: e.target.value as any })}
                        className="w-full appearance-none bg-white border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer"
                    >
                        {authTypes.map(type => (
                            <option key={type.id} value={type.id}>{type.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <div className="mt-4 flex-1">
                    <p className="text-xs text-slate-400 leading-relaxed">
                        The authorization header will be automatically generated when you send the request.
                    </p>
                </div>
            </div>

            {/* Right Column: Details */}
            <div className="flex-1 p-6 overflow-auto">
                {auth.type === 'noauth' && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                        <svg className="w-10 h-10 opacity-20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C9.24 2 7 4.24 7 7v2H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V11c0-1.1-.9-2-2-2h-2V7c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v2H9V7c0-1.66 1.34-3 3-3zm0 9c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
                        </svg>
                        <p className="text-sm">This request does not use any authorization.</p>
                        <p className="text-xs text-slate-300">Select a type from the left panel.</p>
                    </div>
                )}

                {auth.type === 'apikey' && (
                    <div className="max-w-xl space-y-5">
                        <h3 className="text-slate-700 font-semibold text-base">API Key Authorization</h3>
                        <div className="flex items-center gap-4">
                            <label className={labelClass}>Key</label>
                            <input
                                type="text"
                                value={auth.apiKey.key}
                                onChange={(e) => setAuth({ apiKey: { ...auth.apiKey, key: e.target.value } })}
                                placeholder="Header or param name"
                                className={inputClass}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <label className={labelClass}>Value</label>
                            <input
                                type="text"
                                value={auth.apiKey.value}
                                onChange={(e) => setAuth({ apiKey: { ...auth.apiKey, value: e.target.value } })}
                                placeholder="API key value"
                                className={inputClass}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <label className={labelClass}>Add to</label>
                            <div className="relative flex-1">
                                <select
                                    value={auth.apiKey.addTo}
                                    onChange={(e) => setAuth({ apiKey: { ...auth.apiKey, addTo: e.target.value as any } })}
                                    className="w-full appearance-none border border-slate-300 rounded px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer bg-white"
                                >
                                    <option value="Header">Header</option>
                                    <option value="Query Params">Query Params</option>
                                </select>
                                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                            <strong>Preview:</strong>{' '}
                            {auth.apiKey.addTo === 'Header'
                                ? `Header "${auth.apiKey.key || '<key>'}: ${auth.apiKey.value || '<value>'}"`
                                : `Query param ?${auth.apiKey.key || '<key>'}=${auth.apiKey.value || '<value>'}`}
                        </div>
                    </div>
                )}

                {auth.type === 'bearer' && (
                    <div className="max-w-xl space-y-5">
                        <h3 className="text-slate-700 font-semibold text-base">Bearer Token</h3>
                        <div className="flex items-start gap-4">
                            <label className={`${labelClass} mt-2`}>Token</label>
                            <textarea
                                value={auth.bearer}
                                onChange={(e) => setAuth({ bearer: e.target.value })}
                                placeholder="Enter token"
                                rows={3}
                                className="flex-1 border border-slate-300 rounded px-3 py-2 outline-none text-sm font-mono focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors resize-none"
                            />
                        </div>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                            <strong>Preview:</strong> Authorization: Bearer {auth.bearer ? auth.bearer.substring(0, 20) + (auth.bearer.length > 20 ? '...' : '') : '<token>'}
                        </div>
                    </div>
                )}

                {auth.type === 'basic' && (
                    <div className="max-w-xl space-y-5">
                        <h3 className="text-slate-700 font-semibold text-base">Basic Auth</h3>
                        <div className="flex items-center gap-4">
                            <label className={labelClass}>Username</label>
                            <input
                                type="text"
                                value={auth.basic.username}
                                onChange={(e) => setAuth({ basic: { ...auth.basic, username: e.target.value } })}
                                placeholder="Username"
                                className={inputClass}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <label className={labelClass}>Password</label>
                            <input
                                type="password"
                                value={auth.basic.password}
                                onChange={(e) => setAuth({ basic: { ...auth.basic, password: e.target.value } })}
                                placeholder="Password"
                                className={inputClass}
                            />
                        </div>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                            <strong>Preview:</strong> Authorization: Basic {auth.basic.username ? btoa(`${auth.basic.username}:${auth.basic.password}`) : '<base64-encoded>'}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

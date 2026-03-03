import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const authTypes = [
    { id: 'noauth', label: 'No Auth' },
    { id: 'apikey', label: 'API Key' },
    { id: 'bearer', label: 'Bearer Token' },
    { id: 'basic', label: 'Basic Auth' }
];

export const Authorization: React.FC = () => {
    const [authType, setAuthType] = useState('noauth');
    const [apiKey, setApiKey] = useState({ key: '', value: '', addTo: 'Header' });
    const [bearer, setBearer] = useState('');
    const [basic, setBasic] = useState({ username: '', password: '' });

    return (
        <div className="flex h-full w-full text-sm bg-white">
            {/* Left Column: Auth Type Selector */}
            <div className="w-64 border-r border-slate-200 p-4 bg-slate-50 flex flex-col gap-2 shrink-0">
                <label className="text-slate-500 font-medium text-xs uppercase tracking-wider mb-2">Type</label>
                <div className="relative group">
                    <select
                        value={authType}
                        onChange={(e) => setAuthType(e.target.value)}
                        className="w-full appearance-none bg-white border border-slate-300 rounded px-3 py-2 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer"
                    >
                        {authTypes.map(type => (
                            <option key={type.id} value={type.id}>{type.label}</option>
                        ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-orange-500 transition-colors" />
                </div>

                <div className="mt-4 flex-1">
                    <p className="text-xs text-slate-400 leading-relaxed text-justify">
                        The authorization header will be automatically generated when you send the request.
                    </p>
                </div>
            </div>

            {/* Right Column: Auth Details */}
            <div className="flex-1 p-6 overflow-auto">
                {authType === 'noauth' && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <p>This request does not use any authorization.</p>
                    </div>
                )}

                {authType === 'apikey' && (
                    <div className="max-w-xl">
                        <h3 className="text-slate-700 font-semibold mb-6 text-base">API Key Authorization</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <label className="w-24 text-right text-slate-600 font-medium">Key</label>
                                <input
                                    type="text"
                                    value={apiKey.key}
                                    onChange={(e) => setApiKey({ ...apiKey, key: e.target.value })}
                                    placeholder="Key"
                                    className="flex-1 border border-slate-300 rounded px-3 py-2 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="w-24 text-right text-slate-600 font-medium">Value</label>
                                <input
                                    type="text"
                                    value={apiKey.value}
                                    onChange={(e) => setApiKey({ ...apiKey, value: e.target.value })}
                                    placeholder="Value"
                                    className="flex-1 border border-slate-300 rounded px-3 py-2 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="w-24 text-right text-slate-600 font-medium">Add to</label>
                                <div className="relative flex-1">
                                    <select
                                        value={apiKey.addTo}
                                        onChange={(e) => setApiKey({ ...apiKey, addTo: e.target.value })}
                                        className="w-full appearance-none border border-slate-300 rounded px-3 py-2 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer bg-white"
                                    >
                                        <option value="Header">Header</option>
                                        <option value="Query Params">Query Params</option>
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {authType === 'bearer' && (
                    <div className="max-w-xl">
                        <h3 className="text-slate-700 font-semibold mb-6 text-base">Bearer Token</h3>
                        <div className="flex items-start gap-4">
                            <label className="w-24 text-right text-slate-600 font-medium mt-2">Token</label>
                            <input
                                type="text"
                                value={bearer}
                                onChange={(e) => setBearer(e.target.value)}
                                placeholder="Token"
                                className="flex-1 border border-slate-300 rounded px-3 py-2 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-mono text-sm leading-relaxed"
                            />
                        </div>
                    </div>
                )}

                {authType === 'basic' && (
                    <div className="max-w-xl">
                        <h3 className="text-slate-700 font-semibold mb-6 text-base">Basic Auth</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <label className="w-24 text-right text-slate-600 font-medium">Username</label>
                                <input
                                    type="text"
                                    value={basic.username}
                                    onChange={(e) => setBasic({ ...basic, username: e.target.value })}
                                    placeholder="Username"
                                    className="flex-1 border border-slate-300 rounded px-3 py-2 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                />
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="w-24 text-right text-slate-600 font-medium">Password</label>
                                <input
                                    type="password"
                                    value={basic.password}
                                    onChange={(e) => setBasic({ ...basic, password: e.target.value })}
                                    placeholder="Password"
                                    className="flex-1 border border-slate-300 rounded px-3 py-2 outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

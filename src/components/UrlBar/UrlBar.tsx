import React, { useState } from 'react';
import { Button } from '../Button';
import { VariableInput } from '../VariableInput/VariableInput';
import clsx from 'clsx';
import { ChevronDown, Save } from 'lucide-react';

const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

const methodColors: Record<string, string> = {
    GET: 'text-green-600',
    POST: 'text-orange-600',
    PUT: 'text-blue-600',
    DELETE: 'text-red-600',
    PATCH: 'text-yellow-600',
};

interface UrlBarProps {
    method: string;
    url: string;
    onChangeMethod: (method: string) => void;
    onChangeUrl: (url: string) => void;
    onSend: () => void;
    onSave: () => void;
}

export const UrlBar: React.FC<UrlBarProps> = ({ method, url, onChangeMethod, onChangeUrl, onSend, onSave }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    return (
        <div className="p-3 bg-white border-b border-slate-200 flex gap-2 items-center">
            <div className="flex border border-slate-300 rounded overflow-visible flex-1 group focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 bg-slate-100 relative">

                {/* Custom Dropdown */}
                <div className="relative">
                    <button
                        className={clsx(
                            "flex items-center justify-between gap-1 outline-none px-3 py-2 text-sm font-bold border-r border-slate-300 cursor-pointer h-full min-w-[100px] hover:bg-slate-200 transition-colors",
                            methodColors[method] || 'text-slate-700'
                        )}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                    >
                        {method}
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-slate-200 rounded shadow-lg z-50 py-1">
                            {methods.map((m) => (
                                <button
                                    key={m}
                                    className={clsx(
                                        "w-full text-left px-4 py-1.5 text-sm font-bold hover:bg-slate-100",
                                        methodColors[m] || 'text-slate-700',
                                        method === m ? 'bg-slate-50' : ''
                                    )}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        onChangeMethod(m);
                                        setIsDropdownOpen(false);
                                    }}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <VariableInput
                    type="text"
                    className="flex-1 bg-white ml-[1px]"
                    inputClassName="px-3 py-2 text-sm font-medium"
                    value={url}
                    onChangeValue={(val) => onChangeUrl(val)}
                    placeholder="Enter request URL"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            onSend();
                        }
                    }}
                />
            </div>

            <div className="flex gap-1 shrink-0">
                <Button variant="secondary" size="md" onClick={onSave} className="flex gap-2 items-center bg-white border border-slate-300 px-4">
                    <Save className="w-4 h-4 text-slate-500" />
                    <span className="font-bold">Save</span>
                </Button>
                <Button variant="primary" size="md" onClick={onSend} className="bg-orange-600 hover:bg-orange-700 font-bold px-8 shadow-sm active:scale-95 transition-all">
                    Send
                </Button>
            </div>
        </div>
    );
};

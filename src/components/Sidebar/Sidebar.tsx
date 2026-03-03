import React from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { Button } from '../Button';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
    return (
        <div className="w-64 border-r border-slate-200 flex flex-col sidebar-container">
            <div className="p-3 border-b border-slate-200 flex items-center justify-between">
                <span className="font-semibold text-sm">My Workspace</span>
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm">New</Button>
                    <Button variant="secondary" size="sm">Import</Button>
                </div>
            </div>
            <div className="p-2 flex-1 overflow-y-auto">
                <div className="relative mb-3">
                    <Search className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search collections"
                        className="w-full pl-7 pr-2 py-1 text-xs border border-transparent hover:border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-400 focus:outline-none rounded"
                    />
                </div>

                <div className="text-sm font-medium text-slate-600 mb-2 px-1 flex items-center justify-between cursor-pointer hover:bg-slate-100 rounded p-1">
                    <div className="flex items-center gap-1">
                        <ChevronDown className="w-4 h-4" />
                        <span>Github Copilot</span>
                    </div>
                </div>
                <div className="pl-6 text-xs flex flex-col gap-1">
                    <div className="py-1 px-2 hover:bg-slate-100 rounded cursor-pointer flex items-center gap-2 bg-slate-200">
                        <span className="text-orange-500 font-semibold w-8">POST</span>
                        <span className="truncate flex-1">Create session</span>
                    </div>
                    <div className="py-1 px-2 hover:bg-slate-100 rounded cursor-pointer flex items-center gap-2">
                        <span className="text-green-600 font-semibold w-8">GET</span>
                        <span className="truncate flex-1">Get Models</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

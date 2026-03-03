import React from 'react';
import { Terminal } from 'lucide-react';
import './StatusBar.css';

export const StatusBar: React.FC = () => {
    return (
        <div className="h-8 border-t border-slate-200 flex items-center justify-between px-4 text-xs text-slate-500 status-bar-container">
            <div className="flex items-center gap-4">
                <Terminal className="w-3.5 h-3.5" />
                <span>Console</span>
            </div>
            <div>
                Cookies • Runner • Vault
            </div>
        </div>
    );
};

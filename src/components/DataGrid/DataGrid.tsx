import React, { useEffect } from 'react';
import { Trash2, X } from 'lucide-react';
import clsx from 'clsx';

export interface DataGridRow {
    id: string;
    enabled: boolean;
    key: string;
    value: string;
    description: string;
    readonly?: boolean;
    type?: 'text' | 'file';
    fileValue?: File | null;
}

interface DataGridProps {
    rows: DataGridRow[];
    onChange: (rows: DataGridRow[]) => void;
    supportFile?: boolean;
}

export const DataGrid: React.FC<DataGridProps> = ({ rows, onChange, supportFile }) => {

    // Ensure there is always one empty row at the bottom
    useEffect(() => {
        if (rows.length === 0 || rows[rows.length - 1].key !== '' || rows[rows.length - 1].value !== '' || rows[rows.length - 1].description !== '') {
            onChange([
                ...rows,
                { id: Math.random().toString(36).substring(7), enabled: false, key: '', value: '', description: '' }
            ]);
        }
    }, [rows, onChange]);

    const handleChange = (id: string, field: keyof DataGridRow, newValue: string | boolean | File | null) => {
        const newRows = rows.map(r => {
            if (r.id === id) {
                const updatedRow = { ...r, [field]: newValue };
                // Automatically check the row if user types a key/value
                if ((field === 'key' || field === 'value') && (newValue as string).length > 0 && !r.enabled && r.key === '' && r.value === '') {
                    updatedRow.enabled = true;
                }
                return updatedRow;
            }
            return r;
        });
        onChange(newRows);
    };

    const handleDelete = (id: string) => {
        onChange(rows.filter(r => r.id !== id));
    };

    return (
        <div className="w-full h-full overflow-auto bg-white">
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="border-b border-slate-200">
                        <th className="w-10 px-2 py-2 border-r border-slate-200"></th>
                        <th className="w-1/3 px-3 py-2 text-left text-slate-500 font-medium border-r border-slate-200">Key</th>
                        <th className="w-1/3 px-3 py-2 text-left text-slate-500 font-medium border-r border-slate-200">Value</th>
                        <th className="px-3 py-2 text-left text-slate-500 font-medium border-r border-slate-200">Description</th>
                        <th className="w-10 px-2 py-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => {
                        const isLastItem = index === rows.length - 1;
                        const isEmpty = row.key === '' && row.value === '' && row.description === '';

                        return (
                            <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50 group">
                                <td className="px-2 py-1 border-r border-slate-200 text-center">
                                    {!isLastItem && !row.readonly && (
                                        <input
                                            type="checkbox"
                                            checked={row.enabled}
                                            onChange={(e) => handleChange(row.id, 'enabled', e.target.checked)}
                                            className="accent-orange-500 w-3.5 h-3.5 mt-1 cursor-pointer"
                                        />
                                    )}
                                    {row.readonly && (
                                        <input
                                            type="checkbox"
                                            checked={row.enabled}
                                            disabled
                                            className="w-3.5 h-3.5 mt-1 opacity-50 cursor-not-allowed"
                                        />
                                    )}
                                </td>
                                <td className="border-r border-slate-200 group/key relative">
                                    <div className="flex items-center h-full w-full">
                                        <input
                                            type="text"
                                            value={row.key}
                                            onChange={(e) => handleChange(row.id, 'key', e.target.value)}
                                            placeholder="Key"
                                            readOnly={row.readonly}
                                            className={clsx(
                                                "flex-1 h-full px-3 py-1.5 outline-none bg-transparent min-w-0 w-full",
                                                !row.enabled && !isEmpty && "text-slate-400 line-through decoration-slate-300",
                                                row.readonly && "text-slate-500 font-medium cursor-default"
                                            )}
                                        />
                                        {supportFile && !row.readonly && !isLastItem && (
                                            <select
                                                value={row.type || 'text'}
                                                onChange={(e) => handleChange(row.id, 'type', e.target.value)}
                                                className="hidden group-hover/key:block absolute right-1 appearance-none bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs py-0.5 px-2 rounded cursor-pointer outline-none border border-slate-200 z-10"
                                            >
                                                <option value="text">Text</option>
                                                <option value="file">File</option>
                                            </select>
                                        )}
                                        {supportFile && !row.readonly && !isLastItem && row.type === 'file' && (
                                            <span className="group-hover/key:hidden absolute right-2 text-[10px] bg-slate-100 text-slate-400 px-1 rounded pointer-events-none">File</span>
                                        )}
                                    </div>
                                </td>
                                <td className="border-r border-slate-200 relative">
                                    {row.type === 'file' ? (
                                        <div className="flex items-center justify-between h-full px-2 py-1 gap-2">
                                            <label className="flex items-center cursor-pointer min-w-0 w-full">
                                                <div className="bg-slate-100/80 hover:bg-slate-200 text-slate-600 text-[11px] font-medium px-2 py-1 rounded border border-slate-200/60 transition-colors whitespace-nowrap shrink-0">
                                                    Select File
                                                </div>
                                                <span className="text-xs text-slate-500 truncate ml-2">
                                                    {row.fileValue ? row.fileValue.name : (row.value || '')}
                                                </span>
                                                <input
                                                    type="file"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0] || null;
                                                        handleChange(row.id, 'fileValue', file);
                                                        if (file) {
                                                            handleChange(row.id, 'value', file.name);
                                                        } else {
                                                            handleChange(row.id, 'value', '');
                                                        }
                                                    }}
                                                    className="hidden"
                                                />
                                            </label>
                                            {(row.fileValue || row.value) && (
                                                <button
                                                    onClick={() => {
                                                        handleChange(row.id, 'fileValue', null);
                                                        handleChange(row.id, 'value', '');
                                                    }}
                                                    className="text-slate-300 hover:text-red-500 p-0.5 rounded transition-colors shrink-0"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            value={row.value}
                                            onChange={(e) => handleChange(row.id, 'value', e.target.value)}
                                            placeholder="Value"
                                            readOnly={row.readonly}
                                            className={clsx(
                                                "w-full h-full px-3 py-1.5 outline-none bg-transparent",
                                                !row.enabled && !isEmpty && "text-slate-400 line-through decoration-slate-300",
                                                row.readonly && "text-slate-500 cursor-default"
                                            )}
                                        />
                                    )}
                                </td>
                                <td className="border-r border-slate-200">
                                    <input
                                        type="text"
                                        value={row.description}
                                        onChange={(e) => handleChange(row.id, 'description', e.target.value)}
                                        placeholder="Description"
                                        readOnly={row.readonly}
                                        className={clsx(
                                            "w-full h-full px-3 py-1.5 outline-none bg-transparent",
                                            !row.enabled && !isEmpty && "text-slate-400",
                                            row.readonly && "cursor-default"
                                        )}
                                    />
                                </td>
                                <td className="px-2 py-1 text-center">
                                    {!isLastItem && !row.readonly && (
                                        <button
                                            onClick={() => handleDelete(row.id)}
                                            className="p-1 px-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

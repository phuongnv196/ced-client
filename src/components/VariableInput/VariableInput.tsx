import React, { useState, useRef, useEffect } from 'react';
import { useRequestStore } from '../../store/useRequestStore';
import clsx from 'clsx';
import './VariableInput.css';

interface VariableInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
    value: string;
    onChangeValue: (val: string) => void;
    inputClassName?: string;
}

export const VariableInput: React.FC<VariableInputProps> = ({ value, onChangeValue, className, inputClassName, ...props }) => {
    const { variables } = useRequestStore();
    const inputRef = useRef<HTMLInputElement>(null);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionIndex, setSuggestionIndex] = useState(0);
    const [caretPos, setCaretPos] = useState<number | null>(null);

    const varKeys = Object.keys(variables);

    // Filter variables for suggestions based on current typing `{{...`
    const getCurrentWord = () => {
        if (caretPos === null || !value) return null;
        const textBeforeCaret = value.slice(0, caretPos);
        const match = textBeforeCaret.match(/\{\{([^{}]*)$/);
        if (match) {
            return {
                prefix: match[1],
                start: match.index !== undefined ? match.index : 0,
                end: caretPos
            };
        }
        return null;
    };

    const currentWord = getCurrentWord();
    const suggestions = currentWord
        ? varKeys.filter(k => k.toLowerCase().includes(currentWord.prefix.toLowerCase()))
        : [];

    useEffect(() => {
        if (currentWord && suggestions.length > 0) {
            setShowSuggestions(true);
            setSuggestionIndex(0);
        } else {
            setShowSuggestions(false);
        }
    }, [currentWord?.prefix, suggestions.length]);

    const handleScroll = (e: React.UIEvent<HTMLInputElement>) => {
        setScrollLeft(e.currentTarget.scrollLeft);
        if (props.onScroll) props.onScroll(e);
    };

    const handleSelectUpdate = () => {
        if (inputRef.current) {
            setCaretPos(inputRef.current.selectionStart);
        }
    };

    const applySuggestion = (varName: string) => {
        if (!currentWord || !inputRef.current) return;
        const before = value.slice(0, currentWord.start);
        const after = value.slice(currentWord.end);

        // Remove trailing '}' if user already typed it
        let cleanAfter = after;
        if (cleanAfter.startsWith('}')) cleanAfter = cleanAfter.slice(1);
        if (cleanAfter.startsWith('}')) cleanAfter = cleanAfter.slice(1);

        const newValue = `${before}{{${varName}}}${cleanAfter}`;
        onChangeValue(newValue);
        setShowSuggestions(false);

        // Restore focus and caret
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                const newPos = before.length + varName.length + 4; // +4 for {{}}
                inputRef.current.setSelectionRange(newPos, newPos);
                setCaretPos(newPos);
            }
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (showSuggestions) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSuggestionIndex((i) => (i + 1) % suggestions.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSuggestionIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
                return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                applySuggestion(suggestions[suggestionIndex]);
                return;
            }
            if (e.key === 'Escape') {
                setShowSuggestions(false);
                return;
            }
        }

        if (props.onKeyDown) props.onKeyDown(e);
        // Defer update selection caret pos
        setTimeout(handleSelectUpdate, 0);
    };

    const renderOverlay = () => {
        if (!value) return null;
        const regex = /\{\{(.*?)\}\}/g;
        const parts = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = regex.exec(value)) !== null) {
            if (match.index > lastIndex) {
                parts.push(<span key={`text-${lastIndex}`}>{value.substring(lastIndex, match.index)}</span>);
            }
            const varName = match[1].trim();
            const varValue = variables[varName];
            const isResolved = variables.hasOwnProperty(varName);

            // Capture these for the async onMouseDown scope
            const matchIndex = match.index;
            const matchLength = match[0].length;

            parts.push(
                <span
                    key={`var-${match.index}`}
                    className={clsx(
                        "pointer-events-auto cursor-text variable-pill transition-colors rounded-sm",
                        isResolved
                            ? "bg-orange-100 text-orange-700"
                            : "bg-red-100 text-red-700 underline"
                    )}
                    title={isResolved ? `${varName}: ${varValue}` : `Unresolved variable: ${varName}`}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        if (inputRef.current) {
                            inputRef.current.focus();
                            let caretOffset = null;
                            if (document.caretRangeFromPoint) {
                                const range = document.caretRangeFromPoint(e.clientX, e.clientY);
                                if (range && range.startContainer.nodeType === Node.TEXT_NODE) {
                                    caretOffset = range.startOffset;
                                }
                            } else if ((document as any).caretPositionFromPoint) {
                                const pos = (document as any).caretPositionFromPoint(e.clientX, e.clientY);
                                if (pos) caretOffset = pos.offset;
                            }

                            if (caretOffset !== null) {
                                const pos = matchIndex + caretOffset;
                                inputRef.current.setSelectionRange(pos, pos);
                            } else {
                                const pos = matchIndex + matchLength;
                                inputRef.current.setSelectionRange(pos, pos);
                            }
                        }
                    }}
                >
                    {match[0]}
                </span>
            );
            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < value.length) {
            parts.push(<span key={`text-${lastIndex}`}>{value.substring(lastIndex)}</span>);
        }

        return parts;
    };

    return (
        <div className={clsx("relative w-full", className)}>
            {/* Top layer: Input overlay that acts as highlighter block for variables. Must have exact same padding/font as actual input */}
            <div
                className={clsx("absolute inset-0 pointer-events-none overflow-hidden z-10 whitespace-pre text-slate-700", inputClassName)}
                style={{ backgroundColor: 'transparent' }}
            >
                <div style={{ transform: `translateX(-${scrollLeft}px)`, display: 'inline-block' }}>
                    {renderOverlay()}
                </div>
            </div>

            {/* Base layer: Actual input */}
            <input
                {...props}
                ref={inputRef}
                value={value}
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                onChange={(e) => {
                    onChangeValue(e.target.value);
                    handleSelectUpdate();
                }}
                onScroll={handleScroll}
                onKeyDown={handleKeyDown}
                onKeyUp={handleSelectUpdate}
                onClick={handleSelectUpdate}
                className={clsx("relative w-full outline-none focus:ring-0 z-0 bg-transparent caret-black text-transparent m-0", inputClassName)}
                style={{ color: 'transparent', caretColor: 'black', ...(props.style || {}) }}
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-[9999] py-1 min-w-[200px] max-w-[300px] max-h-48 overflow-y-auto">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100 mb-1">
                        Variables
                    </div>
                    {suggestions.map((s, i) => (
                        <div
                            key={s}
                            onMouseDown={(e) => {
                                e.preventDefault(); // keep focus on input
                                applySuggestion(s);
                            }}
                            className={clsx(
                                "px-3 py-1.5 text-xs font-mono cursor-pointer flex justify-between items-center transition-colors",
                                i === suggestionIndex ? "bg-orange-100 text-orange-900" : "hover:bg-slate-100 text-slate-700"
                            )}
                        >
                            <span className="truncate mr-2 border border-slate-200 rounded px-1">{`{{${s}}}`}</span>
                            <span className="text-slate-400 truncate text-[10px] max-w-[100px]" title={variables[s]}>{variables[s]}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

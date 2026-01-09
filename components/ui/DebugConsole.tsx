import React, { useRef, useEffect } from 'react';
import { TranslationKey, ConsoleLog } from '../../types';
import Icon from '../Icon';

interface DebugConsoleProps {
    logs: ConsoleLog[];
    onClear: () => void;
    onFixError: (errorMessage: string) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    height: number;
    setHeight: (height: number) => void;
    t: (key: TranslationKey) => string;
}

const DebugConsole: React.FC<DebugConsoleProps> = ({ logs, onClear, onFixError, isOpen, setIsOpen, height, setHeight, t }) => {
    const resizerRef = useRef<HTMLDivElement>(null);
    const consoleRef = useRef<HTMLDivElement>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        const newHeight = window.innerHeight - e.clientY;
        if (newHeight > 48 && newHeight < window.innerHeight * 0.8) {
            setHeight(newHeight);
        }
    };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    const getLogStyle = (type: ConsoleLog['type']) => {
        switch (type) {
            case 'error': return { icon: 'x-circle', color: 'text-red-500' };
            case 'warn': return { icon: 'alert-triangle', color: 'text-yellow-500' };
            case 'log':
            default: return { icon: 'chevron-right', color: 'text-gray-400' };
        }
    };

    return (
        <div
            ref={consoleRef}
            className={`flex flex-col flex-shrink-0 bg-white dark:bg-neutral-800 border-t border-slate-200 dark:border-neutral-700 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] z-20 transition-all duration-300 ease-in-out`}
            style={{ height: isOpen ? `${height}px` : '48px' }}
        >
            <div
                ref={resizerRef}
                className="w-full h-2 cursor-row-resize absolute -top-1 left-0 z-30"
                onMouseDown={handleMouseDown}
            ></div>
            <header className="h-12 flex justify-between items-center px-4 border-b border-slate-200 dark:border-neutral-700 flex-shrink-0">
                <h3 className="font-bold text-sm flex items-center gap-2 text-gray-800 dark:text-gray-200">
                    <Icon name="terminal" className="w-4 h-4" />
                    {t('console')}
                </h3>
                <div className="flex items-center gap-2">
                    <button onClick={onClear} title={t('clearConsole')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-neutral-700 rounded-md">
                        <Icon name="trash-2" className="w-4 h-4 text-gray-500" />
                    </button>
                    <button onClick={() => setIsOpen(!isOpen)} title={isOpen ? t('minimize') : t('maximize')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-neutral-700 rounded-md">
                        <Icon name={isOpen ? 'minus' : 'maximize'} className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
            </header>
            <div ref={logContainerRef} className={`flex-1 overflow-y-auto p-2 font-mono text-xs custom-scrollbar`}>
                {logs.map((log, index) => {
                    const { icon, color } = getLogStyle(log.type);
                    return (
                        <div key={index} className={`flex items-start gap-2 p-1 border-b border-slate-100 dark:border-neutral-700/50 ${color}`}>
                            <Icon name={icon} className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                            <pre className="flex-1 whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">{log.message}</pre>
                            {log.type === 'error' && (
                                <button onClick={() => onFixError(log.message)} className="ml-auto text-xs font-sans font-semibold bg-red-500/10 text-red-500 hover:bg-red-500/20 px-2 py-0.5 rounded">
                                    {t('fix')}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DebugConsole;

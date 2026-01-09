import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChatSession, TranslationKey } from '../../types';
import Icon from '../Icon';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    sessions: ChatSession[];
    onSelect: (sessionId: string) => void;
    t: (key: TranslationKey) => string;
    onNewChat: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, sessions, onSelect, t, onNewChat }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLUListElement>(null);

    const filteredSessions = useMemo(() => {
        if (!searchTerm) return sessions;
        return sessions.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [sessions, searchTerm]);

    useEffect(() => {
        if (isOpen) {
            // Delay focus to allow for modal transition
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setSearchTerm('');
            setActiveIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        setActiveIndex(0);
    }, [searchTerm]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => (prev + 1) % filteredSessions.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => (prev - 1 + filteredSessions.length) % filteredSessions.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredSessions[activeIndex]) {
                    onSelect(filteredSessions[activeIndex].id);
                }
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, activeIndex, filteredSessions, onSelect, onClose]);
    
     useEffect(() => {
        resultsRef.current?.children[activeIndex]?.scrollIntoView({
            block: 'nearest',
        });
    }, [activeIndex]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center pt-20 animate-fade-in" onClick={onClose}>
            <div className="w-full max-w-2xl bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl flex flex-col max-h-[60vh]" onClick={e => e.stopPropagation()}>
                <div className="p-3 border-b border-slate-200 dark:border-neutral-700 flex items-center gap-3">
                    <Icon name="search" className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform duration-300 ${searchTerm ? '-rotate-12' : ''}`} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder={t('typeToSearch')}
                        className="flex-1 bg-transparent focus:outline-none text-gray-800 dark:text-gray-200"
                    />
                    <button
                        onClick={() => { onNewChat(); onClose(); }}
                        className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-slate-100 dark:bg-neutral-700/60 text-gray-700 dark:text-gray-200 rounded-md hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
                    >
                        <Icon name="plus" className="w-4 h-4" />
                        {t('newChat')}
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredSessions.length > 0 ? (
                        <ul ref={resultsRef} className="p-2">
                            {filteredSessions.map((session, index) => (
                                <li key={session.id}>
                                    <button
                                        onClick={() => onSelect(session.id)}
                                        className={`w-full flex items-center gap-3 p-2.5 rounded-md text-sm text-start rtl:text-right transition-colors ${
                                            index === activeIndex ? 'bg-slate-100 dark:bg-neutral-700' : 'hover:bg-slate-100/50 dark:hover:bg-neutral-700/50'
                                        }`}
                                    >
                                        <Icon name="message-square" className="w-4 h-4 text-gray-500" />
                                        <span className="flex-1 text-gray-700 dark:text-gray-300 truncate">{session.title}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center p-8 text-sm text-gray-500">
                            <Icon name="folder-search" className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                            {t('noResultsFound')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchModal;
import React, { useState, useRef, useEffect } from 'react';
import { CommunityMessage, User, TranslationKey } from '../types';
import Icon from './Icon';

interface CommunityChatViewProps {
  messages: CommunityMessage[];
  currentUser: User | null;
  onSendMessage: (text: string) => void;
  t: (key: TranslationKey) => string;
  onClose: () => void; // For mobile back button
}

const CommunityMessageItem: React.FC<{ message: CommunityMessage; isOwn: boolean; t: (key: TranslationKey) => string }> = ({ message, isOwn, t }) => {
    const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return (
        <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-100/50 dark:hover:bg-neutral-800/50">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
                <Icon name="user" className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex-1">
                <div className="flex items-baseline gap-2">
                    <span className={`font-bold text-sm ${isOwn ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'}`}>
                        {message.sender.name} {isOwn ? `(${t('you')})` : ''}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{time}</span>
                </div>
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                    {message.text}
                </p>
            </div>
        </div>
    );
};

const CommunityChatView: React.FC<CommunityChatViewProps> = ({ messages, currentUser, onSendMessage, t, onClose }) => {
    const [text, setText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    const handleSend = () => {
        if (text.trim()) {
            onSendMessage(text);
            setText('');
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    const sortedMessages = [...messages].sort((a, b) => a.timestamp - b.timestamp);

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-neutral-900">
            <div ref={containerRef} className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
                <div className="text-center p-4 my-4 border-y border-slate-200 dark:border-neutral-800">
                    <Icon name="users" className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-500" />
                    <h2 className="text-lg font-bold mt-2">{t('communityChat')}</h2>
                    <p className="text-xs text-gray-500">{t('communityDesc')}</p>
                </div>
                {sortedMessages.map(msg => (
                    <CommunityMessageItem 
                        key={msg.id} 
                        message={msg}
                        isOwn={!!currentUser?.email && msg.sender.email === currentUser.email}
                        t={t}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="flex-shrink-0 p-3 border-t border-slate-200 dark:border-neutral-800 bg-slate-100 dark:bg-neutral-800/50">
                 <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-2xl shadow-sm">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        className="w-full p-2 bg-transparent focus:outline-none resize-none text-sm max-h-40 custom-scrollbar text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                        placeholder={t('sendMessageToCommunity')}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!text.trim()}
                        className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-slate-800 text-white dark:bg-slate-200 dark:text-black rounded-full shadow-sm hover:bg-slate-700 dark:hover:bg-slate-300 transition-colors disabled:opacity-50"
                    >
                        <Icon name="send" className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CommunityChatView;

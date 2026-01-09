import React, { useRef, useEffect } from 'react';
import { Message, TranslationKey, Settings } from '../../types';
import Icon from '../Icon';

interface ContextualChatProps {
    messages: Message[];
    isLoading: boolean;
    onSendMessage: (text: string) => void;
    onStopGeneration: () => void;
    t: (key: TranslationKey) => string;
    isInsideModal: boolean; // to apply different styling if needed
}

const ContextualChatMessage: React.FC<{ msg: Message }> = ({ msg }) => {
    const isUser = !msg.isAI;
    const renderContent = () => {
        if (msg.isLoading || (msg.isStreaming && msg.text === '')) {
            return <div className="pulsing-dot"></div>;
        }
        if (msg.isStreaming) {
             const animatedWords = msg.text.split(/(\s+)/).filter(Boolean).map((word, index) => (
                <span key={`${msg.id}-word-${index}`} className="animate-word-fade-in">{word}</span>
             ));
             return <div className="whitespace-pre-wrap">{animatedWords}</div>;
        }
        return <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: (window as any).marked?.parse(msg.text || '') || msg.text }}></div>;
    };
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-2 rounded-lg text-xs ${isUser ? 'bg-[var(--bg-bubble-user)]' : 'bg-[var(--bg-bubble-ai)]'}`}>
                {renderContent()}
            </div>
        </div>
    );
};


const ContextualChat: React.FC<ContextualChatProps> = (props) => {
    const { messages, isLoading, onSendMessage, onStopGeneration, t, isInsideModal } = props;
    const [text, setText] = React.useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleSend = () => {
        if (text.trim()) {
            onSendMessage(text);
            setText('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex flex-col h-full bg-[var(--bg-modal)]">
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {messages.map(msg => <ContextualChatMessage key={msg.id} msg={msg} />)}
                <div ref={messagesEndRef} />
            </div>
            <div className={`flex-shrink-0 p-2 border-t`} style={{ borderColor: 'var(--border-primary)' }}>
                <div className="flex items-center gap-2 p-1.5 bg-[var(--bg-interactive)] border border-[var(--border-primary)] rounded-full">
                    <input
                        type="text"
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t('askAboutCoding')}
                        disabled={isLoading}
                        className="flex-1 bg-transparent px-2 text-sm focus:outline-none"
                    />
                    <button
                        onClick={isLoading ? onStopGeneration : handleSend}
                        className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-white text-black rounded-full shadow-sm hover:bg-gray-200 transition-colors"
                    >
                        {isLoading ? <Icon name="square" className="w-4 h-4" /> : <Icon name="arrow-up" className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContextualChat;
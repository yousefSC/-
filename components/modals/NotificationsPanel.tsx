import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TranslationKey, Notifications, NotificationItem, ModalState, NotificationTarget, SettingsTab } from '../../types';
import Icon from '../Icon';
import Tooltip from '../ui/Tooltip';
import CustomVideoPlayer from '../ui/CustomVideoPlayer';
import { SETTINGS_TABS } from '../../constants';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notifications;
  isAdmin: boolean;
  onPostNotification: (item: Omit<NotificationItem, 'id' | 'createdAt'>) => boolean;
  onDeleteNotification: (id: string, type: Tab) => void;
  onEditNotification: (item: NotificationItem) => void;
  t: (key: TranslationKey) => string;
  onOpenModal: (type: keyof ModalState, data?: any) => void;
  unreadStatus: { news: boolean; updates: boolean; messages: boolean };
  onMarkCategoryAsRead: (category: Tab) => void;
  onMarkAllNotificationsAsRead: () => void;
  onNotificationNavigate: (target: NotificationTarget) => void;
  isDesktop: boolean;
  isFullScreen?: boolean;
  onOpenFullscreen?: () => void;
}

type Tab = 'news' | 'updates' | 'messages';
type ViewTab = 'all' | Tab;

const PULL_THRESHOLD = 70;

const PullToRefreshIndicator: React.FC<{
    pullDistance: number;
    isRefreshing: boolean;
    isPulling: boolean;
}> = ({ pullDistance, isRefreshing, isPulling }) => {
    const PULL_INDICATOR_HEIGHT = 64; // Corresponds to h-16
    const opacity = isRefreshing ? 1 : Math.min(1, pullDistance / PULL_THRESHOLD);
    const transformY = Math.min(pullDistance, PULL_THRESHOLD + 30) - PULL_INDICATOR_HEIGHT;

    return (
        <div
            className="absolute top-0 left-0 right-0 h-16 flex items-center justify-center -z-10"
            style={{
                transform: `translateY(${transformY}px)`,
                transition: isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
        >
            <div
                className="flex gap-1.5 items-center transition-opacity"
                style={{ opacity }}
            >
                {Array.from({ length: 3 }).map((_, i) => (
                    <span
                        key={i}
                        className="w-2 h-2 bg-slate-400 dark:bg-neutral-600 rounded-full"
                        style={{
                            animation: isRefreshing ? `dot-pulse 1.2s infinite ease-in-out ${i * 0.2}s` : 'none',
                        }}
                    ></span>
                ))}
            </div>
        </div>
    );
};


const LinkifiedText: React.FC<{ text: string }> = ({ text }) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return (
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
            {parts.map((part, index) => {
                if (part.match(urlRegex)) {
                    return (
                        <a
                            key={index}
                            href={part}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {part}
                        </a>
                    );
                }
                return part;
            })}
        </p>
    );
};

const NotificationEditor: React.FC<{
    item: NotificationItem;
    onSave: (updatedItem: NotificationItem) => void;
    onCancel: () => void;
    t: (key: TranslationKey) => string;
}> = ({ item, onSave, onCancel, t }) => {
    const [title, setTitle] = useState(item.title);
    const [content, setContent] = useState(item.content || '');
    const [image, setImage] = useState<string | null>(item.imageUrl || null);
    const [video, setVideo] = useState<string | null>(item.videoUrl || null);
    const [audio, setAudio] = useState<string | null>(item.audioUrl || null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    
    // Target state
    const [targetType, setTargetType] = useState<NotificationTarget['type']>(item.target?.type || 'none');
    const [settingsTab, setSettingsTab] = useState<SettingsTab>(item.target?.type === 'settings' ? item.target.tab : 'general');
    const [url, setUrl] = useState(item.target?.type === 'url' ? item.target.url : '');


    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setVideo(null);
                setAudio(null);
                setImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('video/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImage(null);
                setAudio(null);
                setVideo(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('audio/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImage(null);
                setVideo(null);
                setAudio(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveClick = () => {
        if (title.trim()) {
            let target: NotificationTarget | undefined = undefined;
            switch(targetType) {
                case 'library':
                case 'subscription':
                case 'new_chat':
                    target = { type: targetType };
                    break;
                case 'settings':
                    target = { type: 'settings', tab: settingsTab };
                    break;
                case 'url':
                    if (url.trim()) target = { type: 'url', url: url.trim() };
                    break;
                default:
                    target = undefined;
            }

            onSave({
                ...item,
                title: title.trim(),
                content: content.trim() || undefined,
                imageUrl: image || undefined,
                videoUrl: video || undefined,
                audioUrl: audio || undefined,
                target: target,
            });
        }
    };

    return (
        <div className="p-3 rounded-lg bg-slate-200 dark:bg-neutral-700 space-y-2">
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('title')} className="w-full p-2 text-sm rounded-lg bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-600" required />
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder={t('content')} rows={3} className="w-full p-2 text-sm rounded-lg bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-600 resize-none custom-scrollbar"></textarea>
             {image && (
                <div className="relative">
                    <img src={image} alt="Preview" className="w-full h-auto rounded-lg max-h-40 object-contain bg-slate-300 dark:bg-neutral-800" />
                    <button type="button" onClick={() => setImage(null)} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full"><Icon name="x" size={16} /></button>
                </div>
            )}
            {video && (
                <div className="relative">
                    <video src={video} controls className="w-full h-auto rounded-lg max-h-40 object-contain bg-slate-300 dark:bg-neutral-800" />
                    <button type="button" onClick={() => setVideo(null)} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full"><Icon name="x" size={16} /></button>
                </div>
            )}
            {audio && (
                <div className="relative">
                    <audio src={audio} controls className="w-full h-12 rounded-lg bg-slate-300 dark:bg-neutral-800" />
                    <button type="button" onClick={() => setAudio(null)} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full"><Icon name="x" size={16} /></button>
                </div>
            )}
            <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageSelect} className="hidden" />
            <input type="file" accept="video/*" ref={videoInputRef} onChange={handleVideoSelect} className="hidden" />
            <input type="file" accept="audio/*" ref={audioInputRef} onChange={handleAudioSelect} className="hidden" />

            <div className="pt-2 border-t border-slate-300 dark:border-neutral-600/50">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Action Target</label>
                <select value={targetType} onChange={e => setTargetType(e.target.value as NotificationTarget['type'])} className="mt-1 w-full p-2 text-sm rounded-lg bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-600">
                    <option value="none">None</option>
                    <option value="library">Open Library</option>
                    <option value="settings">Go to Settings</option>
                    <option value="subscription">Go to Subscription</option>
                    <option value="new_chat">Start New Chat</option>
                    <option value="url">Open URL</option>
                </select>
                {targetType === 'settings' && (
                    <select value={settingsTab} onChange={e => setSettingsTab(e.target.value as SettingsTab)} className="mt-1 w-full p-2 text-sm rounded-lg bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-600">
                        {SETTINGS_TABS.map(tab => <option key={tab.id} value={tab.id}>{t(tab.labelKey)}</option>)}
                    </select>
                )}
                {targetType === 'url' && (
                    <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" className="mt-1 w-full p-2 text-sm rounded-lg bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-600" />
                )}
            </div>

            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                     <button type="button" onClick={() => imageInputRef.current?.click()} title={t('addImage')} className="p-2 bg-slate-300 dark:bg-neutral-600 rounded-md text-gray-600 dark:text-gray-300 hover:bg-slate-400 dark:hover:bg-neutral-500"><Icon name="image" size={18} /></button>
                     <button type="button" onClick={() => imageInputRef.current?.click()} title={t('addGif')} className="p-2 bg-slate-300 dark:bg-neutral-600 rounded-md text-gray-600 dark:text-gray-300 hover:bg-slate-400 dark:hover:bg-neutral-500"><Icon name="file-image" size={18} /></button>
                     <button type="button" onClick={() => videoInputRef.current?.click()} title={t('addVideo')} className="p-2 bg-slate-300 dark:bg-neutral-600 rounded-md text-gray-600 dark:text-gray-300 hover:bg-slate-400 dark:hover:bg-neutral-500"><Icon name="film" size={18} /></button>
                     <button type="button" onClick={() => audioInputRef.current?.click()} title={t('addAudio')} className="p-2 bg-slate-300 dark:bg-neutral-600 rounded-md text-gray-600 dark:text-gray-300 hover:bg-slate-400 dark:hover:bg-neutral-500"><Icon name="music" size={18} /></button>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" onClick={onCancel} className="px-3 py-1.5 font-semibold text-xs bg-slate-300 dark:bg-neutral-600 rounded-md">{t('cancel')}</button>
                    <button type="button" onClick={handleSaveClick} className="px-3 py-1.5 font-semibold text-xs bg-blue-600 text-white rounded-md">{t('save')}</button>
                </div>
            </div>
        </div>
    );
};

const AdminForm: React.FC<{ onPost: (item: Omit<NotificationItem, 'id' | 'createdAt'>) => boolean; onClose: () => void; t: (key: TranslationKey) => string; isAdmin: boolean; }> = ({ onPost, onClose, t, isAdmin }) => {
    const [type, setType] = useState<Tab>('news');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [video, setVideo] = useState<string | null>(null);
    const [audio, setAudio] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPosting, setIsPosting] = useState(false);
    
    // Target state
    const [targetType, setTargetType] = useState<NotificationTarget['type']>('none');
    const [settingsTab, setSettingsTab] = useState<SettingsTab>('general');
    const [url, setUrl] = useState('');

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setVideo(null);
                setAudio(null);
                setImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('video/')) {
            // Video size limit removed as requested.
            const reader = new FileReader();
            reader.onload = (event) => {
                setImage(null);
                setAudio(null);
                setVideo(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('audio/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImage(null);
                setVideo(null);
                setAudio(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isPosting || !title.trim() || (!content.trim() && !image && !video && !audio)) {
            return;
        }

        setIsPosting(true);
        setError(null);
        
        let target: NotificationTarget | undefined = undefined;
        switch(targetType) {
            case 'library':
            case 'subscription':
            case 'new_chat':
                target = { type: targetType };
                break;
            case 'settings':
                target = { type: 'settings', tab: settingsTab };
                break;
            case 'url':
                if (url.trim()) target = { type: 'url', url: url.trim() };
                break;
            default:
                target = undefined;
        }
        
        // Use a small timeout to let the UI update to the loading state
        setTimeout(() => {
            const success = onPost({ type, title, content, imageUrl: image || undefined, videoUrl: video || undefined, audioUrl: audio || undefined, target });
            if (success) {
                onClose();
            } else {
                setError(t('storageLimitExceededError'));
                setIsPosting(false);
            }
        }, 50);
    };
    
    return (
        <div className="absolute inset-0 bg-slate-100 dark:bg-neutral-900 z-20 flex flex-col animate-fade-in">
            <header className="p-2 flex justify-between items-center border-b border-slate-200 dark:border-neutral-800 flex-shrink-0">
                <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200/50 dark:hover:bg-neutral-700/50"><Icon name="arrow-left" className="w-5 h-5"/></button>
                <h4 className="font-bold">{t('addNew')}</h4>
                <div className="w-8"></div>
            </header>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-3 overflow-y-auto custom-scrollbar">
                <div className="flex-1 space-y-3">
                    <select value={type} onChange={e => setType(e.target.value as Tab)} className="w-full p-2 text-sm rounded-lg bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700">
                        <option value="news">{t('news')}</option>
                        <option value="updates">{t('updates')}</option>
                        <option value="messages">{t('messages')}</option>
                    </select>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('title')} className="w-full p-2 text-sm rounded-lg bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700" required />
                    <textarea value={content} onChange={e => setContent(e.target.value)} placeholder={t('content')} rows={5} className="w-full p-2 text-sm rounded-lg bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 resize-none custom-scrollbar"></textarea>
                    {image && (
                        <div className="relative mt-2">
                            <img src={image} alt="Preview" className="w-full h-auto rounded-lg max-h-48 object-contain bg-slate-200 dark:bg-neutral-800" />
                            <button type="button" onClick={() => setImage(null)} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full">
                                <Icon name="x" size={16} />
                            </button>
                        </div>
                    )}
                    {video && (
                        <div className="relative mt-2">
                            <video src={video} controls className="w-full h-auto rounded-lg max-h-48 object-contain bg-slate-200 dark:bg-neutral-800" />
                            <button type="button" onClick={() => setVideo(null)} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full">
                                <Icon name="x" size={16} />
                            </button>
                        </div>
                    )}
                     {audio && (
                        <div className="relative mt-2">
                            <audio src={audio} controls className="w-full h-12 rounded-lg bg-slate-200 dark:bg-neutral-800" />
                            <button type="button" onClick={() => setAudio(null)} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full">
                                <Icon name="x" size={16} />
                            </button>
                        </div>
                    )}
                     <div className="pt-2 border-t border-slate-200 dark:border-neutral-700">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Action Target</label>
                        <select value={targetType} onChange={e => setTargetType(e.target.value as NotificationTarget['type'])} className="mt-1 w-full p-2 text-sm rounded-lg bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-600">
                            <option value="none">None</option>
                            <option value="library">Open Library</option>
                            <option value="settings">Go to Settings</option>
                            <option value="subscription">Go to Subscription</option>
                            <option value="new_chat">Start New Chat</option>
                            <option value="url">Open URL</option>
                        </select>
                        {targetType === 'settings' && (
                            <select value={settingsTab} onChange={e => setSettingsTab(e.target.value as SettingsTab)} className="mt-1 w-full p-2 text-sm rounded-lg bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-600">
                                {SETTINGS_TABS.map(tab => <option key={tab.id} value={tab.id}>{t(tab.labelKey)}</option>)}
                            </select>
                        )}
                        {targetType === 'url' && (
                            <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" className="mt-1 w-full p-2 text-sm rounded-lg bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-600" />
                        )}
                    </div>
                     {error && (
                        <p className="p-2 text-center text-sm font-semibold text-red-600 bg-red-500/10 rounded-lg animate-fade-in">
                            {error}
                        </p>
                    )}
                </div>
                 <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageSelect} className="hidden" />
                 <input type="file" accept="video/*" ref={videoInputRef} onChange={handleVideoSelect} className="hidden" />
                 <input type="file" accept="audio/*" ref={audioInputRef} onChange={handleAudioSelect} className="hidden" />
                <div className="mt-3 flex items-center gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} title={t('addImage')} className="p-2.5 bg-slate-200 dark:bg-neutral-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-slate-300 dark:hover:bg-neutral-600">
                        <Icon name="image" size={20} />
                    </button>
                    <button type="button" onClick={() => fileInputRef.current?.click()} title={t('addGif')} className="p-2.5 bg-slate-200 dark:bg-neutral-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-slate-300 dark:hover:bg-neutral-600">
                        <Icon name="file-image" size={20} />
                    </button>
                    <button type="button" onClick={() => videoInputRef.current?.click()} title={t('addVideo')} className="p-2.5 bg-slate-200 dark:bg-neutral-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-slate-300 dark:hover:bg-neutral-600">
                        <Icon name="film" size={20} />
                    </button>
                    <button type="button" onClick={() => audioInputRef.current?.click()} title={t('addAudio')} className="p-2.5 bg-slate-200 dark:bg-neutral-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-slate-300 dark:hover:bg-neutral-600">
                        <Icon name="music" size={20} />
                    </button>
                    <button 
                        type="submit" 
                        className="flex-1 p-2.5 font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center justify-center min-h-[44px]"
                        disabled={!title.trim() || (!content.trim() && !image && !video && !audio) || isPosting}>
                        {isPosting ? (
                            <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            t('post')
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose, notifications, isAdmin, onPostNotification, onDeleteNotification, onEditNotification, t, onOpenModal, unreadStatus, onMarkCategoryAsRead, onMarkAllNotificationsAsRead, onNotificationNavigate, isDesktop, isFullScreen, onOpenFullscreen }) => {
  const [activeTab, setActiveTab] = useState<ViewTab>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<NotificationItem | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const [pullState, setPullState] = useState({ isPulling: false, distance: 0, isRefreshing: false });
  const pullStateRef = useRef(pullState);
  pullStateRef.current = pullState;


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDesktop && panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen && isDesktop && !isFullScreen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, isDesktop, isFullScreen]);

  // Pull to refresh logic for mobile
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || isDesktop) return;

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) return;

    const state = { startY: 0 };

    const handleTouchStart = (e: TouchEvent) => {
        if (container.scrollTop === 0 && !pullStateRef.current.isRefreshing) {
            state.startY = e.touches[0].clientY;
            setPullState(prev => ({ ...prev, isPulling: true }));
        }
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!pullStateRef.current.isPulling) return;
        const touchY = e.touches[0].clientY;
        const deltaY = touchY - state.startY;

        if (deltaY > 0) {
            e.preventDefault();
            const resistance = 0.65;
            setPullState(prev => ({ ...prev, distance: deltaY * resistance }));
        } else {
            setPullState(prev => ({ ...prev, isPulling: false, distance: 0 }));
        }
    };

    const handleTouchEnd = () => {
        if (!pullStateRef.current.isPulling) return;
        
        const currentPullDistance = pullStateRef.current.distance;
        setPullState(prev => ({ ...prev, isPulling: false }));

        if (currentPullDistance >= PULL_THRESHOLD) {
            setPullState(prev => ({ ...prev, isRefreshing: true, distance: PULL_THRESHOLD }));
            // Simulate a refresh
            setTimeout(() => {
                setPullState({ isPulling: false, distance: 0, isRefreshing: false });
            }, 1500);
        } else {
            setPullState(prev => ({ ...prev, distance: 0 }));
        }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
        container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isDesktop]);

  
  const timeSince = (timestamp: number) => {
    const seconds = Math.floor((new Date().getTime() - timestamp) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "min";
    return Math.floor(seconds) + "s";
  };
  
  const currentList = useMemo(() => {
    if (activeTab === 'all') {
      return [...notifications.news, ...notifications.updates, ...notifications.messages]
        .sort((a, b) => b.createdAt - a.createdAt);
    }
    return notifications[activeTab] || [];
  }, [activeTab, notifications]);
  
  const handleTabChange = (tab: ViewTab) => {
    if (tab !== 'all' && unreadStatus[tab]) {
        onMarkCategoryAsRead(tab);
    }
    setActiveTab(tab);
  };

  const TabSelectorButton: React.FC<{ label: string; tabKey: ViewTab; hasUnread: boolean; }> = ({ label, tabKey, hasUnread }) => (
    <button
        onClick={() => handleTabChange(tabKey)}
        className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 ${activeTab === tabKey ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'text-gray-500'}`}
    >
        {label}
        {hasUnread && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
    </button>
  );

  if (!isOpen) return null;

  const panelClasses = isFullScreen
    ? "relative w-full h-full flex-1 flex flex-col overflow-hidden bg-slate-100 dark:bg-neutral-900"
    : isDesktop
    ? "fixed top-16 rtl:left-4 ltr:right-4 w-full max-w-lg h-auto max-h-[80vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-neutral-800 animate-pop-in bg-slate-100 dark:bg-neutral-900 flex flex-col z-50 overflow-hidden"
    : "fixed inset-0 w-full h-full rounded-none border-0 shadow-none animate-fade-in bg-slate-100 dark:bg-neutral-900 flex flex-col z-50 overflow-hidden";
  
  const isRtl = document.documentElement.dir === 'rtl';

  return (
    <div
      ref={panelRef}
      className={panelClasses}
    >
      <header className="p-3 flex items-center border-b border-slate-200 dark:border-neutral-800 flex-shrink-0">
        <div className="flex-1 flex justify-start">
             {!isDesktop && !isFullScreen && (
                <Tooltip text={t('back')}>
                  <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200/50 dark:hover:bg-neutral-700/50">
                      <Icon name={isRtl ? 'arrow-right' : 'arrow-left'} className="w-5 h-5"/>
                  </button>
                </Tooltip>
            )}
        </div>

        <h3 className="font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap">{t('notifications')}</h3>

        <div className="flex-1 flex justify-end items-center gap-1">
            {isAdmin && (
              <Tooltip text={t('addNew')}>
                <button onClick={() => setIsAdding(true)} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-neutral-700"><Icon name="plus-circle" className="w-5 h-5 text-blue-500" /></button>
              </Tooltip>
            )}
            {isDesktop && !isFullScreen && onOpenFullscreen && (
                <Tooltip text={t('openFullscreen')}>
                    <button onClick={onOpenFullscreen} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-neutral-700">
                        <Icon name="maximize" className="w-5 h-5 text-gray-500" />
                    </button>
                </Tooltip>
            )}
             {(isDesktop || isFullScreen) && (
                <Tooltip text={t('close')}>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200/50 dark:hover:bg-neutral-700/50">
                        <Icon name='x' className="w-5 h-5"/>
                    </button>
                </Tooltip>
            )}
        </div>
      </header>
      <div className="p-3 flex-shrink-0">
        <div className="p-1 rounded-full bg-slate-200 dark:bg-neutral-800 flex items-center">
            <TabSelectorButton label={t('all')} tabKey="all" hasUnread={unreadStatus.news || unreadStatus.updates || unreadStatus.messages} />
            <TabSelectorButton label={t('news')} tabKey="news" hasUnread={unreadStatus.news} />
            <TabSelectorButton label={t('updates')} tabKey="updates" hasUnread={unreadStatus.updates} />
            <TabSelectorButton label={t('messages')} tabKey="messages" hasUnread={unreadStatus.messages} />
        </div>
      </div>
      
      <main ref={scrollContainerRef} className="flex-1 overflow-y-auto custom-scrollbar relative">
        <PullToRefreshIndicator 
            pullDistance={pullState.distance} 
            isRefreshing={pullState.isRefreshing} 
            isPulling={pullState.isPulling} 
        />
        <div 
            ref={scrollContentRef}
            className="p-2"
            style={{
                transform: `translateY(${pullState.distance}px)`,
                transition: pullState.isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
        >
            {currentList.length > 0 ? (
                <ul className="space-y-2">
                    {currentList.map(item => (
                        <li key={item.id} className="transition-all duration-300">
                            {editingItem?.id === item.id ? (
                              <NotificationEditor
                                item={editingItem}
                                onSave={(updatedItem) => {
                                  onEditNotification(updatedItem);
                                  setEditingItem(null);
                                }}
                                onCancel={() => setEditingItem(null)}
                                t={t}
                              />
                            ) : (
                              <button
                                onClick={() => item.target && onNotificationNavigate(item.target)}
                                className="w-full text-left rtl:text-right relative group p-3 rounded-lg bg-white dark:bg-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-700/60 transition-colors duration-200 disabled:cursor-default disabled:hover:bg-white dark:disabled:hover:bg-neutral-800"
                                disabled={!item.target}
                              >
                                <div className="flex justify-between items-start gap-3">
                                  <div className="flex-1">
                                    <h4 className="font-bold text-sm text-gray-800 dark:text-gray-100">{item.title}</h4>
                                  </div>
                                  <div className="flex-shrink-0 flex items-center gap-2">
                                    <span className="text-xs text-gray-400 dark:text-gray-500">{timeSince(item.createdAt)}</span>
                                    {isAdmin && (
                                        <div className="flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                          <Tooltip text={t('edit')}>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setEditingItem(item); }} 
                                                className="p-1 rounded-full text-gray-400 hover:bg-blue-500/10 hover:text-blue-500"
                                            >
                                                <Icon name="pencil" className="w-4 h-4" />
                                            </button>
                                          </Tooltip>
                                          <Tooltip text={t('delete')}>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); onDeleteNotification(item.id, item.type); }} 
                                                className="p-1 rounded-full text-gray-400 hover:bg-red-500/10 hover:text-red-500"
                                            >
                                                <Icon name="trash-2" className="w-4 h-4" />
                                            </button>
                                          </Tooltip>
                                        </div>
                                    )}
                                  </div>
                                </div>
                                {item.imageUrl && (
                                    <img 
                                        src={item.imageUrl} 
                                        alt={item.title} 
                                        className="mt-2 w-full h-auto max-h-64 object-contain rounded-md cursor-pointer bg-slate-200 dark:bg-neutral-900" 
                                        onClick={(e) => { e.stopPropagation(); onOpenModal('imageViewer', item.imageUrl); }}
                                    />
                                )}
                                {item.videoUrl && (
                                    <div className="mt-2">
                                        <CustomVideoPlayer src={item.videoUrl} t={t} />
                                    </div>
                                )}
                                {item.audioUrl && (
                                    <div className="mt-2">
                                        <audio controls src={item.audioUrl} className="w-full h-12 rounded-md" />
                                    </div>
                                )}
                                {item.content && (
                                  <LinkifiedText text={item.content} />
                                )}
                              </button>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
                    <Icon name="bell-off" className="w-12 h-12 mb-3" />
                    <p className="font-semibold">{t('noNotifications')}</p>
                </div>
            )}
        </div>
      </main>
      
      {isAdding && <AdminForm onPost={onPostNotification} onClose={() => setIsAdding(false)} t={t} isAdmin={isAdmin} />}
    </div>
  );
};

export default NotificationsPanel;
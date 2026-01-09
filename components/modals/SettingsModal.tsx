
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Settings, TranslationKey, Language, ErrorHandling, Theme, Scale, SettingsTab, SimulationDevice, MemoryItem, ColorScheme, User, ChatSession, CommunityMessage, Shortcut, ShortcutAction, EditorPreference } from '../../types';
import Icon from '../Icon';
import CustomSelect from '../ui/CustomSelect';
import CommunityChatView from '../CommunityChatView';
import Tooltip from '../ui/Tooltip';
import { DEFAULT_SHORTCUTS, AVAILABLE_SHORTCUT_ACTIONS } from '../../constants';

const MAX_AGENT_POINTS = 500;
const POINTS_REFRESH_INTERVAL = 24 * 60 * 60 * 1000;

// New component for the timer to isolate re-renders
const TimeRemainingCounter: React.FC<{ lastReset: number }> = React.memo(({ lastReset }) => {
    const [timeRemaining, setTimeRemaining] = useState('');

    useEffect(() => {
        const calculateRemaining = () => {
            const nextResetTime = lastReset + POINTS_REFRESH_INTERVAL;
            const now = Date.now();
            const diff = Math.max(0, nextResetTime - now);

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        };
        
        setTimeRemaining(calculateRemaining()); // Set initial value immediately

        const intervalId = setInterval(() => {
            setTimeRemaining(calculateRemaining());
        }, 1000);

        return () => clearInterval(intervalId);
    }, [lastReset]);

    return <span className="text-sm font-mono font-semibold text-gray-700 dark:text-gray-300">{timeRemaining}</span>;
});


interface SettingsModalProps {
  settings: Settings;
  onClose: () => void;
  onSettingsChange: React.Dispatch<React.SetStateAction<Settings>>;
  onDeleteAllData: () => void;
  t: (key: TranslationKey) => string;
  language: Language;
  isDesktop: boolean;
  effectiveTheme: Theme;
  isProUnlocked: boolean;
  isNanoUnlocked: boolean;
  onOpenSubscriptionModal: () => void;
  onCancelSubscription: () => void;
  agentPoints: number;
  agentPointsLastReset: number;
  currentUser: User | null;
  users?: User[];
  onOpenAuthModal: () => void;
  onLogout: () => void;
  onUpdateUserProfile: (updatedProfile: Partial<User>) => void;
  onSwitchAccount?: (user: User) => void;
  onRemoveAccount?: (user: User) => void;
  archivedSessions: ChatSession[];
  onUnarchiveSession: (sessionId: string) => void;
  onNavigateToSession: (sessionId: string) => void;
  initialTab?: SettingsTab;
  onOpenProfileEditor: (user: User) => void;
}

const SettingsCard: React.FC<{ title: React.ReactNode; children: React.ReactNode; }> = ({ title, children }) => (
  <div className="p-4 space-y-4 rounded-xl bg-slate-200 dark:bg-neutral-800/50">
    <h3 className="font-bold text-md text-gray-800 dark:text-gray-200">{title}</h3>
    {children}
  </div>
);

type PermissionState = 'prompt' | 'granted' | 'denied';

const PermissionRow: React.FC<{
    name: 'camera' | 'microphone';
    label: string;
    status: PermissionState;
    t: (key: TranslationKey) => string;
}> = ({ name, label, status, t }) => {
    
    const translatedStatus = {
      granted: t('permissionGranted'),
      denied: t('permissionDenied'),
      prompt: t('permissionPrompt'),
    };
    
    const color = {
        granted: 'bg-green-500',
        denied: 'bg-red-500',
        prompt: 'bg-yellow-500',
    };
    
    return (
        <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-neutral-900 rounded-lg">
            <div>
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">{label}</h4>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span className={`w-2 h-2 rounded-full ${color[status]}`}></span>
                    <span>{translatedStatus[status]}</span>
                </div>
            </div>
        </div>
    );
};

const ActionSelector: React.FC<{
    onSelect: (action: ShortcutAction) => void;
    onClose: () => void;
    t: (key: TranslationKey) => string;
    actions: { action: ShortcutAction; labelKey: TranslationKey, icon: string }[];
}> = ({ onSelect, onClose, t, actions }) => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
        <div className="w-full max-w-lg bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-center mb-4">{t('selectAction')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 overflow-y-auto custom-scrollbar">
                {actions.map(({ action, labelKey, icon }) => (
                    <button
                        key={action}
                        onClick={() => onSelect(action)}
                        className="flex flex-col items-center justify-center text-center p-3 w-full h-24 transition-colors duration-200 ease-in-out rounded-xl bg-slate-100 dark:bg-neutral-700/60 hover:bg-slate-200 dark:hover:bg-neutral-700"
                    >
                        <Icon name={icon} className="w-6 h-6 text-gray-700 dark:text-gray-300 mb-2" />
                        <span className="font-semibold text-xs text-gray-700 dark:text-gray-300">{t(labelKey)}</span>
                    </button>
                ))}
            </div>
        </div>
    </div>
);


const SettingsModal: React.FC<SettingsModalProps> = (props) => {
    const {
        settings, onClose, onSettingsChange, onDeleteAllData, t, language, isDesktop,
        isProUnlocked, isNanoUnlocked, onOpenSubscriptionModal, onCancelSubscription,
        agentPoints, agentPointsLastReset, currentUser, onOpenAuthModal, onLogout, onUpdateUserProfile,
        archivedSessions, onUnarchiveSession, onNavigateToSession, initialTab, onOpenProfileEditor
    } = props;
    
    const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab || 'general');
    const contentRef = useRef<HTMLDivElement>(null);
    const [showAdvancedAi, setShowAdvancedAi] = useState(false);
    const [newMemory, setNewMemory] = useState('');
    const [cameraPermission, setCameraPermission] = useState<PermissionState>('prompt');
    const [micPermission, setMicPermission] = useState<PermissionState>('prompt');
    
    // Shortcut editing state
    const [recordingFor, setRecordingFor] = useState<string | null>(null); // Can be shortcut ID or 'new'
    const [isCreatingShortcut, setIsCreatingShortcut] = useState(false);
    const [newShortcut, setNewShortcut] = useState<{ keys: string, action: ShortcutAction }>({ keys: '', action: 'newChat' });
    const [isActionSelectorOpen, setIsActionSelectorOpen] = useState(false);


    // State for account PIN
    const [isPinSetupVisible, setIsPinSetupVisible] = useState(false);
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmNewPin, setConfirmNewPin] = useState('');
    const [pinError, setPinError] = useState<string | null>(null);

    // State for User ID
    const [isIdVisible, setIsIdVisible] = useState(false);
    const [idCopied, setIdCopied] = useState(false);

    const handleSettingsChange = (key: keyof Settings, value: any) => {
        onSettingsChange(prev => ({ ...prev, [key]: value }));
    };

    const handleTabClick = (tab: SettingsTab) => {
        setActiveTab(tab);
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    };
    
    const assignedActions = useMemo(() => new Set(settings.shortcuts.map(s => s.action)), [settings.shortcuts]);
    const availableActionsForNewShortcut = useMemo(() => AVAILABLE_SHORTCUT_ACTIONS.filter(a => !assignedActions.has(a.action)), [assignedActions]);
    
    const handleStartCreatingShortcut = () => {
        setNewShortcut({ keys: '', action: availableActionsForNewShortcut[0]?.action || 'newChat' });
        setIsCreatingShortcut(true);
    };

    const checkPermissions = useCallback(async () => {
        try {
            const camStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
            setCameraPermission(camStatus.state);
            camStatus.onchange = () => setCameraPermission(camStatus.state);

            const micStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            setMicPermission(micStatus.state);
            micStatus.onchange = () => setMicPermission(micStatus.state);
        } catch (e) {
            console.error("Permission query failed:", e);
        }
    }, []);
    
    useEffect(() => {
        if (!recordingFor) return;

        const keysDown = new Set<string>();
        const activeElement = document.activeElement as HTMLElement;
        if(activeElement) activeElement.blur();

        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (e.repeat) return;

            if (e.key === 'Escape') {
                setRecordingFor(null);
                return;
            }
            keysDown.add(e.key);
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();

            if (keysDown.size > 0) {
                const nonModifiers = Array.from(keysDown).filter(k => !['Control', 'Shift', 'Alt', 'Meta'].includes(k));
                if (nonModifiers.length > 0) {
                    const sortedKeys = Array.from(keysDown).sort();
                    const newShortcutKeys = sortedKeys.join('+');
                    
                     if (recordingFor === 'new') {
                        setNewShortcut(prev => ({ ...prev, keys: newShortcutKeys }));
                    } else {
                        onSettingsChange(prev => ({
                            ...prev,
                            shortcuts: prev.shortcuts.map(s => s.id === recordingFor ? { ...s, keys: newShortcutKeys } : s)
                        }));
                    }
                }
                setRecordingFor(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('keyup', handleKeyUp, true);

        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('keyup', handleKeyUp, true);
        };

    }, [recordingFor, onSettingsChange]);

    useEffect(() => {
        if (activeTab === 'data') {
            checkPermissions();
        }
    }, [activeTab, checkPermissions]);
    
    const tabs: { id: SettingsTab; labelKey: TranslationKey; icon: string }[] = useMemo(() => {
        const baseTabs: { id: SettingsTab; labelKey: TranslationKey; icon: string }[] = [
            { id: 'general', labelKey: 'general', icon: 'sliders-horizontal' },
            { id: 'personal', labelKey: 'personal', icon: 'user' },
            { id: 'ai', labelKey: 'ai', icon: 'cpu' },
            { id: 'preview', labelKey: 'preview', icon: 'monitor-play' },
            { id: 'subscription', labelKey: 'subscription', icon: 'credit-card' },
            { id: 'account', labelKey: 'account', icon: 'users' },
            { id: 'data', labelKey: 'data', icon: 'database' },
            { id: 'lab', labelKey: 'lab', icon: 'flask-conical' },
            { id: 'help', labelKey: 'help', icon: 'help-circle' },
            { id: 'about', labelKey: 'about', icon: 'info' },
        ];
        if (isDesktop) {
            baseTabs.push({ id: 'shortcuts', labelKey: 'keyboardShortcuts', icon: 'keyboard' });
        }
        return baseTabs;
    }, [isDesktop]);
    
    const [communityMessages, setCommunityMessages] = useState<CommunityMessage[]>([]);
    
    const handleSendCommunityMessage = (text: string) => {
        if (!currentUser) {
            onOpenAuthModal();
            return;
        }
        const newMessage: CommunityMessage = {
            id: `comm_msg_${Date.now()}`,
            sender: { name: currentUser.firstName || currentUser.email, email: currentUser.email },
            text,
            timestamp: Date.now()
        };
        setCommunityMessages(prev => [...prev, newMessage]);
        
        setTimeout(() => {
            const botReply: CommunityMessage = {
                id: `comm_msg_${Date.now() + 1}`,
                sender: { name: "Community Bot", email: "bot@community.nanom" },
                text: "Thanks for your message! This is a demo community chat.",
                timestamp: Date.now() + 1
            };
            setCommunityMessages(prev => [...prev, botReply]);
        }, 1000);
    };

    const handleAddMemory = () => {
        if (newMemory.trim()) {
            const newItem: MemoryItem = { id: `mem_${Date.now()}`, content: newMemory.trim() };
            onSettingsChange(prev => ({ ...prev, memoryItems: [...prev.memoryItems, newItem] }));
            setNewMemory('');
        }
    };

    const handleDeleteMemory = (id: string) => {
        onSettingsChange(prev => ({ ...prev, memoryItems: prev.memoryItems.filter(item => item.id !== id) }));
    };

    const handlePinSave = () => {
        if (!currentUser) return;
        setPinError(null);
        
        // Disable PIN
        if (!newPin && !confirmNewPin) {
            if (currentUser.pin === currentPin) {
                onUpdateUserProfile({ isPinEnabled: false, pin: '' });
                setIsPinSetupVisible(false);
                setCurrentPin('');
            } else {
                setPinError(t('currentPinIncorrect'));
            }
            return;
        }

        // Enable or change PIN
        if (newPin.length !== 4) {
            setPinError(t('pinMustBe4Digits'));
            return;
        }
        if (newPin !== confirmNewPin) {
            setPinError(t('pinsDoNotMatch'));
            return;
        }
        if (currentUser.isPinEnabled && currentUser.pin !== currentPin) {
            setPinError(t('currentPinIncorrect'));
            return;
        }
        
        onUpdateUserProfile({ isPinEnabled: true, pin: newPin });
        setIsPinSetupVisible(false);
        setCurrentPin('');
        setNewPin('');
        setConfirmNewPin('');
    };
    
    const handleSaveNewShortcut = () => {
        if (newShortcut.keys && newShortcut.action) {
            const newShortcutItem: Shortcut = {
                id: `custom_${Date.now()}`,
                keys: newShortcut.keys,
                action: newShortcut.action,
                isEditable: true,
                isDeletable: true,
            };
            onSettingsChange(prev => ({ ...prev, shortcuts: [...prev.shortcuts, newShortcutItem]}));
            setIsCreatingShortcut(false);
            setNewShortcut({ keys: '', action: 'newChat' });
        }
    };
    
    const handleDeleteShortcut = (id: string) => {
        onSettingsChange(prev => ({...prev, shortcuts: prev.shortcuts.filter(s => s.id !== id)}));
    };
    
    const handleCopyId = () => {
        if (currentUser) {
            navigator.clipboard.writeText(currentUser.id);
            setIdCopied(true);
            setTimeout(() => setIdCopied(false), 2000);
        }
    };
    
    const renderContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div className="space-y-4">
                        <SettingsCard title={t('appearance')}>
                            <div className="space-y-3">
                                <CustomSelect title={t('language')} t={t} options={[{value: 'system', label: t('system')}, {value: 'en', label: 'English'}, {value: 'ar', label: 'العربية'}]} value={settings.language} onChange={(v) => handleSettingsChange('language', v as Language)} />
                                <CustomSelect 
                                    title={t('theme')} 
                                    t={t} 
                                    options={[
                                        {value: 'system', label: t('system')}, 
                                        {value: 'light', label: t('light_theme')}, 
                                        {value: 'dark', label: t('dark_theme')},
                                        {value: 'midnight', label: 'داكن جداً (Midnight)'},
                                        {value: 'latte', label: 'كافى لاتيه (Latte)'}
                                    ]} 
                                    value={settings.theme} 
                                    onChange={(v) => handleSettingsChange('theme', v as Theme)} 
                                />
                                <CustomSelect title={t('scale')} t={t} options={[{value: 'small', label: t('scaleSmall')}, {value: 'medium', label: t('scaleMedium')}, {value: 'large', label: t('scaleLarge')}]} value={settings.scale} onChange={(v) => handleSettingsChange('scale', v as Scale)} />
                            </div>
                        </SettingsCard>
                        <SettingsCard title={t('hapticFeedback')}>
                             <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-600 dark:text-gray-400">{t('hapticFeedbackDesc')}</p>
                                <div className="flex items-center">
                                    <input type="checkbox" id="haptic-toggle" className="toggle-switch-input" checked={settings.hapticFeedback} onChange={(e) => handleSettingsChange('hapticFeedback', e.target.checked)} />
                                    <label htmlFor="haptic-toggle" className="toggle-switch-label"></label>
                                </div>
                            </div>
                        </SettingsCard>
                    </div>
                );
            case 'personal':
                return (
                     <div className="space-y-4">
                        <SettingsCard title={t('personalization')}>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">{t('yourName')}</label>
                                    <input type="text" value={settings.userName} onChange={(e) => handleSettingsChange('userName', e.target.value)} placeholder={t('namePlaceholder')} className="w-full p-2.5 text-sm rounded-lg bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700" />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">{t('aboutYou')}</label>
                                    <textarea value={settings.userInfo} onChange={(e) => handleSettingsChange('userInfo', e.target.value)} placeholder={t('aboutYouPlaceholder')} rows={3} className="w-full p-2.5 text-sm rounded-lg bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 resize-none custom-scrollbar" />
                                </div>
                            </div>
                        </SettingsCard>
                        <SettingsCard title={t('memory')}>
                            <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-600 dark:text-gray-400">{t('memoryDesc')}</p>
                                <input type="checkbox" id="memory-toggle" className="toggle-switch-input" checked={settings.useMemory} onChange={(e) => handleSettingsChange('useMemory', e.target.checked)} />
                                <label htmlFor="memory-toggle" className="toggle-switch-label"></label>
                            </div>
                            {settings.useMemory && (
                                <div className="mt-4 space-y-2 pt-4 border-t border-slate-300 dark:border-neutral-700/50">
                                    <h4 className="font-semibold text-sm">{t('savedMemories')}</h4>
                                    {settings.memoryItems.length === 0 && <p className="text-xs text-gray-500">{t('noMemoriesYet')}</p>}
                                    <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                                        {settings.memoryItems.map(item => (
                                            <div key={item.id} className="flex justify-between items-center text-sm p-2 bg-slate-100 dark:bg-neutral-900 rounded-md">
                                                <p className="flex-1">{item.content}</p>
                                                <button onClick={() => handleDeleteMemory(item.id)} className="p-1 rounded-full hover:bg-red-500/10 text-gray-400 hover:text-red-500"><Icon name="x" size={14}/></button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input type="text" value={newMemory} onChange={e => setNewMemory(e.target.value)} placeholder={t('memoryPlaceholder')} className="flex-1 p-2 text-sm rounded-lg bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700" />
                                        <button onClick={handleAddMemory} className="px-3 py-2 text-xs font-bold bg-slate-800 text-white dark:bg-slate-200 dark:text-black rounded-lg">{t('addMemory')}</button>
                                    </div>
                                </div>
                            )}
                        </SettingsCard>
                    </div>
                )
            case 'ai':
                 return (
                    <div className="space-y-4">
                        <SettingsCard title={t('response_customization')}>
                            <div className="space-y-3">
                                <CustomSelect title={t('response_style')} t={t} options={[{value: 'تعليمي ومفصل', label: t('style_detailed')}, {value: 'موجز ومباشر', label: t('style_concise')}, {value: 'ودود ومساعد', label: t('style_friendly')}]} value={settings.aiStyle} onChange={(v) => handleSettingsChange('aiStyle', v)} />
                                <CustomSelect title={t('code_explanation')} t={t} options={[{value: 'شرح مفصل', label: t('explanation_detailed')}, {value: 'شرح أساسي', label: t('explanation_basic')}, {value: 'بدون شرح', label: t('explanation_none')}]} value={settings.aiExplanation} onChange={(v) => handleSettingsChange('aiExplanation', v)} />
                                <CustomSelect title={t('projectCreationResponse')} t={t} options={[{value: 'respond_then_create', label: t('respondThenCreate')}, {value: 'create_immediately', label: t('createImmediately')}]} value={settings.projectCreationResponse} onChange={(v) => handleSettingsChange('projectCreationResponse', v)} />
                            </div>
                        </SettingsCard>
                        <button onClick={() => setShowAdvancedAi(!showAdvancedAi)} className="w-full flex items-center justify-between p-2 text-sm font-semibold text-blue-600 hover:bg-blue-500/10 rounded-lg">
                            <span>{showAdvancedAi ? t('hideAdvancedFeatures') : t('showAdvancedFeatures')}</span>
                            <Icon name={showAdvancedAi ? 'chevron-up' : 'chevron-down'} size={16}/>
                        </button>
                        {showAdvancedAi && (
                            <div className="space-y-4 animate-fade-in">
                                <SettingsCard title={t('code_generation_style')}>
                                    <div className="space-y-3">
                                       <CustomSelect title={t('comment_style')} t={t} options={[{value: 'detailed', label: t('comment_detailed')}, {value: 'brief', label: t('comment_brief')}, {value: 'none', label: t('comment_none')}]} value={settings.commentStyle} onChange={(v) => handleSettingsChange('commentStyle', v)} />
                                       <CustomSelect title={t('variable_casing')} t={t} options={[{value: 'camelCase', label: t('casing_camel')}, {value: 'snake_case', label: t('casing_snake')}, {value: 'PascalCase', label: t('casing_pascal')}, {value: 'none', label: t('casing_none')}]} value={settings.variableCasing} onChange={(v) => handleSettingsChange('variableCasing', v)} />
                                       <CustomSelect title={t('function_casing')} t={t} options={[{value: 'camelCase', label: t('casing_camel')}, {value: 'snake_case', label: t('casing_snake')}, {value: 'PascalCase', label: t('casing_pascal')}, {value: 'none', label: t('casing_none')}]} value={settings.functionCasing} onChange={(v) => handleSettingsChange('functionCasing', v)} />
                                       <CustomSelect title={t('errorHandling')} t={t} options={[{value: 'try_catch', label: t('errorHandlingTryCatch')}, {value: 'throw', label: t('errorHandlingThrow')}, {value: 'return_null', label: t('errorHandlingReturnNull')}, {value: 'none', label: t('casing_none')}]} value={settings.errorHandling} onChange={(v) => handleSettingsChange('errorHandling', v as ErrorHandling)} />
                                    </div>
                                </SettingsCard>
                                <SettingsCard title={t('technology_preferences')}>
                                     <div className="space-y-3">
                                       <CustomSelect title={t('css_preference')} t={t} options={[{value: 'tailwind', label: t('css_tailwind')}, {value: 'scss', label: t('css_scss')}, {value: 'css_in_js', label: t('css_in_js')}, {value: 'inline', label: t('css_inline')}, {value: 'none', label: t('css_none')}]} value={settings.cssPreference} onChange={(v) => handleSettingsChange('cssPreference', v)} />
                                       <CustomSelect title={t('api_style')} t={t} options={[{value: 'rest', label: t('api_rest')}, {value: 'graphql', label: t('api_graphql')}, {value: 'none', label: t('api_none')}]} value={settings.apiStyle} onChange={(v) => handleSettingsChange('apiStyle', v)} />
                                       <div>
                                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">{t('tech_stack')}</label>
                                            <input type="text" value={settings.techStack} onChange={(e) => handleSettingsChange('techStack', e.target.value)} placeholder={t('tech_stack_placeholder')} className="w-full p-2.5 text-sm rounded-lg bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700" />
                                       </div>
                                       <div>
                                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-400 block mb-1">{t('programming_preferences')}</label>
                                            <textarea value={settings.aiPreferences} onChange={(e) => handleSettingsChange('aiPreferences', e.target.value)} placeholder={t('programming_preferences_placeholder')} rows={2} className="w-full p-2.5 text-sm rounded-lg bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 resize-none custom-scrollbar" />
                                       </div>
                                    </div>
                                </SettingsCard>
                            </div>
                        )}
                    </div>
                );
            case 'preview':
                 return (
                    <div className="space-y-4">
                        <SettingsCard title={t('editor')}>
                             <CustomSelect
                                title={t('editor')}
                                t={t}
                                options={[
                                    { value: 'default', label: t('defaultEditor') },
                                    { value: 'code_duck', label: t('codeDuckEditor') }
                                ]}
                                value={settings.editorPreference}
                                onChange={(v) => handleSettingsChange('editorPreference', v as EditorPreference)}
                            />
                        </SettingsCard>
                        <SettingsCard title={t('simulation')}>
                           <CustomSelect title={t('simulationDevice')} t={t} options={[{value: 'none', label: t('none')}, {value: 'smartphone', label: t('smartphone')}, {value: 'tablet', label: t('tablet')}, {value: 'laptop', label: t('laptop')}]} value={settings.simulationDevice} onChange={(v) => handleSettingsChange('simulationDevice', v as SimulationDevice)} />
                        </SettingsCard>
                        <SettingsCard title={t('appearance')}>
                           <CustomSelect title={t('previewColorScheme')} t={t} options={[{value: 'auto', label: t('system')}, {value: 'light', label: t('light_theme')}, {value: 'dark', label: t('dark_theme')}]} value={settings.previewColorScheme} onChange={(v) => handleSettingsChange('previewColorScheme', v as ColorScheme)} />
                           <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-300 dark:border-neutral-700/50">
                                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">{t('previewDisableJavascript')}</p>
                                <input type="checkbox" id="js-toggle" className="toggle-switch-input" checked={settings.previewDisableJavascript} onChange={(e) => handleSettingsChange('previewDisableJavascript', e.target.checked)} />
                                <label htmlFor="js-toggle" className="toggle-switch-label"></label>
                            </div>
                            <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-300 dark:border-neutral-700/50">
                                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">{t('previewDisableCss')}</p>
                                <input type="checkbox" id="css-toggle" className="toggle-switch-input" checked={settings.previewDisableCss} onChange={(e) => handleSettingsChange('previewDisableCss', e.target.checked)} />
                                <label htmlFor="css-toggle" className="toggle-switch-label"></label>
                            </div>
                        </SettingsCard>
                        <SettingsCard title={t('previewCustomCss')}>
                           <textarea value={settings.previewCustomCss} onChange={(e) => handleSettingsChange('previewCustomCss', e.target.value)} placeholder="body { background-color: #f0f0f0; }" rows={4} className="w-full p-2.5 text-sm rounded-lg bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 resize-y custom-scrollbar font-mono" />
                        </SettingsCard>
                    </div>
                );
            case 'subscription':
                const planName = isNanoUnlocked ? t('agentPlan') : isProUnlocked ? t('proPlan') : t('freePlan');
                return (
                    <div className="space-y-4">
                         <SettingsCard title={t('subscriptionStatus')}>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{t('yourCurrentPlan')}: <span className="font-bold text-gray-800 dark:text-gray-200">{planName}</span></p>
                            {!isProUnlocked && <p className="text-xs text-gray-500 mt-1">{t('notSubscribedMessage')}</p>}
                            <button onClick={onOpenSubscriptionModal} className="mt-3 w-full px-4 py-2 font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors rounded-lg">{t('manageSubscription')}</button>
                         </SettingsCard>
                         {(isProUnlocked || isNanoUnlocked) && (
                            <SettingsCard title={t('usageDetails')}>
                               <div className="flex justify-between items-center text-sm">
                                  <span className="font-semibold text-gray-600 dark:text-gray-400">{t('agentPointsUsage')}</span>
                                  <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{agentPoints} / {MAX_AGENT_POINTS}</span>
                               </div>
                               <div className="w-full bg-slate-100 dark:bg-neutral-900 rounded-full h-2.5 mt-2">
                                  <div className="bg-blue-500 h-2.5 rounded-full" style={{width: `${(agentPoints / MAX_AGENT_POINTS) * 100}%`}}></div>
                               </div>
                               <div className="flex justify-between items-center text-xs mt-2 text-gray-500 dark:text-gray-400">
                                  <span>{t('pointsResetIn')}</span>
                                  <TimeRemainingCounter lastReset={agentPointsLastReset} />
                               </div>
                            </SettingsCard>
                         )}
                         {(isProUnlocked || isNanoUnlocked) && (
                            <SettingsCard title={t('danger_zone')}>
                                <button onClick={onCancelSubscription} className="w-full px-4 py-2 font-bold text-sm bg-red-600 hover:bg-red-700 text-white transition-colors rounded-lg">{t('cancelSubscription')}</button>
                                <p className="text-xs text-gray-500 mt-2">{t('cancelSubscriptionDesc')}</p>
                            </SettingsCard>
                         )}
                    </div>
                );
            case 'account':
                return (
                    <div className="space-y-4">
                        {currentUser ? (
                            <>
                                <SettingsCard title={t('account')}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-slate-300 dark:bg-neutral-700 flex items-center justify-center overflow-hidden">
                                                {currentUser.profilePicture ? (
                                                    <img src={currentUser.profilePicture} alt={currentUser.firstName || 'User'} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Icon name="user" className="w-6 h-6 text-gray-500" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">{currentUser.firstName || currentUser.email}</p>
                                                <p className="text-xs text-gray-500">{currentUser.email}</p>
                                            </div>
                                        </div>
                                        <Tooltip text={t('editProfile')}>
                                            <button onClick={() => onOpenProfileEditor(currentUser)} className="p-2 rounded-full hover:bg-slate-300 dark:hover:bg-neutral-700">
                                                <Icon name="pencil" className="w-5 h-5" />
                                            </button>
                                        </Tooltip>
                                    </div>
                                    <button onClick={onLogout} className="mt-3 w-full px-4 py-2 font-bold text-sm bg-slate-300 dark:bg-neutral-700 hover:bg-slate-400 dark:hover:bg-neutral-600 transition-colors rounded-lg">{t('logout')}</button>
                                </SettingsCard>
                                <SettingsCard title="User ID">
                                    <div className="flex items-center justify-between p-2 bg-slate-100 dark:bg-neutral-900 rounded-lg">
                                        <span className="text-sm font-mono text-gray-600 dark:text-gray-400 truncate">
                                            {isIdVisible ? currentUser.id : '********************'}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <Tooltip text={t(idCopied ? 'copied' : 'copyText')}>
                                                <button onClick={handleCopyId} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-neutral-700">
                                                    <Icon name={idCopied ? 'check' : 'copy'} size={16} className={idCopied ? "text-green-500" : "text-gray-500"} />
                                                </button>
                                            </Tooltip>
                                            <Tooltip text={isIdVisible ? "Hide ID" : "Show ID"}>
                                                <button onClick={() => setIsIdVisible(p => !p)} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-neutral-700">
                                                    <Icon name={isIdVisible ? 'eye-off' : 'eye'} size={16} className="text-gray-500" />
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </SettingsCard>
                                <SettingsCard title={t('pinLock')}>
                                   <div className="flex justify-between items-center">
                                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">{t('enablePinLock')}</p>
                                        <input type="checkbox" id="pin-toggle" className="toggle-switch-input" checked={!!currentUser.isPinEnabled} onChange={() => setIsPinSetupVisible(!isPinSetupVisible)} />
                                        <label htmlFor="pin-toggle" className="toggle-switch-label"></label>
                                    </div>
                                    {isPinSetupVisible && (
                                        <div className="mt-3 pt-3 border-t border-slate-300 dark:border-neutral-700/50 space-y-2">
                                            {currentUser.isPinEnabled && <input type="password" value={currentPin} onChange={e => setCurrentPin(e.target.value)} placeholder={t('currentPin')} maxLength={4} className="w-full p-2 text-sm rounded-lg bg-white dark:bg-neutral-900" />}
                                            <input type="password" value={newPin} onChange={e => setNewPin(e.target.value)} placeholder={currentUser.isPinEnabled ? t('newPinOptional') : t('newPin')} maxLength={4} className="w-full p-2 text-sm rounded-lg bg-white dark:bg-neutral-900" />
                                            <input type="password" value={confirmNewPin} onChange={e => setConfirmNewPin(e.target.value)} placeholder={t('confirmNewPin')} maxLength={4} className="w-full p-2 text-sm rounded-lg bg-white dark:bg-neutral-900" />
                                            {pinError && <p className="text-xs text-red-500">{pinError}</p>}
                                            <button onClick={handlePinSave} className="w-full px-4 py-2 text-sm font-bold bg-blue-600 text-white rounded-lg">{t('save')}</button>
                                        </div>
                                    )}
                                </SettingsCard>
                            </>
                        ) : (
                            <SettingsCard title={t('account')}>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{t('signInToSync')}</p>
                                <button onClick={onOpenAuthModal} className="w-full px-4 py-2 font-bold text-sm bg-slate-800 text-white dark:bg-slate-200 dark:text-black rounded-lg">{t('signIn')}</button>
                            </SettingsCard>
                        )}
                    </div>
                );
            case 'data':
                return (
                    <div className="space-y-4">
                        <SettingsCard title={t('data_management')}>
                             <button onClick={() => {}} className="w-full px-4 py-2 font-bold text-sm bg-slate-300 dark:bg-neutral-700 rounded-lg">{t('export_my_data')}</button>
                             <button onClick={onDeleteAllData} className="w-full px-4 py-2 font-bold text-sm bg-red-600 text-white rounded-lg mt-2">{t('delete_all_data')}</button>
                        </SettingsCard>
                        <SettingsCard title={t('permissions')}>
                           <div className="space-y-2">
                            <PermissionRow name="camera" label={t('cameraAccess')} status={cameraPermission} t={t} />
                            <PermissionRow name="microphone" label={t('microphoneAccess')} status={micPermission} t={t} />
                           </div>
                        </SettingsCard>
                        <SettingsCard title={t('archived')}>
                            {archivedSessions.length > 0 ? (
                                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                    {archivedSessions.map(session => (
                                        <div key={session.id} className="flex justify-between items-center p-2 bg-slate-100 dark:bg-neutral-900 rounded-md">
                                            <p className="text-sm flex-1 truncate">{session.title}</p>
                                            <button onClick={() => onUnarchiveSession(session.id)} className="text-xs font-semibold text-blue-600">{t('unarchive')}</button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">{t('noArchivedChats')}</p>
                            )}
                        </SettingsCard>
                    </div>
                );
            case 'lab':
                return (
                    <div className="space-y-4">
                        <SettingsCard title={t('lab')}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">{t('labEnableAutocomplete')}</p>
                                    <p className="text-xs text-gray-500">{t('labEnableAutocompleteDesc')}</p>
                                </div>
                                <input type="checkbox" id="lab-toggle" className="toggle-switch-input" checked={settings.labEnableAutocomplete} onChange={(e) => handleSettingsChange('labEnableAutocomplete', e.target.checked)} />
                                <label htmlFor="lab-toggle" className="toggle-switch-label"></label>
                            </div>
                        </SettingsCard>
                    </div>
                );
            case 'help':
                return (
                    <div className="h-full">
                        <CommunityChatView messages={communityMessages} currentUser={currentUser} onSendMessage={handleSendCommunityMessage} t={t} onClose={() => {}} />
                    </div>
                );
            case 'about':
                return (
                    <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                        <SettingsCard title={"NANOM AI Studio"}>
                           <p>Version 1.0.0</p>
                           <p>&copy; {new Date().getFullYear()} Score Studio Company. All rights reserved.</p>
                           <div className="pt-2 mt-2 border-t border-slate-300 dark:border-neutral-700/50">
                             <a href="#" className="text-blue-500 hover:underline">{t('termsOfUse')}</a>
                           </div>
                        </SettingsCard>
                    </div>
                );
             case 'shortcuts':
                const selectedActionInfo = AVAILABLE_SHORTCUT_ACTIONS.find(a => a.action === newShortcut.action);
                return (
                    <>
                    <SettingsCard title={
                        <div className="flex justify-between items-center">
                            <span>{t('keyboardShortcuts')}</span>
                            <div className="flex items-center gap-2">
                                <button onClick={handleStartCreatingShortcut} className="p-1.5 text-blue-600 hover:bg-blue-500/10 rounded-full">
                                    <Icon name="plus" size={16} />
                                </button>
                                <button onClick={() => onSettingsChange(prev => ({ ...prev, shortcuts: DEFAULT_SHORTCUTS }))} className="p-1.5 text-blue-600 hover:bg-blue-500/10 rounded-full">
                                    <Icon name="rotate-ccw" size={16} />
                                </button>
                            </div>
                        </div>
                    }>
                        <p className="text-sm text-gray-600 dark:text-gray-400 -mt-2 mb-4">{t('keyboardShortcutsDesc')}</p>
                        <div className="space-y-2">
                            {settings.shortcuts.map((shortcut) => {
                                const actionLabel = AVAILABLE_SHORTCUT_ACTIONS.find(a => a.action === shortcut.action)?.labelKey;
                                return (
                                    <div key={shortcut.id} className="flex justify-between items-center p-2 bg-slate-100 dark:bg-neutral-900 rounded-lg">
                                        <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">{actionLabel ? t(actionLabel) : shortcut.action}</span>
                                        <div className="flex items-center gap-2">
                                            {recordingFor === shortcut.id ? (
                                                <div className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-100 dark:bg-blue-900/50 rounded-md animate-pulse">
                                                    {t('pressNewKeys')}
                                                </div>
                                            ) : (
                                                <>
                                                    <kbd className="px-2 py-1 text-xs font-semibold text-gray-600 bg-slate-200 dark:text-gray-300 dark:bg-neutral-700 border border-slate-300 dark:border-neutral-600 rounded-md">
                                                        {shortcut.keys.replace('Meta', 'Cmd').replace(/\+/g, ' + ')}
                                                    </kbd>
                                                    {shortcut.isEditable &&
                                                        <button onClick={() => setRecordingFor(shortcut.id)} className="px-3 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-neutral-700 hover:bg-slate-300 dark:hover:bg-neutral-600 rounded-md">
                                                            {t('changeShortcut')}
                                                        </button>
                                                    }
                                                    {shortcut.isDeletable &&
                                                        <button onClick={() => handleDeleteShortcut(shortcut.id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md">
                                                            <Icon name="trash-2" size={14}/>
                                                        </button>
                                                    }
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {isCreatingShortcut && (
                                <div className="p-2 bg-slate-100 dark:bg-neutral-900 rounded-lg space-y-3 animate-fade-in border-t-2 border-slate-300 dark:border-neutral-700 mt-4 pt-3">
                                     <div className="flex items-center justify-between">
                                        <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">{t('action')}</label>
                                        <button onClick={() => setIsActionSelectorOpen(true)} className="px-3 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-neutral-700 hover:bg-slate-300 dark:hover:bg-neutral-600 rounded-md flex items-center gap-2">
                                            {selectedActionInfo && <Icon name={selectedActionInfo.icon} size={14} />}
                                            {selectedActionInfo ? t(selectedActionInfo.labelKey) : t('selectAction')}
                                        </button>
                                     </div>
                                     <div className="flex items-center justify-between">
                                        <label className="font-semibold text-sm text-gray-700 dark:text-gray-300">{t('keyBinding')}</label>
                                         {recordingFor === 'new' ? (
                                            <div className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-100 dark:bg-blue-900/50 rounded-md animate-pulse">
                                                {t('pressNewKeys')}
                                            </div>
                                         ) : (
                                            <div className="flex items-center gap-2">
                                                <kbd className="px-2 py-1 text-xs font-semibold text-gray-600 bg-slate-200 dark:text-gray-300 dark:bg-neutral-700 border border-slate-300 dark:border-neutral-600 rounded-md">
                                                    {newShortcut.keys ? newShortcut.keys.replace('Meta', 'Cmd').replace(/\+/g, ' + ') : '...'}
                                                </kbd>
                                                <button onClick={() => setRecordingFor('new')} className="px-3 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-neutral-700 hover:bg-slate-300 dark:hover:bg-neutral-600 rounded-md">
                                                    {t('changeShortcut')}
                                                </button>
                                            </div>
                                         )}
                                     </div>
                                      <div className="flex justify-end gap-2 pt-2">
                                        <button onClick={() => setIsCreatingShortcut(false)} className="px-3 py-1.5 text-xs font-bold bg-slate-200 dark:bg-neutral-700 rounded-lg">{t('cancel')}</button>
                                        <button onClick={handleSaveNewShortcut} className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg" disabled={!newShortcut.keys}>{t('saveShortcut')}</button>
                                      </div>
                                </div>
                            )}
                        </div>
                    </SettingsCard>
                     {isActionSelectorOpen && <ActionSelector t={t} onClose={() => setIsActionSelectorOpen(false)} actions={availableActionsForNewShortcut} onSelect={(action) => {
                        setNewShortcut(p => ({...p, action}));
                        setIsActionSelectorOpen(false);
                     }} />}
                     </>
                );
            default:
                return <div>{t(tabs.find(t => t.id === activeTab)?.labelKey || 'settings')}</div>
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center md:p-4 animate-fade-in">
            <div className="shadow-2xl md:rounded-2xl max-w-5xl w-full h-full md:max-h-[90vh] bg-slate-100 dark:bg-neutral-900 overflow-hidden flex flex-col md:flex-row">
                {/* Header for mobile */}
                <header className="md:hidden p-3 flex justify-between items-center border-b border-slate-200 dark:border-neutral-800">
                    <h2 className="font-bold text-lg">{t('settings')}</h2>
                    <Tooltip text={t('close')}>
                      <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-neutral-700"><Icon name="x" className="w-5 h-5" /></button>
                    </Tooltip>
                </header>

                {/* Sidebar */}
                <nav className="w-full md:w-56 flex-shrink-0 p-3 flex flex-col border-b md:border-b-0 md:border-r border-slate-200 dark:border-neutral-800">
                    <div className="md:flex items-center justify-between hidden mb-4 flex-shrink-0">
                       <h2 className="font-bold text-lg">{t('settings')}</h2>
                       <Tooltip text={t('close')}>
                        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-neutral-700"><Icon name="x" className="w-5 h-5" /></button>
                       </Tooltip>
                    </div>
                    <ul className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-y-auto custom-scrollbar pb-2 md:pb-0">
                        {tabs.map(tab => (
                            <li key={tab.id}>
                                <button
                                    onClick={() => handleTabClick(tab.id)}
                                    className={`flex-shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors w-full text-start ${activeTab === tab.id ? 'bg-slate-200 dark:bg-neutral-800 text-gray-800 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 hover:bg-slate-200/50 dark:hover:bg-neutral-800/50'}`}
                                >
                                    <Icon name={tab.icon} className="w-5 h-5" />
                                    <span>{t(tab.labelKey)}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
                
                {/* Content */}
                <main ref={contentRef} className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-white dark:bg-neutral-800/30">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default SettingsModal;

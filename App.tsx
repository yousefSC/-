
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GenerateContentResponse } from "@google/genai";
import { Message, ChatSession, Project, Settings, ModalState, GenerationMode, Language, TranslationKey, Theme, Attachment, GroundingMetadata, SimulationDevice, MemoryItem, Scale, User, Space, Notifications, NotificationItem, ShortcutAction, NotificationTarget, SettingsTab } from './types';
import { translations, projectTemplates, DEV_MODE_ACTIVATION_CODE, DEFAULT_SHORTCUTS } from './constants';
import * as s from './services/gemini';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import InputArea from './components/InputArea';
import Icon from './components/Icon';
import HtmlPreviewModal from './components/modals/HtmlPreviewModal';
import { JsPreviewModal } from './components/modals/JsPreviewModal';
import AndroidPreviewModal from './components/modals/AndroidPreviewModal';
import LibraryModal from './components/modals/LibraryModal';
import SettingsModal from './components/modals/SettingsModal';
import ConfirmationModal from './components/modals/ConfirmationModal';
import CameraCaptureModal from './components/modals/CameraCaptureModal';
import MediaAttachmentSheet from './components/modals/MediaAttachmentSheet';
import AiToolsSheet from './components/modals/AiToolsSheet';
import ImageViewerModal from './components/modals/ImageViewerModal';
import ImageEditorModal from './components/modals/ImageEditorModal';
import SubscriptionModal from './components/modals/SubscriptionModal';
import SourcesModal from './components/modals/SourcesModal';
import ThinkingModal from './components/modals/ThinkingModal';
import ImportProjectModal from './components/modals/ImportProjectModal';
import AuthModal from './components/modals/AuthModal';
import SpaceEditorModal from './components/modals/SpaceEditorModal';
import SpaceViewModal from './components/modals/SpaceViewModal';
import PinLockModal from './components/modals/PinLockModal';
import NotificationsPanel from './components/modals/NotificationsPanel';
import ReportModal from './components/modals/ReportModal';
import SearchModal from './components/modals/SearchModal';
import Tooltip from './components/ui/Tooltip';
import StreamingProjectView from './components/StreamingProjectView';
import ExportChatModal from './components/modals/ExportChatModal';
import ProfileEditorModal from './components/modals/ProfileEditorModal';
import JSZip from 'jszip';


const downloadDataUrl = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const saveFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const MAX_PRO_POINTS = 300;
const MAX_AGENT_POINTS = 500;
const POINTS_REFRESH_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in ms
const ACTIVATION_CODE = '182006';
const NANO_ACTIVATION_CODE = '30102007';

const LOCAL_STORAGE_KEY_PREFIX = 'nanom_data_';
const LOCAL_STORAGE_KEY_USERS = 'nanom_users';
const LOCAL_STORAGE_KEY_USERS_BACKUP = 'nanom_users_backup';
const LOCAL_STORAGE_KEY_USERS_LEGACY = 'nanom_legacy_users'; // Key from previous version that caused the issue
const LOCAL_STORAGE_KEY_CURRENT_USER = 'nanom_currentUser';
const LOCAL_STORAGE_KEY_GLOBAL_NOTIFICATIONS = 'nanom_global_notifications';
const LOCAL_STORAGE_KEY_DEV_MODE = 'nanom_isDeveloperMode';


// --- User Data Persistence Helpers ---
const getUsersWithRecovery = (): User[] => {
    let users: User[] = [];

    // 1. Try reading primary storage
    try {
        const usersData = localStorage.getItem(LOCAL_STORAGE_KEY_USERS);
        if (usersData && usersData !== '[]') {
            const parsedUsers = JSON.parse(usersData);
            if (Array.isArray(parsedUsers)) {
                users = parsedUsers;
            }
        }
    } catch (e) {
        console.error(`Failed to parse primary user list from key "${LOCAL_STORAGE_KEY_USERS}":`, e);
        users = [];
    }

    // 2. If primary is empty/invalid, try reading backup
    if (users.length === 0) {
        try {
            const backupUsersData = localStorage.getItem(LOCAL_STORAGE_KEY_USERS_BACKUP);
            if (backupUsersData && backupUsersData !== '[]') {
                console.log("Primary user list is empty or invalid, attempting to restore from backup.");
                const backupUsers = JSON.parse(backupUsersData);
                if (Array.isArray(backupUsers) && backupUsers.length > 0) {
                    users = backupUsers;
                    // Restore primary from backup immediately
                    localStorage.setItem(LOCAL_STORAGE_KEY_USERS, JSON.stringify(users));
                    console.log("Successfully restored users from backup.");
                }
            }
        } catch (e) {
            console.error(`Failed to parse or restore from backup user list at key "${LOCAL_STORAGE_KEY_USERS_BACKUP}":`, e);
        }
    }
    
    // 3. If still no users, check for legacy data and load it for migration on next save
    if (users.length === 0) {
        try {
            const legacyUsersData = localStorage.getItem(LOCAL_STORAGE_KEY_USERS_LEGACY);
            if (legacyUsersData && legacyUsersData !== '[]') {
                console.log("No users found in current storage, attempting to load from legacy storage.");
                const legacyUsers = JSON.parse(legacyUsersData);
                if (Array.isArray(legacyUsers) && legacyUsers.length > 0) {
                    users = legacyUsers;
                    console.log(`Loaded ${legacyUsers.length} users from legacy storage. They will be migrated on the next save operation.`);
                }
            }
        } catch (e) {
            console.error(`Failed to parse from legacy user list at key "${LOCAL_STORAGE_KEY_USERS_LEGACY}":`, e);
        }
    }
    
    return users;
};

const saveUsers = (users: User[]) => {
    try {
        const usersJson = JSON.stringify(users);
        localStorage.setItem(LOCAL_STORAGE_KEY_USERS, usersJson);
        localStorage.setItem(LOCAL_STORAGE_KEY_USERS_BACKUP, usersJson);
        
        // After successfully saving to new keys, remove the legacy key if it exists
        // to complete the migration.
        if (localStorage.getItem(LOCAL_STORAGE_KEY_USERS_LEGACY)) {
             localStorage.removeItem(LOCAL_STORAGE_KEY_USERS_LEGACY);
             console.log("Legacy user key removed after successful migration.");
        }
    } catch (e) {
        console.error("Failed to save user lists to localStorage:", e);
    }
};


// Main App Component
const App: React.FC = () => {
  // State Management
  const [settings, setSettings] = useState<Settings>({
    language: 'ar',
    theme: 'system',
    scale: 'medium',
    model: 'smooth',
    userName: '',
    userInfo: '',
    aiStyle: 'تعليمي ومفصل',
    aiExplanation: 'شرح أساسي',
    projectCreationResponse: 'respond_then_create',
    codeTarget: 'web',
    commentStyle: 'brief',
    variableCasing: 'camelCase',
    functionCasing: 'camelCase',
    cssPreference: 'none',
    apiStyle: 'none',
    errorHandling: 'try_catch',
    techStack: '',
    aiPreferences: '',
    useWebSearch: false,
    autoFixCode: false,
    useDeepThinking: true,
    useMemory: false,
    memoryItems: [],
    simulationDevice: 'none',
    previewColorScheme: 'auto',
    previewDisableJavascript: false,
    previewDisableCss: false,
    previewCustomCss: '',
    hapticFeedback: false,
    projectTemperature: 0.7,
    labEnableAutocomplete: false,
    shortcuts: DEFAULT_SHORTCUTS,
    editorPreference: 'default',
  });

  const [effectiveTheme, setEffectiveTheme] = useState<Theme>('dark');
  const [effectiveLanguage, setEffectiveLanguage] = useState<Language>('ar');

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatSessionId, setCurrentChatSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentGenerationMode, setCurrentGenerationMode] = useState<GenerationMode>('chat');
  const [currentProjectContext, setCurrentProjectContext] = useState<Project | null>(null);
  const [capturedAttachment, setCapturedAttachment] = useState<Attachment | null>(null);
  const [isImageEdited, setIsImageEdited] = useState(false);
  const stopGenerationRef = useRef(false);
  const [editingMessage, setEditingMessage] = useState<{ id: string; text: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [inputAreaHeight, setInputAreaHeight] = useState(0);
  const [isChatMenuOpen, setIsChatMenuOpen] = useState(false);
  const [isProjectsMenuOpen, setIsProjectsMenuOpen] = useState(false);
  const [headerConfirmationAction, setHeaderConfirmationAction] = useState<'delete' | 'archive' | null>(null);
  const chatMenuRef = useRef<HTMLDivElement>(null);
  const projectsMenuRef = useRef<HTMLDivElement>(null);
  const [activeSnapshotId, setActiveSnapshotId] = useState<string | null>(null);
  const [newChatButtonState, setNewChatButtonState] = useState<'idle' | 'shake'>('idle');

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [isSidebarOpen, setSidebarOpen] = useState(isDesktop);
  const [projectPreviewChatWidth, setProjectPreviewChatWidth] = useState(window.innerWidth > 1024 ? 450 : window.innerWidth / 3);

  // Undo action state
  const [pendingAction, setPendingAction] = useState<{ type: 'delete' | 'archive'; sessionId: string } | null>(null);
  const pendingActionTimerRef = useRef<number | null>(null);
  const [animatingInSessionId, setAnimatingInSessionId] = useState<string | null>(null);


  // Points & Subscription State
  const [proPoints, setProPoints] = useState(MAX_PRO_POINTS);
  const [proPointsLastReset, setProPointsLastReset] = useState(Date.now());
  const [agentPoints, setAgentPoints] = useState(MAX_AGENT_POINTS);
  const [agentPointsLastReset, setAgentPointsLastReset] = useState(Date.now());
  const [isProUnlocked, setIsProUnlocked] = useState(false);
  const [isNanoUnlocked, setIsNanoUnlocked] = useState(false);
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);


  // Notifications State
  const [notifications, setNotifications] = useState<Notifications>({ news: [], updates: [], messages: [] });
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [unreadStatus, setUnreadStatus] = useState({ news: false, updates: false, messages: false });
  
  // Inline Renaming State (Header)
  const [isEditingHeaderTitle, setIsEditingHeaderTitle] = useState(false);
  const [headerTitleEditText, setHeaderTitleEditText] = useState('');
  const headerRenameInputRef = useRef<HTMLInputElement>(null);


  // Modal States
  const [modalState, setModalState] = useState<ModalState>({
    html: null,
    js: null,
    android: null,
    library: false,
    settings: false,
    confirmation: null,
    camera: false,
    mediaAttachment: false,
    aiToolsSheet: false,
    imageViewer: null,
    imageEditor: null,
    subscription: false,
    sources: null,
    thinking: null,
    importProject: false,
    auth: false,
    spaceEditor: null,
    spaceView: null,
    pinLock: null,
    notificationsPanel: false,
    notificationsFullscreen: false,
    reportSession: null,
    search: false,
    streamingProject: null,
    exportChat: null,
    profileEditor: null,
  });
  
  const [initialSettingsTab, setInitialSettingsTab] = useState<SettingsTab | undefined>();
  const [selectionPrompt, setSelectionPrompt] = useState<string | null>(null);

  const handleAskWithSelection = (text: string) => {
    setSelectionPrompt(text);
  };

  const t = useCallback((key: TranslationKey): string => {
    return (translations[effectiveLanguage] as any)[key] || key;
  }, [effectiveLanguage]);
  
  const handleCloseModal = useCallback((type: keyof ModalState) => {
    // Special handling for library -> template preview flow
    if (type === 'html' || type === 'js' || type === 'android') {
        const project = modalState[type] as Project | null;
        if (project?.isTemplatePreview) {
            setModalState(prev => ({ ...prev, [type]: null }));
            // Don't close the library modal if it's open
            return;
        }
    }
    setModalState(prev => ({...prev, [type]: null }));
  }, [modalState]);


  const handleOpenModal = useCallback((type: keyof ModalState, data?: any) => {
    setModalState(prev => ({...prev, [type]: data === undefined ? true : data }));
  }, []);

  const startNewChat = useCallback(() => {
    // Shake if already in a pristine new chat state
    if (currentChatSessionId === null && messages.length === 0) {
        setNewChatButtonState('shake');
        setTimeout(() => setNewChatButtonState('idle'), 700);
        return;
    }

    // Save current session's messages before switching away
    if (currentChatSessionId) {
        setChatSessions(prevSessions =>
            prevSessions.map(session =>
                session.id === currentChatSessionId
                    ? { ...session, messages: messages, lastModified: new Date() }
                    : session
            )
        );
    }
    
    // Reset the view to a new, unsaved chat state.
    // The session will be created and added to the sidebar in handleSendMessage.
    setCurrentChatSessionId(null);
    setMessages([]);
    setCurrentProjectContext(null);
    setCurrentGenerationMode('chat');
    setActiveSnapshotId(null);
    handleCloseModal('notificationsFullscreen');

    if (!isDesktop) {
        setSidebarOpen(false);
    }
  }, [currentChatSessionId, messages, chatSessions, isDesktop, handleCloseModal]);
  
  // --- DATA PERSISTENCE ---

  const saveDataToStorage = useCallback((user: User | null) => {
    const key = user ? `${LOCAL_STORAGE_KEY_PREFIX}${user.email}` : `${LOCAL_STORAGE_KEY_PREFIX}local`;
    const dataToSave = {
        chatSessions,
        settings,
        spaces,
        // Points are saved separately to handle resets independently
    };
    localStorage.setItem(key, JSON.stringify(dataToSave));
  }, [chatSessions, settings, spaces]);

  const loadDataFromStorage = useCallback((user: User | null) => {
    const key = user ? `${LOCAL_STORAGE_KEY_PREFIX}${user.email}` : `${LOCAL_STORAGE_KEY_PREFIX}local`;
    const savedData = localStorage.getItem(key);
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            const savedSessions = parsedData.chatSessions || [];

            setSettings(prev => ({ ...prev, ...(parsedData.settings || {}) }));
            setSpaces(parsedData.spaces || []);
            
            if (savedSessions.length > 0) {
                setChatSessions(savedSessions);
                const lastSession = savedSessions[0];
                setCurrentChatSessionId(lastSession.id);
                setMessages(lastSession.messages || []);
            } else {
                startNewChat();
            }
        } catch (e) {
            console.error("Failed to parse saved data:", e);
            startNewChat();
        }
    } else {
        startNewChat();
    }
  }, [startNewChat]);
  
  // Initial load effect
  useEffect(() => {
    const savedUserEmail = localStorage.getItem(LOCAL_STORAGE_KEY_CURRENT_USER);
    if (savedUserEmail) {
      const users = getUsersWithRecovery();
      const user = users.find((u: any) => u.email === savedUserEmail);
      if (user) {
        setCurrentUser(user);
        loadDataFromStorage(user);
      } else {
        // User in current_user key not found in users db, clear it.
        localStorage.removeItem(LOCAL_STORAGE_KEY_CURRENT_USER);
        setCurrentUser(null);
        loadDataFromStorage(null);
      }
    } else {
        setCurrentUser(null);
        loadDataFromStorage(null);
    }
    
    // Load subscription status (remains global)
    const unlocked = localStorage.getItem('isProUnlocked') === 'true';
    const nanoUnlocked = localStorage.getItem('isNanoUnlocked') === 'true';
    const devMode = localStorage.getItem(LOCAL_STORAGE_KEY_DEV_MODE) === 'true';
    setIsProUnlocked(unlocked);
    setIsNanoUnlocked(nanoUnlocked);
    setIsDeveloperMode(devMode);

    // Load global notifications
    try {
        const savedNotifications = localStorage.getItem(LOCAL_STORAGE_KEY_GLOBAL_NOTIFICATIONS);
        if (savedNotifications) {
            setNotifications(JSON.parse(savedNotifications));
        } else {
            localStorage.setItem(LOCAL_STORAGE_KEY_GLOBAL_NOTIFICATIONS, JSON.stringify({ news: [], updates: [], messages: [] }));
        }
    } catch (e) {
        console.error("Failed to load global notifications:", e);
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save data on change
  useEffect(() => {
    saveDataToStorage(currentUser);
  }, [chatSessions, settings, currentUser, saveDataToStorage, spaces]);

  // Save on Exit: Final safeguard to prevent data loss on tab close.
  useEffect(() => {
    const handleBeforeUnload = () => {
        // Directly save the most up-to-date state to localStorage, bypassing React's async state updates.
        // This constructs the final version of chatSessions manually with the latest messages.
        const finalSessions = currentChatSessionId
            ? chatSessions.map(session =>
                session.id === currentChatSessionId ? { ...session, messages: messages, lastModified: new Date() } : session
              )
            : chatSessions;

        const dataToSave = {
            chatSessions: finalSessions,
            settings,
            spaces
        };
        
        const key = currentUser ? `${LOCAL_STORAGE_KEY_PREFIX}${currentUser.email}` : `${LOCAL_STORAGE_KEY_PREFIX}local`;
        localStorage.setItem(key, JSON.stringify(dataToSave));
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [messages, currentChatSessionId, chatSessions, settings, spaces, currentUser]);


  // Effect for initializing and resetting points based on subscription status
  useEffect(() => {
    if (isNanoUnlocked) return; // Nano plan has unlimited points

    if (isProUnlocked) {
        // Agent points logic for subscribers
        const savedAgentPointsStr = localStorage.getItem('agentPoints');
        const savedAgentResetTimeStr = localStorage.getItem('agentPointsLastReset');

        if (savedAgentPointsStr !== null && savedAgentResetTimeStr !== null) {
            const savedAgentPoints = parseInt(savedAgentPointsStr, 10);
            const lastAgentReset = parseInt(savedAgentResetTimeStr, 10);
            
            if (Date.now() - lastAgentReset > POINTS_REFRESH_INTERVAL) {
                setAgentPoints(MAX_AGENT_POINTS);
                setAgentPointsLastReset(Date.now());
            } else {
                setAgentPoints(savedAgentPoints);
                setAgentPointsLastReset(lastAgentReset);
            }
        } else {
            setAgentPoints(MAX_AGENT_POINTS);
            setAgentPointsLastReset(Date.now());
        }
    } else {
        // Pro points logic for non-subscribers
        const savedPointsStr = localStorage.getItem('proPoints');
        const savedResetTimeStr = localStorage.getItem('proPointsLastReset');

        if (savedPointsStr !== null && savedResetTimeStr !== null) {
            const savedPoints = parseInt(savedPointsStr, 10);
            const lastReset = parseInt(savedResetTimeStr, 10);
            
            if (Date.now() - lastReset > POINTS_REFRESH_INTERVAL) {
                setProPoints(MAX_PRO_POINTS);
                setProPointsLastReset(Date.now());
            } else {
                setProPoints(savedPoints);
                setProPointsLastReset(lastReset);
            }
        } else {
            setProPoints(MAX_PRO_POINTS);
            setProPointsLastReset(Date.now());
        }
    }
  }, [isProUnlocked, isNanoUnlocked]);

  // Effect for persisting points based on subscription status
  useEffect(() => {
    if (isNanoUnlocked) return; // No points to save for nano

     if (isProUnlocked) {
        localStorage.setItem('agentPoints', agentPoints.toString());
        localStorage.setItem('agentPointsLastReset', agentPointsLastReset.toString());
     } else {
        localStorage.setItem('proPoints', proPoints.toString());
        localStorage.setItem('proPointsLastReset', proPointsLastReset.toString());
     }
  }, [proPoints, proPointsLastReset, agentPoints, agentPointsLastReset, isProUnlocked, isNanoUnlocked]);

  useEffect(() => {
    const handleResize = () => {
        const desktop = window.innerWidth >= 768;
        // Transition from mobile to desktop
        if (desktop && !isDesktop) {
            setSidebarOpen(true);
        }
        // Transition from desktop to mobile
        else if (!desktop && isDesktop) {
            setSidebarOpen(false);
        }
        setIsDesktop(desktop);
        if (!desktop) {
            setIsSearchFocused(false);
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isDesktop]);

  useEffect(() => {
    let mediaQuery: MediaQueryList | undefined;
    const handler = (e: MediaQueryListEvent) => setEffectiveTheme(e.matches ? 'dark' : 'light');

    if (settings.theme === 'system') {
        mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setEffectiveTheme(mediaQuery.matches ? 'dark' : 'light');
        mediaQuery.addEventListener('change', handler);
    } else {
        setEffectiveTheme(settings.theme);
    }
    return () => mediaQuery?.removeEventListener('change', handler);
  }, [settings.theme]);

  useEffect(() => {
      if (settings.language === 'system') {
          const lang = (navigator.language || 'en').split('-')[0];
          const supportedLangs: Language[] = ['ar', 'en', 'zh', 'es', 'fr', 'hi'];
          if (supportedLangs.includes(lang as Language)) {
              setEffectiveLanguage(lang as Language);
          } else {
              setEffectiveLanguage('en');
          }
      } else {
          setEffectiveLanguage(settings.language);
      }
  }, [settings.language]);

  useEffect(() => {
      if (effectiveTheme === 'dark') {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
      document.documentElement.lang = effectiveLanguage;
      document.documentElement.dir = effectiveLanguage === 'ar' ? 'rtl' : 'ltr';
  }, [effectiveTheme, effectiveLanguage]);

  useEffect(() => {
    document.documentElement.classList.remove('scale-small', 'scale-medium', 'scale-large');
    document.documentElement.classList.add(`scale-${settings.scale}`);
  }, [settings.scale]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatMenuRef.current && !chatMenuRef.current.contains(event.target as Node)) {
        setIsChatMenuOpen(false);
        setHeaderConfirmationAction(null);
        setIsEditingHeaderTitle(false);
      }
      if (projectsMenuRef.current && !projectsMenuRef.current.contains(event.target as Node)) {
        setIsProjectsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleUpdateUserProfile = useCallback((updatedProfile: Partial<User>) => {
    if (!currentUser) return;
    
    // Create a new object to avoid direct mutation issues
    const updatedUser = { ...currentUser, ...updatedProfile };
    
    // Explicitly handle removal of old keys during migration
    if ('lastReadNotificationsTimestamp' in updatedProfile) {
      delete (updatedUser as any).lastReadNotificationsTimestamp;
    }

    setCurrentUser(updatedUser);
    
    const users = getUsersWithRecovery();
    const userIndex = users.findIndex((u) => u.id === currentUser.id);
    
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updatedUser };
      if ('lastReadNotificationsTimestamp' in updatedProfile) {
        delete (users[userIndex] as any).lastReadNotificationsTimestamp;
      }
      saveUsers(users);
    }
  }, [currentUser]);

   // Check for unread notifications
  useEffect(() => {
      if (!currentUser) {
          setHasUnreadNotifications(false);
          setUnreadStatus({ news: false, updates: false, messages: false });
          return;
      }
      
      // Migration for users who have logged in but don't have the new structure yet
      if ((currentUser as any).lastReadNotificationsTimestamp && !currentUser.lastReadTimestamps) {
        const ts = (currentUser as any).lastReadNotificationsTimestamp;
        handleUpdateUserProfile({ 
            lastReadTimestamps: { news: ts, updates: ts, messages: ts },
            // This is a special property that `handleUpdateUserProfile` will look for to delete the old key
            ...({ lastReadNotificationsTimestamp: undefined } as any)
        });
        return; // Recalculate on next render with updated user profile
      }

      const lastRead = currentUser.lastReadTimestamps || { news: 0, updates: 0, messages: 0 };
      
      const newStatus = {
          news: notifications.news.some(item => item.createdAt > (lastRead.news || 0)),
          updates: notifications.updates.some(item => item.createdAt > (lastRead.updates || 0)),
          messages: notifications.messages.some(item => item.createdAt > (lastRead.messages || 0)),
      };
      
      setUnreadStatus(newStatus);
      // The external dot should only be visible when the panel is closed and there are unread items.
      setHasUnreadNotifications(!modalState.notificationsPanel && (newStatus.news || newStatus.updates || newStatus.messages));
  }, [notifications, currentUser, modalState.notificationsPanel, handleUpdateUserProfile]);

  const handleSetCurrentChatSessionId = useCallback((id: string) => {
    if (id === currentChatSessionId) return;

    // Save current session's messages before switching
    if (currentChatSessionId) {
        setChatSessions(prevSessions =>
            prevSessions.map(session =>
                session.id === currentChatSessionId
                    ? { ...session, messages: messages, lastModified: new Date() }
                    : session
            )
        );
    }

    // Switch to new session
    const session = chatSessions.find(s => s.id === id);
    if (session) {
      setMessages(session.messages || []); // Ensure it's an array
      setCurrentChatSessionId(id);
      setCurrentProjectContext(null);
      handleCloseModal('notificationsFullscreen');
    }
  }, [currentChatSessionId, messages, chatSessions, handleCloseModal]);

  const handleSelectSessionFromSearch = (sessionId: string) => {
    handleSetCurrentChatSessionId(sessionId);
    handleCloseModal('search');
    if (!isDesktop) {
        setSidebarOpen(false);
    }
  };

  const handleSetProjectContext = (message: Message) => {
    if (!message.isAI || (!message.isCode && !message.isJavaScript && !message.isAndroidApp)) return;
    const project = messageToProject(message);
    setCurrentProjectContext(project);
    setCurrentGenerationMode('project_generation');
  };

  const messageToProject = (message: Message): Project => {
    let type: 'HTML' | 'JavaScript' | 'Android' = 'HTML';
    if (message.isJavaScript) type = 'JavaScript';
    if (message.isAndroidApp) type = 'Android';
    
    return {
        id: message.id,
        type: type,
        prompt: message.prompt || 'Untitled Project',
        sessionTitle: chatSessions.find(s => s.id === currentChatSessionId)?.title || 'Current Chat',
        sessionId: currentChatSessionId || 'current',
        timestamp: message.timestamp,
        isPinned: message.isProjectPinned || false,
        htmlContent: message.htmlContent,
        text: message.text,
        manifestContent: message.manifestContent,
        layoutXmlContent: message.layoutXmlContent,
        activityCodeContent: message.activityCodeContent,
        isStopped: message.isStopped || false,
        isStreamingProject: message.isStreamingProject || false,
    };
  };

  const handleStopGeneration = useCallback(() => {
    stopGenerationRef.current = true;
    setIsLoading(false);
  }, []);
  
  const handleTogglePinSession = useCallback((sessionId: string) => {
    setChatSessions(prevSessions => 
        prevSessions.map(session => 
            session.id === sessionId ? { ...session, isPinned: !session.isPinned, lastModified: new Date() } : session
        )
    );
  }, []);

  const confirmPendingAction = useCallback(() => {
    setPendingAction(currentPendingAction => {
        if (!currentPendingAction) return null;

        if (currentPendingAction.type === 'delete') {
            setChatSessions(prevSessions => prevSessions.filter(s => s.id !== currentPendingAction.sessionId));
            if (currentChatSessionId === currentPendingAction.sessionId) {
                // Find the next available session to switch to
                const sessionsForSwitch = chatSessions.filter(s => s.id !== currentPendingAction.sessionId && !s.isArchived)
                    .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
                
                if (sessionsForSwitch.length > 0) {
                    handleSetCurrentChatSessionId(sessionsForSwitch[0].id);
                } else {
                    startNewChat();
                }
            }
        } else if (currentPendingAction.type === 'archive') {
            const sessionToUpdate = chatSessions.find(s => s.id === currentPendingAction.sessionId);
            if (sessionToUpdate) {
                setChatSessions(prevSessions =>
                    prevSessions.map(session =>
                        session.id === currentPendingAction.sessionId 
                            ? { ...session, isArchived: !session.isArchived, lastModified: new Date() } 
                            : session
                    )
                );
            }
        }
        
        if (pendingActionTimerRef.current) {
            clearTimeout(pendingActionTimerRef.current);
            pendingActionTimerRef.current = null;
        }
        return null;
    });
  }, [chatSessions, currentChatSessionId, handleSetCurrentChatSessionId, startNewChat]);

  const initiateAction = useCallback((type: 'delete' | 'archive', sessionId: string) => {
    // If there's an existing action, confirm it immediately before starting the new one.
    if (pendingActionTimerRef.current) {
        clearTimeout(pendingActionTimerRef.current);
        confirmPendingAction();
    }
    
    // Set new action
    setPendingAction({ type, sessionId });

    pendingActionTimerRef.current = window.setTimeout(() => {
        confirmPendingAction();
    }, 5000); // 5 seconds to undo
  }, [confirmPendingAction]);

  const handleUndoAction = useCallback(() => {
    if (pendingActionTimerRef.current) {
        clearTimeout(pendingActionTimerRef.current);
        pendingActionTimerRef.current = null;
    }
    if (pendingAction) {
        setAnimatingInSessionId(pendingAction.sessionId);
    }
    setPendingAction(null);
  }, [pendingAction]);

  const handleAnimationInEnd = () => {
    setAnimatingInSessionId(null);
  };

  // Handler for immediate archiving/unarchiving from settings
  const handleToggleArchiveSession = useCallback((sessionId: string) => {
    setChatSessions(prevSessions =>
        prevSessions.map(session =>
            session.id === sessionId ? { ...session, isArchived: !session.isArchived, lastModified: new Date() } : session
        )
    );
  }, []);

  const calculateAndDeductPoints = useCallback((userMessage: Message, aiMessage: Message, activeSettings: Settings) => {
    const model = activeSettings.model;

    // Base cost calculation
    let baseCost = 0;
    const isProjectCreation = (aiMessage.isCode || aiMessage.isJavaScript || aiMessage.isAndroidApp) && !userMessage.isContextEdit;
    const isProjectEdit = (aiMessage.isCode || aiMessage.isJavaScript || aiMessage.isAndroidApp) && !!userMessage.isContextEdit;
    if (isProjectEdit) {
        baseCost = 5 + Math.floor((userMessage.text.length) / 50);
    } else if (isProjectCreation) {
        if (aiMessage.isCode) baseCost = 15;
        else if (aiMessage.isJavaScript) baseCost = 25;
        else if (aiMessage.isAndroidApp) baseCost = 40;
    } else { // Regular Chat
        baseCost = 1 + Math.floor((userMessage.text.length + (aiMessage.text?.length || 0)) / 150);
    }

    // --- Point deduction based on plan ---

    // Free Plan (!isProUnlocked)
    if (!isProUnlocked) {
        if (model === 'smooth') {
            setProPoints(prev => Math.max(0, prev - baseCost));
        }
        return;
    }

    // Pro Plan (isProUnlocked && !isNanoUnlocked)
    if (isProUnlocked && !isNanoUnlocked) {
        if (model === 'pro') {
            setAgentPoints(prev => Math.max(0, prev - baseCost));
        }
        return;
    }

    // Nano Plan (isNanoUnlocked)
    if (isNanoUnlocked) {
        if (model === 'agent') {
            setAgentPoints(prev => Math.max(0, prev - baseCost));
        }
        return;
    }
  }, [isProUnlocked, isNanoUnlocked, setProPoints, setAgentPoints]);

  const generateAndStreamResponse = useCallback(async (options: {
      prompt: string;
      attachment?: Attachment;
      settingsOverride?: Partial<Settings>;
      messageToUpdateId?: string;
  }) => {
      const { prompt, attachment, settingsOverride, messageToUpdateId } = options;
      const activeSettings = { ...settings, ...settingsOverride };
      
      // --- Plan-based access control ---
      const showUpgradeModal = () => {
        setModalState(prev => ({ ...prev, confirmation: {
            title: t('upgradeRequiredTitle'),
            message: t('upgradeRequiredMessage'),
            icon: 'rocket',
            confirmButtonText: t('upgrade'),
            cancelButtonText: t('cancel'),
            onConfirm: () => {
              handleCloseModal('confirmation');
              handleOpenModal('subscription');
            },
            confirmButtonVariant: 'primary',
        }}));
      };

      // Free Plan Checks
      if (!isProUnlocked) {
        if (activeSettings.model === 'pro' || activeSettings.model === 'agent') {
            showUpgradeModal();
            return null;
        }
        if (activeSettings.model === 'smooth' && proPoints <= 0) {
            setModalState(prev => ({ ...prev, confirmation: {
                title: t('proPointsExhaustedTitle'),
                message: t('proPointsExhaustedMessage'),
                icon: 'battery-warning',
                confirmButtonVariant: 'primary',
                onConfirm: () => handleCloseModal('confirmation'),
            }}));
            return null;
        }
      }
      // Pro Plan Checks
      else if (isProUnlocked && !isNanoUnlocked) {
          if (activeSettings.model === 'agent') {
              showUpgradeModal();
              return null;
          }
          if (activeSettings.model === 'pro' && agentPoints <= 0) {
               setModalState(prev => ({ ...prev, confirmation: {
                title: t('agentPointsExhaustedTitle'),
                message: t('agentPointsExhaustedMessage'),
                icon: 'battery-warning',
                confirmButtonVariant: 'primary',
                onConfirm: () => handleCloseModal('confirmation'),
            }}));
            return null;
          }
      }
      // Nano Plan Checks
      else if (isNanoUnlocked) {
          if (activeSettings.model === 'agent' && agentPoints <= 0) {
               setModalState(prev => ({ ...prev, confirmation: {
                title: t('agentPointsExhaustedTitle'),
                message: t('agentPointsExhaustedMessage'),
                icon: 'battery-warning',
                confirmButtonVariant: 'primary',
                onConfirm: () => handleCloseModal('confirmation'),
            }}));
            return null;
          }
      }
      
      setIsLoading(true);
      stopGenerationRef.current = false;
      const imageBase64 = attachment?.mimeType.startsWith('image/') ? attachment.dataUrl.split(',')[1] : undefined;
      
      const messageIdToUpdate = messageToUpdateId || `ai_${Date.now()}`;
      
      if (messageToUpdateId) {
          setMessages(prev => prev.map(m => m.id === messageIdToUpdate ? { ...m, isStreaming: true, text: '', isError: false, groundingMetadata: null, reasoning: undefined, isStopped: false } : m));
      } else {
          const aiMessagePlaceholder: Message = { 
              id: messageIdToUpdate, sender: 'ai', text: '', timestamp: new Date(), isAI: true, type: 'chat', isStreaming: true, prompt: prompt,
              deepThinkingUsed: activeSettings.useDeepThinking,
              webSearchUsed: activeSettings.useWebSearch,
          };
          setMessages(prev => [...prev, aiMessagePlaceholder]);
      }

      try {
          const stream = await s.generateChatStream({ prompt, imageBase64, settings: activeSettings, chatHistory: messages.slice(-10), isImageEdited });
          let streamedText = "";
          let lastChunk: GenerateContentResponse | null = null;
          
          for await (const chunk of stream) {
              if (stopGenerationRef.current) break;
              
              lastChunk = chunk;
              const chunkText = chunk.text;
              
              if (chunkText) {
                  streamedText += chunkText;
                  setMessages(prev => prev.map(m =>
                      m.id === messageIdToUpdate ? { ...m, text: streamedText } : m
                  ));
              }
          }

          if (stopGenerationRef.current) {
               setMessages(prev => prev.map(m =>
                m.id === messageIdToUpdate
                    ? { ...m, isStreaming: false, isStopped: true, text: streamedText ? `${streamedText}\n\n**${t('responseStopped')}**` : `**${t('responseStopped')}**` }
                    : m
               ));
              return null;
          }
          
          let finalAiText = streamedText;
          let reasoningText: string | undefined;

          const reasoningRegex = /\[REASONING_START\](.*?)\[REASONING_END\]/s;
          const reasoningMatch = finalAiText.match(reasoningRegex);
          if (reasoningMatch && reasoningMatch[1]) {
              reasoningText = reasoningMatch[1].trim();
              finalAiText = finalAiText.replace(reasoningRegex, '').trim();
          }
          
          if (settings.useMemory) {
              const memoryRegex = /\[MEMORIES_START\](.*?)\[MEMORIES_END\]/s;
              const memoryMatch = finalAiText.match(memoryRegex);
              if (memoryMatch && memoryMatch[1]) {
                  try {
                      const newMemoryItems = JSON.parse(memoryMatch[1]);
                      if (Array.isArray(newMemoryItems) && newMemoryItems.length > 0) {
                          setSettings(prevSettings => {
                              const existingMemories = new Set(prevSettings.memoryItems.map(item => item.content.toLowerCase()));
                              const memoriesToAdd: MemoryItem[] = newMemoryItems
                                  .filter((newItem): newItem is string => typeof newItem === 'string' && newItem.trim() && !existingMemories.has(newItem.trim().toLowerCase()))
                                  .map(newItem => ({ id: `mem_${Date.now()}_${Math.random()}`, content: newItem.trim() }));
                              
                              if (memoriesToAdd.length === 0) return prevSettings;

                              return { ...prevSettings, memoryItems: [...prevSettings.memoryItems, ...memoriesToAdd] };
                          });
                      }
                  } catch (e) {
                      console.error("Failed to parse memory JSON from AI response:", e);
                  }
                  finalAiText = finalAiText.replace(memoryRegex, '').trim();
              }
          }

          const groundingMetadata = (lastChunk?.candidates?.[0]?.groundingMetadata as GroundingMetadata) ?? null;

          let finalAiMessage: Message | undefined;
          setMessages(prev => prev.map(m => {
              if (m.id === messageIdToUpdate) {
                  finalAiMessage = { ...m, isStreaming: false, text: finalAiText, groundingMetadata: groundingMetadata, reasoning: reasoningText };
                  return finalAiMessage;
              }
              return m;
          }));
          return finalAiMessage || null;
      } catch (error: any) {
          if (!stopGenerationRef.current) {
            setMessages(prev => prev.map(m =>
                m.id === messageIdToUpdate
                    ? { ...m, isStreaming: false, isError: true, text: `${t('errorOccurred')}: ${error.message || 'Unknown error'}` }
                    : m
            ));
          }
          return null;
      } finally {
          if (!stopGenerationRef.current) {
              setIsLoading(false);
          }
          setIsImageEdited(false);
      }
  }, [settings, isProUnlocked, agentPoints, proPoints, isImageEdited, messages, isNanoUnlocked, t, handleCloseModal, handleOpenModal]);

  const handleRegenerate = useCallback(async (messageToRegen: Message) => {
    const regenIndex = messages.findIndex(msg => msg.id === messageToRegen.id);
    if (regenIndex === -1) return;

    let userMessageToRegen: Message | undefined;
    for (let i = regenIndex - 1; i >= 0; i--) {
        if (!messages[i].isAI) {
            userMessageToRegen = messages[i];
            break;
        }
    }
    
    if (userMessageToRegen) {
      const finalAiMessage = await generateAndStreamResponse({
        prompt: userMessageToRegen.text,
        attachment: userMessageToRegen.attachment,
        messageToUpdateId: messageToRegen.id
      });

      if (finalAiMessage) {
        calculateAndDeductPoints(userMessageToRegen, finalAiMessage, settings);
      }
    }
  }, [messages, generateAndStreamResponse, calculateAndDeductPoints, settings]);

  // Keyboard shortcuts
  useEffect(() => {
    const keysDown = new Set<string>();

    const actionMap: { [key in ShortcutAction]: () => void } = {
      newChat: startNewChat,
      stopGeneration: handleStopGeneration,
      openSearch: () => handleOpenModal('search'),
      openLibrary: () => handleOpenModal('library'),
      openSettings: () => handleOpenModal('settings'),
      toggleSidebar: () => setSidebarOpen(prev => isDesktop && !prev),
      toggleTheme: () => setSettings(p => ({...p, theme: p.theme === 'dark' ? 'light' : 'dark'})),
      copyLastMessage: () => {
        const lastMessage = messages[messages.length - 1];
        if(lastMessage) navigator.clipboard.writeText(lastMessage.text);
      },
      regenerateLastResponse: () => {
        const lastAiMessage = [...messages].reverse().find(m => m.isAI);
        if(lastAiMessage) handleRegenerate(lastAiMessage);
      },
      focusInput: () => {
        (document.querySelector('textarea[placeholder*="' + t('askAboutCoding') + '"]') as HTMLTextAreaElement)?.focus();
      },
      openSubscription: () => handleOpenModal('subscription'),
      clearChat: () => {
         handleOpenModal('confirmation', {
            title: t('clearChatShortcut'),
            message: t('clearChatConfirm'),
            icon: 'trash-2',
            confirmButtonVariant: 'destructive',
            onConfirm: () => {
                setMessages([]);
                handleCloseModal('confirmation');
            },
        });
      },
      pinChat: () => { if (currentChatSessionId) handleTogglePinSession(currentChatSessionId); },
      archiveChat: () => { if (currentChatSessionId) initiateAction('archive', currentChatSessionId); },
      openAiTools: () => handleOpenModal('aiToolsSheet'),
      openMediaAttachments: () => handleOpenModal('mediaAttachment'),
      nextChat: () => {
        const sessions = chatSessions.filter(s => !s.isArchived).sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
        const currentIndex = sessions.findIndex(s => s.id === currentChatSessionId);
        if (currentIndex !== -1 && currentIndex < sessions.length - 1) {
            handleSetCurrentChatSessionId(sessions[currentIndex + 1].id);
        }
      },
      previousChat: () => {
        const sessions = chatSessions.filter(s => !s.isArchived).sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
        const currentIndex = sessions.findIndex(s => s.id === currentChatSessionId);
        if (currentIndex > 0) {
            handleSetCurrentChatSessionId(sessions[currentIndex - 1].id);
        }
      },
      increaseTextScale: () => setSettings(p => {
        const scales: Scale[] = ['small', 'medium', 'large'];
        const currentIndex = scales.indexOf(p.scale);
        return { ...p, scale: scales[Math.min(scales.length - 1, currentIndex + 1)] };
      }),
      decreaseTextScale: () => setSettings(p => {
        const scales: Scale[] = ['small', 'medium', 'large'];
        const currentIndex = scales.indexOf(p.scale);
        return { ...p, scale: scales[Math.max(0, currentIndex - 1)] };
      }),
      resetTextScale: () => setSettings(p => ({ ...p, scale: 'medium' })),
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (modalState.settings || e.repeat) return;

        keysDown.add(e.key);

        const sortedKeys = Array.from(keysDown).sort();
        const pressedShortcut = sortedKeys.join('+');

        for (const shortcut of settings.shortcuts) {
            let targetShortcut = shortcut.keys;
            
            // Platform specific: If shortcut is Control+... check for Meta+... on Mac
            if (targetShortcut.includes('Control') && !targetShortcut.includes('Meta') && navigator.platform.toUpperCase().indexOf('MAC') >= 0) {
                const macShortcut = targetShortcut.split('+').map(k => k === 'Control' ? 'Meta' : k).sort().join('+');
                if (macShortcut === pressedShortcut) {
                    targetShortcut = macShortcut;
                }
            }
            
            if (targetShortcut === pressedShortcut) {
                if (shortcut.action === 'stopGeneration' && !isLoading) continue;
                if (shortcut.action === 'toggleSidebar' && !isDesktop) continue;

                e.preventDefault();
                actionMap[shortcut.action]();
                return;
            }
        }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
        keysDown.delete(e.key);
    };

    const handleBlur = () => {
        keysDown.clear();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('blur', handleBlur);
    };
  }, [settings.shortcuts, isLoading, startNewChat, handleStopGeneration, handleOpenModal, modalState.settings, isDesktop, setSidebarOpen, messages, t, setSettings, currentChatSessionId, handleTogglePinSession, chatSessions, handleSetCurrentChatSessionId, handleCloseModal, handleRegenerate, initiateAction]);

  const handleReportSession = (sessionId: string) => {
    setIsChatMenuOpen(false);
    setHeaderConfirmationAction(null);
    const sessionToReport = chatSessions.find(s => s.id === sessionId);
    if (sessionToReport) {
        const finalSessionData = sessionId === currentChatSessionId
            ? { ...sessionToReport, messages: messages, reportContext: 'chat' as const }
            : { ...sessionToReport, reportContext: 'chat' as const };
        
        setModalState(prev => ({ ...prev, reportSession: finalSessionData }));
    } else {
        console.error("Could not find session to report:", sessionId);
    }
  };

  const handleOpenExportChatModal = (sessionId: string) => {
    const sessionToExport = chatSessions.find(s => s.id === sessionId);
    if (sessionToExport) {
        const finalSessionData = sessionId === currentChatSessionId
            ? { ...sessionToExport, messages: messages }
            : sessionToExport;
        
        handleOpenModal('exportChat', finalSessionData);
    } else {
        console.error("Could not find session to export:", sessionId);
    }
  };

  const handleReportMessage = (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) {
        console.error("Could not find message to report:", messageId);
        return;
    }

    const aiMessage = messages[messageIndex];
    let userMessage: Message | undefined;

    // Find the last user message before this AI message for context
    for (let i = messageIndex - 1; i >= 0; i--) {
        if (!messages[i].isAI) {
            userMessage = messages[i];
            break;
        }
    }

    const currentSession = chatSessions.find(s => s.id === currentChatSessionId);

    const sessionForReport: ChatSession = {
        id: `report_msg_${messageId}`,
        title: `Report for message in "${currentSession?.title || 'Unknown Chat'}"`,
        createdAt: new Date(),
        lastModified: new Date(),
        isPinned: false,
        messages: userMessage ? [userMessage, aiMessage] : [aiMessage],
        reportContext: 'message',
    };

    setModalState(prev => ({ ...prev, reportSession: sessionForReport }));
  };


  const handleSendMessage = async (text: string, attachment?: Attachment) => {
      // Create User Message
      const userMessage: Message = {
          id: `msg_${Date.now()}`, sender: 'user', text, timestamp: new Date(), isAI: false, type: currentGenerationMode, prompt: text,
          isContextEdit: !!currentProjectContext, originalPrompt: currentProjectContext?.prompt,
          attachment,
      };

      // If this is the first message of a new chat, create the session and update the title.
      const isFirstMessageInSession = (currentChatSessionId === null) ||
          (messages.length === 0 && chatSessions.find(s => s.id === currentChatSessionId)?.messages.length === 0);
      
      if (isFirstMessageInSession) {
        const title = await s.generateTitle(text || "New Media Chat", effectiveLanguage);
        if (currentChatSessionId === null) {
            // Create and add a completely new session
            const newSession: ChatSession = {
                id: `session_${Date.now()}`,
                title,
                createdAt: new Date(),
                lastModified: new Date(),
                isPinned: false,
                messages: [], // messages state will handle the UI
            };
            setChatSessions(prev => [newSession, ...prev]);
            setCurrentChatSessionId(newSession.id);
            setAnimatingInSessionId(newSession.id);
        } else {
            // Update title of an existing, but empty, session
            setChatSessions(prev =>
                prev.map(s =>
                    s.id === currentChatSessionId ? { ...s, title } : s
                )
            );
        }
      }
      
      setMessages(prev => [...prev, userMessage]);
      
      let treatAsChat = false;
      if (currentProjectContext) {
          const intent = await s.classifyIntent(text, currentProjectContext, effectiveLanguage);
          if (intent === 'chat') {
              setCurrentProjectContext(null);
              treatAsChat = true;
          }
      }

      const isProjectTask = (currentGenerationMode !== 'chat' || !!currentProjectContext) && !treatAsChat;
      
      if(isProjectTask) {
        setActiveSnapshotId(null);
      }

      // --- PROJECT GENERATION / EDITING LOGIC ---
      if (isProjectTask) {
        setIsLoading(true);
        const imageBase64 = attachment?.mimeType.startsWith('image/') ? attachment.dataUrl.split(',')[1] : undefined;

        if (currentProjectContext) {
            // --- EDITING EXISTING PROJECT ---
            const projectToEditId = currentProjectContext.id;
            setMessages(prev => prev.map(m => m.id === projectToEditId ? { ...m, isBeingEdited: true, isStopped: false } : m));

            try {
                if (stopGenerationRef.current) {
                    setMessages(prev => {
                        const stoppedMessage: Message = { id: `ai_stopped_${Date.now()}`, isAI: true, sender: 'ai', timestamp: new Date(), type: 'chat', text: t('responseStopped'), isError: true };
                        return prev.map(m => m.id === projectToEditId ? { ...m, isBeingEdited: false } : m).concat(stoppedMessage);
                    });
                    return;
                }

                const { chatText, messageData, editSummary } = await s.generateProjectContent({
                    prompt: text, imageBase64, generationMode: currentProjectContext.type.toLowerCase() as GenerationMode, settings: settings, chatHistory: messages.slice(-10),
                    isEditing: true, projectContext: currentProjectContext, isImageEdited, language: effectiveLanguage,
                });
                
                let updatedProject: Project | null = null;
                
                setMessages(prev => {
                    let originalProjectMessage: Message | undefined;
                    const newMessages = prev.map(m => {
                      if (m.id === projectToEditId) {
                        originalProjectMessage = m;
                        const basePrompt = m.prompt?.split(' (')[0] || '';
                        const newPrompt = editSummary ? `${basePrompt} (${editSummary})` : basePrompt;
                        return { ...m, ...messageData, prompt: newPrompt, isBeingEdited: false };
                      }
                      return m;
                    });
                    
                    if (!originalProjectMessage) return prev;
                    
                    const updatedProjectMessage = newMessages.find(m => m.id === projectToEditId)!;
                    updatedProject = messageToProject(updatedProjectMessage);
                    
                    calculateAndDeductPoints(userMessage, updatedProjectMessage, settings);
                    
                    const aiChatReply: Message = {
                        id: `ai_reply_${Date.now()}`, isAI: true, sender: 'ai', timestamp: new Date(), type: 'chat',
                        text: chatText || t('done'), isContextEdit: true, originalPrompt: currentProjectContext.prompt,
                        projectSnapshot: {
                            id: projectToEditId,
                            htmlContent: updatedProjectMessage.htmlContent,
                            text: updatedProjectMessage.text,
                            manifestContent: updatedProjectMessage.manifestContent,
                            layoutXmlContent: updatedProjectMessage.layoutXmlContent,
                            activityCodeContent: updatedProjectMessage.activityCodeContent,
                            type: updatedProjectMessage.type,
                        }
                    };

                    return [...newMessages, aiChatReply];
                });
                
                if (updatedProject) {
                    setCurrentProjectContext(updatedProject);
                    const projectTypeKey = updatedProject.type.toLowerCase() as 'html' | 'js' | 'android';
                    if (modalState[projectTypeKey]) {
                        setModalState(prev => ({ ...prev, [projectTypeKey]: updatedProject }));
                    }
                }
            } catch (error: any) {
                 setMessages(prev => {
                    const errorMessage: Message = {
                         id: `err_${Date.now()}`, isAI: true, sender: 'ai', text: `${t('errorOccurred')}: ${error.message}`,
                         timestamp: new Date(), type: 'chat', isError: true
                    };
                    return prev
                        .map(m => m.id === projectToEditId ? { ...m, isBeingEdited: false } : m)
                        .concat(errorMessage);
                 });
            } finally {
                 if (!stopGenerationRef.current) setIsLoading(false);
                 setIsImageEdited(false);
            }
        } else {
            // --- GENERATING NEW PROJECT ---
            const generationModeForRequest = currentGenerationMode;
            if (currentGenerationMode === 'project_generation') setCurrentGenerationMode('chat');
            setIsLoading(true);
            stopGenerationRef.current = false;

            const startProjectGeneration = async () => {
              try {
                  const { messageData } = await s.generateProjectContent({
                      prompt: text, imageBase64, generationMode: generationModeForRequest,
                      settings: { ...settings, projectCreationResponse: 'create_immediately' },
                      chatHistory: messages.slice(-10), isEditing: false, projectContext: null, isImageEdited,
                      language: effectiveLanguage,
                  });
        
                  if (stopGenerationRef.current) {
                      const stoppedMessage: Message = { id: `ai_stopped_${Date.now()}`, isAI: true, sender: 'ai', text: t('responseStopped'), timestamp: new Date(), type: 'chat', isError: true };
                      setMessages(prev => [...prev, stoppedMessage]);
                      return;
                  }
        
                  const finalProjectMessage: Message = {
                      id: `ai_proj_${Date.now()}`, sender: 'ai', timestamp: new Date(), isAI: true, type: generationModeForRequest, prompt: text,
                      isStreamingProject: false,
                      isCode: generationModeForRequest === 'code_generation' || generationModeForRequest === 'project_generation',
                      isJavaScript: generationModeForRequest === 'javascript_code_generation',
                      isAndroidApp: generationModeForRequest === 'android_app_generation',
                      ...messageData,
                      text: messageData.text || 'Project Generated.',
                  };
                  
                  calculateAndDeductPoints(userMessage, finalProjectMessage, settings);
                  setMessages(prev => [...prev, finalProjectMessage]);
              } catch (error: any) {
                  if (stopGenerationRef.current) {
                    const stoppedMessage: Message = { id: `ai_stopped_${Date.now()}`, isAI: true, sender: 'ai', text: t('responseStopped'), timestamp: new Date(), type: 'chat', isError: true };
                    setMessages(prev => [...prev, stoppedMessage]);
                  } else {
                    const errorMessage: Message = { 
                       id: `err_${Date.now()}`, isAI: true, sender: 'ai', text: `${t('errorOccurred')}: ${error.message || 'Unknown error'}`, 
                       timestamp: new Date(), type: 'chat', isError: true 
                    };
                    setMessages(prev => [...prev, errorMessage]);
                  }
              } finally {
                  if (!stopGenerationRef.current) setIsLoading(false);
                  setIsImageEdited(false);
              }
            };

            if (settings.projectCreationResponse === 'respond_then_create') {
                const ackMessageId = `ai_ack_${Date.now()}`;
                const ackPlaceholder: Message = { id: ackMessageId, sender: 'ai', text: '', timestamp: new Date(), isAI: true, type: 'chat', isStreaming: true, prompt: text };
                setMessages(prev => [...prev, ackPlaceholder]);
        
                try {
                    const stream = await s.generateAcknowledgementStream(text, settings);
                    let streamedText = "";
                    for await (const chunk of stream) {
                        if (stopGenerationRef.current) break;
                        const chunkText = chunk.text;
                        if (chunkText) {
                            streamedText += chunkText;
                            setMessages(prev => prev.map(m => m.id === ackMessageId ? { ...m, text: streamedText } : m));
                        }
                    }
                    setMessages(prev => prev.map(m => m.id === ackMessageId ? { ...m, isStreaming: false } : m));
            
                    if (!stopGenerationRef.current) {
                        await startProjectGeneration();
                    } else {
                         setIsLoading(false);
                    }
                } catch (error: any) {
                    setMessages(prev => prev.map(m => m.id === ackMessageId ? { ...m, isStreaming: false, isError: true, text: `${t('errorOccurred')}: ${error.message || 'Unknown error'}` } : m));
                    setIsLoading(false);
                }
            } else { // 'create_immediately'
                await startProjectGeneration();
            }
        }
      } else {
          // --- STREAMING CHAT LOGIC ---
          const finalAiMessage = await generateAndStreamResponse({ prompt: text, attachment });
          if (finalAiMessage) {
              calculateAndDeductPoints(userMessage, finalAiMessage, settings);
          }
      }
  };

  const handleMessageFeedback = async (message: Message, feedback: 'good' | 'bad' | 'web_search' | 'deep_thinking') => {
    const messageIndex = messages.findIndex(msg => msg.id === message.id);
    if (messageIndex === -1) return;

    let userPromptMessage: Message | undefined;
    for (let i = messageIndex - 1; i >= 0; i--) {
        if (!messages[i].isAI) {
            userPromptMessage = messages[i];
            break;
        }
    }

    if (!userPromptMessage) return;

    if (feedback === 'web_search' || feedback === 'deep_thinking') {
      const finalAiMessage = await generateAndStreamResponse({
        prompt: userPromptMessage.text,
        attachment: userPromptMessage.attachment,
        messageToUpdateId: message.id,
        settingsOverride: feedback === 'web_search' ? { useWebSearch: true } : { useDeepThinking: true }
      });
       if (finalAiMessage) {
        calculateAndDeductPoints(userPromptMessage, finalAiMessage, settings);
      }
      return;
    }
    
    // For good/bad feedback
    const feedbackTypeString = feedback === 'good' ? 'Good Response Example' : 'Bad Response Example';
    const feedbackString = `\n\n---\n# ${feedbackTypeString}\n## User Prompt:\n${userPromptMessage.text}\n\n## AI Response:\n${message.text}\n---`;

    setSettings(prev => ({
      ...prev,
      userInfo: (prev.userInfo || '') + feedbackString
    }));

    setMessages(prev => prev.map(m => 
        m.id === message.id ? { ...m, feedbackGiven: true } : m
    ));
  };
  
  const handleStartEdit = (message: Message) => {
    setEditingMessage({ id: message.id, text: message.text });
    setMessages(prev => prev.map(m => m.id === message.id ? { ...m, isEditing: true } : m));
  };
  
  const handleCancelEdit = () => {
    if (editingMessage) {
      setMessages(prev => prev.map(m => m.id === editingMessage.id ? { ...m, isEditing: false } : m));
    }
    setEditingMessage(null);
  };
  
  const handleConfirmEdit = async (newText: string) => {
    if (!editingMessage) return;

    const editIndex = messages.findIndex(m => m.id === editingMessage.id);
    if (editIndex === -1) return;
    
    const userMessageToEdit = messages[editIndex];

    // Remove all subsequent messages
    const updatedMessages = messages.slice(0, editIndex + 1);
    
    // Update the edited message's text and clear the editing flag
    updatedMessages[editIndex] = { ...userMessageToEdit, text: newText, isEditing: false };
    
    setMessages(updatedMessages);
    setEditingMessage(null);
    
    // Generate a new response
    const finalAiMessage = await generateAndStreamResponse({
        prompt: newText,
        attachment: userMessageToEdit.attachment
    });
    
    if (finalAiMessage) {
        calculateAndDeductPoints(updatedMessages[editIndex], finalAiMessage, settings);
    }
  };


  const handleDeleteMessage = (messageId: string) => {
    setModalState(prev => ({ ...prev, confirmation: {
      title: t('deleteMessage'),
      message: t('deleteMessageConfirm'),
      icon: 'trash-2',
      confirmButtonVariant: 'destructive',
      onConfirm: () => {
        setMessages(prev => prev.filter(m => m.id !== messageId));
        handleCloseModal('confirmation');
      },
    }}));
  };
  
  const executeDeleteSession = (sessionId: string) => {
    initiateAction('delete', sessionId);
  };

  const handleDeleteSession = (sessionId: string) => {
    setModalState(prev => ({ ...prev, confirmation: {
      title: t('delete'),
      message: t('deleteSessionConfirm'),
      icon: 'trash-2',
      confirmButtonVariant: 'destructive',
      onConfirm: () => {
        initiateAction('delete', sessionId);
        handleCloseModal('confirmation');
      }
    }}));
  };

  const handleArchiveSessionWithConfirmation = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (!session) return;
    const isArchiving = !session.isArchived;

    handleOpenModal('confirmation', {
        title: t(isArchiving ? 'archive' : 'unarchive'),
        message: t(isArchiving ? 'archiveChatConfirm' : 'unarchiveChatConfirm'),
        icon: isArchiving ? 'archive' : 'unarchive',
        confirmButtonText: t(isArchiving ? 'archive' : 'unarchive'),
        onConfirm: () => {
            initiateAction('archive', sessionId);
            handleCloseModal('confirmation');
        }
    });
  };

  const handleRenameProject = (projectId: string, newTitle: string) => {
    setMessages(prevMessages =>
        prevMessages.map(msg =>
            msg.id === projectId ? { ...msg, prompt: newTitle } : msg
        )
    );
  };

  const handleTogglePinProject = (projectId: string) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === projectId ? { ...msg, isProjectPinned: !msg.isProjectPinned } : msg
      )
    );
  };

  const handleRenameSession = (sessionId: string, newTitle: string) => {
    setChatSessions(prevSessions =>
        prevSessions.map(session =>
            session.id === sessionId ? { ...session, title: newTitle, lastModified: new Date() } : session
        )
    );
  };

  const handleOpenProjectOrImageViewer = (message: Message) => {
    if (message.isCode || message.isJavaScript || message.isAndroidApp) {
        const project = messageToProject(message);
        let projectTypeKey = project.type.toLowerCase();

        if (projectTypeKey === 'javascript') {
            projectTypeKey = 'js';
        }

        setModalState(prev => ({
            ...prev,
            library: false,
            [projectTypeKey as 'html' | 'js' | 'android']: project
        }));

        // Context is no longer set automatically. The user will initiate edits from within the modal.
        return;
    }

    if (message.attachment) {
        if (message.attachment.mimeType.startsWith('image/')) {
            handleOpenModal('imageViewer', message.attachment.dataUrl);
        } else {
            downloadDataUrl(message.attachment.dataUrl, message.attachment.name);
        }
    }
  };
  
  const handleOpenStreamingProjectView = (project: Project) => {
    handleOpenModal('streamingProject', project);
  };

  const handleCloseProjectPreview = (type: 'html' | 'js' | 'android') => {
      setModalState(prev => ({ ...prev, [type]: null }));
      setCurrentProjectContext(null);
  };

  const handleUpdateCode = (messageId: string, updates: Partial<Message>) => {
    let updatedMessageForContext: Message | null = null;
    setMessages(prev => prev.map(m => {
        if (m.id === messageId) {
            const updated = { ...m, ...updates };
            updatedMessageForContext = updated;
            return updated;
        }
        return m;
    }));
    
    // Use a timeout to ensure the state has likely updated before acting on it.
    // A more robust solution would involve useEffect.
    setTimeout(() => {
        if(updatedMessageForContext && currentProjectContext && currentProjectContext.id === messageId) {
            const updatedProject = messageToProject(updatedMessageForContext);
            setCurrentProjectContext(updatedProject);
            const projectTypeKey = updatedProject.type.toLowerCase() as 'html' | 'js' | 'android';
            if (modalState[projectTypeKey]) {
              setModalState(prev => ({ ...prev, [projectTypeKey]: updatedProject }));
            }
        }
    }, 0);
  };

  const handleRevertToSnapshot = useCallback((messageToRevertTo: Message) => {
    let projectId: string;
    let code: Partial<Message>;
    let activeSnapshotIdToSet: string | null;

    if (messageToRevertTo.projectSnapshot) { // Case 1: Reverting to a snapshot held by an AI message
        projectId = messageToRevertTo.projectSnapshot.id;
        const { id, ...snapshotCode } = messageToRevertTo.projectSnapshot;
        code = snapshotCode;
        activeSnapshotIdToSet = messageToRevertTo.id;
    } else { // Case 2: Reverting to the original project message
        projectId = messageToRevertTo.id;
        const { id, sender, timestamp, isAI, type, ...projectCode } = messageToRevertTo;
        code = projectCode;
        activeSnapshotIdToSet = null;
    }

    const confirmationMessage: Message = {
        id: `ai_revert_${Date.now()}`,
        sender: 'ai',
        text: t('projectRestored'),
        timestamp: new Date(),
        isAI: true,
        type: 'chat',
    };

    let revertedProjectMessage: Message | undefined;

    setMessages(prev => {
        const updatedMessages = prev.map(m => {
            if (m.id === projectId) {
                const reverted = { ...m, ...code, prompt: m.prompt }; // keep original prompt
                revertedProjectMessage = reverted;
                return reverted;
            }
            return m;
        });
        return [...updatedMessages, confirmationMessage];
    });
    
    setActiveSnapshotId(activeSnapshotIdToSet);

    setTimeout(() => {
        if (revertedProjectMessage) {
            const currentProj = currentProjectContext;
            const openModalProj = modalState.html || modalState.js || modalState.android;
            
            if ((currentProj && currentProj.id === projectId) || (openModalProj && openModalProj.id === projectId)) {
                const updatedProject = messageToProject(revertedProjectMessage);
                if (currentProj && currentProj.id === projectId) {
                    setCurrentProjectContext(updatedProject);
                }
                
                const projectTypeKey = updatedProject.type.toLowerCase() as 'html' | 'js' | 'android';
                if (modalState[projectTypeKey] && modalState[projectTypeKey]!.id === projectId) {
                    setModalState(prev => ({ ...prev, [projectTypeKey]: updatedProject }));
                }
            }
        }
    }, 0);
  }, [currentProjectContext, modalState, t]);


  const handleMediaSelected = (dataUrl: string, name: string) => {
      const mimeType = dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));
      setCapturedAttachment({ dataUrl, name, mimeType });
      setIsImageEdited(false);
      setModalState(prev => ({ ...prev, camera: false, mediaAttachment: false }));
  };

  const handleClearCapturedAttachment = () => {
    setCapturedAttachment(null);
    setIsImageEdited(false);
  };

  const setDeveloperMode = (enabled: boolean) => {
    setIsDeveloperMode(enabled);
    localStorage.setItem(LOCAL_STORAGE_KEY_DEV_MODE, String(enabled));
  };
  
  const handleCodeSubmit = (code: string): boolean => {
    const lowerCode = code.toLowerCase();

    if (lowerCode === DEV_MODE_ACTIVATION_CODE.toLowerCase()) {
        handleCloseModal('subscription');
        setTimeout(() => {
            handleOpenModal('confirmation', {
                title: t('developerModeConfirmTitle'),
                message: t('developerModeConfirmMessage'),
                icon: 'wrench',
                confirmButtonVariant: 'primary',
                onConfirm: () => {
                    setDeveloperMode(true);
                    handleCloseModal('confirmation');
                }
            });
        }, 300);
        return true; 
    }
    
    if (lowerCode === NANO_ACTIVATION_CODE.toLowerCase()) {
        setIsProUnlocked(true);
        setIsNanoUnlocked(true);
        localStorage.setItem('isProUnlocked', 'true');
        localStorage.setItem('isNanoUnlocked', 'true');
        return true;
    }
    
    if (lowerCode === ACTIVATION_CODE.toLowerCase()) {
        setIsProUnlocked(true);
        setIsNanoUnlocked(false);
        localStorage.setItem('isProUnlocked', 'true');
        localStorage.removeItem('isNanoUnlocked');
        setAgentPoints(MAX_AGENT_POINTS);
        setAgentPointsLastReset(Date.now());
        return true;
    }
    return false;
  };

  const handleCancelSubscription = () => {
    setIsProUnlocked(false);
    setIsNanoUnlocked(false);
    localStorage.removeItem('isProUnlocked');
    localStorage.removeItem('isNanoUnlocked');
    // Reset points to the free tier default
    setProPoints(MAX_PRO_POINTS);
    setProPointsLastReset(Date.now());
  };

  const handleCreateNewProject = () => {
    handleCloseModal('library');
    startNewChat();
    setTimeout(() => {
        setCurrentGenerationMode('project_generation');
    }, 100);
  };

  const handlePreviewTemplate = (template: typeof projectTemplates[0]) => {
    const commonProperties = {
        id: `template_preview_${template.id}`,
        sender: 'ai' as const,
        timestamp: new Date(),
        isAI: true,
        type: template.generationMode,
        prompt: t(template.promptKey),
        isCode: template.type === 'HTML',
        isJavaScript: template.type === 'JavaScript',
        isAndroidApp: template.type === 'Android',
        isProjectPinned: false,
        isTemplatePreview: true,
    };

    let previewProject: Project;

    if (template.type === 'HTML') {
        previewProject = {
            ...messageToProject({
                ...commonProperties,
                text: `Preview: ${t(template.titleKey)}`,
                htmlContent: (template.content as { htmlContent: string }).htmlContent,
            }),
            isTemplatePreview: true,
        };
        handleOpenModal('html', previewProject);
    } else if (template.type === 'JavaScript') {
         previewProject = {
            ...messageToProject({
                ...commonProperties,
                text: `\`\`\`javascript\n${(template.content as { text: string }).text}\n\`\`\``,
            }),
            isTemplatePreview: true,
        };
        handleOpenModal('js', previewProject);
    } else { // type is 'Android'
        previewProject = {
            ...messageToProject({
                ...commonProperties,
                isAndroidApp: true,
                type: 'android_app_generation',
                text: `Preview: ${t(template.titleKey)}`,
                manifestContent: (template.content as { manifestContent: string }).manifestContent,
                layoutXmlContent: (template.content as { layoutXmlContent: string }).layoutXmlContent,
                activityCodeContent: (template.content as { activityCodeContent: string }).activityCodeContent,
            }),
            isTemplatePreview: true,
        };
        handleOpenModal('android', previewProject);
    }
  };

  const handleUseTemplate = (templateProject: Project) => {
    const now = new Date();
    const newProjectMessage: Message = {
        id: `proj_${Date.now()}`,
        sender: 'ai',
        timestamp: now,
        isAI: true,
        type: templateProject.type === 'HTML' 
            ? 'code_generation' 
            : templateProject.type === 'JavaScript'
            ? 'javascript_code_generation'
            : 'android_app_generation',
        prompt: templateProject.prompt,
        isCode: templateProject.type === 'HTML',
        isJavaScript: templateProject.type === 'JavaScript',
        isAndroidApp: templateProject.type === 'Android',
        htmlContent: templateProject.htmlContent,
        text: templateProject.text,
        manifestContent: templateProject.manifestContent,
        layoutXmlContent: templateProject.layoutXmlContent,
        activityCodeContent: templateProject.activityCodeContent,
        isProjectPinned: false,
    };
    
    // Close preview modal first, then library
    if (templateProject.type === 'HTML') handleCloseModal('html');
    if (templateProject.type === 'JavaScript') handleCloseModal('js');
    if (templateProject.type === 'Android') handleCloseModal('android');
    handleCloseModal('library');
    
    startNewChat();
    
    // Use a timeout to ensure the new chat is active before adding the message
    setTimeout(() => {
        const newSessionId = `session_${now.getTime()}`;
        setMessages([newProjectMessage]);
        // Find the newly created session to update its title. The ID might not be exact, so we find the one that matches our new chat pattern.
        setChatSessions(prev => {
           const newSessions = [...prev];
           const newSessionIndex = newSessions.findIndex(s => s.title === t('newChat') && s.messages.length === 0);
           if (newSessionIndex !== -1) {
             newSessions[newSessionIndex] = { ...newSessions[newSessionIndex], title: newProjectMessage.prompt || t('newChat') };
           }
           return newSessions;
        });
    }, 100);
  };

  const handleReportTemplate = (templateProject: Project) => {
      const messageFromProject = {
          id: templateProject.id,
          sender: 'ai' as const,
          text: templateProject.text || '',
          timestamp: templateProject.timestamp,
          isAI: true,
          type: (templateProject.type.toLowerCase() + '_generation') as GenerationMode,
          prompt: templateProject.prompt,
          htmlContent: templateProject.htmlContent
      };
      
      const sessionForReport: ChatSession = {
        id: `report_template_${templateProject.id}`,
        title: `Report for Template: "${templateProject.prompt}"`,
        createdAt: new Date(),
        lastModified: new Date(),
        isPinned: false,
        messages: [messageFromProject],
        reportContext: 'template',
    };
    handleOpenModal('reportSession', sessionForReport);
  };


  const handleDeleteProject = (projectId: string) => {
    setModalState(prev => ({ ...prev, confirmation: {
      title: t('deleteProject'),
      message: t('deleteProjectConfirm'),
      icon: 'trash-2',
      confirmButtonText: t('delete'),
      confirmButtonVariant: 'destructive',
      onConfirm: () => {
        setMessages(prev => prev.filter(m => m.id !== projectId));
        handleCloseModal('confirmation');
      },
    }}));
  };

  const handleImportProject = (code: string): boolean => {
    try {
        let newProjectMessage: Message | null = null;
        const commonProperties = {
            id: `imported_proj_${Date.now()}`,
            sender: 'ai' as const,
            timestamp: new Date(),
            isAI: true,
            prompt: t('importedProjectTitle'),
            isProjectPinned: false,
        };

        try {
            const parsed = JSON.parse(code);
            if (parsed.manifest && parsed.layout_xml && parsed.main_activity_kt) {
                newProjectMessage = {
                    ...commonProperties,
                    type: 'android_app_generation', isAndroidApp: true, text: 'Imported Android Project.',
                    manifestContent: parsed.manifest,
                    layoutXmlContent: parsed.layout_xml,
                    activityCodeContent: parsed.main_activity_kt,
                };
            } else if (parsed.project_type && parsed.code) {
                switch(parsed.project_type) {
                    case 'android':
                        newProjectMessage = {
                            ...commonProperties, type: 'android_app_generation', isAndroidApp: true, text: 'Imported Android Project.',
                            manifestContent: parsed.code.manifest, layoutXmlContent: parsed.code.layout_xml, activityCodeContent: parsed.code.main_activity_kt,
                        };
                        break;
                    case 'html':
                         newProjectMessage = {
                            ...commonProperties, type: 'code_generation', isCode: true, text: 'Imported HTML Project.',
                            htmlContent: parsed.code.html,
                         };
                         break;
                    case 'javascript':
                        newProjectMessage = {
                            ...commonProperties, type: 'javascript_code_generation', isJavaScript: true,
                            text: `\`\`\`javascript\n${parsed.code.javascript}\n\`\`\``,
                        };
                        break;
                }
            }
        } catch (e) { /* Not JSON */ }

        if (!newProjectMessage) {
            const trimmedCode = code.trim().toLowerCase();
            if (trimmedCode.startsWith('<!doctype html>') || trimmedCode.startsWith('<html>')) {
                 newProjectMessage = {
                    ...commonProperties, type: 'code_generation', isCode: true, text: 'Imported HTML Project.',
                    htmlContent: code,
                 };
            }
        }

        if (!newProjectMessage) {
            newProjectMessage = {
                ...commonProperties, type: 'javascript_code_generation', isJavaScript: true,
                text: `\`\`\`javascript\n${code}\n\`\`\``,
            };
        }
        
        if (!newProjectMessage) throw new Error("Could not determine project type.");
        
        startNewChat();
        setTimeout(() => { setMessages([newProjectMessage!]); }, 50);

        handleCloseModal('importProject');
        return true;
    } catch (error) {
        console.error("Failed to import project:", error);
        return false;
    }
};

  useEffect(() => {
    const handleHapticFeedback = (event: MouseEvent) => {
        if (settings.hapticFeedback && !isDesktop && 'vibrate' in navigator) {
            let targetElement = event.target as HTMLElement;
            // Traverse up the DOM to find a button or an element with button role
            while (targetElement && targetElement !== document.body) {
                if (targetElement.tagName === 'BUTTON' || targetElement.getAttribute('role') === 'button') {
                    navigator.vibrate(20); // A short, noticeable vibration for UI feedback
                    break; // Vibrate once and stop traversing
                }
                targetElement = targetElement.parentElement as HTMLElement;
            }
        }
    };

    // Using 'mousedown' for a more immediate response than 'click'
    document.addEventListener('mousedown', handleHapticFeedback);

    return () => {
        document.removeEventListener('mousedown', handleHapticFeedback);
    };
  }, [settings.hapticFeedback, isDesktop]);

  // --- AUTHENTICATION HANDLERS ---
  const handleLogin = (email: string, pass: string): string | null => {
      const users = getUsersWithRecovery();
      const user = users.find((u) => u.email === email && u.password === pass); // NOTE: In a real app, hash passwords!

      if (user) {
          if (user.isPinEnabled) {
              handleCloseModal('auth');
              handleOpenModal('pinLock', user);
          } else {
              saveDataToStorage(currentUser); // Save current local/guest session
              localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT_USER, user.email);
              setCurrentUser(user);
              loadDataFromStorage(user);
              handleCloseModal('auth');
          }
          return null; // Success
      } else {
          return t('invalidCredentialsError');
      }
  };

  const handleSignUp = (email: string, pass: string): string | null => {
      const users = getUsersWithRecovery();
      const userExists = users.some((u) => u.email === email);
      if (userExists) {
        return t('userExistsError');
      }
      
      // NOTE: In a real app, hash passwords!
      const newUser: User = { 
        id: `nanom_usr_${Date.now()}${Math.random().toString(36).substring(2, 6)}`,
        email, 
        password: pass 
      };
      const updatedUsers = [...users, newUser];
      saveUsers(updatedUsers);
      
      // Log in the new user
      saveDataToStorage(currentUser); // Save current local/guest session
      localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT_USER, newUser.email);
      setCurrentUser(newUser);
      loadDataFromStorage(newUser);
      handleCloseModal('auth');
      return null; // Success
    };

    const handleLogout = () => {
      saveDataToStorage(currentUser); // Save current user's data before logging out
      localStorage.removeItem(LOCAL_STORAGE_KEY_CURRENT_USER);
      setCurrentUser(null);
      loadDataFromStorage(null); // Load local/guest data
      handleCloseModal('confirmation');
    };
  
    const handlePinVerification = (user: User, enteredPin: string): boolean => {
        if (user.pin === enteredPin) {
            saveDataToStorage(currentUser); 
            localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT_USER, user.email);
            setCurrentUser(user);
            loadDataFromStorage(user);
            handleCloseModal('pinLock');
            return true;
        }
        return false;
    };

    const handleForgotPassword = async (email: string): Promise<string | null> => {
        const users = getUsersWithRecovery();
        const userIndex = users.findIndex(u => u.email === email);
    
        if (userIndex === -1) {
            return t('userNotFound');
        }
    
        // This is a simulation. In a real app, you would send an email with a reset link.
        // Here, we'll just generate a new password and update it in localStorage.
        const newPassword = Math.floor(100000 + Math.random() * 900000).toString();
        
        const updatedUsers = [...users];
        updatedUsers[userIndex] = { ...updatedUsers[userIndex], password: newPassword };
        saveUsers(updatedUsers);
    
        console.log(`SIMULATION: Password for ${email} has been reset to: ${newPassword}`);
        
        return null; // Indicates success
    };

    const handleSaveSpace = (spaceToSave: Partial<Space>) => {
        setSpaces(prev => {
            if (spaceToSave.id) { // Update existing
                return prev.map(s => s.id === spaceToSave.id ? { ...s, ...spaceToSave, lastModified: new Date() } as Space : s);
            } else { // Create new
                const newSpace: Space = {
                    id: `space_${Date.now()}`,
                    name: spaceToSave.name || t('newSpace'),
                    projectIds: spaceToSave.projectIds || [],
                    createdAt: new Date(),
                    lastModified: new Date(),
                    icon: spaceToSave.icon,
                    color: spaceToSave.color,
                };
                return [newSpace, ...prev];
            }
        });
        handleCloseModal('spaceEditor');
    };

    const handleDeleteSpace = (spaceId: string) => {
        setModalState(prev => ({ ...prev, confirmation: {
            title: t('deleteSpace'),
            message: t('deleteSpaceConfirm'),
            icon: 'trash-2',
            confirmButtonVariant: 'destructive',
            onConfirm: () => {
                setSpaces(prev => prev.filter(s => s.id !== spaceId));
                if (modalState.spaceView?.id === spaceId) {
                    handleCloseModal('spaceView');
                }
                handleCloseModal('confirmation');
            },
        }}));
    };

    const handleTogglePinSpace = (spaceId: string) => {
        setSpaces(prev =>
            prev.map(s =>
                s.id === spaceId ? { ...s, isPinned: !s.isPinned, lastModified: new Date() } : s
            )
        );
    };

    const handlePostNotification = (item: Omit<NotificationItem, 'id' | 'createdAt'>): boolean => {
        const newItem: NotificationItem = {
            ...item,
            id: `notif_${Date.now()}`,
            createdAt: Date.now(),
        };
        try {
            const currentNotificationsJSON = localStorage.getItem(LOCAL_STORAGE_KEY_GLOBAL_NOTIFICATIONS);
            const currentNotifications: Notifications = currentNotificationsJSON ? JSON.parse(currentNotificationsJSON) : { news: [], updates: [], messages: [] };
            
            currentNotifications[newItem.type].unshift(newItem); // Add to the top
            
            localStorage.setItem(LOCAL_STORAGE_KEY_GLOBAL_NOTIFICATIONS, JSON.stringify(currentNotifications));
            setNotifications(currentNotifications);
            return true;
        } catch (e) {
            console.error("Failed to post notification, likely due to storage limit:", e);
            return false;
        }
    };
    
    const handleDeleteNotification = (notificationId: string, type: 'news' | 'updates' | 'messages') => {
        const currentNotificationsJSON = localStorage.getItem(LOCAL_STORAGE_KEY_GLOBAL_NOTIFICATIONS);
        const currentNotifications: Notifications = currentNotificationsJSON ? JSON.parse(currentNotificationsJSON) : { news: [], updates: [], messages: [] };

        const updatedList = currentNotifications[type].filter(item => item.id !== notificationId);
        const newNotifications = {
            ...currentNotifications,
            [type]: updatedList
        };

        localStorage.setItem(LOCAL_STORAGE_KEY_GLOBAL_NOTIFICATIONS, JSON.stringify(newNotifications));
        setNotifications(newNotifications);
    };

    const handleEditNotification = (updatedItem: NotificationItem) => {
        const currentNotificationsJSON = localStorage.getItem(LOCAL_STORAGE_KEY_GLOBAL_NOTIFICATIONS);
        const currentNotifications: Notifications = currentNotificationsJSON ? JSON.parse(currentNotificationsJSON) : { news: [], updates: [], messages: [] };

        const listToUpdate = currentNotifications[updatedItem.type];
        const itemIndex = listToUpdate.findIndex(item => item.id === updatedItem.id);

        if (itemIndex !== -1) {
            listToUpdate[itemIndex] = updatedItem;
            const newNotifications = {
                ...currentNotifications,
                [updatedItem.type]: listToUpdate
            };

            localStorage.setItem(LOCAL_STORAGE_KEY_GLOBAL_NOTIFICATIONS, JSON.stringify(newNotifications));
            setNotifications(newNotifications);
        }
    };

    const handleMarkAllNotificationsAsRead = () => {
        if (currentUser) {
            const now = Date.now();
            handleUpdateUserProfile({ 
                lastReadTimestamps: {
                    news: now,
                    updates: now,
                    messages: now,
                }
            });
        }
    };

    const handleMarkCategoryAsRead = (category: 'news' | 'updates' | 'messages') => {
        if (currentUser) {
            handleUpdateUserProfile({
                lastReadTimestamps: {
                    ...(currentUser.lastReadTimestamps || { news: 0, updates: 0, messages: 0 }),
                    [category]: Date.now(),
                }
            });
        }
    };

    const handleNavigateToSessionFromSettings = (sessionId: string) => {
      handleToggleArchiveSession(sessionId); // This will set isArchived to false
      handleSetCurrentChatSessionId(sessionId);
      handleCloseModal('settings');
    };
    
    const handleOpenFullscreenNotifications = () => {
        handleCloseModal('notificationsPanel');
        handleOpenModal('notificationsFullscreen', true);
    };
    
    const handleNotificationNavigate = (target: NotificationTarget) => {
        handleCloseModal('notificationsPanel');
        handleCloseModal('notificationsFullscreen');
    
        // Add a small delay for the panel to close before navigating
        setTimeout(() => {
            switch (target.type) {
                case 'library':
                    handleOpenModal('library');
                    break;
                case 'settings':
                    setInitialSettingsTab(target.tab);
                    handleOpenModal('settings');
                    break;
                case 'subscription':
                    setInitialSettingsTab('subscription');
                    handleOpenModal('settings');
                    break;
                case 'new_chat':
                    startNewChat();
                    break;
                case 'url':
                    window.open(target.url, '_blank', 'noopener,noreferrer');
                    break;
                default:
                    console.warn("Unhandled notification target type:", (target as any).type);
            }
        }, 200);
    };

    const handleOpenSpaceView = (space: Space) => {
        handleOpenModal('spaceView', space);
    };

    const handleUpdateSpace = (spaceToUpdate: Space) => {
        setSpaces(prev => prev.map(s => s.id === spaceToUpdate.id ? { ...s, ...spaceToUpdate, lastModified: new Date() } : s));
    };

    const handleExportProject = async (project: Project) => {
        const sanitizedFilename = (project.prompt || "project").replace(/[^a-z0-9]/gi, '_').toLowerCase();
        switch (project.type) {
            case 'HTML':
                saveFile(new Blob([project.htmlContent || ''], { type: 'text/html' }), `${sanitizedFilename}.html`);
                break;
            case 'JavaScript':
                const jsCode = project.text?.replace(/```javascript\n|```/g, '').trim() || '';
                saveFile(new Blob([jsCode], { type: 'text/javascript' }), `${sanitizedFilename}.js`);
                break;
            case 'Android':
                const zip = new JSZip();
                zip.file("AndroidManifest.xml", project.manifestContent || '');
                const resFolder = zip.folder("res");
                const layoutFolder = resFolder?.folder("layout");
                layoutFolder?.file("activity_main.xml", project.layoutXmlContent || '');
                const javaFolder = zip.folder("java");
                const comFolder = javaFolder?.folder("com");
                const exampleFolder = comFolder?.folder("example");
                const appFolder = exampleFolder?.folder("app");
                appFolder?.file("MainActivity.kt", project.activityCodeContent || '');
                const content = await zip.generateAsync({ type: "blob" });
                saveFile(content, `${sanitizedFilename}_android.zip`);
                break;
        }
    };

    const handleExportId = (project: Project, setCopiedId: (id: string | null) => void) => {
        const projectId = `nanom-proj-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        let exportData: object;
        switch (project.type) {
            case 'HTML':
                exportData = { project_type: 'html', code: { html: project.htmlContent || '' } };
                break;
            case 'JavaScript':
                const jsCode = project.text?.replace(/```javascript\n|```/g, '').trim() || '';
                exportData = { project_type: 'javascript', code: { javascript: jsCode } };
                break;
            case 'Android':
                exportData = {
                    project_type: 'android',
                    code: {
                        manifest: project.manifestContent || '',
                        layout_xml: project.layoutXmlContent || '',
                        main_activity_kt: project.activityCodeContent || ''
                    }
                };
                break;
            default: return;
        }
        try {
            localStorage.setItem(projectId, JSON.stringify(exportData));
            navigator.clipboard.writeText(projectId);
            setCopiedId(project.id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (error) {
            console.error("Failed to export project ID:", error);
        }
    };

    const handleForkProject = (prompt: string, generationMode: GenerationMode) => {
        handleCloseModal('library');
        handleCloseModal('spaceView');
        startNewChat();
        setTimeout(() => {
            setCurrentGenerationMode(generationMode);
        }, 100);
    };

    const handleRequestClearChat = (projectMessageIdToKeep: string) => {
        handleOpenModal('confirmation', {
            title: t('resetChatConfirmTitle'),
            message: t('resetChatConfirmMessage'),
            icon: 'rotate-ccw',
            confirmButtonVariant: 'destructive',
            confirmButtonText: t('resetChat'),
            onConfirm: () => {
                const projectMessage = messages.find(m => m.id === projectMessageIdToKeep);
                setMessages(projectMessage ? [projectMessage] : []);
                handleCloseModal('confirmation');
            },
        });
    };

    const currentSession = chatSessions.find(s => s.id === currentChatSessionId);
    
    // Header Rename Handlers
    useEffect(() => {
        if (isEditingHeaderTitle && headerRenameInputRef.current) {
            headerRenameInputRef.current.focus();
            headerRenameInputRef.current.select();
        }
    }, [isEditingHeaderTitle]);

    const handleSaveHeaderRename = () => {
        if (currentChatSessionId && headerTitleEditText.trim() && headerTitleEditText.trim() !== currentSession?.title) {
            handleRenameSession(currentChatSessionId, headerTitleEditText.trim());
        }
        setIsEditingHeaderTitle(false);
        setIsChatMenuOpen(false);
    };

    const handleHeaderRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSaveHeaderRename();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setIsEditingHeaderTitle(false);
        }
    };


    const { allProjectsForSpaces, allProjectMessages } = React.useMemo(() => {
        const allSessions = chatSessions.map(session =>
            session.id === currentChatSessionId
            ? { ...session, messages: messages }
            : session
        );
        const projects: Project[] = [];
        const projectMessages: Message[] = [];
        allSessions.flatMap(s => s.messages || [])
            .filter(m => m.isAI && (m.isCode || m.isJavaScript || m.isAndroidApp))
            .forEach(m => {
                projects.push(messageToProject(m));
                projectMessages.push(m);
            });
        return { allProjectsForSpaces: projects, allProjectMessages: projectMessages };
    }, [messages, chatSessions, currentChatSessionId]);

    const currentChatProjects = useMemo(() => {
        if (!messages) return [];
        return messages.filter(m => m.isAI && (m.isCode || m.isJavaScript || m.isAndroidApp));
    }, [messages]);

    return (
      <div className={`h-screen w-screen flex font-sans bg-slate-100 dark:bg-neutral-900 text-gray-900 dark:text-gray-100 overflow-hidden`}>
        <Sidebar
          isOpen={isSidebarOpen}
          setIsOpen={setSidebarOpen}
          sessions={chatSessions.filter(s => !s.isArchived).sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())}
          archivedSessions={chatSessions.filter(s => s.isArchived)}
          currentChatSessionId={currentChatSessionId}
          setCurrentChatSessionId={handleSetCurrentChatSessionId}
          startNewChat={startNewChat}
          t={t}
          onOpenLibrary={() => handleOpenModal('library')}
          onOpenSettings={() => handleOpenModal('settings')}
          onOpenSearchModal={() => handleOpenModal('search')}
          language={effectiveLanguage}
          onDeleteSession={handleDeleteSession}
          onExecuteDeleteSession={(id) => initiateAction('delete', id)}
          onArchiveSessionWithConfirmation={handleArchiveSessionWithConfirmation}
          onTogglePin={handleTogglePinSession}
          onToggleArchive={(id) => initiateAction('archive', id)}
          onRenameSession={handleRenameSession}
          onOpenExportChatModal={handleOpenExportChatModal}
          isDesktop={isDesktop}
          isProUnlocked={isProUnlocked}
          isNanoUnlocked={isNanoUnlocked}
          scale={settings.scale}
          isSearchFocused={isSearchFocused}
          setIsSearchFocused={setIsSearchFocused}
          currentUser={currentUser}
          onOpenAuthModal={() => handleOpenModal('auth')}
          onLogout={() => handleOpenModal('confirmation', { title: t('logoutConfirmTitle'), message: t('logoutConfirmMessage'), icon: 'log-out', confirmButtonVariant: 'primary', onConfirm: handleLogout })}
          pendingAction={pendingAction}
          onUndoAction={handleUndoAction}
          animatingInSessionId={animatingInSessionId}
          onAnimationInEnd={handleAnimationInEnd}
          newChatButtonState={newChatButtonState}
        />
  
        <main className={`flex-1 flex flex-col h-full relative bg-slate-100 dark:bg-neutral-900 transition-all duration-300 ease-in-out transform-gpu
          ${!isDesktop && isSidebarOpen && !isSearchFocused ? 'ltr:translate-x-[22rem] rtl:-translate-x-[22rem] shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.3)] dark:shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.7)] rounded-2xl' : 'translate-x-0 rounded-none'}
        `}>
          <div 
            className={`absolute inset-0 bg-black/20 dark:bg-black/50 z-30 transition-opacity md:hidden ${isSidebarOpen && !isSearchFocused ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setSidebarOpen(false)}
          />

          {modalState.notificationsFullscreen ? (
            <NotificationsPanel
              isOpen={true}
              isFullScreen={true}
              onClose={() => handleCloseModal('notificationsFullscreen')}
              notifications={notifications}
              isAdmin={isDeveloperMode}
              onPostNotification={handlePostNotification}
              onDeleteNotification={handleDeleteNotification}
              onEditNotification={handleEditNotification}
              t={t}
              onOpenModal={handleOpenModal}
              unreadStatus={unreadStatus}
              onMarkCategoryAsRead={handleMarkCategoryAsRead}
              onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
              onNotificationNavigate={handleNotificationNavigate}
              isDesktop={isDesktop}
            />
          ) : (
            <>
                <header className="relative p-2 flex justify-between items-center border-b border-slate-200 dark:border-neutral-800 flex-shrink-0 z-10">
                    {/* Left side controls */}
                    <div className="flex items-center gap-2">
                        {!isDesktop && (
                        <Tooltip text={t(isSidebarOpen ? 'closeSidebar' : 'openSidebar')}>
                            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-600 dark:text-gray-400">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-6 h-6"
                            >
                                <path d="M4 8h10" />
                                <path d="M4 16h16" />
                            </svg>
                            </button>
                        </Tooltip>
                        )}
                    </div>

                    {/* Centered controls */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
                        { (isDesktop || messages.length === 0) && (
                            <button 
                                onClick={() => handleOpenModal('subscription')} 
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white text-gray-900 rounded-full shadow-sm hover:bg-gray-100 transition-colors border border-slate-200 dark:border-neutral-700"
                            >
                                <Icon name="crown" className="w-3.5 h-3.5 text-gray-900" />
                                <span>{t('upgrade')}</span>
                            </button>
                        )}
                        {isDeveloperMode && (
                            <div className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 text-xs font-semibold bg-green-100 text-green-800 rounded-full shadow-sm border border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800 animate-fade-in">
                                <Icon name="wrench" className="w-3.5 h-3.5" />
                                <span>{t('developerMode')}</span>
                                <Tooltip text={t('exitDeveloperMode')}>
                                <button
                                    onClick={() => setDeveloperMode(false)}
                                    className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                                >
                                    <Icon name="x" className="w-3 h-3"/>
                                </button>
                                </Tooltip>
                            </div>
                        )}
                    </div>

                    {/* Right side controls */}
                    <div className="flex items-center gap-2">
                        {messages.length === 0 ? (
                            <div className="relative">
                                <Tooltip text={t('notifications')}>
                                <button
                                    onClick={() => handleOpenModal('notificationsPanel')}
                                    className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-neutral-800"
                                >
                                    <Icon name="bell" className="w-5 h-5" />
                                </button>
                                </Tooltip>
                                {hasUnreadNotifications && (
                                    <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-slate-100 dark:ring-neutral-900"></span>
                                )}
                            </div>
                        ) : (
                            <>
                                {!isDesktop && (
                                    <Tooltip text={t('newChat')}>
                                        <button
                                            onClick={startNewChat}
                                            className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-neutral-800"
                                        >
                                            <Icon name="message-square-plus" className="w-5 h-5" />
                                        </button>
                                    </Tooltip>
                                )}
                                {isDesktop && currentChatProjects.length > 0 && (
                                    <div ref={projectsMenuRef} className="relative">
                                        <Tooltip text={t('chatProjects')}>
                                            <button
                                                onClick={() => setIsProjectsMenuOpen(prev => !prev)}
                                                className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-neutral-800"
                                            >
                                                <Icon name="layout-grid" className="w-5 h-5" />
                                            </button>
                                        </Tooltip>
                                        {isProjectsMenuOpen && (
                                            <div className="absolute top-full mt-2 right-0 rtl:right-auto rtl:left-0 w-72 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-slate-200 dark:border-neutral-700 z-10 animate-pop-in">
                                                <div className="p-3 border-b border-slate-100 dark:border-neutral-700/50">
                                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{t('chatProjects')}</p>
                                                </div>
                                                <ul className="py-1 text-sm text-gray-700 dark:text-gray-300 max-h-80 overflow-y-auto custom-scrollbar">
                                                    {currentChatProjects.map(projectMsg => (
                                                        <li key={projectMsg.id}>
                                                            <button
                                                                onClick={() => {
                                                                    handleOpenProjectOrImageViewer(projectMsg);
                                                                    setIsProjectsMenuOpen(false);
                                                                }}
                                                                className="w-full flex items-center gap-3 px-3 py-2 text-start rtl:text-right hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors"
                                                            >
                                                                <Icon 
                                                                    name={projectMsg.isCode ? 'code-xml' : projectMsg.isJavaScript ? 'zap' : 'smartphone'} 
                                                                    className="w-4 h-4 text-gray-500 dark:text-gray-400" 
                                                                />
                                                                <span className="truncate">{projectMsg.prompt || t('untitledProject')}</span>
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div ref={chatMenuRef} className="relative">
                                    <Tooltip text={t('chatOptions')}>
                                    <button
                                        onClick={() => {
                                        setIsChatMenuOpen(prev => !prev);
                                        if (isChatMenuOpen) {
                                            setHeaderConfirmationAction(null);
                                        }
                                        }}
                                        className="p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-neutral-800"
                                    >
                                        <Icon name={isDesktop ? "ellipsis" : "more-vertical"} className="w-5 h-5" />
                                    </button>
                                    </Tooltip>
                                    {isChatMenuOpen && currentChatSessionId && (
                                    <div className="absolute top-full mt-2 right-0 rtl:right-auto rtl:left-0 w-64 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-slate-200 dark:border-neutral-700 z-10 animate-pop-in">
                                        <div className="px-3 py-2 border-b border-slate-100 dark:border-neutral-700/50">
                                            {isEditingHeaderTitle ? (
                                                <div className="flex items-center gap-2">
                                                    <Icon name="pencil" className="w-4 h-4 text-gray-500 dark:text-gray-400 animate-wiggle" />
                                                    <input
                                                        ref={headerRenameInputRef}
                                                        type="text"
                                                        value={headerTitleEditText}
                                                        onChange={(e) => setHeaderTitleEditText(e.target.value)}
                                                        onBlur={handleSaveHeaderRename}
                                                        onKeyDown={handleHeaderRenameKeyDown}
                                                        className="w-full bg-transparent focus:outline-none text-sm font-semibold text-gray-800 dark:text-gray-200"
                                                    />
                                                </div>
                                            ) : (
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{currentSession?.title}</p>
                                            )}
                                        </div>
                                        {!isEditingHeaderTitle && (
                                            <>
                                                {headerConfirmationAction === null ? (
                                                    <ul className="py-1 text-sm text-gray-700 dark:text-gray-300">
                                                        <li>
                                                            <button
                                                                onClick={() => {
                                                                    if (currentSession) {
                                                                        setHeaderTitleEditText(currentSession.title);
                                                                        setIsEditingHeaderTitle(true);
                                                                    }
                                                                }}
                                                                className="w-full flex items-center gap-3 px-3 py-2 text-start rtl:text-right hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors"
                                                            >
                                                                <Icon name="pencil" className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                                                <span>{t('rename')}</span>
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button
                                                                onClick={() => {
                                                                    if (isDesktop) {
                                                                        setHeaderConfirmationAction('archive');
                                                                    } else {
                                                                        setIsChatMenuOpen(false);
                                                                        handleArchiveSessionWithConfirmation(currentChatSessionId);
                                                                    }
                                                                }}
                                                                className="w-full flex items-center gap-3 px-3 py-2 text-start rtl:text-right hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors"
                                                            >
                                                                <Icon name="archive" className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                                                <span>{t('archive')}</span>
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button
                                                                onClick={() => {
                                                                    handleOpenExportChatModal(currentChatSessionId);
                                                                    setIsChatMenuOpen(false);
                                                                }}
                                                                className="w-full flex items-center gap-3 px-3 py-2 text-start rtl:text-right hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors"
                                                            >
                                                                <Icon name="download" className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                                                <span>{t('exportChat')}</span>
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button
                                                                onClick={() => handleReportSession(currentChatSessionId)}
                                                                className="w-full flex items-center gap-3 px-3 py-2 text-start rtl:text-right hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors"
                                                            >
                                                                <Icon name="shield-alert" className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                                                <span>{t('reportChat')}</span>
                                                            </button>
                                                        </li>
                                                        <div className="my-1 border-t border-slate-100 dark:border-neutral-700/50"></div>
                                                        <li>
                                                            <button
                                                                onClick={() => {
                                                                    if (isDesktop) {
                                                                        setHeaderConfirmationAction('delete');
                                                                    } else {
                                                                        setIsChatMenuOpen(false);
                                                                        handleDeleteSession(currentChatSessionId);
                                                                    }
                                                                }}
                                                                className="w-full flex items-center gap-3 px-3 py-2 text-start rtl:text-right text-red-600 dark:text-red-500 hover:!bg-red-500/10 dark:hover:!bg-red-500/10 transition-colors"
                                                            >
                                                                <Icon name="trash-2" className="w-4 h-4 text-red-600 dark:text-red-500" />
                                                                <span>{t('delete')}</span>
                                                            </button>
                                                        </li>
                                                    </ul>
                                                ) : (
                                                    <ul className="py-1 text-sm text-gray-700 dark:text-gray-300">
                                                        <li>
                                                            <button
                                                                onClick={() => {
                                                                    setIsChatMenuOpen(false);
                                                                    setHeaderConfirmationAction(null);
                                                                    if (headerConfirmationAction) {
                                                                        initiateAction(headerConfirmationAction, currentChatSessionId);
                                                                    }
                                                                }}
                                                                className={`w-full flex items-center justify-center gap-2 px-3 py-1.5 font-semibold transition-colors ${
                                                                    headerConfirmationAction === 'delete'
                                                                        ? 'text-red-500 hover:bg-red-500/10'
                                                                        : 'text-gray-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-neutral-700'
                                                                }`}
                                                            >
                                                                {headerConfirmationAction === 'delete' ? t('delete') : t('archive')}
                                                            </button>
                                                        </li>
                                                        <li>
                                                            <button
                                                                onClick={() => setHeaderConfirmationAction(null)}
                                                                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-neutral-700"
                                                            >
                                                                {t('cancel')}
                                                            </button>
                                                        </li>
                                                    </ul>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                                </div>
                            </>
                        )}
                    </div>
                </header>

                <ChatView
                    messages={messages}
                    isLoading={isLoading}
                    t={t}
                    onRegenerate={handleRegenerate}
                    onDelete={handleDeleteMessage}
                    onOpenModal={handleOpenProjectOrImageViewer}
                    onSetProjectContext={handleSetProjectContext}
                    onSendMessage={handleSendMessage}
                    onOpenSourcesModal={(msg) => handleOpenModal('sources', msg)}
                    onOpenThinkingModal={(msg) => handleOpenModal('thinking', msg)}
                    onStartEdit={handleStartEdit}
                    onMessageFeedback={handleMessageFeedback}
                    onReportMessage={handleReportMessage}
                    isDesktop={isDesktop}
                    inputAreaHeight={inputAreaHeight}
                    onOpenStreamingProjectView={handleOpenStreamingProjectView}
                    onAskWithSelection={handleAskWithSelection}
                    onRevertToSnapshot={handleRevertToSnapshot}
                    activeSnapshotId={activeSnapshotId}
                />
        
                <InputArea
                    isLoading={isLoading}
                    onSendMessage={handleSendMessage}
                    onStopGeneration={handleStopGeneration}
                    currentGenerationMode={currentGenerationMode}
                    setCurrentGenerationMode={setCurrentGenerationMode}
                    currentProjectContext={currentProjectContext}
                    clearProjectContext={() => setCurrentProjectContext(null)}
                    t={t}
                    language={effectiveLanguage}
                    settings={settings}
                    setSettings={setSettings}
                    onOpenModal={handleOpenModal}
                    capturedAttachment={capturedAttachment}
                    clearCapturedAttachment={handleClearCapturedAttachment}
                    effectiveTheme={effectiveTheme}
                    editingMessage={editingMessage}
                    onConfirmEdit={handleConfirmEdit}
                    onCancelEdit={handleCancelEdit}
                    onHeightChange={setInputAreaHeight}
                    selectionPrompt={selectionPrompt}
                    onSelectionPromptHandled={() => setSelectionPrompt(null)}
                />
            </>
          )}
        </main>
        
        {/* Modals */}
        {modalState.library && <LibraryModal messages={messages} chatSessions={chatSessions} currentChatSessionId={currentChatSessionId} spaces={spaces} onClose={() => handleCloseModal('library')} onOpenModal={handleOpenProjectOrImageViewer} onForkProject={handleForkProject} onCreateNewProject={handleCreateNewProject} onPreviewTemplate={handlePreviewTemplate} onRenameProject={handleRenameProject} onTogglePinProject={handleTogglePinProject} onDeleteProject={handleDeleteProject} onOpenImportProject={() => handleOpenModal('importProject')} onOpenSpaceEditor={(space, projects) => handleOpenModal('spaceEditor', {space, allProjects: projects})} onDeleteSpace={handleDeleteSpace} onOpenSpace={handleOpenSpaceView} onTogglePinSpace={handleTogglePinSpace} onExportProject={handleExportProject} onExportId={handleExportId} t={t} language={effectiveLanguage} />}
        {modalState.html && <HtmlPreviewModal chatPanelWidth={projectPreviewChatWidth} setChatPanelWidth={setProjectPreviewChatWidth} activeSnapshotId={activeSnapshotId} onRevertToSnapshot={handleRevertToSnapshot} onClearChat={handleRequestClearChat} message={modalState.html} messages={(modalState.html.sessionId === currentChatSessionId ? messages : (chatSessions.find(s => s.id === modalState.html!.sessionId)?.messages || []))} onClose={() => handleCloseModal('html')} onUpdateCode={handleUpdateCode} t={t} language={effectiveLanguage} settings={settings} setSettings={setSettings} isLoading={isLoading} onStopGeneration={handleStopGeneration} onSendMessage={handleSendMessage} onRegenerate={handleRegenerate} onDelete={handleDeleteMessage} onOpenChatModal={handleOpenProjectOrImageViewer} onSetProjectContext={(p) => setCurrentProjectContext(p)} currentProjectContext={currentProjectContext} clearProjectContext={() => setCurrentProjectContext(null)} onOpenSourcesModal={(msg) => handleOpenModal('sources', msg)} onOpenThinkingModal={(msg) => handleOpenModal('thinking', msg)} onOpenInputModal={handleOpenModal} setCurrentGenerationMode={setCurrentGenerationMode} capturedAttachment={capturedAttachment} clearCapturedAttachment={handleClearCapturedAttachment} effectiveTheme={effectiveTheme} setIsImageEdited={setIsImageEdited} proPoints={proPoints} agentPoints={agentPoints} isProUnlocked={isProUnlocked} isNanoUnlocked={isNanoUnlocked} onStartEdit={handleStartEdit} onMessageFeedback={handleMessageFeedback} editingMessage={editingMessage} onConfirmEdit={handleConfirmEdit} onCancelEdit={handleCancelEdit} onReportMessage={handleReportMessage} isDesktop={isDesktop} onUseTemplate={handleUseTemplate} onReportTemplate={handleReportTemplate} onAskWithSelection={handleAskWithSelection} selectionPrompt={selectionPrompt} onSelectionPromptHandled={() => setSelectionPrompt(null)} />}
        {modalState.js && <JsPreviewModal chatPanelWidth={projectPreviewChatWidth} setChatPanelWidth={setProjectPreviewChatWidth} activeSnapshotId={activeSnapshotId} onRevertToSnapshot={handleRevertToSnapshot} onClearChat={handleRequestClearChat} message={modalState.js} messages={(modalState.js.sessionId === currentChatSessionId ? messages : (chatSessions.find(s => s.id === modalState.js!.sessionId)?.messages || []))} onClose={() => handleCloseModal('js')} onUpdateCode={handleUpdateCode} t={t} language={effectiveLanguage} settings={settings} setSettings={setSettings} isLoading={isLoading} onStopGeneration={handleStopGeneration} onSendMessage={handleSendMessage} onRegenerate={handleRegenerate} onDelete={handleDeleteMessage} onOpenChatModal={handleOpenProjectOrImageViewer} onSetProjectContext={(p) => setCurrentProjectContext(p)} currentProjectContext={currentProjectContext} clearProjectContext={() => setCurrentProjectContext(null)} onOpenSourcesModal={(msg) => handleOpenModal('sources', msg)} onOpenThinkingModal={(msg) => handleOpenModal('thinking', msg)} onOpenInputModal={handleOpenModal} setCurrentGenerationMode={setCurrentGenerationMode} capturedAttachment={capturedAttachment} clearCapturedAttachment={handleClearCapturedAttachment} effectiveTheme={effectiveTheme} setIsImageEdited={setIsImageEdited} proPoints={proPoints} agentPoints={agentPoints} isProUnlocked={isProUnlocked} isNanoUnlocked={isNanoUnlocked} onStartEdit={handleStartEdit} onMessageFeedback={handleMessageFeedback} editingMessage={editingMessage} onConfirmEdit={handleConfirmEdit} onCancelEdit={handleCancelEdit} onReportMessage={handleReportMessage} isDesktop={isDesktop} onUseTemplate={handleUseTemplate} onReportTemplate={handleReportTemplate} onAskWithSelection={handleAskWithSelection} selectionPrompt={selectionPrompt} onSelectionPromptHandled={() => setSelectionPrompt(null)} />}
        {modalState.android && <AndroidPreviewModal chatPanelWidth={projectPreviewChatWidth} setChatPanelWidth={setProjectPreviewChatWidth} activeSnapshotId={activeSnapshotId} onRevertToSnapshot={handleRevertToSnapshot} onClearChat={handleRequestClearChat} message={modalState.android} messages={(modalState.android.sessionId === currentChatSessionId ? messages : (chatSessions.find(s => s.id === modalState.android!.sessionId)?.messages || []))} onClose={() => handleCloseModal('android')} onUpdateCode={handleUpdateCode} t={t} language={effectiveLanguage} settings={settings} setSettings={setSettings} isLoading={isLoading} onStopGeneration={handleStopGeneration} onSendMessage={handleSendMessage} onRegenerate={handleRegenerate} onDelete={handleDeleteMessage} onOpenChatModal={handleOpenProjectOrImageViewer} onSetProjectContext={(p) => setCurrentProjectContext(p)} currentProjectContext={currentProjectContext} clearProjectContext={() => setCurrentProjectContext(null)} onOpenSourcesModal={(msg) => handleOpenModal('sources', msg)} onOpenThinkingModal={(msg) => handleOpenModal('thinking', msg)} onOpenInputModal={handleOpenModal} setCurrentGenerationMode={setCurrentGenerationMode} capturedAttachment={capturedAttachment} clearCapturedAttachment={handleClearCapturedAttachment} effectiveTheme={effectiveTheme} setIsImageEdited={setIsImageEdited} proPoints={proPoints} agentPoints={agentPoints} isProUnlocked={isProUnlocked} isNanoUnlocked={isNanoUnlocked} onStartEdit={handleStartEdit} onMessageFeedback={handleMessageFeedback} editingMessage={editingMessage} onConfirmEdit={handleConfirmEdit} onCancelEdit={handleCancelEdit} onReportMessage={handleReportMessage} isDesktop={isDesktop} onAskWithSelection={handleAskWithSelection} selectionPrompt={selectionPrompt} onSelectionPromptHandled={() => setSelectionPrompt(null)} />}
        {modalState.settings && <SettingsModal settings={settings} onClose={() => { handleCloseModal('settings'); setInitialSettingsTab(undefined); }} onSettingsChange={setSettings} onDeleteAllData={() => {}} t={t} language={effectiveLanguage} isDesktop={isDesktop} effectiveTheme={effectiveTheme} isProUnlocked={isProUnlocked} isNanoUnlocked={isNanoUnlocked} onOpenSubscriptionModal={() => handleOpenModal('subscription')} onCancelSubscription={handleCancelSubscription} agentPoints={agentPoints} agentPointsLastReset={agentPointsLastReset} currentUser={currentUser} onOpenAuthModal={() => handleOpenModal('auth')} onLogout={() => handleOpenModal('confirmation', { title: t('logoutConfirmTitle'), message: t('logoutConfirmMessage'), icon: 'log-out', confirmButtonVariant: 'primary', onConfirm: handleLogout })} onUpdateUserProfile={handleUpdateUserProfile} archivedSessions={chatSessions.filter(s => s.isArchived)} onUnarchiveSession={handleToggleArchiveSession} onNavigateToSession={handleNavigateToSessionFromSettings} initialTab={initialSettingsTab} onOpenProfileEditor={(user) => handleOpenModal('profileEditor', user)} />}
        {modalState.confirmation && <ConfirmationModal {...modalState.confirmation} onCancel={() => handleCloseModal('confirmation')} t={t} />}
        {modalState.camera && <CameraCaptureModal onClose={() => handleCloseModal('camera')} onCapture={handleMediaSelected} t={t} isDesktop={isDesktop} />}
        {modalState.mediaAttachment && <MediaAttachmentSheet onClose={() => handleCloseModal('mediaAttachment')} onSelect={handleMediaSelected} onOpenCamera={() => handleOpenModal('camera')} t={t} />}
        {modalState.aiToolsSheet && <AiToolsSheet onClose={() => handleCloseModal('aiToolsSheet')} settings={settings} setSettings={setSettings} t={t} proPoints={proPoints} agentPoints={agentPoints} isProUnlocked={isProUnlocked} isNanoUnlocked={isNanoUnlocked} />}
        {modalState.imageViewer && <ImageViewerModal imageUrl={modalState.imageViewer} onClose={() => handleCloseModal('imageViewer')} />}
        {modalState.imageEditor && <ImageEditorModal image={modalState.imageEditor} onClose={() => handleCloseModal('imageEditor')} onComplete={(dataUrl, name) => { handleMediaSelected(dataUrl, name); setIsImageEdited(true); }} t={t} />}
        {modalState.subscription && <SubscriptionModal onClose={() => handleCloseModal('subscription')} onCodeSubmit={handleCodeSubmit} t={t} isProUnlocked={isProUnlocked} isNanoUnlocked={isNanoUnlocked} />}
        {modalState.sources && <SourcesModal message={modalState.sources} onClose={() => handleCloseModal('sources')} t={t} />}
        {modalState.thinking && <ThinkingModal message={modalState.thinking} onClose={() => handleCloseModal('thinking')} t={t} />}
        {modalState.importProject && <ImportProjectModal onClose={() => handleCloseModal('importProject')} onImport={handleImportProject} t={t} />}
        {modalState.auth && <AuthModal onClose={() => handleCloseModal('auth')} onLogin={handleLogin} onSignUp={handleSignUp} onForgotPassword={handleForgotPassword} t={t} />}
        {modalState.spaceEditor && <SpaceEditorModal space={modalState.spaceEditor.space} allProjects={modalState.spaceEditor.allProjects} onClose={() => handleCloseModal('spaceEditor')} onSave={handleSaveSpace} t={t} />}
        {modalState.spaceView && <SpaceViewModal space={modalState.spaceView} allProjects={allProjectsForSpaces} allProjectMessages={allProjectMessages} onClose={() => { handleCloseModal('spaceView'); handleOpenModal('library'); }} onSave={handleUpdateSpace} onOpenProject={handleOpenProjectOrImageViewer} t={t} onDeleteSpace={handleDeleteSpace} onRenameProject={handleRenameProject} onTogglePinProject={handleTogglePinProject} onDeleteProject={handleDeleteProject} onForkProject={handleForkProject} onExportProject={handleExportProject} onExportId={handleExportId} />}
        {modalState.pinLock && <PinLockModal user={modalState.pinLock} onClose={() => handleCloseModal('pinLock')} onVerify={handlePinVerification} t={t} />}
        {modalState.notificationsPanel && <NotificationsPanel isOpen={true} onClose={() => handleCloseModal('notificationsPanel')} notifications={notifications} isAdmin={isDeveloperMode} onPostNotification={handlePostNotification} onDeleteNotification={handleDeleteNotification} onEditNotification={handleEditNotification} t={t} onOpenModal={handleOpenModal} unreadStatus={unreadStatus} onMarkCategoryAsRead={handleMarkCategoryAsRead} onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead} onNotificationNavigate={handleNotificationNavigate} isDesktop={isDesktop} onOpenFullscreen={handleOpenFullscreenNotifications} />}
        {modalState.reportSession && <ReportModal session={modalState.reportSession} onClose={() => handleCloseModal('reportSession')} t={t} />}
        {modalState.search && <SearchModal isOpen={true} onClose={() => handleCloseModal('search')} sessions={chatSessions} onSelect={handleSelectSessionFromSearch} t={t} onNewChat={startNewChat} />}
        {modalState.streamingProject && <StreamingProjectView project={modalState.streamingProject} onClose={() => handleCloseModal('streamingProject')} t={t} />}
        {modalState.exportChat && <ExportChatModal session={modalState.exportChat} onClose={() => handleCloseModal('exportChat')} t={t} />}
        {modalState.profileEditor && <ProfileEditorModal user={modalState.profileEditor} onClose={() => handleCloseModal('profileEditor')} onSave={handleUpdateUserProfile} t={t} />}
      </div>
    );
}

export default App;

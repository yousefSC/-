

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Message, TranslationKey, Settings, InspectionIssue, Language, Project, ModalState, GenerationMode, Theme, Attachment, SimulationDevice } from '../../types';
import Icon from '../Icon';
import CodeEditor from '../ui/CodeEditor';
import InspectionPanel from '../ui/InspectionPanel';
import { inspectCode, fixCode, generateProjectSuggestions, generateAndroidWebPreview } from '../../services/gemini';
import ChatView from '../ChatView';
import InputArea from '../InputArea';
import MediaAttachmentSheet from './MediaAttachmentSheet';
import AiToolsSheet from './AiToolsSheet';
import CameraCaptureModal from './CameraCaptureModal';
import SuggestionsSheet from '../StreamingProjectView';
import Tooltip from '../ui/Tooltip';
import DeviceFrame from '../ui/DeviceFrame';


interface AndroidPreviewModalProps {
  message: Project;
  messages: Message[];
  onClose: () => void;
  onUpdateCode: (messageId: string, updates: Partial<Message>) => void;
  isLoading: boolean;
  onStopGeneration: () => void;
  t: (key: TranslationKey) => string;
  language: Language;
  settings: Settings;
  setIsImageEdited: (isEdited: boolean) => void;
  proPoints: number;
  agentPoints: number;
  isProUnlocked: boolean;
  isNanoUnlocked: boolean;
  onRegenerate: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onOpenChatModal: (message: Message) => void;
  onSetProjectContext: (project: Project | null) => void;
  currentProjectContext: Project | null;
  onOpenSourcesModal: (message: Message) => void;
  onOpenThinkingModal: (message: Message) => void;
  onSendMessage: (text: string, attachment?: Attachment) => void;
  onOpenInputModal: (type: keyof ModalState, data?: any) => void;
  setCurrentGenerationMode: (mode: GenerationMode) => void;
  clearProjectContext: () => void;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  capturedAttachment: Attachment | null;
  clearCapturedAttachment: () => void;
  effectiveTheme: Theme;
  onStartEdit: (message: Message) => void;
  onMessageFeedback: (message: Message, feedback: 'good' | 'bad' | 'web_search' | 'deep_thinking') => void;
  editingMessage: { id: string; text: string } | null;
  onConfirmEdit: (newText: string) => void;
  onCancelEdit: () => void;
  onReportMessage: (messageId: string) => void;
  isDesktop: boolean;
  onAskWithSelection: (text: string) => void;
  selectionPrompt: string | null;
  onSelectionPromptHandled: () => void;
  onClearChat: (projectMessageIdToKeep: string) => void;
  // FIX: Corrected signature to accept a Message object, not just an ID.
  onRevertToSnapshot: (snapshotMessage: Message) => void;
  activeSnapshotId?: string | null;
  chatPanelWidth: number;
  setChatPanelWidth: (width: number) => void;
}

type AndroidTab = 'activity' | 'layout' | 'manifest';
type AndroidHistoryState = { activity: string; layout: string; manifest: string; };

const messageToProject = (message: Message): Project => {
    let type: 'HTML' | 'JavaScript' | 'Android' = 'HTML';
    if (message.isJavaScript) type = 'JavaScript';
    if (message.isAndroidApp) type = 'Android';
    
    return {
        id: message.id,
        type: type,
        prompt: message.prompt || 'Untitled Project',
        sessionTitle: 'Current Chat', // Simplified
        sessionId: 'current', // Simplified
        timestamp: message.timestamp,
        isPinned: message.isProjectPinned || false,
        htmlContent: message.htmlContent,
        text: message.text,
        manifestContent: message.manifestContent,
        layoutXmlContent: message.layoutXmlContent,
        activityCodeContent: message.activityCodeContent
    };
};

const HeaderButton: React.FC<{title: string, onClick: () => void, children: React.ReactNode, disabled?: boolean}> = ({ title, onClick, children, disabled }) => (
    <Tooltip text={title}>
      <button onClick={onClick} disabled={disabled} className="w-9 h-9 flex items-center justify-center rounded-full transition-colors bg-slate-200 dark:bg-neutral-700/60 text-gray-700 dark:text-gray-300 md:hover:bg-slate-300 md:dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed">
          {children}
      </button>
    </Tooltip>
);

const HistoryItem: React.FC<{
    id: string;
    label: string;
    timestamp: Date;
    isActive: boolean;
    onClick: () => void;
    t: (key: TranslationKey) => string;
    onRename?: (id: string, newName: string) => void;
}> = ({ id, label, timestamp, isActive, onClick, t, onRename }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(label);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setEditText(label); // Sync with external changes
    }, [label]);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);
    
    const handleSave = () => {
        if (onRename && editText.trim() && editText.trim() !== label) {
            onRename(id, editText.trim());
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') setIsEditing(false);
    };
    
    if (isEditing) {
        return (
            <li className="px-3 py-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-slate-100 dark:bg-neutral-900 px-2 py-1 text-sm rounded-md border border-blue-500"
                />
            </li>
        )
    }

    return (
        <li>
            <button
                onClick={onClick}
                disabled={isActive}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-start rtl:text-right transition-colors disabled:cursor-default group ${isActive ? 'bg-blue-100/50 dark:bg-blue-900/30' : 'hover:bg-slate-100 dark:hover:bg-neutral-700'}`}
            >
                <div className="flex-1 overflow-hidden">
                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-blue-600 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>{label}</p>
                    <p className="text-xs text-gray-400">{new Date(timestamp).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1">
                    {onRename && !isActive && 
                        <button onClick={(e) => {e.stopPropagation(); setIsEditing(true);}} className="p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-neutral-600">
                            <Icon name="pencil" size={14} className="text-gray-500" />
                        </button>
                    }
                    {isActive && <Icon name="check-circle-2" className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                </div>
            </button>
        </li>
    );
};


const AndroidPreviewModal: React.FC<AndroidPreviewModalProps> = (props) => {
  const { 
    message, onClose, t, settings, onUpdateCode, messages, setIsImageEdited, proPoints, agentPoints, isProUnlocked, isNanoUnlocked,
    onSendMessage, isLoading, onStopGeneration, onRegenerate, onDelete,
    onOpenChatModal, onSetProjectContext, currentProjectContext,
    clearProjectContext, setSettings, language, effectiveTheme,
    onOpenSourcesModal, onOpenThinkingModal, setCurrentGenerationMode,
    onStartEdit, onMessageFeedback, editingMessage, onConfirmEdit, onCancelEdit, onReportMessage,
    isDesktop,
    onAskWithSelection,
    selectionPrompt,
    onSelectionPromptHandled,
    onClearChat,
    onRevertToSnapshot,
    activeSnapshotId,
    chatPanelWidth,
    setChatPanelWidth,
  } = props;
  
  const [isCodeView, setIsCodeView] = useState(true);
  const [webPreviewHtml, setWebPreviewHtml] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [localSimulationDevice, setLocalSimulationDevice] = useState<SimulationDevice>(settings.simulationDevice);
  const [isSmartphoneRotated, setIsSmartphoneRotated] = useState(false);

  const [activeTab, setActiveTab] = useState<AndroidTab>('activity');
  const [isEditing, setIsEditing] = useState(false);
  
  const [isInspecting, setIsInspecting] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [inspectionIssues, setInspectionIssues] = useState<InspectionIssue[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChatPanelOpen, setChatPanelOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [isSuggestionsSheetOpen, setSuggestionsSheetOpen] = useState(false);

  const [localModalState, setLocalModalState] = useState({ mediaAttachment: false, aiToolsSheet: false, camera: false });
  const [localCapturedAttachment, setLocalCapturedAttachment] = useState<Attachment | null>(null);
  
  const [isLiveGenerating, setIsLiveGenerating] = useState(message.isStreamingProject || false);

  const [manifestCode, setManifestCode] = useState(message.manifestContent || '');
  const [layoutCode, setLayoutCode] = useState(message.layoutXmlContent || '');
  const [activityCode, setActivityCode] = useState(message.activityCodeContent || '');
  
  const [history, setHistory] = useState<AndroidHistoryState[]>([{
    activity: message.activityCodeContent || '',
    layout: message.layoutXmlContent || '',
    manifest: message.manifestContent || '',
  }]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);

  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [sheetHeight, setSheetHeight] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef({ startY: 0, startHeight: 0 });
  const isDraggingRef = useRef(isDragging);
  useEffect(() => { isDraggingRef.current = isDragging; }, [isDragging]);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  const [isResizing, setIsResizing] = useState(false);
  const chatPanelRef = useRef<HTMLDivElement>(null);

  // Version History state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const historyPanelRef = useRef<HTMLDivElement>(null);

  const handleRenameSnapshot = (snapshotId: string, newName: string) => {
    onUpdateCode(snapshotId, { editSummary: newName });
  };
  
  // Effect to sync with external changes (like revert)
  useEffect(() => {
    const newCodeState = {
        activity: message.activityCodeContent || '',
        layout: message.layoutXmlContent || '',
        manifest: message.manifestContent || '',
    };
    setActivityCode(newCodeState.activity);
    setLayoutCode(newCodeState.layout);
    setManifestCode(newCodeState.manifest);
    setHistory([newCodeState]);
    setCurrentHistoryIndex(0);
  }, [message.id, message.activityCodeContent, message.layoutXmlContent, message.manifestContent]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyPanelRef.current && !historyPanelRef.current.contains(event.target as Node)) {
        setIsHistoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const versionHistory = useMemo(() => {
    const originalVersion = messages.find(m => m.id === message.id);
    const snapshots = messages
      .filter(m => m.projectSnapshot?.id === message.id)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    return { originalVersion, snapshots };
  }, [messages, message.id]);

  const handleLocalMediaSelected = (dataUrl: string, name: string) => {
    const mimeType = dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));
    setLocalCapturedAttachment({ dataUrl, name, mimeType });
    setIsImageEdited(false);
    setLocalModalState(prev => ({ ...prev, camera: false, mediaAttachment: false }));
  };

  const handleGenerateSuggestions = useCallback(async () => {
    setIsGeneratingSuggestions(true);
    setSuggestions(null);
    try {
        const generatedSuggestions = await generateProjectSuggestions(message, settings, language);
        setSuggestions(generatedSuggestions);
    } catch (error) {
        console.error("Failed to generate suggestions:", error);
        setSuggestions([]);
    } finally {
        setIsGeneratingSuggestions(false);
    }
  }, [message, settings, language]);

  useEffect(() => {
    if (isSuggestionsSheetOpen && !suggestions) {
        handleGenerateSuggestions();
    }
  }, [isSuggestionsSheetOpen, suggestions, handleGenerateSuggestions]);
  
  const handleGeneratePreview = useCallback(async () => {
    setIsPreviewLoading(true);
    setPreviewError(null);
    try {
        const html = await generateAndroidWebPreview(message, settings, language);
        setWebPreviewHtml(html);
    } catch (e: any) {
        setPreviewError(e.message || "Failed to generate web preview.");
    } finally {
        setIsPreviewLoading(false);
    }
  }, [message, settings, language]);

  useEffect(() => {
    if (!isCodeView && !webPreviewHtml && !isPreviewLoading && !previewError) {
        handleGeneratePreview();
    }
  }, [isCodeView, webPreviewHtml, isPreviewLoading, previewError, handleGeneratePreview]);

  const pushToHistory = useCallback((newCodeState: AndroidHistoryState) => {
    setHistory(prevHistory => {
        const newHistorySlice = prevHistory.slice(0, currentHistoryIndex + 1);
        newHistorySlice.push(newCodeState);
        setCurrentHistoryIndex(newHistorySlice.length - 1);
        return newHistorySlice;
    });
  }, [currentHistoryIndex]);

    useEffect(() => {
        if (isLiveGenerating && !message.isStreamingProject) {
            const animateCode = (finalCode: string | undefined, setCode: React.Dispatch<React.SetStateAction<string>>) => {
                if (!finalCode) return;
                let currentCode = '';
                let i = 0;
                const animationFrameRef = { id: 0 };

                const typeCharacter = () => {
                    if (i < finalCode.length) {
                        const chunkSize = Math.max(10, Math.floor(finalCode.length / 100));
                        currentCode += finalCode.substring(i, Math.min(i + chunkSize, finalCode.length));
                        setCode(currentCode);
                        i += chunkSize;
                        animationFrameRef.id = requestAnimationFrame(typeCharacter);
                    } else {
                        setCode(finalCode);
                    }
                };
                animationFrameRef.id = requestAnimationFrame(typeCharacter);
                return () => cancelAnimationFrame(animationFrameRef.id);
            };

            const cleanupActivity = animateCode(message.activityCodeContent, setActivityCode);
            const cleanupLayout = animateCode(message.layoutXmlContent, setLayoutCode);
            const cleanupManifest = animateCode(message.manifestContent, setManifestCode);
            
            setTimeout(() => {
                 pushToHistory({
                    activity: message.activityCodeContent || '',
                    layout: message.layoutXmlContent || '',
                    manifest: message.manifestContent || '',
                 });
                setIsLiveGenerating(false);
            }, 2000); 

            return () => {
                cleanupActivity && cleanupActivity();
                cleanupLayout && cleanupLayout();
                cleanupManifest && cleanupManifest();
            };
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [message.isStreamingProject, message.activityCodeContent, message.layoutXmlContent, message.manifestContent, isLiveGenerating]);

  const PEEK_HEIGHT = 140;
  const MEDIUM_HEIGHT_VH = 50;
  const FULL_HEIGHT_VH = 90;

  const mediumHeight = viewportHeight * (MEDIUM_HEIGHT_VH / 100);
  const fullHeight = viewportHeight * (FULL_HEIGHT_VH / 100);

  useEffect(() => {
    const handleResize = () => setViewportHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isChatPanelOpen) {
        setSheetHeight(PEEK_HEIGHT);
        const timer = setTimeout(() => setIsSheetVisible(true), 10);
        return () => clearTimeout(timer);
    } else {
        setIsSheetVisible(false);
    }
  }, [isChatPanelOpen]);

  const handleDragStart = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('input, textarea, button, .custom-scrollbar')) {
        return;
    }
    e.stopPropagation();
    setIsDragging(true);
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragInfo.current = {
        startY: y,
        startHeight: sheetRef.current?.offsetHeight || PEEK_HEIGHT,
    };
    document.body.style.userSelect = 'none';
    document.body.style.overflow = 'hidden';
  }, []);

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDraggingRef.current) return;
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = y - dragInfo.current.startY;
    let newHeight = dragInfo.current.startHeight - deltaY;

    newHeight = Math.max(PEEK_HEIGHT / 2, Math.min(newHeight, fullHeight * 1.05));
    setSheetHeight(newHeight);
  }, [fullHeight]);

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    setIsDragging(false);
    document.body.style.userSelect = '';
    document.body.style.overflow = '';

    const currentHeight = sheetRef.current?.offsetHeight || 0;

    if (currentHeight < PEEK_HEIGHT * 0.75) {
        setIsSheetVisible(false);
        setTimeout(() => setChatPanelOpen(false), 300);
        return;
    }
    
    const snapPoints = [PEEK_HEIGHT, mediumHeight, fullHeight];
    const distances = snapPoints.map(p => Math.abs(currentHeight - p));
    const closestSnapPoint = snapPoints[distances.indexOf(Math.min(...distances))];
    
    setSheetHeight(closestSnapPoint);
  }, [mediumHeight, fullHeight, PEEK_HEIGHT]);

  const TabButton: React.FC<{ tab: AndroidTab, labelKey: TranslationKey }> = ({ tab, labelKey }) => (
    <button
        onClick={() => setActiveTab(tab)}
        className={`px-3 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${activeTab === tab ? 'border-blue-500 text-gray-800 dark:text-gray-100' : 'border-transparent text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'}`}
    >
        {t(labelKey)}
    </button>
  );

  const handleInspect = async () => {
    setIsInspecting(true);
    setError(null);
    try {
      const codeToInspect = activeTab === 'activity' ? activityCode : layoutCode;
      const lang = activeTab === 'activity' ? 'kotlin' : 'xml';
      const issues = await inspectCode(codeToInspect, lang, settings);
      setInspectionIssues(issues);
    } catch (e: any) {
      setError(e.message || "Failed to inspect code.");
      setInspectionIssues([]);
    } finally {
      setIsInspecting(false);
    }
  };

  const handleFix = async () => {
    if (!inspectionIssues) return;
    setIsFixing(true);
    setError(null);
    try {
      const codeToFix = activeTab === 'activity' ? activityCode : layoutCode;
      const lang = activeTab === 'activity' ? 'kotlin' : 'xml';
      const fixedCode = await fixCode(codeToFix, inspectionIssues, lang, settings);
      
      if (activeTab === 'activity') setActivityCode(fixedCode);
      if (activeTab === 'layout') setLayoutCode(fixedCode);

      setInspectionIssues(null);
    } catch (e: any) {
      setError(e.message || "Failed to fix code.");
    } finally {
      setIsFixing(false);
    }
  };

  const handleSaveChanges = () => {
        onUpdateCode(message.id, {
            activityCodeContent: activityCode,
            layoutXmlContent: layoutCode,
            manifestContent: manifestCode,
        });
        pushToHistory({ activity: activityCode, layout: layoutCode, manifest: manifestCode });
        setIsEditing(false);
  };
    
  const handleUndo = useCallback(() => {
        if (currentHistoryIndex > 0) {
            const newIndex = currentHistoryIndex - 1;
            const prevState = history[newIndex];
            setActivityCode(prevState.activity);
            setLayoutCode(prevState.layout);
            setManifestCode(prevState.manifest);
            setCurrentHistoryIndex(newIndex);
        }
  }, [currentHistoryIndex, history]);

  const handleRedo = useCallback(() => {
        if (currentHistoryIndex < history.length - 1) {
            const newIndex = currentHistoryIndex + 1;
            const nextState = history[newIndex];
            setActivityCode(nextState.activity);
            setLayoutCode(nextState.layout);
            setManifestCode(nextState.manifest);
            setCurrentHistoryIndex(newIndex);
        }
  }, [currentHistoryIndex, history]);

  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    const isRtl = document.documentElement.dir === 'rtl';
    const newWidth = isRtl ? e.clientX : window.innerWidth - e.clientX;
    const minWidth = 320;
    const maxWidth = window.innerWidth * 0.8;

    if (newWidth > minWidth && newWidth < maxWidth) {
        setChatPanelWidth(newWidth);
    }
  }, [setChatPanelWidth]);

  const handleResizeMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', handleResizeMouseMove);
    window.removeEventListener('mouseup', handleResizeMouseUp);
  }, [handleResizeMouseMove]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleResizeMouseMove);
    window.addEventListener('mouseup', handleResizeMouseUp);
  }, [handleResizeMouseMove, handleResizeMouseUp]);
  
   return (
    <div className="fixed inset-0 bg-slate-100 dark:bg-neutral-900 z-50 animate-fade-in flex flex-col">
       <header className="p-2 flex justify-between items-center border-b border-slate-200 dark:border-neutral-800 flex-shrink-0">
             <div className="flex items-center gap-2">
                <Tooltip text={t('back')}>
                  <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-neutral-700">
                      <Icon name={language === 'ar' ? "arrow-right" : "arrow-left"} className="w-5 h-5" />
                  </button>
                </Tooltip>
                <div className="w-px h-6 bg-slate-200 dark:bg-neutral-700"></div>
                {isDesktop ? (
                    <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-200/80 dark:bg-neutral-800/80">
                       <button onClick={() => setIsCodeView(false)} className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${!isCodeView ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'text-gray-500'}`}>{t('viewPage')}</button>
                       <button onClick={() => setIsCodeView(true)} className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${isCodeView ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'text-gray-500'}`}>{t('viewCode')}</button>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-200/80 dark:bg-neutral-800/80">
                        <Tooltip text={t('viewPage')}>
                            <button onClick={() => setIsCodeView(false)} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${!isCodeView ? 'bg-white dark:bg-neutral-700 shadow-sm' : ''}`}>
                                <Icon name="monitor-play" className={`w-4 h-4 ${!isCodeView ? 'text-gray-800 dark:text-gray-100' : 'text-gray-500'}`} />
                            </button>
                        </Tooltip>
                        <Tooltip text={t('viewCode')}>
                            <button onClick={() => setIsCodeView(true)} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isCodeView ? 'bg-white dark:bg-neutral-700 shadow-sm' : ''}`}>
                                <Icon name="code" className={`w-4 h-4 ${isCodeView ? 'text-gray-800 dark:text-gray-100' : 'text-gray-500'}`} />
                            </button>
                        </Tooltip>
                    </div>
                )}
            </div>
            
            <div className="absolute left-1/2 -translate-x-1/2">
                {!isCodeView && isDesktop ? (
                    <div className="flex items-center gap-1 p-1 rounded-full bg-slate-200/80 dark:bg-neutral-800/80">
                        <Tooltip text={t('desktop')}><button onClick={() => setLocalSimulationDevice('none')} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${localSimulationDevice === 'none' ? 'bg-white dark:bg-neutral-700 shadow-sm' : ''}`}><Icon name="monitor" className={`w-4 h-4 ${localSimulationDevice === 'none' ? 'text-gray-800 dark:text-gray-100' : 'text-gray-500'}`} /></button></Tooltip>
                        <Tooltip text={t('laptop')}><button onClick={() => setLocalSimulationDevice('laptop')} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${localSimulationDevice === 'laptop' ? 'bg-white dark:bg-neutral-700 shadow-sm' : ''}`}><Icon name="laptop" className={`w-4 h-4 ${localSimulationDevice === 'laptop' ? 'text-gray-800 dark:text-gray-100' : 'text-gray-500'}`} /></button></Tooltip>
                        <Tooltip text={t('smartphone')}><button onClick={() => setLocalSimulationDevice('smartphone')} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${localSimulationDevice === 'smartphone' ? 'bg-white dark:bg-neutral-700 shadow-sm' : ''}`}><Icon name="smartphone" className={`w-4 h-4 ${localSimulationDevice === 'smartphone' ? 'text-gray-800 dark:text-gray-100' : 'text-gray-500'}`} /></button></Tooltip>
                        {localSimulationDevice === 'smartphone' && (<><div className="w-px h-4 bg-slate-300 dark:bg-neutral-700 mx-1"></div><Tooltip text={t('rotateDevice')}><button onClick={() => setIsSmartphoneRotated(p => !p)} className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors`}><Icon name="rotate-cw" className={`w-4 h-4 text-gray-500`} /></button></Tooltip></>)}
                    </div>
                ) : (
                    <p className="text-sm font-bold truncate max-w-[40vw]">{message.prompt} <span className="text-gray-400 font-normal">({t('androidProject')})</span></p>
                )}
            </div>


            <div className="flex items-center gap-2">
                {isCodeView ? (
                    <>
                        {!isEditing ? (
                             <HeaderButton title={t('editCode')} onClick={() => setIsEditing(true)}>
                                <Icon name="pencil" className="w-4 h-4" />
                             </HeaderButton>
                        ) : (
                            <div className="flex items-center gap-2">
                                <HeaderButton title={t('undo')} onClick={handleUndo} disabled={!isEditing || currentHistoryIndex <= 0}>
                                   <Icon name="undo-2" className="w-4 h-4" />
                                </HeaderButton>
                                <HeaderButton title={t('redo')} onClick={handleRedo} disabled={!isEditing || currentHistoryIndex >= history.length - 1}>
                                    <Icon name="redo-2" className="w-4 h-4" />
                                </HeaderButton>
                               <button onClick={handleSaveChanges} className="px-4 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-full hover:bg-blue-700">{t('saveChanges')}</button>
                            </div>
                        )}
                        <div className="w-px h-6 bg-slate-200 dark:bg-neutral-700"></div>
                        <HeaderButton title={t('inspectCode')} onClick={handleInspect}>
                            <Icon name="search" className="w-4 h-4" />
                        </HeaderButton>
                    </>
                ) : (
                    <HeaderButton title={t('reloadPreview')} onClick={() => { setWebPreviewHtml(null); handleGeneratePreview(); }}>
                        <Icon name="refresh-cw" className="w-4 h-4" />
                    </HeaderButton>
                )}

                <div className="w-px h-6 bg-slate-200 dark:bg-neutral-700"></div>
                 <div className="relative">
                    <HeaderButton title={t('versionHistory')} onClick={() => setIsHistoryOpen(p => !p)}>
                        <Icon name="history" className="w-4 h-4" />
                    </HeaderButton>
                        {isHistoryOpen && (
                        <div ref={historyPanelRef} className="absolute top-full mt-2 right-0 rtl:right-auto rtl:left-0 w-72 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-slate-200 dark:border-neutral-700 z-10 animate-pop-in">
                            <div className="p-3 border-b border-slate-100 dark:border-neutral-700/50">
                                <p className="text-sm font-semibold">{t('versionHistory')}</p>
                            </div>
                            <ul className="py-1 max-h-80 overflow-y-auto custom-scrollbar">
                                {versionHistory.originalVersion && (
                                    <HistoryItem
                                        id={versionHistory.originalVersion.id}
                                        t={t}
                                        label={t('originalVersion')}
                                        timestamp={versionHistory.originalVersion.timestamp}
                                        isActive={!activeSnapshotId}
                                        onClick={() => {
                                            // FIX: Pass the entire Message object to the revert handler.
                                            onRevertToSnapshot(versionHistory.originalVersion!);
                                            setIsHistoryOpen(false);
                                        }}
                                    />
                                )}
                                {versionHistory.snapshots.map(snapshotMsg => (
                                    <HistoryItem
                                        key={snapshotMsg.id}
                                        id={snapshotMsg.id}
                                        t={t}
                                        label={snapshotMsg.editSummary || new Date(snapshotMsg.timestamp).toLocaleTimeString()}
                                        timestamp={snapshotMsg.timestamp}
                                        isActive={activeSnapshotId === snapshotMsg.id}
                                        onClick={() => {
                                            // FIX: Pass the entire snapshot message to the handler.
                                            onRevertToSnapshot(snapshotMsg);
                                            setIsHistoryOpen(false);
                                        }}
                                        onRename={(id, newName) => onUpdateCode(id, { editSummary: newName })}
                                    />
                                ))}
                                {(!versionHistory.originalVersion && versionHistory.snapshots.length === 0) && (
                                    <li className="p-3 text-xs text-center text-gray-500">{t('noVersionsYet')}</li>
                                )}
                            </ul>
                        </div>
                    )}
                </div>
                 <HeaderButton title={t('getSuggestions')} onClick={() => setSuggestionsSheetOpen(true)}>
                    <Icon name="lightbulb" className="w-4 h-4" />
                </HeaderButton>
                 <Tooltip text={t('chatsAndMenu')}>
                   <button onClick={() => setChatPanelOpen(p => !p)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-neutral-700">
                      <Icon name="messages-square" className="w-5 h-5" />
                  </button>
                 </Tooltip>
            </div>
        </header>
        <main className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {isCodeView ? (
                    <>
                        <div className="flex-shrink-0 border-b border-slate-200 dark:border-neutral-800 px-2">
                            <TabButton tab="activity" labelKey="activity" />
                            <TabButton tab="layout" labelKey="layout" />
                            <TabButton tab="manifest" labelKey="manifest" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            {activeTab === 'activity' && <CodeEditor language="kotlin" value={activityCode} onChange={setActivityCode} readOnly={!isEditing} />}
                            {activeTab === 'layout' && <CodeEditor language="xml" value={layoutCode} onChange={setLayoutCode} readOnly={!isEditing} />}
                            {activeTab === 'manifest' && <CodeEditor language="xml" value={manifestCode} onChange={setManifestCode} readOnly={!isEditing} />}
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex-1 flex flex-col items-center justify-center p-2 bg-slate-200 dark:bg-neutral-950">
                        {isPreviewLoading ? (
                             <div className="flex flex-col items-center gap-4 text-center">
                                <div className="w-12 h-12 border-4 border-slate-400 border-t-blue-500 rounded-full animate-spin"></div>
                                <p className="font-semibold text-gray-600 dark:text-gray-300">Generating Web Preview...</p>
                            </div>
                        ) : previewError ? (
                            <div className="text-center p-4">
                                <Icon name="server-crash" className="w-12 h-12 text-red-500 mx-auto mb-3" />
                                <p className="font-semibold text-red-500">{t('errorOccurred')}</p>
                                <p className="text-xs text-gray-500 mt-1">{previewError}</p>
                            </div>
                        ) : (
                             <DeviceFrame device={localSimulationDevice} isRotated={isSmartphoneRotated}>
                                <iframe
                                    srcDoc={webPreviewHtml || ''}
                                    title="Web Preview"
                                    sandbox="allow-scripts allow-forms allow-same-origin"
                                    className="w-full h-full bg-white"
                                />
                            </DeviceFrame>
                        )}
                    </div>
                )}
                {isInspecting && isCodeView && <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20"><div className="w-8 h-8 border-4 border-slate-400 border-t-white rounded-full animate-spin"></div></div>}
                {inspectionIssues && isCodeView && <InspectionPanel issues={inspectionIssues} onFix={handleFix} onClose={() => setInspectionIssues(null)} isFixing={isFixing} t={t} titleKey="androidAppFiles" />}
            </div>
             {isChatPanelOpen && isDesktop && (
                <>
                    <div onMouseDown={handleResizeMouseDown} className={`w-1.5 cursor-col-resize flex-shrink-0 bg-slate-200 dark:bg-neutral-700 ${isResizing ? 'bg-blue-500' : 'hover:bg-blue-500/50'}`}></div>
                    <div ref={chatPanelRef} style={{ width: chatPanelWidth }} className="flex-shrink-0 flex flex-col h-full bg-slate-50 dark:bg-neutral-900 border-l border-slate-200 dark:border-neutral-700 rtl:border-l-0 rtl:border-r">
                        <div className="flex items-center justify-between p-2 border-b border-slate-200 dark:border-neutral-700 flex-shrink-0">
                            <h4 className="font-brand font-bold text-sm text-gray-800 dark:text-gray-200">nanom ai</h4>
                            <Tooltip text={t('resetChat')}>
                                <button
                                    onClick={() => onClearChat(message.id)}
                                    disabled={messages.length <= 1}
                                    className="p-1.5 rounded-full text-gray-500 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Icon name="rotate-ccw" className="w-4 h-4" />
                                </button>
                            </Tooltip>
                        </div>
                        <ChatView messages={messages} isLoading={isLoading} t={t} onRegenerate={onRegenerate} onDelete={onDelete} onOpenModal={onOpenChatModal} onSetProjectContext={(msg) => onSetProjectContext(messageToProject(msg))} onSendMessage={onSendMessage} onOpenSourcesModal={onOpenSourcesModal} onOpenThinkingModal={onOpenThinkingModal} onStartEdit={onStartEdit} onMessageFeedback={onMessageFeedback} onReportMessage={onReportMessage} isDesktop={isDesktop} onOpenStreamingProjectView={() => {}} onAskWithSelection={onAskWithSelection} onRevertToSnapshot={onRevertToSnapshot} activeSnapshotId={activeSnapshotId} />
                        <InputArea isLoading={isLoading} onSendMessage={onSendMessage} onStopGeneration={onStopGeneration} currentGenerationMode={currentProjectContext ? 'project_generation' : 'chat'} setCurrentGenerationMode={setCurrentGenerationMode} currentProjectContext={currentProjectContext} clearProjectContext={clearProjectContext} t={t} language={language} settings={settings} setSettings={setSettings} onOpenModal={(type, data) => setLocalModalState(prev => ({ ...prev, [type as string]: data === undefined ? true : data }))} capturedAttachment={localCapturedAttachment} clearCapturedAttachment={() => setLocalCapturedAttachment(null)} effectiveTheme={effectiveTheme} editingMessage={editingMessage} onConfirmEdit={onConfirmEdit} onCancelEdit={onCancelEdit} isContextLocked hideAttachmentButton onHeightChange={() => {}} selectionPrompt={selectionPrompt} onSelectionPromptHandled={onSelectionPromptHandled} />
                    </div>
                </>
            )}
        </main>
         {isChatPanelOpen && !isDesktop && (
            <div
                className={`fixed inset-0 bg-black/30 z-30 transition-opacity ${isSheetVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => { setIsSheetVisible(false); setTimeout(() => setChatPanelOpen(false), 300); }}
            >
                <div
                    ref={sheetRef}
                    className={`absolute bottom-0 w-full bg-slate-50 dark:bg-neutral-900 rounded-t-2xl shadow-2xl flex flex-col transition-all duration-300 ease-in-out`}
                    style={{ height: `${sheetHeight}px`, transform: isSheetVisible ? 'translateY(0)' : 'translateY(100%)' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div
                        onMouseDown={handleDragStart as any}
                        onTouchStart={handleDragStart as any}
                        className="w-full h-8 flex items-center justify-center cursor-grab active:cursor-grabbing flex-shrink-0"
                    >
                        <div className="w-10 h-1.5 bg-slate-300 dark:bg-neutral-600 rounded-full"></div>
                    </div>
                    <div className="flex-1 flex flex-col overflow-hidden">
                         <div className="flex items-center justify-between p-2 border-b border-slate-200 dark:border-neutral-700 flex-shrink-0">
                            <h4 className="font-brand font-bold text-sm text-gray-800 dark:text-gray-200">nanom ai</h4>
                            <Tooltip text={t('resetChat')}>
                                <button
                                    onClick={() => onClearChat(message.id)}
                                    disabled={messages.length <= 1}
                                    className="p-1.5 rounded-full text-gray-500 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Icon name="rotate-ccw" className="w-4 h-4" />
                                </button>
                            </Tooltip>
                        </div>
                        <ChatView messages={messages} isLoading={isLoading} t={t} onRegenerate={onRegenerate} onDelete={onDelete} onOpenModal={onOpenChatModal} onSetProjectContext={(msg) => onSetProjectContext(messageToProject(msg))} onSendMessage={onSendMessage} onOpenSourcesModal={onOpenSourcesModal} onOpenThinkingModal={onOpenThinkingModal} onStartEdit={onStartEdit} onMessageFeedback={onMessageFeedback} onReportMessage={onReportMessage} isDesktop={isDesktop} onOpenStreamingProjectView={() => {}} onAskWithSelection={onAskWithSelection} onRevertToSnapshot={onRevertToSnapshot} activeSnapshotId={activeSnapshotId} />
                        <InputArea isLoading={isLoading} onSendMessage={onSendMessage} onStopGeneration={onStopGeneration} currentGenerationMode={currentProjectContext ? 'project_generation' : 'chat'} setCurrentGenerationMode={setCurrentGenerationMode} currentProjectContext={currentProjectContext} clearProjectContext={clearProjectContext} t={t} language={language} settings={settings} setSettings={setSettings} onOpenModal={(type, data) => setLocalModalState(prev => ({ ...prev, [type as string]: data === undefined ? true : data }))} capturedAttachment={localCapturedAttachment} clearCapturedAttachment={() => setLocalCapturedAttachment(null)} effectiveTheme={effectiveTheme} editingMessage={editingMessage} onConfirmEdit={onConfirmEdit} onCancelEdit={onCancelEdit} isContextLocked hideAttachmentButton onHeightChange={setSheetHeight} selectionPrompt={selectionPrompt} onSelectionPromptHandled={onSelectionPromptHandled} />
                    </div>
                </div>
            </div>
        )}
        {isSuggestionsSheetOpen && <SuggestionsSheet
            isOpen={isSuggestionsSheetOpen}
            onClose={() => setSuggestionsSheetOpen(false)}
            suggestions={suggestions}
            isLoading={isGeneratingSuggestions}
            onSelectSuggestion={(s) => {
                onSendMessage(s);
                setSuggestionsSheetOpen(false);
                setChatPanelOpen(true);
            }}
            onGenerate={handleGenerateSuggestions}
            t={t}
        />}
        {localModalState.mediaAttachment && <MediaAttachmentSheet onClose={() => setLocalModalState(p => ({...p, mediaAttachment: false}))} onSelect={handleLocalMediaSelected} onOpenCamera={() => setLocalModalState(p => ({...p, camera: true}))} t={t} />}
        {localModalState.camera && <CameraCaptureModal onClose={() => setLocalModalState(p => ({...p, camera: false}))} onCapture={handleLocalMediaSelected} t={t} isDesktop={isDesktop} />}
        {localModalState.aiToolsSheet && <AiToolsSheet onClose={() => setLocalModalState(p => ({...p, aiToolsSheet: false}))} settings={settings} setSettings={setSettings} t={t} proPoints={proPoints} agentPoints={agentPoints} isProUnlocked={isProUnlocked} isNanoUnlocked={isNanoUnlocked} showCreativityControl />}
    </div>
  );
};
export default AndroidPreviewModal;

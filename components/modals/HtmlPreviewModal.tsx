import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Message, TranslationKey, InspectionIssue, Settings, Language, Project, ModalState, GenerationMode, Theme, Attachment, SimulationDevice, ConsoleLog } from '../../types';
import Icon from '../Icon';
import CodeEditor from '../ui/CodeEditor';
import InspectionPanel from '../ui/InspectionPanel';
import { inspectCode, fixCode, generateProjectSuggestions } from '../../services/gemini';
import ChatView from '../ChatView';
import InputArea from '../InputArea';
import MediaAttachmentSheet from './MediaAttachmentSheet';
import AiToolsSheet from './AiToolsSheet';
import CameraCaptureModal from './CameraCaptureModal';
import DeviceFrame from '../ui/DeviceFrame';
import SuggestionsSheet from '../StreamingProjectView';
import DebugConsole from '../ui/DebugConsole';
import Tooltip from '../ui/Tooltip';


interface HtmlPreviewModalProps {
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
  onUseTemplate: (templateProject: Project) => void;
  onReportTemplate: (templateProject: Project) => void;
  onAskWithSelection: (text: string) => void;
  selectionPrompt: string | null;
  onSelectionPromptHandled: () => void;
  onClearChat: (projectMessageIdToKeep: string) => void;
  onRevertToSnapshot: (snapshotMessage: Message) => void;
  activeSnapshotId?: string | null;
  chatPanelWidth: number;
  setChatPanelWidth: (width: number) => void;
}

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


const HtmlPreviewModal: React.FC<HtmlPreviewModalProps> = (props) => {
  const { 
    message, onClose, onUpdateCode, t, settings, messages, setIsImageEdited, proPoints, agentPoints, isProUnlocked, isNanoUnlocked,
    onSendMessage, isLoading, onStopGeneration, onRegenerate, onDelete,
    onOpenChatModal, onSetProjectContext, currentProjectContext,
    clearProjectContext, setSettings, language, effectiveTheme,
    onOpenSourcesModal, onOpenThinkingModal, setCurrentGenerationMode,
    onStartEdit, onMessageFeedback, editingMessage, onConfirmEdit, onCancelEdit, onReportMessage,
    isDesktop, onUseTemplate, onReportTemplate,
    onAskWithSelection,
    selectionPrompt,
    onSelectionPromptHandled,
    onClearChat,
    onRevertToSnapshot,
    activeSnapshotId,
    chatPanelWidth,
    setChatPanelWidth,
  } = props;
  
  const [isCodeView, setIsCodeView] = useState(message.isStreamingProject || message.isTemplatePreview || false);
  const [isEditing, setIsEditing] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [inspectionIssues, setInspectionIssues] = useState<InspectionIssue[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChatPanelOpen, setChatPanelOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [isSuggestionsSheetOpen, setSuggestionsSheetOpen] = useState(false);

  const [localModalState, setLocalModalState] = useState({ mediaAttachment: false, aiToolsSheet: false, camera: false });
  const [localCapturedAttachment, setLocalCapturedAttachment] = useState<Attachment | null>(null);
  
  const [displayedCode, setDisplayedCode] = useState(message.htmlContent || '');
  const [history, setHistory] = useState<string[]>([message.htmlContent || '']);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);
  const [isLiveGenerating, setIsLiveGenerating] = useState(message.isStreamingProject || false);

  const [localSimulationDevice, setLocalSimulationDevice] = useState<SimulationDevice>(settings.simulationDevice);
  const [isSmartphoneRotated, setIsSmartphoneRotated] = useState(false);

  const previewRef = useRef<HTMLIFrameElement>(null);
  const selectionContainerRef = useRef<HTMLDivElement>(null);

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionRect, setSelectionRect] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [isDrawingSelection, setIsDrawingSelection] = useState(false);
  const [selectionCoordinates, setSelectionCoordinates] = useState<string | null>(null);

  // Draggable Sheet State
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [sheetHeight, setSheetHeight] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragInfo = useRef({ startY: 0, startHeight: 0 });
  const isDraggingRef = useRef(isDragging);
  useEffect(() => { isDraggingRef.current = isDragging; }, [isDragging]);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [consoleHeight, setConsoleHeight] = useState(250);

  // Split view state
  const [viewMode, setViewMode] = useState<'single' | 'split'>('single');
  const [activeSplitTab, setActiveSplitTab] = useState<'html' | 'css' | 'js'>('html');
  const [splitHtml, setSplitHtml] = useState('');
  const [splitCss, setSplitCss] = useState('');
  const [splitJs, setSplitJs] = useState('');

  // Resizable panel state
  const [isResizing, setIsResizing] = useState(false);
  const chatPanelRef = useRef<HTMLDivElement>(null);
  
  // Version History state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const historyPanelRef = useRef<HTMLDivElement>(null);

  const handleRenameSnapshot = (snapshotId: string, newName: string) => {
    onUpdateCode(snapshotId, { editSummary: newName });
  };

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


  useEffect(() => {
    setIsSmartphoneRotated(false);
  }, [localSimulationDevice]);

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

  const pushToHistory = useCallback((newCode: string) => {
    setHistory(prevHistory => {
      const newHistorySlice = prevHistory.slice(0, currentHistoryIndex + 1);
      newHistorySlice.push(newCode);
      setCurrentHistoryIndex(newHistorySlice.length - 1);
      return newHistorySlice;
    });
  }, [currentHistoryIndex]);
  
  // Effect to sync with external changes (like revert)
  useEffect(() => {
    const newCode = message.htmlContent || '';
    setDisplayedCode(newCode);
    setHistory([newCode]);
    setCurrentHistoryIndex(0);
  }, [message.id, message.htmlContent]);

  useEffect(() => {
    if (isLiveGenerating && !message.isStreamingProject && message.htmlContent) {
      let currentCode = '';
      const finalCode = message.htmlContent;
      let i = 0;
      const animationFrameRef = { id: 0 };
      
      const typeCharacter = () => {
        if (i < finalCode.length) {
          const chunkSize = Math.max(10, Math.floor(finalCode.length / 100));
          currentCode += finalCode.substring(i, Math.min(i + chunkSize, finalCode.length));
          setDisplayedCode(currentCode);
          i += chunkSize;
          animationFrameRef.id = requestAnimationFrame(typeCharacter);
        } else {
          setDisplayedCode(finalCode);
          pushToHistory(finalCode);
          setIsLiveGenerating(false);
        }
      };
      
      animationFrameRef.id = requestAnimationFrame(typeCharacter);
      
      return () => cancelAnimationFrame(animationFrameRef.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message.isStreamingProject, message.htmlContent, isLiveGenerating]);


  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
        if (event.source !== previewRef.current?.contentWindow) {
            return;
        }
        const { source, type, message } = event.data;
        if (source === 'nanom-debug-console' && type && typeof message === 'string') {
            if (!isConsoleOpen) setIsConsoleOpen(true);
            setConsoleLogs(prev => [...prev.slice(-100), { type, message, timestamp: new Date().toLocaleTimeString() }]);
        }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isConsoleOpen]);

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
  
  const handleUndo = useCallback(() => {
    if (currentHistoryIndex > 0) {
      setCurrentHistoryIndex(prev => {
        const newIndex = prev - 1;
        setDisplayedCode(history[newIndex]);
        return newIndex;
      });
    }
  }, [currentHistoryIndex, history]);

  const handleRedo = useCallback(() => {
    if (currentHistoryIndex < history.length - 1) {
      setCurrentHistoryIndex(prev => {
        const newIndex = prev + 1;
        setDisplayedCode(history[newIndex]);
        return newIndex;
      });
    }
  }, [currentHistoryIndex, history]);

  const handleSaveChanges = () => {
    onUpdateCode(message.id, { htmlContent: displayedCode });
    pushToHistory(displayedCode);
    setIsEditing(false);
    setReloadKey(prev => prev + 1); // Force iframe reload
  };
  
  const handleInspect = async () => {
        setIsInspecting(true);
        setError(null);
        try {
            const issues = await inspectCode(displayedCode, 'html', settings);
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
            // FIX: Pass the `inspectionIssues` array to the `fixCode` function.
            const fixedCode = await fixCode(displayedCode, inspectionIssues, 'html', settings);
            setDisplayedCode(fixedCode);
            setInspectionIssues(null);
        } catch (e: any) {
            setError(e.message || "Failed to fix code.");
        } finally {
            setIsFixing(false);
        }
  };

  const createSrcDoc = useCallback(() => {
        let html = displayedCode;

        const consoleScript = `
            <script>
                const originalConsole = { ...window.console };
                window.console = {
                    ...originalConsole,
                    log: (...args) => { originalConsole.log(...args); parent.postMessage({ source: 'nanom-debug-console', type: 'log', message: args.map(a => JSON.stringify(a, null, 2)).join(' ') }, '*'); },
                    warn: (...args) => { originalConsole.warn(...args); parent.postMessage({ source: 'nanom-debug-console', type: 'warn', message: args.map(a => JSON.stringify(a, null, 2)).join(' ') }, '*'); },
                    error: (...args) => { originalConsole.error(...args); parent.postMessage({ source: 'nanom-debug-console', type: 'error', message: args.map(a => a.stack || a).join(' ') }, '*'); },
                };
                window.addEventListener('error', e => parent.postMessage({ source: 'nanom-debug-console', type: 'error', message: \`\${e.message} at \${e.filename}:\${e.lineno}\` }, '*'));
            </script>
        `;

        if (settings.previewDisableJavascript) {
            html = html.replace(/<script/gi, '<script type="text/plain"');
        }

        const headEnd = html.indexOf('</head>');
        if (headEnd !== -1) {
            let injectedContent = consoleScript;
            if (settings.previewCustomCss) {
                injectedContent += `<style>${settings.previewCustomCss}</style>`;
            }
            if (settings.previewDisableCss) {
                injectedContent += `<style>body * { all: initial !important; }</style>`;
            }
            html = html.slice(0, headEnd) + injectedContent + html.slice(headEnd);
        }

        return html;
    }, [displayedCode, settings.previewDisableJavascript, settings.previewCustomCss, settings.previewDisableCss]);

    const srcDoc = useMemo(() => createSrcDoc(), [createSrcDoc, reloadKey]);

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

    const handleFixError = (errorMessage: string) => {
        const fixPrompt = `Fix the following error in the HTML project: ${errorMessage}`;
        onSendMessage(fixPrompt);
        if (!isDesktop) {
            setChatPanelOpen(true);
        }
    };
  
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
            
            {isDesktop && (
                <div className="absolute left-1/2 -translate-x-1/2">
                    {(isCodeView || message.isTemplatePreview) ? (
                        <p className="text-sm font-bold truncate max-w-[40vw]">{message.prompt}</p>
                    ) : (
                        <div className="flex items-center gap-1 p-1 rounded-full bg-slate-200/80 dark:bg-neutral-800/80">
                            <Tooltip text={t('desktop')}>
                                <button
                                    onClick={() => setLocalSimulationDevice('none')}
                                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${localSimulationDevice === 'none' ? 'bg-white dark:bg-neutral-700 shadow-sm' : ''}`}
                                >
                                    <Icon name="monitor" className={`w-4 h-4 ${localSimulationDevice === 'none' ? 'text-gray-800 dark:text-gray-100' : 'text-gray-500'}`} />
                                </button>
                            </Tooltip>
                            <Tooltip text={t('laptop')}>
                                <button
                                    onClick={() => setLocalSimulationDevice('laptop')}
                                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${localSimulationDevice === 'laptop' ? 'bg-white dark:bg-neutral-700 shadow-sm' : ''}`}
                                >
                                    <Icon name="laptop" className={`w-4 h-4 ${localSimulationDevice === 'laptop' ? 'text-gray-800 dark:text-gray-100' : 'text-gray-500'}`} />
                                </button>
                            </Tooltip>
                            <Tooltip text={t('smartphone')}>
                                <button
                                    onClick={() => setLocalSimulationDevice('smartphone')}
                                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${localSimulationDevice === 'smartphone' ? 'bg-white dark:bg-neutral-700 shadow-sm' : ''}`}
                                >
                                    <Icon name="smartphone" className={`w-4 h-4 ${localSimulationDevice === 'smartphone' ? 'text-gray-800 dark:text-gray-100' : 'text-gray-500'}`} />
                                </button>
                            </Tooltip>
                            {localSimulationDevice === 'smartphone' && (
                                <>
                                    <div className="w-px h-4 bg-slate-300 dark:bg-neutral-700 mx-1"></div>
                                    <Tooltip text={t('rotateDevice')}>
                                        <button
                                            onClick={() => setIsSmartphoneRotated(p => !p)}
                                            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors`}
                                        >
                                            <Icon name="rotate-cw" className={`w-4 h-4 text-gray-500`} />
                                        </button>
                                    </Tooltip>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center gap-2">
                {message.isTemplatePreview ? (
                    <>
                        <button onClick={() => onReportTemplate(message)} className="px-4 py-1.5 text-xs font-bold bg-slate-200 dark:bg-neutral-700/60 text-gray-700 dark:text-gray-300 rounded-full hover:bg-slate-300 dark:hover:bg-neutral-700">{t('report')}</button>
                        <button onClick={() => onUseTemplate(message)} className="px-4 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-full hover:bg-blue-700">{t('useTemplate')}</button>
                    </>
                ) : isCodeView ? (
                    <>
                        {!isEditing ? (
                             <HeaderButton title={t('editCode')} onClick={() => setIsEditing(true)}>
                                <Icon name="pencil" className="w-4 h-4" />
                             </HeaderButton>
                        ) : (
                            <div className="flex items-center gap-2">
                               <HeaderButton title={t('undo')} onClick={handleUndo} disabled={currentHistoryIndex <= 0}>
                                  <Icon name="undo-2" className="w-4 h-4" />
                               </HeaderButton>
                               <HeaderButton title={t('redo')} onClick={handleRedo} disabled={currentHistoryIndex >= history.length - 1}>
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
                    <HeaderButton title={t('reloadPreview')} onClick={() => setReloadKey(k => k + 1)}>
                        <Icon name="refresh-cw" className="w-4 h-4" />
                    </HeaderButton>
                )}
                {!message.isTemplatePreview && (
                    <>
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
                                                    onRevertToSnapshot(versionHistory.originalVersion!);
                                                    setIsHistoryOpen(false);
                                                }}
                                            />
                                        )}
                                        {versionHistory.snapshots.map(snapshotMsg => (
                                            <HistoryItem
                                                key={snapshotMsg.id}
                                                id={snapshotMsg.projectSnapshot!.id}
                                                t={t}
                                                label={snapshotMsg.editSummary || new Date(snapshotMsg.timestamp).toLocaleTimeString()}
                                                timestamp={snapshotMsg.timestamp}
                                                isActive={activeSnapshotId === snapshotMsg.id}
                                                onClick={() => {
                                                    onRevertToSnapshot(snapshotMsg);
                                                    setIsHistoryOpen(false);
                                                }}
                                                onRename={handleRenameSnapshot}
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
                    </>
                )}
            </div>
        </header>
        <main className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden relative bg-slate-200 dark:bg-neutral-950">
                {isCodeView ? (
                    <div className="w-full h-full flex flex-col">
                        <CodeEditor language="html" value={displayedCode} onChange={setDisplayedCode} readOnly={!isEditing || !!message.isTemplatePreview} />
                    </div>
                ) : (
                    <div className="w-full h-full flex-1 flex flex-col items-center justify-center p-2">
                        <DeviceFrame device={localSimulationDevice} isRotated={isSmartphoneRotated}>
                            <div ref={selectionContainerRef} className="relative w-full h-full">
                                <iframe
                                    key={reloadKey}
                                    ref={previewRef}
                                    srcDoc={srcDoc}
                                    title="HTML Preview"
                                    sandbox="allow-scripts allow-forms allow-same-origin"
                                    className="w-full h-full bg-white"
                                />
                                {isSelecting && (
                                    <div
                                        className="absolute inset-0 cursor-crosshair"
                                    />
                                )}
                                {isDrawingSelection && selectionRect && (
                                    <div
                                        className="absolute border-2 border-dashed border-blue-500 bg-blue-500/20"
                                        style={{
                                            left: Math.min(selectionRect.startX, selectionRect.endX),
                                            top: Math.min(selectionRect.startY, selectionRect.endY),
                                            width: Math.abs(selectionRect.endX - selectionRect.startX),
                                            height: Math.abs(selectionRect.endY - selectionRect.startY),
                                        }}
                                    />
                                )}
                            </div>
                        </DeviceFrame>
                    </div>
                )}
                {isInspecting && <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20"><div className="w-8 h-8 border-4 border-slate-400 border-t-white rounded-full animate-spin"></div></div>}
                {inspectionIssues && <InspectionPanel issues={inspectionIssues} onFix={handleFix} onClose={() => setInspectionIssues(null)} isFixing={isFixing} t={t} titleKey="htmlInspectionResults" />}
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
                        <ChatView messages={messages} isLoading={isLoading} t={t} onRegenerate={onRegenerate} onDelete={onDelete} onOpenModal={onOpenChatModal} onSetProjectContext={() => onSetProjectContext(message)} onSendMessage={onSendMessage} onOpenSourcesModal={onOpenSourcesModal} onOpenThinkingModal={onOpenThinkingModal} onStartEdit={onStartEdit} onMessageFeedback={onMessageFeedback} onReportMessage={onReportMessage} isDesktop={isDesktop} onOpenStreamingProjectView={() => {}} onAskWithSelection={onAskWithSelection} onRevertToSnapshot={onRevertToSnapshot} activeSnapshotId={activeSnapshotId} />
                        <InputArea isLoading={isLoading} onSendMessage={onSendMessage} onStopGeneration={onStopGeneration} currentGenerationMode={currentProjectContext ? 'project_generation' : 'chat'} setCurrentGenerationMode={setCurrentGenerationMode} currentProjectContext={currentProjectContext} clearProjectContext={clearProjectContext} t={t} language={language} settings={settings} setSettings={setSettings} onOpenModal={(type, data) => setLocalModalState(prev => ({ ...prev, [type as string]: data === undefined ? true : data }))} capturedAttachment={localCapturedAttachment} clearCapturedAttachment={() => setLocalCapturedAttachment(null)} effectiveTheme={effectiveTheme} editingMessage={editingMessage} onConfirmEdit={onConfirmEdit} onCancelEdit={onCancelEdit} isContextLocked hideAttachmentButton onHeightChange={() => {}} selectionPrompt={selectionPrompt} onSelectionPromptHandled={onSelectionPromptHandled} />
                    </div>
                </>
            )}
             {isConsoleOpen && <DebugConsole logs={consoleLogs} onClear={() => setConsoleLogs([])} onFixError={handleFixError} isOpen={isConsoleOpen} setIsOpen={setIsConsoleOpen} height={consoleHeight} setHeight={setConsoleHeight} t={t} />}
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
                        <ChatView messages={messages} isLoading={isLoading} t={t} onRegenerate={onRegenerate} onDelete={onDelete} onOpenModal={onOpenChatModal} onSetProjectContext={() => onSetProjectContext(message)} onSendMessage={onSendMessage} onOpenSourcesModal={onOpenSourcesModal} onOpenThinkingModal={onOpenThinkingModal} onStartEdit={onStartEdit} onMessageFeedback={onMessageFeedback} onReportMessage={onReportMessage} isDesktop={isDesktop} onOpenStreamingProjectView={() => {}} onAskWithSelection={onAskWithSelection} onRevertToSnapshot={onRevertToSnapshot} activeSnapshotId={activeSnapshotId} />
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
export default HtmlPreviewModal;

import React, { useRef, useEffect, useState } from 'react';
import { Message, Project, TranslationKey, Attachment } from '../types';
import Icon from './Icon';
// FIX: Changed to a default import to match the export in WelcomeScreen.tsx and resolve the module error.
import WelcomeScreen from './WelcomeScreen';
import ProjectCard from './ui/ProjectCard';
import FileAttachment from './ui/FileAttachment';
import Tooltip from './ui/Tooltip';

interface ChatViewProps {
  messages: Message[];
  isLoading: boolean;
  t: (key: TranslationKey) => string;
  onRegenerate: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onOpenModal: (message: Message) => void;
  onSetProjectContext: (project: Message) => void;
  onSendMessage: (text: string, attachment?: Attachment) => void;
  onOpenSourcesModal: (message: Message) => void;
  onOpenThinkingModal: (message: Message) => void;
  onStartEdit: (message: Message) => void;
  onMessageFeedback: (message: Message, feedback: 'good' | 'bad' | 'web_search' | 'deep_thinking') => void;
  onReportMessage: (messageId: string) => void;
  isDesktop: boolean;
  inputAreaHeight?: number;
  onOpenStreamingProjectView: (project: Project) => void;
  onAskWithSelection: (text: string) => void;
  onRevertToSnapshot: (snapshotMessage: Message) => void;
  activeSnapshotId?: string | null;
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
        activityCodeContent: message.activityCodeContent,
        isStopped: message.isStopped || false,
        isStreamingProject: message.isStreamingProject || false,
    };
  };

const AiStatusIndicator: React.FC<{ msg: Message, t: (key: TranslationKey) => string }> = ({ msg, t }) => {
    if (!msg.isStreaming) return null;
    
    const indicatorTextKey = msg.webSearchUsed ? 'searchingWeb' : msg.deepThinkingUsed ? 'thinking' : null;
    const indicatorIcon = msg.webSearchUsed ? 'search' : msg.deepThinkingUsed ? 'brain' : null;

    if (!indicatorTextKey || !indicatorIcon) return null;

    return (
        <div className="self-start mb-1 flex items-center gap-2 px-2 py-0.5 max-w-full overflow-hidden">
             <div className="relative w-full h-1 rounded-full bg-slate-300 dark:bg-neutral-700 overflow-hidden">
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-70 animate-background-pan"></div>
            </div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">{t(indicatorTextKey)}</span>
        </div>
    );
};

const AiMessageFooter: React.FC<{
  msg: Message;
  t: (key: TranslationKey) => string;
  onOpenSourcesModal: (message: Message) => void;
  onOpenThinkingModal: (message: Message) => void;
  onRevertToSnapshot: (snapshotMessage: Message) => void;
  activeSnapshotId?: string | null;
}> = ({ msg, t, onOpenSourcesModal, onOpenThinkingModal, onRevertToSnapshot, activeSnapshotId }) => {
    if (msg.isStreaming) return null;

    const hasSources = !!msg.groundingMetadata?.groundingChunks?.length;
    const hasThinking = msg.deepThinkingUsed;
    const hasSnapshot = !!msg.projectSnapshot;
    const isCheckpointActive = activeSnapshotId === msg.id;

    if (!hasSources && !hasThinking && !hasSnapshot) return null;
    
    const checkpointButton = (
        <button
            onClick={() => !isCheckpointActive && onRevertToSnapshot(msg)}
            disabled={isCheckpointActive}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-neutral-800 transition-colors text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed md:hover:enabled:bg-slate-300 md:dark:hover:enabled:bg-neutral-700"
        >
            <Icon name="history" className="w-3.5 h-3.5 text-gray-500" />
            <span>{t('checkpoint')}</span>
            {isCheckpointActive && <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-green-500/20 text-green-700 dark:text-green-300">{t('active')}</span>}
        </button>
    );

    return (
        <div className="flex items-center gap-2 mt-2 px-1">
            {hasSources && (
                <button onClick={() => onOpenSourcesModal(msg)} className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-neutral-800 md:hover:bg-slate-300 md:dark:hover:bg-neutral-700 transition-colors text-gray-600 dark:text-gray-300">
                    <Icon name="search" className="w-3.5 h-3.5 text-blue-500" />
                    <span>{t('sources')}</span>
                </button>
            )}
            {hasThinking && (
                <button onClick={() => onOpenThinkingModal(msg)} className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-neutral-800 md:hover:bg-slate-300 md:dark:hover:bg-neutral-700 transition-colors text-gray-600 dark:text-gray-300">
                    <Icon name="brain" className="w-3.5 h-3.5 text-purple-500" />
                    <span>{t('thinkingProcess')}</span>
                </button>
            )}
            {hasSnapshot && (
                isCheckpointActive ? (
                    <Tooltip text={t('alreadyOnCheckpoint')}>
                        <span className="inline-block cursor-not-allowed">{checkpointButton}</span>
                    </Tooltip>
                ) : checkpointButton
            )}
        </div>
    );
};

const SelectionPopover: React.FC<{
    x: number;
    y: number;
    onAsk: () => void;
    onCopy: () => void;
    t: (key: TranslationKey) => string;
}> = ({ x, y, onAsk, onCopy, t }) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: y, left: x });
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (popoverRef.current) {
            const popoverRect = popoverRef.current.getBoundingClientRect();
            let left = x - popoverRect.width / 2;
            let top = y - popoverRect.height - 8; // 8px spacing

            // Boundary checks
            if (top < 8) top = y + 24; // If not enough space above, show below
            if (left < 8) left = 8;
            if (left + popoverRect.width > window.innerWidth - 8) {
                left = window.innerWidth - popoverRect.width - 8;
            }

            setPosition({ top, left });
        }
    }, [x, y]);
    
    const handleCopy = () => {
        onCopy();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            ref={popoverRef}
            className="fixed z-50 flex items-center gap-1 p-1 rounded-full bg-white dark:bg-neutral-800 shadow-lg border border-slate-200 dark:border-neutral-700 animate-pop-in"
            style={{ ...position, visibility: position.top ? 'visible' : 'hidden' }}
        >
            <button onClick={onAsk} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full text-gray-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-neutral-700">
                <Icon name="sparkles" className="w-3.5 h-3.5 text-blue-500" />
                <span>اسأل الذكاء الاصطناعي</span>
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-neutral-700"></div>
            <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full text-gray-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-neutral-700">
                <Icon name={copied ? 'check' : 'copy'} className={`w-3.5 h-3.5 ${copied ? 'text-green-500' : ''}`} />
                <span>{copied ? t('copied') : t('copyText')}</span>
            </button>
        </div>
    );
};


const ChatMessage: React.FC<{
  msg: Message;
  t: (key: TranslationKey) => string;
  onRegenerate: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onOpenModal: (message: Message) => void;
  onSetProjectContext: (project: Message) => void;
  onOpenSourcesModal: (message: Message) => void;
  onOpenThinkingModal: (message: Message) => void;
  onStartEdit: (message: Message) => void;
  onMessageFeedback: (message: Message, feedback: 'good' | 'bad' | 'web_search' | 'deep_thinking') => void;
  onReportMessage: (messageId: string) => void;
  isDesktop: boolean;
  onOpenStreamingProjectView: (project: Project) => void;
  onAskWithSelection: (text: string) => void;
  onRevertToSnapshot: (snapshotMessage: Message) => void;
  activeSnapshotId?: string | null;
}> = (props) => {
  const { msg, t, onRegenerate, onDelete, onOpenModal, onSetProjectContext, onOpenSourcesModal, onOpenThinkingModal, onStartEdit, onMessageFeedback, onReportMessage, isDesktop, onOpenStreamingProjectView, onAskWithSelection, onRevertToSnapshot, activeSnapshotId } = props;
  const isUser = !msg.isAI;
  const [copied, setCopied] = React.useState(false);
  
  const [actionsVisible, setActionsVisible] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const pressTimer = useRef<number | null>(null);
  const wasLongPress = useRef(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const messageContentRef = useRef<HTMLDivElement>(null);

  const [selectionPopover, setSelectionPopover] = useState<{ x: number, y: number, text: string } | null>(null);
  
  useEffect(() => {
    // Cleanup timer on unmount
    return () => {
        if (pressTimer.current) {
            clearTimeout(pressTimer.current);
        }
    };
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setPopoverOpen(false);
      }
       if (selectionPopover && messageContentRef.current && !messageContentRef.current.contains(event.target as Node)) {
            setSelectionPopover(null);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectionPopover]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMouseUp = () => {
    if (!isDesktop || msg.isAI !== true) return;

    setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection?.toString().trim();

        if (selection && selectedText) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            setSelectionPopover({
                x: rect.left + rect.width / 2,
                y: rect.top,
                text: selectedText,
            });
        } else {
            setSelectionPopover(null);
        }
    }, 10);
  };

  // --- Event Handlers ---
  const handlePressStart = () => {
    if (isDesktop) return; // Only for touch/mobile-like interaction

    wasLongPress.current = false;
    pressTimer.current = window.setTimeout(() => {
        setActionsVisible(true);
        wasLongPress.current = true;
    }, 1500); // User requested 1.5 seconds
  };

  const handlePressEnd = () => {
    if (isDesktop) return;
    if (pressTimer.current) {
        clearTimeout(pressTimer.current);
        pressTimer.current = null;
    }
  };

  const handleMouseEnter = () => {
    if (isDesktop) {
      setActionsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (isDesktop) {
      setActionsVisible(false);
      setPopoverOpen(false);
    }
  };

  const handleContainerClick = () => {
    // Mobile: if it was a long press, do nothing.
    if (!isDesktop && wasLongPress.current) {
        return;
    }
    // Mobile: if actions are visible, a short click hides them.
    if (!isDesktop && actionsVisible) {
        setActionsVisible(false);
        setPopoverOpen(false);
        return;
    }
    // Default click action for desktop clicks and mobile short taps when actions are hidden.
    if (hasAttachment && !isProject) {
        onOpenModal(msg);
    }
  };

  const handleReport = () => {
    onReportMessage(msg.id);
    setPopoverOpen(false);
  };

  const renderAiMessageContent = () => {
    if (msg.isStreaming && msg.text === '') {
       return (
            <div className="flex items-center py-2">
                <span className="pulsing-dot"></span>
            </div>
       );
    }
    
    if (msg.isStreaming) {
      const animatedWords = msg.text.split(/(\s+)/).filter(Boolean).map((word, index) => (
         <span key={`${msg.id}-word-${index}`} className="animate-word-fade-in">{word}</span>
      ));
      return (
          <div ref={messageContentRef} onMouseUp={handleMouseUp} className="ai-message-content text-sm leading-relaxed whitespace-pre-wrap">
            {animatedWords}
          </div>
      );
    }

    const rawMarkup = (window as any).marked?.parse(msg.text || '') || msg.text;
    return <div ref={messageContentRef} onMouseUp={handleMouseUp} className="ai-message-content text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: rawMarkup }}></div>;
  };
  
  const isProject = msg.isCode || msg.isJavaScript || msg.isAndroidApp;
  const hasAttachment = !!msg.attachment;
  
  const actionButtonClass = "p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10";
  
  const handleFeedback = (feedbackType: 'good' | 'bad' | 'web_search' | 'deep_thinking') => {
    onMessageFeedback(msg, feedbackType);
    setPopoverOpen(false);
  }

  return (
    <>
    {selectionPopover && (
        <SelectionPopover
            x={selectionPopover.x}
            y={selectionPopover.y}
            t={t}
            onAsk={() => {
                onAskWithSelection(selectionPopover.text);
                setSelectionPopover(null);
            }}
            onCopy={() => {
                navigator.clipboard.writeText(selectionPopover.text);
            }}
        />
    )}
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`relative inline-flex flex-col max-w-[90%] sm:max-w-[80%] md:max-w-[70%] group`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleContainerClick}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onContextMenu={(e) => { if (!isDesktop) e.preventDefault(); }}
      >
        <AiStatusIndicator msg={msg} t={t} />
        <div className={`p-3 rounded-2xl ${isUser ? `bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 border border-slate-200 dark:border-neutral-700 transition-colors` : 'bg-slate-100 dark:bg-neutral-800/50 backdrop-blur-sm text-gray-800 dark:text-gray-200 border border-slate-200 dark:border-neutral-700/50'} ${hasAttachment && !isProject ? 'cursor-pointer' : ''}`}>
          {msg.isError ? (
            <p className="text-red-400 text-sm">{msg.text}</p>
          ) : isProject ? (
             <div className="w-full max-w-[280px] h-44">
                <ProjectCard
                    project={messageToProject(msg)}
                    t={t}
                    onView={(proj) => {
                      if (proj.isStreamingProject) {
                        onOpenStreamingProjectView(proj);
                      } else {
                        onOpenModal(msg);
                      }
                    }}
                    onAction={() => onSetProjectContext(msg)}
                    actionTextKey="editCode"
                    isStreaming={msg.isStreamingProject}
                    isBeingEdited={msg.isBeingEdited}
                />
            </div>
          ) : (
            <>
                {msg.text && (
                  isUser 
                    ? <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                    : renderAiMessageContent()
                )}
                {hasAttachment && (
                    <div className={`${msg.text ? 'mt-2' : ''}`}>
                         <FileAttachment
                            dataUrl={msg.attachment!.dataUrl}
                            name={msg.attachment!.name}
                            mimeType={msg.attachment!.mimeType}
                         />
                    </div>
                )}
            </>
          )}
        </div>
        {msg.isAI && !isProject && msg.isStopped && (
            <div className="mt-2 self-start animate-fade-in">
                <button
                    onClick={() => onRegenerate(msg)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
                >
                    <Icon name="play" className="w-3.5 h-3.5" />
                    <span>{t('continueResponse')}</span>
                </button>
            </div>
        )}
        {!msg.isStreaming && (
            <div className="flex items-center justify-between">
              <AiMessageFooter msg={msg} t={t} onOpenSourcesModal={onOpenSourcesModal} onOpenThinkingModal={onOpenThinkingModal} onRevertToSnapshot={onRevertToSnapshot} activeSnapshotId={activeSnapshotId} />
              {!msg.isLoading && !msg.isStreamingProject && !msg.isBeingEdited && (
                  <div className={`relative flex items-center space-x-1 rtl:space-x-reverse mt-1.5 px-2 text-gray-500 dark:text-gray-400 ml-auto transition-opacity duration-200 ${actionsVisible ? 'opacity-100' : 'opacity-0 invisible'}`}>
                    {isUser && (
                      <Tooltip text={t('editMessage')}>
                        <button onClick={(e) => { e.stopPropagation(); onStartEdit(msg); }} className={actionButtonClass}>
                          <Icon name="pencil" className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    )}
                    {!isProject && (
                        <Tooltip text={copied ? t('copied') : t('copyText')}>
                        <button onClick={(e) => { e.stopPropagation(); handleCopy(msg.text); }} className={actionButtonClass}>
                            <Icon name={copied ? 'check' : 'copy'} className={`w-4 h-4 ${copied ? 'text-green-500' : ''}`} />
                        </button>
                        </Tooltip>
                    )}
                    {msg.isAI && !msg.isError && !msg.isStopped && (
                      <Tooltip text={t('regenerateResponse')}>
                        <button onClick={(e) => { e.stopPropagation(); onRegenerate(msg); }} className={actionButtonClass}>
                          <Icon name="refresh-cw" className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    )}
                    {!isProject && (
                      <Tooltip text={t('deleteMessage')}>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(msg.id); }} className={actionButtonClass}>
                          <Icon name="trash-2" className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    )}
                    {msg.isAI && !msg.isError && !msg.isStopped && (
                       <div ref={popoverRef}>
                          <Tooltip text={t('more')}>
                            <button onClick={(e) => { e.stopPropagation(); setPopoverOpen(p => !p); }} className={actionButtonClass}>
                              <Icon name="chevron-down" className="w-4 h-4" />
                            </button>
                          </Tooltip>
                          {popoverOpen && (
                              <div className="absolute bottom-full mb-1 right-0 rtl:right-auto rtl:left-0 w-max bg-white/70 dark:bg-neutral-800/70 backdrop-blur-md shadow-lg rounded-xl border border-slate-200 dark:border-neutral-700 z-10 animate-pop-in overflow-hidden">
                                  <ul className="text-xs font-semibold text-gray-800 dark:text-gray-200 divide-y divide-slate-200/50 dark:divide-neutral-700/50">
                                      <li>
                                          <button onClick={(e) => { e.stopPropagation(); handleFeedback('web_search'); }} className="flex items-center gap-2 w-full text-left rtl:text-right px-3 py-2 hover:bg-slate-100/50 dark:hover:bg-neutral-900/50">
                                              <Icon name="globe" className="w-3.5 h-3.5 text-blue-500" />
                                              <span>{t('regenerateWithWebSearch')}</span>
                                          </button>
                                      </li>
                                      <li>
                                          <button onClick={(e) => { e.stopPropagation(); handleFeedback('deep_thinking'); }} className="flex items-center gap-2 w-full text-left rtl:text-right px-3 py-2 hover:bg-slate-100/50 dark:hover:bg-neutral-900/50">
                                              <Icon name="brain-circuit" className="w-3.5 h-3.5 text-purple-500" />
                                              <span>{t('regenerateWithDeepThinking')}</span>
                                          </button>
                                      </li>
                                      <li>
                                          <button onClick={(e) => { e.stopPropagation(); handleFeedback('good'); }} disabled={!!msg.feedbackGiven} className="flex items-center gap-2 w-full text-left rtl:text-right px-3 py-2 hover:bg-slate-100/50 dark:hover:bg-neutral-900/50 disabled:opacity-50 disabled:cursor-not-allowed">
                                              <Icon name="thumbs-up" className="w-3.5 h-3.5 text-green-500" />
                                              <span>{t('goodResponse')}</span>
                                          </button>
                                      </li>
                                      <li>
                                          <button onClick={(e) => { e.stopPropagation(); handleFeedback('bad'); }} disabled={!!msg.feedbackGiven} className="flex items-center gap-2 w-full text-left rtl:text-right px-3 py-2 hover:bg-slate-100/50 dark:hover:bg-neutral-900/50 disabled:opacity-50 disabled:cursor-not-allowed">
                                              <Icon name="thumbs-down" className="w-3.5 h-3.5 text-red-500" />
                                              <span>{t('badResponse')}</span>
                                          </button>
                                      </li>
                                      <li>
                                          <button onClick={(e) => { e.stopPropagation(); handleReport(); }} className="flex items-center gap-2 w-full text-left rtl:text-right px-3 py-2 hover:bg-slate-100/50 dark:hover:bg-neutral-900/50">
                                              <Icon name="shield-alert" className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                                              <span>{t('reportMessage')}</span>
                                          </button>
                                      </li>
                                  </ul>
                              </div>
                          )}
                       </div>
                    )}
                  </div>
              )}
            </div>
        )}
      </div>
    </div>
    </>
  );
};

const ChatView: React.FC<ChatViewProps> = (props) => {
  const { messages, isLoading, t, onSendMessage, inputAreaHeight, ...chatMessageProps } = props;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Overscroll bounce effect logic
  useEffect(() => {
    const container = chatContainerRef.current;
    const content = scrollContentRef.current;
    if (!container || !content) return;

    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isSmallScreen = window.matchMedia("(max-width: 767px)").matches;

    if (!isTouchDevice || !isSmallScreen) {
        container.style.overscrollBehavior = '';
        return;
    }

    container.style.overscrollBehavior = 'contain';

    const state = {
        startY: 0,
        isDragging: false,
    };

    const handleTouchStart = (e: TouchEvent) => {
        state.startY = e.touches[0].clientY;
        state.isDragging = true;
        content.style.transition = 'none';
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!state.isDragging) return;
        const touchY = e.touches[0].clientY;
        const deltaY = touchY - state.startY;
        const atTop = container.scrollTop <= 0;
        const atBottom = container.scrollTop >= container.scrollHeight - container.clientHeight;

        if ((atTop && deltaY > 0) || (atBottom && deltaY < 0)) {
            e.preventDefault();
            const rubberBandOffset = Math.sign(deltaY) * Math.pow(Math.abs(deltaY), 0.7);
            content.style.transform = `translateY(${rubberBandOffset}px)`;
        }
    };

    const handleTouchEnd = () => {
        if (!state.isDragging) return;
        state.isDragging = false;
        content.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        content.style.transform = 'translateY(0px)';
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchcancel', handleTouchEnd);

    return () => {
        if (container) {
          container.removeEventListener('touchstart', handleTouchStart);
          container.removeEventListener('touchmove', handleTouchMove);
          container.removeEventListener('touchend', handleTouchEnd);
          container.removeEventListener('touchcancel', handleTouchEnd);
          container.style.overscrollBehavior = '';
        }
        if (content) {
            content.style.transform = '';
            content.style.transition = '';
        }
    };
  }, []);

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if(chatContainer){
      const isScrolledToBottom = chatContainer.scrollHeight - chatContainer.clientHeight <= chatContainer.scrollTop + 150;
      if (isScrolledToBottom) {
          scrollToBottom('smooth');
      }
    }
  }, [messages]);

  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      setShowScrollButton(scrollHeight - scrollTop - clientHeight > 400);
    }
  };

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    chatContainer?.addEventListener('scroll', handleScroll);
    return () => {
      chatContainer?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const buttonBottomOffset = (inputAreaHeight || 0) + 16; // 16px (1rem) for spacing

  return (
    <div className="relative flex-1">
      <div ref={chatContainerRef} className={`absolute inset-0 p-3 space-y-4 custom-scrollbar bg-slate-50 dark:bg-neutral-900 ${messages.length > 0 || isLoading ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        <div ref={scrollContentRef}>
          {messages.length === 0 && !isLoading ? (
            <WelcomeScreen onQuestionClick={onSendMessage} t={t} />
          ) : (
            
            messages.map((msg) => <ChatMessage key={msg.id} msg={msg} t={t} {...chatMessageProps} />)
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

       {showScrollButton && (
        <Tooltip text={t('scrollToBottom')}>
          <button
            onClick={() => scrollToBottom()}
            className="fixed right-4 rtl:right-auto rtl:left-4 z-10 w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 transform md:hover:scale-110 bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 shadow-lg border border-slate-200 dark:border-neutral-700"
            style={{ bottom: `${buttonBottomOffset}px` }}
          >
            <Icon name="chevron-down" className="w-6 h-6" />
          </button>
        </Tooltip>
      )}
    </div>
  );
};

export default ChatView;
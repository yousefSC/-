import React, { useMemo, useState, useRef, useEffect } from 'react';
import { ChatSession, TranslationKey, Language, Scale, User } from '../types';
import Icon from './Icon';
import Tooltip from './ui/Tooltip';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  sessions: ChatSession[];
  archivedSessions: ChatSession[];
  currentChatSessionId: string | null;
  setCurrentChatSessionId: (id: string | null) => void;
  startNewChat: () => void;
  t: (key: TranslationKey) => string;
  onOpenLibrary: () => void;
  onOpenSettings: () => void;
  onOpenSearchModal: () => void;
  language: Language;
  onDeleteSession: (sessionId: string) => void;
  onExecuteDeleteSession: (sessionId: string) => void;
  onArchiveSessionWithConfirmation: (sessionId: string) => void;
  onTogglePin: (sessionId: string) => void;
  onToggleArchive: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
  onOpenExportChatModal: (sessionId: string) => void;
  isDesktop: boolean;
  isProUnlocked: boolean;
  isNanoUnlocked: boolean;
  scale: Scale;
  isSearchFocused: boolean;
  setIsSearchFocused: (isFocused: boolean) => void;
  currentUser: User | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  pendingAction: { type: 'delete' | 'archive', sessionId: string } | null;
  onUndoAction: () => void;
  animatingInSessionId: string | null;
  onAnimationInEnd: () => void;
  newChatButtonState: 'idle' | 'shake';
}

const SessionItem: React.FC<{
    session: ChatSession;
    isActive: boolean;
    onClick: () => void;
    onDelete: () => void;
    onConfirmDelete: () => void;
    onTogglePin: (e: React.MouseEvent) => void;
    onRenameSession: (sessionId: string, newTitle: string) => void;
    onArchive: () => void;
    onConfirmArchive: () => void;
    onExport: () => void;
    t: (key: TranslationKey) => string;
    isCollapsed: boolean;
    isDesktop: boolean;
    isAnimatingOut?: boolean;
    animationType?: 'delete' | 'archive' | null;
    onAnimationOutEnd?: () => void;
    isAnimatingIn?: boolean;
    onAnimationInEnd?: () => void;
}> = ({ session, isActive, onClick, onDelete, onConfirmDelete, onTogglePin, onRenameSession, onArchive, onConfirmArchive, onExport, t, isCollapsed, isDesktop, isAnimatingOut, animationType, onAnimationOutEnd, isAnimatingIn, onAnimationInEnd }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [confirmationAction, setConfirmationAction] = useState<'delete' | 'archive' | null>(null);
    const [isHoveringMenu, setIsHoveringMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(session.title);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);
    
    const handleSaveRename = () => {
        if (editText.trim() && editText.trim() !== session.title) {
            onRenameSession(session.id, editText.trim());
        }
        setIsEditing(false);
    };

    const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSaveRename();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditText(session.title);
        }
    };

    const handleRenameClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditText(session.title);
        setIsEditing(true);
        setIsMenuOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
                setConfirmationAction(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMenuToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        const willBeOpen = !isMenuOpen;
        setIsMenuOpen(willBeOpen);
        if (willBeOpen) {
            setIsHoveringMenu(true);
        } else {
            setConfirmationAction(null);
        }
    }

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isDesktop) {
            setConfirmationAction('delete');
        } else {
            onDelete();
            setIsMenuOpen(false);
        }
    };
    
    const handleArchiveClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isDesktop) {
            setConfirmationAction('archive');
        } else {
            onArchive();
            setIsMenuOpen(false);
        }
    };

    const handleConfirm = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirmationAction === 'delete') {
            onConfirmDelete();
        } else if (confirmationAction === 'archive') {
            onConfirmArchive();
        }
        setConfirmationAction(null);
        setIsMenuOpen(false);
    };
    
    const handleCancel = (e: React.MouseEvent) => {
        e.stopPropagation();
        setConfirmationAction(null);
    };
    
    const handleExportClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onExport();
        setIsMenuOpen(false);
    };


    const buttonContent = (
      <button
          onClick={onClick}
          className={`w-full text-start rtl:text-right flex items-center gap-3 p-2 rounded-lg transition-colors text-sm ${isActive ? 'bg-slate-200 dark:bg-neutral-800 font-semibold text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400 hover:bg-slate-200/50 dark:hover:bg-neutral-800/50'} ${isCollapsed ? 'justify-center' : ''}`}
      >
          {session.isPinned && <Icon name="pin" className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 transition-transform duration-300 ease-in-out md:group-hover:scale-125 md:group-hover:rotate-12" />}
          {!session.isPinned && isCollapsed && <Icon name="message-square" className="w-5 h-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />}
          {!isCollapsed && (
            <div className="flex-1 truncate relative">
                <span>{session.title}</span>
            </div>
          )}
      </button>
    );

    const animationClass = isAnimatingOut
        ? (animationType === 'delete' ? 'animate-session-delete' : 'animate-session-archive')
        : isAnimatingIn
        ? 'animate-session-slide-in'
        : '';

    const handleAnimationEnd = () => {
        if (isAnimatingIn && onAnimationInEnd) {
            onAnimationInEnd();
        } else if (isAnimatingOut && onAnimationOutEnd) {
            onAnimationOutEnd();
        }
    };

    if (isEditing) {
        return (
            <div className="w-full flex items-center gap-2 p-2 rounded-lg bg-slate-200 dark:bg-neutral-800">
                <Icon name="pencil" className="w-4 h-4 text-gray-500 animate-wiggle flex-shrink-0" />
                <input
                    ref={inputRef}
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={handleSaveRename}
                    onKeyDown={handleRenameKeyDown}
                    className="w-full bg-transparent focus:outline-none text-sm font-semibold text-gray-800 dark:text-gray-100"
                />
            </div>
        );
    }

    return (
        <div 
            className={`relative group rounded-lg ${animationClass}`}
            onAnimationEnd={handleAnimationEnd}
        >
            {isCollapsed ? <Tooltip text={session.title}>{buttonContent}</Tooltip> : buttonContent}
            {!isCollapsed && (
                <div
                    ref={menuRef}
                    className={`absolute top-1/2 -translate-y-1/2 right-2 rtl:right-auto rtl:left-2 z-10 transition-opacity ${
                        isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                >
                    <button onClick={handleMenuToggle} className="p-1.5 rounded-full hover:bg-slate-300 dark:hover:bg-neutral-700">
                        <Icon name="ellipsis" className="w-4 h-4" />
                    </button>
                    {isMenuOpen && (
                        <div
                            onMouseEnter={() => setIsHoveringMenu(true)}
                            onMouseLeave={() => setIsHoveringMenu(false)}
                            className={`absolute top-full mt-1 right-0 rtl:right-auto rtl:left-0 w-40 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-slate-200 dark:border-neutral-700 z-20 animate-pop-in transition-opacity duration-300 ${
                                confirmationAction && !isHoveringMenu ? 'opacity-75' : 'opacity-100'
                            }`}
                        >
                            {confirmationAction === null ? (
                                <ul className="py-1 text-xs text-gray-700 dark:text-gray-300">
                                    <li><button onClick={handleRenameClick} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-neutral-700">{t('rename')}</button></li>
                                    <li><button onClick={onTogglePin} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-neutral-700">{t(session.isPinned ? 'unpin' : 'pin')}</button></li>
                                    <li><button onClick={handleArchiveClick} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-neutral-700">{t('archive')}</button></li>
                                    <li><button onClick={handleExportClick} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-neutral-700">{t('exportChat')}</button></li>
                                    <div className="my-1 border-t border-slate-100 dark:border-neutral-700/50"></div>
                                    <li><button onClick={handleDeleteClick} className="w-full flex items-center gap-2 px-3 py-1.5 text-red-500 hover:bg-red-500/10">{t('delete')}</button></li>
                                </ul>
                            ) : (
                                <ul className="py-1 text-xs text-gray-700 dark:text-gray-300">
                                    <li>
                                        <button 
                                            onClick={handleConfirm} 
                                            className={`w-full flex items-center gap-2 px-3 py-1.5 font-semibold transition-colors ${
                                                confirmationAction === 'delete' 
                                                    ? 'text-red-500 hover:bg-red-500/10' 
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-neutral-700'
                                            }`}
                                        >
                                            {confirmationAction === 'delete' ? t('delete') : t('archive')}
                                        </button>
                                    </li>
                                    <li>
                                        <button 
                                            onClick={handleCancel} 
                                            className="w-full flex items-center gap-2 px-3 py-1.5 text-gray-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-neutral-700"
                                        >
                                            {t('cancel')}
                                        </button>
                                    </li>
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


const Sidebar: React.FC<SidebarProps> = (props) => {
  const {
      isOpen, setIsOpen, sessions, currentChatSessionId, setCurrentChatSessionId, startNewChat,
      t, onOpenLibrary, onOpenSettings, onOpenSearchModal, language, onDeleteSession, onExecuteDeleteSession,
      onArchiveSessionWithConfirmation, onTogglePin, onToggleArchive, onRenameSession, onOpenExportChatModal, isDesktop, currentUser, onOpenAuthModal, onLogout,
      isSearchFocused, setIsSearchFocused, pendingAction, onUndoAction, newChatButtonState
  } = props;
  
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isCollapsed = !isOpen && isDesktop;
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [animatingOut, setAnimatingOut] = useState<{ id: string; type: 'delete' | 'archive' } | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
        document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  useEffect(() => {
    if (pendingAction) {
        setAnimatingOut({ id: pendingAction.sessionId, type: pendingAction.type });
    }
  }, [pendingAction]);

  const handleAnimationEnd = (sessionId: string) => {
    if (animatingOut?.id === sessionId) {
        setAnimatingOut(null);
    }
  };

  const filteredSessions = useMemo(() => {
    if (!searchTerm) return [];
    return sessions.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [sessions, searchTerm]);
  
  const handleCancelSearch = () => {
    setIsSearchFocused(false);
    setSearchTerm('');
    inputRef.current?.blur();
  };
  
  const handleSelectSessionFromSearch = (id: string) => {
    setCurrentChatSessionId(id);
    handleCancelSearch();
    if (!isDesktop) {
        setIsOpen(false);
    }
  }

  const { pinnedSessions, recentSessions } = useMemo(() => {
    const pinned = sessions.filter(s => s.isPinned);
    const recent = sessions.filter(s => !s.isPinned);
    return { pinnedSessions: pinned, recentSessions: recent };
  }, [sessions]);

  const IconButton: React.FC<{title: string; onClick:() => void; children: React.ReactNode; className?: string}> = ({ title, onClick, children, className }) => (
    <Tooltip text={title}>
      <button onClick={onClick} className={`group flex items-center justify-center w-full p-3 rounded-full text-gray-500 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors ${className || ''}`}>
          {children}
      </button>
    </Tooltip>
  );

  const isMobileSearchActive = isSearchFocused && !isDesktop;

  const renderSessionList = (sessionsToRender: ChatSession[]) => {
      return sessionsToRender.map(session => {
          const isPending = pendingAction?.sessionId === session.id;
          const isAnimatingOut = animatingOut?.id === session.id;
          const isAnimatingIn = props.animatingInSessionId === session.id;

          if (isPending && !isAnimatingOut) {
              return (
                  <div key={`${session.id}-undo`} className="rounded-lg flex items-center justify-center text-sm h-[40px] animate-fade-in">
                      <button
                          onClick={(e) => { e.stopPropagation(); onUndoAction(); }}
                          className="bg-slate-700 text-white px-4 py-1.5 rounded-full text-xs font-semibold hover:bg-slate-800 transition-colors"
                      >
                          {t('undo')}
                      </button>
                  </div>
              );
          }

          return (
              <SessionItem
                  key={session.id}
                  session={session}
                  isActive={currentChatSessionId === session.id}
                  onClick={() => setCurrentChatSessionId(session.id)}
                  onDelete={() => onDeleteSession(session.id)}
                  onConfirmDelete={() => onExecuteDeleteSession(session.id)}
                  onTogglePin={(e) => { e.stopPropagation(); onTogglePin(session.id); }}
                  onRenameSession={onRenameSession}
                  onArchive={() => onArchiveSessionWithConfirmation(session.id)}
                  onConfirmArchive={() => onToggleArchive(session.id)}
                  onExport={() => onOpenExportChatModal(session.id)}
                  t={t}
                  isCollapsed={isCollapsed}
                  isDesktop={isDesktop}
                  isAnimatingOut={isAnimatingOut}
                  animationType={isAnimatingOut ? animatingOut.type : null}
                  onAnimationOutEnd={() => handleAnimationEnd(session.id)}
                  isAnimatingIn={isAnimatingIn}
                  onAnimationInEnd={props.onAnimationInEnd}
              />
          );
      });
  };
  
  return (
    <aside className={
      `h-full bg-slate-100/80 dark:bg-neutral-900/80 backdrop-blur-lg 
      border-l rtl:border-r-0 rtl:border-l border-slate-200/80 dark:border-neutral-800/80 
      flex flex-col transition-all duration-300 ease-in-out
      ${!isDesktop 
        ? `fixed top-0 z-40 ${language === 'ar' ? 'right-0' : 'left-0'} ${isOpen ? 'translate-x-0' : (language === 'ar' ? 'translate-x-full' : '-translate-x-full')} ${isMobileSearchActive ? 'w-full max-w-none' : 'w-[22rem] max-w-[85vw]'}` 
        : `relative flex-shrink-0 ${isOpen ? 'w-72' : 'w-16'}`
      }`
    }>
      <div className={`h-full flex flex-col overflow-hidden ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {/* Header */}
        <div className={`py-3 flex items-center flex-shrink-0 w-full transition-all duration-300 ${isCollapsed ? 'justify-center' : 'justify-between'} ${isMobileSearchActive ? 'hidden' : ''}`}>
          <div className={`flex items-center gap-2 transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
            {!isCollapsed && <span className="font-brand font-bold text-lg">NANOM AI</span>}
          </div>
          {isDesktop &&
            <Tooltip text={t(isOpen ? 'closeSidebar' : 'openSidebar')}>
              <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="p-2 rounded-full bg-slate-200 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700/50 hover:bg-slate-300 dark:hover:bg-neutral-700 transition-colors" 
              >
                  <Icon name="chevrons-left-right" className="w-5 h-5" />
              </button>
            </Tooltip>
          }
        </div>

        {/* Search / Collapsed actions */}
        <div className={`pb-2 flex-shrink-0 w-full transition-all duration-300 ${isMobileSearchActive ? 'pt-3' : ''}`}>
            {isCollapsed ? (
                <div className="space-y-2">
                    <IconButton
                        title={t('newChat')}
                        onClick={startNewChat}
                        className={newChatButtonState === 'shake' ? '!bg-red-500 !text-white hover:!bg-red-600' : ''}
                    >
                      <Icon name="plus" className={`w-5 h-5 transition-all group-hover:scale-90 ${newChatButtonState === 'shake' ? 'animate-plus-shake' : 'group-hover:text-gray-400'}`} />
                    </IconButton>
                    <IconButton title={t('search')} onClick={onOpenSearchModal}>
                      <Icon name="search" className="w-5 h-5 transition-all group-hover:scale-90 group-hover:text-gray-400" />
                    </IconButton>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Icon name="search" className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => { if (!isDesktop) setIsSearchFocused(true); }}
                            onClick={() => { if (isDesktop) onOpenSearchModal(); }}
                            readOnly={isDesktop}
                            placeholder={t('search')}
                            className="w-full bg-white dark:bg-neutral-800 rounded-full py-2 ltr:pl-9 rtl:pr-9 text-sm border border-slate-300 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer md:cursor-text"
                        />
                    </div>
                     {isMobileSearchActive ? (
                        <button onClick={handleCancelSearch} className="text-sm font-semibold text-blue-500 animate-fade-in">{t('cancel')}</button>
                    ) : (
                        <Tooltip text={t('newChat')}>
                          <button onClick={startNewChat} className={`flex-shrink-0 p-2 rounded-full bg-slate-200 dark:bg-neutral-800 hover:bg-slate-300 dark:hover:bg-neutral-700 transition-colors ${newChatButtonState === 'shake' ? '!bg-red-500 text-white hover:!bg-red-600' : ''}`}>
                              <Icon name="plus" className={newChatButtonState === 'shake' ? 'animate-plus-shake' : ''} />
                          </button>
                        </Tooltip>
                    )}
                </div>
            )}
        </div>
        
        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pt-0 w-full">
            {isMobileSearchActive ? (
                 <div className="animate-fade-in">
                    {filteredSessions.length > 0 ? (
                        <div className="space-y-1 mt-2">
                            {filteredSessions.map(session => (
                                <button key={session.id} onClick={() => handleSelectSessionFromSearch(session.id)} className="w-full text-start rtl:text-right flex items-center gap-3 p-2 rounded-lg transition-colors text-sm text-gray-600 dark:text-gray-400 hover:bg-slate-200/50 dark:hover:bg-neutral-800/50">
                                    <Icon name="message-square" className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                                    <span className="flex-1 truncate">{session.title}</span>
                                </button>
                            ))}
                        </div>
                    ) : (
                        searchTerm && <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">{t('noResultsFound')}</p>
                    )}
                </div>
            ) : !isCollapsed && (
                <>
                {pinnedSessions.length > 0 && (
                    <div className="mb-4">
                    <h3 className="px-2 text-xs font-semibold uppercase text-gray-400 dark:text-gray-500 mb-1">{t('pinned')}</h3>
                    <div className="space-y-1">
                        {renderSessionList(pinnedSessions)}
                    </div>
                    </div>
                )}
                {recentSessions.length > 0 && (
                    <div>
                    <h3 className="px-2 text-xs font-semibold uppercase text-gray-400 dark:text-gray-500 mb-1">{t('today')}</h3>
                    <div className="space-y-1">
                        {renderSessionList(recentSessions)}
                    </div>
                    </div>
                )}
                </>
            )}
        </div>

        {/* Footer */}
        <div className={`flex flex-col flex-shrink-0 py-2 border-t border-slate-200 dark:border-neutral-800 space-y-2 transition-opacity duration-300 ${isMobileSearchActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <Tooltip text={t('library')}>
            <button onClick={onOpenLibrary} className={`group flex items-center gap-3 w-full text-start rtl:text-right transition-colors ${isCollapsed ? 'justify-center rounded-full p-3 hover:bg-slate-200 dark:hover:bg-neutral-800' : 'rounded-lg p-2'}`}>
                <div className={`flex items-center justify-center flex-shrink-0 transition-colors ${isCollapsed ? '' : 'w-8 h-8 rounded-full bg-slate-200 dark:bg-neutral-700 group-hover:bg-slate-300 dark:group-hover:bg-neutral-600'}`}>
                    <Icon name="library" className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-all ${isCollapsed ? 'group-hover:scale-90 group-hover:text-gray-400' : ''}`} />
                </div>
                {!isCollapsed && <span className="font-semibold text-sm">{t('library')}</span>}
            </button>
          </Tooltip>
          
          {currentUser ? (
              <div ref={userMenuRef} className="relative">
                <button 
                  onClick={() => {
                      if (isCollapsed) {
                          onOpenSettings();
                      } else {
                          setIsUserMenuOpen(p => !p);
                      }
                  }}
                  className={`flex items-center gap-3 p-2 rounded-lg w-full text-start rtl:text-right hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
                >
                    <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                         {currentUser.profilePicture ? (
                            <img src={currentUser.profilePicture} alt={currentUser.firstName || 'User'} className="w-full h-full object-cover" />
                         ) : (
                            <Icon name="user" className="w-5 h-5 text-gray-500" />
                         )}
                    </div>
                    {!isCollapsed && (
                      <div className="flex-1 overflow-hidden">
                          <p className="font-bold text-sm truncate">{currentUser.firstName || currentUser.email}</p>
                      </div>
                    )}
                    {!isCollapsed && (
                        <Icon name="chevrons-up-down" className={`w-4 h-4 text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                    )}
                </button>
                {isUserMenuOpen && !isCollapsed && isDesktop && (
                  <div className="absolute bottom-full mb-2 w-full bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-slate-200 dark:border-neutral-700 z-10 animate-pop-in">
                      <ul className="py-1 text-sm text-gray-700 dark:text-gray-300">
                          <li>
                              <button
                                  onClick={() => { onOpenSettings(); setIsUserMenuOpen(false); }}
                                  className="w-full flex items-center gap-3 px-3 py-2 text-start rtl:text-right hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors"
                              >
                                  <Icon name="settings" className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                  <span>{t('settings')}</span>
                              </button>
                          </li>
                          <li>
                              <button
                                  onClick={() => { onLogout(); setIsUserMenuOpen(false); }}
                                  className="w-full flex items-center gap-3 px-3 py-2 text-start rtl:text-right text-red-600 dark:text-red-500 hover:!bg-red-500/10 dark:hover:!bg-red-500/10 transition-colors"
                              >
                                  <Icon name="log-out" className="w-4 h-4 text-red-600 dark:text-red-500" />
                                  <span>{t('signOut')}</span>
                              </button>
                          </li>
                      </ul>
                  </div>
                )}
              </div>
          ) : (
              <div className={`flex items-center gap-2 ${isCollapsed ? 'flex-col-reverse' : 'flex-row'}`}>
                  <Tooltip text={t('signIn')}>
                    <button onClick={onOpenAuthModal} className={`flex items-center justify-center gap-2 py-2 text-sm font-semibold bg-slate-800 dark:bg-slate-200 text-white dark:text-black rounded-full hover:opacity-90 transition-opacity ${isCollapsed ? 'w-11 h-11' : 'flex-1 px-4'}`}>
                        <Icon name="log-in" className="w-4 h-4" />
                        {!isCollapsed && <span>{t('signIn')}</span>}
                    </button>
                  </Tooltip>
                  <Tooltip text={t('settings')}>
                    <button onClick={onOpenSettings} className="p-3 rounded-full hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors">
                        <Icon name="settings" className="w-5 h-5" />
                    </button>
                  </Tooltip>
              </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
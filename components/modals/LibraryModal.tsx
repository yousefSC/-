import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Message, Project, TranslationKey, Language, GenerationMode, Space, ChatSession } from '../../types';
import Icon from '../Icon';
import ProjectCard from '../ui/ProjectCard';
import CustomSelect from '../ui/CustomSelect';
import { projectTemplates, SPACE_COLORS } from '../../constants';
import Tooltip from '../ui/Tooltip';


interface LibraryModalProps {
  messages: Message[];
  chatSessions: ChatSession[];
  currentChatSessionId: string | null;
  spaces: Space[];
  onClose: () => void;
  onOpenModal: (message: Message) => void;
  onForkProject: (prompt: string, type: GenerationMode) => void;
  onCreateNewProject: () => void;
  onPreviewTemplate: (template: typeof projectTemplates[0]) => void;
  onRenameProject: (projectId: string, newTitle: string) => void;
  onTogglePinProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onOpenImportProject: () => void;
  onOpenSpaceEditor: (space: Partial<Space> | null, allProjects: Project[]) => void;
  onDeleteSpace: (spaceId: string) => void;
  onOpenSpace: (space: Space) => void;
  onTogglePinSpace: (spaceId: string) => void;
  t: (key: TranslationKey) => string;
  language: Language;
  onExportProject: (project: Project) => void;
  onExportId: (project: Project, setCopiedId: (id: string | null) => void) => void;
}

const FilterButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors duration-200 ${
            isActive
                ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-black'
                : 'bg-slate-200 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 md:hover:bg-slate-300 md:dark:hover:bg-neutral-600 md:hover:text-gray-800 md:dark:hover:text-gray-100'
        }`}
    >
        {label}
    </button>
);

const TemplateCard: React.FC<{
  template: (typeof projectTemplates)[0] & { design?: string };
  onClick: () => void;
}> = ({ template, onClick }) => {
  const { design } = template;
  
  const baseClasses = "group suggestion-card w-full h-40 flex flex-col p-4 rounded-xl transition-all duration-300 ease-in-out overflow-hidden relative text-neutral-800 dark:text-white bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700/50";

  switch (design) {
    case 'portfolio':
      return (
        <button onClick={onClick} className={`${baseClasses}`}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 transition-transform group-hover:scale-[2] duration-500 ease-out"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 transition-transform group-hover:scale-[2.5] duration-500 ease-out delay-75"></div>
        </button>
      );
    case 'landing':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                 <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-purple-500/20 to-transparent transition-all duration-300 group-hover:h-full"></div>
                 <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                 <div className="absolute bottom-1/4 left-1/4 w-1 h-1 rounded-full bg-purple-300 animate-pulse" style={{animationDelay: '0.5s'}}></div>
            </button>
        );
    case 'blog':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute top-6 left-4 w-2/3 h-1 rounded-full bg-red-500/10 transition-all duration-300 group-hover:w-5/6"></div>
                <div className="absolute top-10 left-4 w-1/2 h-1 rounded-full bg-red-500/10 transition-all duration-300 delay-75 group-hover:w-2/3"></div>
                <div className="absolute top-14 left-4 w-3/4 h-1 rounded-full bg-red-500/10 transition-all duration-300 delay-150 group-hover:w-1/2"></div>
            </button>
        );
    case 'login':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 border-yellow-400/20 transition-all duration-300 group-hover:scale-150 group-hover:border-yellow-400/40"></div>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[10px] w-2 h-2 rounded-full bg-yellow-400/50 transition-all duration-300 group-hover:scale-125"></div>
            </button>
        );
    case 'survey':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute top-4 right-4 w-4 h-4 rounded-sm border-2 border-sky-500/30 transition-transform group-hover:rotate-45"></div>
                <div className="absolute top-12 right-8 w-4 h-4 rounded-full border-2 border-sky-500/30 transition-transform group-hover:scale-125"></div>
                <div className="absolute bottom-4 left-4 w-20 h-1 rounded-full bg-sky-500/10"></div>
            </button>
        );
    case 'product':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute inset-0 w-full h-full bg-[linear-gradient(to_right,#80808011_1px,transparent_1px),linear-gradient(to_bottom,#80808011_1px,transparent_1px)] bg-[size:1rem_1rem]"></div>
                <div className="absolute top-4 right-4 w-10 h-6 bg-purple-500/10 rounded-md transition-transform group-hover:-rotate-12 group-hover:scale-110"></div>
            </button>
        );
    case 'gallery':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute top-4 left-4 w-6 h-6 rounded-md bg-red-500/10 transition-transform group-hover:scale-125"></div>
                <div className="absolute top-4 right-4 w-6 h-6 rounded-md bg-red-500/10 transition-transform group-hover:scale-125 delay-75"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 rounded-md bg-red-500/10 transition-transform group-hover:scale-125 delay-150"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 rounded-md bg-red-500/10 transition-transform group-hover:scale-125 delay-200"></div>
            </button>
        );
    case 'clock':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute top-1/2 left-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-400/20"></div>
                <div className="absolute top-1/2 left-1/2 w-1 h-8 bg-indigo-400/50 rounded-full origin-bottom transition-transform duration-500 group-hover:rotate-90" style={{transformOrigin: 'bottom'}}></div>
                <div className="absolute top-1/2 left-1/2 w-1 h-5 bg-indigo-400/50 rounded-full origin-bottom transition-transform duration-500 group-hover:-rotate-45" style={{transformOrigin: 'bottom'}}></div>
            </button>
        );
    case 'todo':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute top-6 left-4 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm border-2 border-sky-500/30 group-hover:bg-sky-500/20"></div>
                    <div className="w-20 h-1 rounded-full bg-sky-500/10"></div>
                </div>
                <div className="absolute top-12 left-4 flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm border-2 border-sky-500/30"></div>
                    <div className="w-16 h-1 rounded-full bg-sky-500/10"></div>
                </div>
            </button>
        );
    case 'api':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                 <div className="absolute top-4 left-4 w-12 h-8 rounded-full bg-yellow-400/10 transition-transform group-hover:translate-x-2"></div>
                <div className="absolute bottom-4 right-4 w-12 h-8 rounded-full bg-yellow-400/10 transition-transform group-hover:-translate-x-2"></div>
                <div className="absolute top-1/2 left-1/2 w-1 h-10 -translate-x-1/2 -translate-y-1/2 bg-yellow-400/20 rotate-45"></div>
            </button>
        );
    case 'timer':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute top-1/2 left-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{background: 'conic-gradient(rgb(139,92,246,0.5) 270deg, #0000 0deg)'}}></div>
                <div className="absolute top-1/2 left-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white dark:bg-neutral-800"></div>
            </button>
        );
    case 'android-hello':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute top-1/2 left-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2 rounded-b-full rounded-t-lg bg-green-500/10 group-hover:scale-110 transition-transform"></div>
                <div className="absolute top-[38%] left-[35%] w-1.5 h-1.5 rounded-full bg-green-400/50"></div>
                <div className="absolute top-[38%] right-[35%] w-1.5 h-1.5 rounded-full bg-green-400/50"></div>
            </button>
        );
    case 'android-counter':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute top-8 left-8 text-2xl font-black text-sky-500/10 group-hover:rotate-12 transition-transform">+</div>
                <div className="absolute bottom-8 right-8 text-2xl font-black text-sky-500/10 group-hover:-rotate-12 transition-transform">-</div>
                <div className="absolute top-1/2 left-1/2 text-5xl font-black text-sky-500/20 -translate-x-1/2 -translate-y-1/2 group-hover:scale-125 transition-transform">1</div>
            </button>
        );
    case 'android-login':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute top-8 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-2 border-yellow-400/20"></div>
                <div className="absolute top-16 left-1/2 -translate-x-1/2 w-20 h-1 rounded-full bg-yellow-400/10"></div>
                <div className="absolute top-24 left-1/2 -translate-x-1/2 w-20 h-1 rounded-full bg-yellow-400/10"></div>
            </button>
        );
    case 'restaurant':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute top-4 right-4 w-10 h-1 rounded-full bg-red-500/10 transition-transform group-hover:scale-x-150"></div>
                <div className="absolute top-8 right-4 w-8 h-1 rounded-full bg-red-500/10 transition-transform delay-75 group-hover:scale-x-150"></div>
            </button>
        );
    case 'dashboard':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute top-4 left-4 w-10 h-10 bg-sky-500/10 rounded-md"></div>
                <div className="absolute top-4 right-4 w-16 h-10 bg-sky-500/10 rounded-md"></div>
                <div className="absolute bottom-4 left-4 right-4 h-12 bg-sky-500/10 rounded-md"></div>
            </button>
        );
    case 'faq':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute top-6 left-4 w-1/2 h-2 rounded-full bg-purple-500/10"></div>
                <div className="absolute top-12 left-4 w-3/4 h-2 rounded-full bg-purple-500/10"></div>
            </button>
        );
    case 'contact':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-16 border-2 border-green-500/20 rounded-lg group-hover:rotate-6 transition-transform"></div>
            </button>
        );
    case 'weather':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute top-8 left-8 w-12 h-12 rounded-full bg-yellow-400/20"></div>
                <div className="absolute top-12 left-12 w-16 h-16 rounded-full bg-sky-400/10"></div>
            </button>
        );
    case 'music-player':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute bottom-4 left-4 w-4 h-4 rounded-full bg-pink-500/20"></div>
                <div className="absolute bottom-4 left-10 w-4 h-4 rounded-full bg-pink-500/20"></div>
                <div className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-pink-500/20"></div>
            </button>
        );
    case 'error-404':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-7xl text-gray-500/10">404</div>
            </button>
        );
    case 'pricing':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute top-1/2 left-8 -translate-y-1/2 w-12 h-20 rounded-lg border-2 border-teal-500/20"></div>
                <div className="absolute top-1/2 right-8 -translate-y-1/2 w-12 h-20 rounded-lg border-2 border-teal-500/20"></div>
            </button>
        );
    case 'password':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-8 w-4 h-4 rounded-full bg-gray-500/20"></div>
                <div className="absolute top-1/2 left-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gray-500/20"></div>
                <div className="absolute top-1/2 left-1/2 -translate-y-1/2 translate-x-8 w-4 h-4 rounded-full bg-gray-500/20"></div>
            </button>
        );
    case 'calculator':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute top-6 left-6 w-16 h-8 rounded-md bg-orange-500/10"></div>
                <div className="absolute top-16 left-6 w-4 h-4 rounded-md bg-orange-500/10"></div>
                <div className="absolute top-16 left-12 w-4 h-4 rounded-md bg-orange-500/10"></div>
            </button>
        );
    case 'validator':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-1 bg-green-500/20 rotate-45"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-1 bg-green-500/20 -rotate-45 translate-x-3 -translate-y-3"></div>
            </button>
        );
    case 'modal-script':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute inset-4 rounded-lg bg-indigo-500/10"></div>
                <div className="absolute inset-8 rounded-lg bg-white dark:bg-neutral-800 border border-indigo-500/20"></div>
            </button>
        );
    case 'android-tip':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute top-10 left-10 font-bold text-4xl text-green-500/20">$</div>
                <div className="absolute bottom-10 right-10 font-bold text-2xl text-green-500/10">%</div>
            </button>
        );
    case 'android-profile':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-purple-500/10"></div>
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-20 h-2 rounded-full bg-purple-500/10"></div>
            </button>
        );
    case 'android-notes':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute bottom-6 right-6 w-8 h-8 rounded-full bg-yellow-500/20"></div>
                <div className="absolute top-6 left-6 w-px h-20 bg-yellow-500/10"></div>
            </button>
        );
    case 'android-image':
        return (
            <button onClick={onClick} className={`${baseClasses}`}>
                <div className="absolute inset-6 rounded-lg border-2 border-red-500/20"></div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-500/10"></div>
            </button>
        );
    default:
      return (
          <button onClick={onClick} className={`${baseClasses}`}>
          </button>
      );
  }
};


const LibraryModal: React.FC<LibraryModalProps> = (props) => {
  const { messages, chatSessions, currentChatSessionId, spaces, onClose, onOpenModal, onForkProject, onCreateNewProject, onPreviewTemplate, onRenameProject, onTogglePinProject, onDeleteProject, onOpenImportProject, onOpenSpaceEditor, onDeleteSpace, onOpenSpace, onTogglePinSpace, onExportProject, onExportId, t, language } = props;
  const [activeTab, setActiveTab] = useState<'projects' | 'spaces'>('projects');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState<'library' | 'templates'>('library');
  const [templateFilter, setTemplateFilter] = useState<'all' | 'HTML' | 'JavaScript' | 'Android'>('all');
  const [isNewProjectMenuOpen, setIsNewProjectMenuOpen] = useState(false);
  const newProjectMenuRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  
  const { projects, allProjectMessages } = useMemo(() => {
    // Create an up-to-date representation of all chat sessions
    const allSessions = chatSessions.map(session => 
        session.id === currentChatSessionId 
        ? { ...session, messages: messages } 
        : session
    );

    const projectList: Project[] = [];
    const messageList: Message[] = [];

    allSessions.forEach(session => {
        (session.messages || []).forEach(m => {
            if (m.isAI && (m.isCode || m.isJavaScript || m.isAndroidApp)) {
                messageList.push(m);

                let type: 'HTML' | 'JavaScript' | 'Android' = 'HTML';
                if (m.isJavaScript) type = 'JavaScript';
                if (m.isAndroidApp) type = 'Android';
                
                projectList.push({
                    id: m.id,
                    type: type,
                    prompt: m.prompt || 'Untitled Project',
                    sessionTitle: session.title,
                    sessionId: session.id,
                    timestamp: m.timestamp,
                    isPinned: m.isProjectPinned || false,
                    htmlContent: m.htmlContent,
                    text: m.text,
                    manifestContent: m.manifestContent,
                    layoutXmlContent: m.layoutXmlContent,
                    activityCodeContent: m.activityCodeContent,
                });
            }
        });
    });

    return { projects: projectList, allProjectMessages: messageList };
}, [messages, chatSessions, currentChatSessionId]);


  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects];

    if (searchTerm) {
      result = result.filter(p => p.prompt.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (filter !== 'all') {
      result = result.filter(p => p.type.toLowerCase() === filter);
    }
    
    // Default sort by newest first
    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return result;
  }, [projects, searchTerm, filter]);

  const sortedSpaces = useMemo(() => {
      return [...spaces].sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      });
  }, [spaces]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (newProjectMenuRef.current && !newProjectMenuRef.current.contains(event.target as Node)) {
        setIsNewProjectMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  const SpaceCard: React.FC<{
    space: Space;
    onOpen: () => void;
    onTogglePin: (spaceId: string) => void;
  }> = ({ space, onOpen, onTogglePin }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const colorConfig = SPACE_COLORS.find(c => c.key === space.color) || SPACE_COLORS[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsMenuOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleActionClick = (action: (id: string) => void, id: string) => {
        action(id);
        setIsMenuOpen(false);
    };

    return (
        <div
            onClick={onOpen}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onOpen(); }}
            className="relative group cursor-pointer"
        >
            <div className={`w-full h-52 rounded-xl p-4 flex flex-col justify-between text-left rtl:text-right transition-all hover:shadow-lg ${colorConfig.class} ${colorConfig.text}`}>
                <div className="flex justify-end h-5">
                    {space.isPinned && <Icon name="pin" className="w-5 h-5 opacity-70" />}
                </div>
                <div className="flex-1 flex items-center justify-center min-h-0 -mt-5">
                     <Icon name={space.icon || 'folder-kanban'} className="w-16 h-16 opacity-80" />
                </div>

                <div className="flex-shrink-0 mt-2">
                    <p className="font-bold text-sm truncate">{space.name}</p>
                    <p className="text-xs opacity-70">{space.projectIds.length} {t('projectLibrary')}</p>
                </div>
            </div>
            <div className="absolute top-2 right-2 rtl:right-auto rtl:left-2 z-20" ref={menuRef}>
                <Tooltip text={t('more')}>
                  <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(p => !p); }} className="p-1.5 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/30 transition-colors">
                      <Icon name="ellipsis" className="w-5 h-5" />
                  </button>
                </Tooltip>
                {isMenuOpen && (
                     <div className="absolute top-full mt-1 right-0 rtl:right-auto rtl:left-0 w-48 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-slate-200 dark:border-neutral-700 z-30 animate-pop-in">
                        <ul className="py-1 text-sm text-gray-700 dark:text-gray-300">
                             <li><button onClick={(e) => { e.stopPropagation(); onOpenSpaceEditor(space, projects); setIsMenuOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-start rtl:text-right hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors"><Icon name="pencil" className="w-4 h-4 text-gray-500 dark:text-gray-400" /><span>{t('editSpace')}</span></button></li>
                             <li><button onClick={(e) => { e.stopPropagation(); handleActionClick(onTogglePin, space.id); }} className="w-full flex items-center gap-3 px-3 py-2 text-start rtl:text-right hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors"><Icon name={space.isPinned ? "pin-off" : "pin"} className="w-4 h-4 text-gray-500 dark:text-gray-400" /><span>{t(space.isPinned ? 'unpin' : 'pin')}</span></button></li>
                             <li><div className="my-1 border-t border-slate-100 dark:border-neutral-700/50"></div></li>
                             <li><button onClick={(e) => { e.stopPropagation(); handleActionClick(onDeleteSpace, space.id); }} className="w-full flex items-center gap-3 px-3 py-2 text-start rtl:text-right text-red-600 dark:text-red-500 hover:!bg-red-500/10 dark:hover:!bg-red-500/10 transition-colors"><Icon name="trash-2" className="w-4 h-4 text-red-600 dark:text-red-500" /><span>{t('deleteSpace')}</span></button></li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
  };
  
  const newProjectMenuItems = (
    <ul className="text-sm font-semibold text-gray-700 dark:text-gray-200">
        <li><button onClick={() => { onCreateNewProject(); setIsNewProjectMenuOpen(false); }} className="w-full text-left rtl:text-right flex items-center gap-3 px-3 py-2 hover:bg-slate-100 dark:hover:bg-neutral-700"><Icon name="file-plus-2" className="w-4 h-4" />{t('createFromScratch')}</button></li>
        <li><button onClick={() => { setView('templates'); setIsNewProjectMenuOpen(false); }} className="w-full text-left rtl:text-right flex items-center gap-3 px-3 py-2 hover:bg-slate-100 dark:hover:bg-neutral-700"><Icon name="layout-template" className="w-4 h-4" />{t('selectFromTemplate')}</button></li>
        <li><button onClick={() => { onOpenImportProject(); setIsNewProjectMenuOpen(false); }} className="w-full text-left rtl:text-right flex items-center gap-3 px-3 py-2 hover:bg-slate-100 dark:hover:bg-neutral-700"><Icon name="upload" className="w-4 h-4" />{t('importProject')}</button></li>
    </ul>
);


  const renderLibraryView = () => (
    <>
        <div className="p-4 border-b border-slate-200 dark:border-neutral-800 flex-shrink-0">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Icon name="search" className="absolute top-1/2 -translate-y-1/2 rtl:right-4 ltr:left-4 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                    <input
                        type="text"
                        placeholder={t('searchProjects')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-neutral-800 rounded-full py-2.5 rtl:pr-10 ltr:pl-10 text-sm border border-slate-300 dark:border-neutral-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
                <div className="hidden md:flex items-center gap-2">
                    <FilterButton label={t('all')} isActive={filter === 'all'} onClick={() => setFilter('all')} />
                    <FilterButton label="HTML" isActive={filter === 'html'} onClick={() => setFilter('html')} />
                    <FilterButton label="JavaScript" isActive={filter === 'javascript'} onClick={() => setFilter('javascript')} />
                    <FilterButton label="Android" isActive={filter === 'android'} onClick={() => setFilter('android')} />
                </div>
            </div>
        </div>
        <main className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            {filteredAndSortedProjects.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                    {filteredAndSortedProjects.map(p => (
                        <ProjectCard
                            key={p.id}
                            project={p}
                            t={t}
                            onView={(proj) => onOpenModal(allProjectMessages.find(m => m.id === proj.id)!)}
                            actionTextKey="fork"
                            onAction={(proj) => onForkProject(proj.prompt, proj.type === 'HTML' ? 'code_generation' : proj.type === 'JavaScript' ? 'javascript_code_generation' : 'android_app_generation')}
                            onExport={onExportProject}
                            exportTextKey="exportProject"
                            onExportId={(proj) => onExportId(proj, setCopiedId)}
                            isIdCopied={copiedId === p.id}
                            onStartRename={() => setEditingProjectId(p.id)}
                            onSaveRename={(newTitle) => {
                                onRenameProject(p.id, newTitle);
                                setEditingProjectId(null);
                            }}
                            onCancelRename={() => setEditingProjectId(null)}
                            isEditing={editingProjectId === p.id}
                            onTogglePin={(proj) => onTogglePinProject(proj.id)}
                            onDelete={(proj) => onDeleteProject(proj.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <Icon name="folder-search" className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
                    <h3 className="font-bold text-lg text-gray-700 dark:text-gray-300">{searchTerm || filter !== 'all' ? t('noResults') : t('libraryEmpty')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{searchTerm || filter !== 'all' ? t('noResultsDesc') : t('libraryEmptyDesc')}</p>
                </div>
            )}
        </main>
    </>
  );

  const renderSpacesView = () => (
     <main className="flex-1 p-4 overflow-y-auto custom-scrollbar">
         {sortedSpaces.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {sortedSpaces.map(space => <SpaceCard key={space.id} space={space} onOpen={() => onOpenSpace(space)} onTogglePin={onTogglePinSpace} />)}
            </div>
         ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <Icon name="package-plus" className="w-16 h-16 text-gray-400 dark:text-gray-500 mb-4" />
                <h3 className="font-bold text-lg text-gray-700 dark:text-gray-300">{t('noSpacesYet')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('noSpacesYetDesc')}</p>
                 <button
                    onClick={() => onOpenSpaceEditor(null, projects)}
                    className="mt-4 px-4 py-2 flex items-center gap-2 text-sm font-semibold bg-slate-800 dark:bg-slate-200 text-white dark:text-black rounded-full hover:opacity-90 transition-opacity"
                >
                    <Icon name="plus" className="w-4 h-4" />
                    <span>{t('newSpace')}</span>
                </button>
            </div>
         )}
     </main>
  );

  const renderTemplatesView = () => {
    const filteredTemplates = projectTemplates.filter(t => templateFilter === 'all' || t.type === templateFilter);
    return (
        <main className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-2 mb-4 px-2">
                <FilterButton label={t('filterAll')} isActive={templateFilter === 'all'} onClick={() => setTemplateFilter('all')} />
                <FilterButton label={t('filterHtml')} isActive={templateFilter === 'HTML'} onClick={() => setTemplateFilter('HTML')} />
                <FilterButton label={t('filterJs')} isActive={templateFilter === 'JavaScript'} onClick={() => setTemplateFilter('JavaScript')} />
                <FilterButton label={t('filterAndroid')} isActive={templateFilter === 'Android'} onClick={() => setTemplateFilter('Android')} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 px-2">{t('templateGalleryDesc')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-6">
                {filteredTemplates.map(template => (
                    <div key={template.id} className="flex flex-col gap-2">
                        <TemplateCard
                            template={template}
                            onClick={() => onPreviewTemplate(template)}
                        />
                        <h4 className="font-semibold text-xs text-center text-gray-700 dark:text-gray-300">{t(template.titleKey)}</h4>
                    </div>
                ))}
            </div>
        </main>
    );
  }

  const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button onClick={onClick} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${isActive ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'text-gray-500'}`}>
        {label}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-slate-100 dark:bg-neutral-900 z-50 animate-fade-in">
        <div className="w-full h-full bg-slate-100 dark:bg-neutral-900 overflow-hidden flex flex-col">
            <header className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-neutral-800 flex-shrink-0">
                <div className="flex items-center gap-2 md:gap-4">
                    {view === 'templates' && activeTab === 'projects' ? (
                        <Tooltip text={t('back')}>
                          <button onClick={() => setView('library')} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors">
                              <Icon name={language === 'ar' ? 'arrow-right' : 'arrow-left'} className="w-5 h-5" />
                          </button>
                        </Tooltip>
                    ) : null}
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">{view === 'templates' ? t('templateGalleryTitle') : t('library')}</h2>
                     {view === 'library' && (
                        <div className="p-1 rounded-full bg-slate-200 dark:bg-neutral-800 flex items-center">
                            <TabButton label={t('projectLibrary')} isActive={activeTab === 'projects'} onClick={() => setActiveTab('projects')} />
                            <TabButton label={t('spaces')} isActive={activeTab === 'spaces'} onClick={() => setActiveTab('spaces')} />
                        </div>
                     )}
                </div>
                <div className="flex items-center gap-2">
                    {/* Unified Buttons */}
                    <div className="flex items-center gap-2">
                        {view === 'library' && (
                            <>
                                {activeTab === 'projects' && (
                                    <div className="relative" ref={newProjectMenuRef}>
                                        <Tooltip text={t('newProject')}>
                                          <button
                                              onClick={() => setIsNewProjectMenuOpen(p => !p)}
                                              className="flex items-center justify-center text-sm font-semibold bg-slate-800 dark:bg-slate-200 text-white dark:text-black rounded-full hover:opacity-90 transition-all duration-200 w-9 h-9 md:w-auto md:h-auto md:px-4 md:py-2 md:gap-2"
                                          >
                                              <Icon name="plus" className="w-4 h-4" />
                                              <span className="hidden md:inline">{t('newProject')}</span>
                                          </button>
                                        </Tooltip>
                                        {isNewProjectMenuOpen && (
                                            <div className="absolute top-full mt-2 right-0 rtl:right-auto rtl:left-0 w-max bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-slate-200 dark:border-neutral-700 z-10 animate-pop-in">
                                                {newProjectMenuItems}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {activeTab === 'spaces' && (
                                    <Tooltip text={t('newSpace')}>
                                      <button
                                          onClick={() => onOpenSpaceEditor(null, projects)}
                                          className="flex items-center justify-center text-sm font-semibold bg-slate-800 dark:bg-slate-200 text-white dark:text-black rounded-full hover:opacity-90 transition-all duration-200 w-9 h-9 md:w-auto md:h-auto md:px-4 md:py-2 md:gap-2"
                                      >
                                          <Icon name="plus" className="w-4 h-4" />
                                          <span className="hidden md:inline">{t('newSpace')}</span>
                                      </button>
                                    </Tooltip>
                                )}
                            </>
                        )}
                    </div>
                    <Tooltip text={t('close')}>
                      <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors">
                          <Icon name="x" className="w-5 h-5" />
                      </button>
                    </Tooltip>
                </div>
            </header>
            
            {activeTab === 'projects' && view === 'library' ? renderLibraryView() : 
             activeTab === 'projects' && view === 'templates' ? renderTemplatesView() : 
             renderSpacesView()
            }
        </div>
    </div>
  );
};

export default LibraryModal;
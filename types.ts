import type { GenerateContentResponse } from '@google/genai';

// This is a placeholder for the full GroundingMetadata type if it's complex
// and comes from the SDK. If it's simple, define it here.
// Based on usage, it seems to have `groundingChunks`.
export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}
export interface GroundingChunk {
  web: {
    uri?: string;
    title?: string;
  };
}

// Basic types
export type Language = 'ar' | 'en' | 'zh' | 'es' | 'fr' | 'hi' | 'system';
export type Theme = 'light' | 'dark' | 'system';
export type Scale = 'small' | 'medium' | 'large';
export type AiModel = 'smooth' | 'pro' | 'agent';
export type GenerationMode = 'chat' | 'code_generation' | 'javascript_code_generation' | 'android_app_generation' | 'project_generation';
export type ColorScheme = 'auto' | 'light' | 'dark';
export type EditorPreference = 'default' | 'code_duck';

// Attachment type
export interface Attachment {
  dataUrl: string;
  name: string;
  mimeType: string;
}

// Message and Chat types
export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  isAI: boolean;
  type: GenerationMode | 'chat'; // 'chat' is a valid type here
  isStreaming?: boolean;
  isError?: boolean;
  isCode?: boolean;
  isJavaScript?: boolean;
  isAndroidApp?: boolean;
  htmlContent?: string;
  manifestContent?: string;
  layoutXmlContent?: string;
  activityCodeContent?: string;
  prompt?: string;
  isContextEdit?: boolean;
  originalPrompt?: string;
  attachment?: Attachment;
  isProjectPinned?: boolean;
  isTemplatePreview?: boolean;
  isBeingEdited?: boolean;
  isStopped?: boolean;
  isStreamingProject?: boolean;
  groundingMetadata?: GroundingMetadata | null;
  webSearchUsed?: boolean;
  deepThinkingUsed?: boolean;
  reasoning?: string;
  feedbackGiven?: boolean;
  isEditing?: boolean;
  isLoading?: boolean;
  projectSnapshot?: { id: string; } & Partial<Message>;
  editSummary?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  lastModified: Date;
  isPinned: boolean;
  messages: Message[];
  isArchived?: boolean;
  reportContext?: 'message' | 'chat' | 'template';
}

// Project type
export interface Project {
  id: string;
  type: 'HTML' | 'JavaScript' | 'Android';
  prompt: string;
  sessionTitle: string;
  sessionId: string;
  timestamp: Date;
  isPinned: boolean;
  htmlContent?: string;
  text?: string;
  manifestContent?: string;
  layoutXmlContent?: string;
  activityCodeContent?: string;
  isTemplatePreview?: boolean;
  isStopped?: boolean;
  isStreamingProject?: boolean;
}

// Settings and related types
export type ErrorHandling = 'throw' | 'try_catch' | 'return_null' | 'none';

export interface MemoryItem {
  id: string;
  content: string;
}

export type SimulationDevice = 'none' | 'smartphone' | 'tablet' | 'laptop' | 'desktop';

export interface Settings {
  language: Language;
  theme: Theme;
  scale: Scale;
  model: AiModel;
  userName: string;
  userInfo: string;
  aiStyle: string;
  aiExplanation: string;
  projectCreationResponse: 'respond_then_create' | 'create_immediately';
  codeTarget: 'web' | 'android' | 'ios' | 'backend';
  commentStyle: 'brief' | 'detailed' | 'none';
  variableCasing: 'camelCase' | 'snake_case' | 'PascalCase' | 'none';
  functionCasing: 'camelCase' | 'snake_case' | 'PascalCase' | 'none';
  cssPreference: 'tailwind' | 'scss' | 'css_in_js' | 'inline' | 'none';
  apiStyle: 'rest' | 'graphql' | 'none';
  errorHandling: ErrorHandling;
  techStack: string;
  aiPreferences: string;
  useWebSearch: boolean;
  autoFixCode: boolean;
  useDeepThinking: boolean;
  useMemory: boolean;
  memoryItems: MemoryItem[];
  simulationDevice: SimulationDevice;
  previewColorScheme: ColorScheme;
  previewDisableJavascript: boolean;
  previewDisableCss: boolean;
  previewCustomCss: string;
  hapticFeedback: boolean;
  projectTemperature: number;
  labEnableAutocomplete: boolean;
  shortcuts: Shortcut[];
  editorPreference: EditorPreference;
}

// Modal State
export interface ModalState {
  html: Project | null;
  js: Project | null;
  android: Project | null;
  library: boolean;
  settings: boolean;
  confirmation: {
    title?: string;
    message: string;
    icon?: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    onConfirm: () => void;
    confirmButtonVariant?: 'primary' | 'destructive';
  } | null;
  camera: boolean;
  mediaAttachment: boolean;
  aiToolsSheet: boolean;
  imageViewer: string | null;
  imageEditor: { dataUrl: string; name: string } | null;
  subscription: boolean;
  sources: Message | null;
  thinking: Message | null;
  importProject: boolean;
  auth: boolean;
  spaceEditor: { space: Partial<Space> | null, allProjects: Project[] } | null;
  spaceView: Space | null;
  pinLock: User | null;
  notificationsPanel: boolean;
  notificationsFullscreen: boolean;
  reportSession: ChatSession | null;
  search: boolean;
  streamingProject: Project | null;
  exportChat: ChatSession | null;
  profileEditor: User | null;
}

// User and Auth
export interface User {
  id: string;
  email: string;
  password?: string; // Should be hashed in a real app
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  isPinEnabled?: boolean;
  pin?: string;
  lastReadTimestamps?: {
    news: number;
    updates: number;
    messages: number;
  };
}

// Spaces
export interface Space {
  id: string;
  name: string;
  projectIds: string[];
  createdAt: Date;
  lastModified: Date;
  isPinned?: boolean;
  icon?: string;
  color?: string;
}

// Notifications
export type NotificationType = 'news' | 'updates' | 'messages';
export type SettingsTab = 'general' | 'personal' | 'ai' | 'preview' | 'subscription' | 'account' | 'data' | 'lab' | 'help' | 'about' | 'shortcuts';

export type NotificationTarget = 
  | { type: 'none' }
  | { type: 'library' }
  | { type: 'settings', tab: SettingsTab }
  | { type: 'subscription' }
  | { type: 'new_chat' }
  | { type: 'url', url: string };

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  content?: string;
  createdAt: number;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  target?: NotificationTarget;
}

export interface Notifications {
  news: NotificationItem[];
  updates: NotificationItem[];
  messages: NotificationItem[];
}

// For Community Chat in settings
export interface CommunityMessage {
    id: string;
    sender: { name: string; email: string };
    text: string;
    timestamp: number;
}

// For code inspection
export interface InspectionIssue {
  line: number;
  type: 'error' | 'warning' | 'suggestion';
  message: string;
}

// For console logs in preview
export interface ConsoleLog {
  type: 'log' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

// Shortcuts
export type ShortcutAction =
    | 'newChat' | 'stopGeneration' | 'openSearch' | 'openLibrary' | 'openSettings'
    | 'toggleSidebar' | 'toggleTheme' | 'copyLastMessage' | 'regenerateLastResponse'
    | 'focusInput' | 'openSubscription' | 'clearChat' | 'pinChat' | 'archiveChat'
    | 'openAiTools' | 'openMediaAttachments' | 'nextChat' | 'previousChat'
    | 'increaseTextScale' | 'decreaseTextScale' | 'resetTextScale';

export interface Shortcut {
  id: string;
  keys: string;
  action: ShortcutAction;
  isEditable: boolean;
  isDeletable: boolean;
}

// Translations
export type TranslationKey = string;
export type Translation = Record<TranslationKey, string>;
export type Translations = Record<Language, Translation>;
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GenerationMode, Project, TranslationKey, Settings, AiModel, ModalState, Language, Theme, Attachment, Message } from '../types';
import Icon from './Icon';
import FileAttachment from './ui/FileAttachment';
import Tooltip from './ui/Tooltip';


interface InputAreaProps {
  isLoading: boolean;
  onSendMessage: (text: string, attachment?: Attachment) => void;
  onStopGeneration: () => void;
  currentGenerationMode: GenerationMode;
  setCurrentGenerationMode: (mode: GenerationMode) => void;
  currentProjectContext: Project | null;
  clearProjectContext: () => void;
  t: (key: TranslationKey) => string;
  language: Language;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  onOpenModal: (type: keyof ModalState, data?: any) => void;
  capturedAttachment: Attachment | null;
  clearCapturedAttachment: () => void;
  isContextLocked?: boolean;
  effectiveTheme: Theme;
  onDrawRequest?: () => void;
  editingMessage: { id: string; text: string } | null;
  onConfirmEdit: (newText: string) => void;
  onCancelEdit: () => void;
  hideAttachmentButton?: boolean;
  isDrawingMode?: boolean;
  onCancelDrawing?: () => void;
  onHeightChange?: (height: number) => void;
  selectionPrompt: string | null;
  onSelectionPromptHandled: () => void;
}

const FullWidthSoundWaveVisualizer: React.FC<{ volume: number, isPaused: boolean }> = ({ volume, isPaused }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [numBars, setNumBars] = useState(0);

    useEffect(() => {
        const calculateBars = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                const barWidth = 3 + 4; // width (3px) + gap (4px from gap-1)
                setNumBars(Math.floor(containerWidth / barWidth));
            }
        };
        const currentRef = containerRef.current;
        if (!currentRef) return;
        const resizeObserver = new ResizeObserver(calculateBars);
        resizeObserver.observe(currentRef);
        calculateBars();
        return () => resizeObserver.unobserve(currentRef);
    }, []);
    
    const pseudoRandom = (seed: number) => {
        let x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };

    return (
        <div ref={containerRef} className="absolute inset-0 flex items-center justify-center gap-1 overflow-hidden">
            {Array.from({ length: numBars }).map((_, i) => {
                const baseHeight = isPaused ? 0.05 : Math.max(0.05, Math.min(1, volume / 80));
                const variation = (pseudoRandom(i) * 0.3) + 0.7; // Reduced variation
                const barHeight = baseHeight * variation;
                
                return (
                    <div
                        key={i}
                        className="w-[3px] rounded-full bg-gray-500 dark:bg-gray-400 opacity-60"
                        style={{
                            height: '50%', // Made smaller
                            transform: `scaleY(${barHeight})`,
                            transition: 'transform 0.08s ease-out',
                        }}
                    />
                );
            })}
        </div>
    );
};


const InputArea: React.FC<InputAreaProps> = ({
  isLoading,
  onSendMessage,
  onStopGeneration,
  currentGenerationMode,
  setCurrentGenerationMode,
  currentProjectContext,
  clearProjectContext,
  t,
  language,
  settings,
  setSettings,
  onOpenModal,
  capturedAttachment,
  clearCapturedAttachment,
  isContextLocked,
  effectiveTheme,
  onDrawRequest,
  editingMessage,
  onConfirmEdit,
  onCancelEdit,
  hideAttachmentButton = false,
  isDrawingMode,
  onCancelDrawing,
  onHeightChange,
  selectionPrompt,
  onSelectionPromptHandled,
}) => {
  const [text, setText] = useState('');
  const [media, setMedia] = useState<Attachment | null>(null);
  
  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [volume, setVolume] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const recognitionActiveRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isRecordingRef = useRef(isRecording);
  const isPausedRef = useRef(isPaused);
  useEffect(() => {
    isRecordingRef.current = isRecording;
    isPausedRef.current = isPaused;
  }, [isRecording, isPaused]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || !onHeightChange) return;

    const observer = new ResizeObserver(() => {
        onHeightChange(element.offsetHeight);
    });
    observer.observe(element);

    onHeightChange(element.offsetHeight);

    return () => observer.disconnect();
  }, [onHeightChange]);

  useEffect(() => {
    if (editingMessage) {
        setText(editingMessage.text);
        textareaRef.current?.focus();
    } else {
        setText('');
    }
  }, [editingMessage]);

  useEffect(() => {
      if (selectionPrompt) {
        setText(selectionPrompt);
        textareaRef.current?.focus();
        onSelectionPromptHandled();
      }
  }, [selectionPrompt, onSelectionPromptHandled]);

  useEffect(() => {
    if (capturedAttachment) {
        setMedia(capturedAttachment);
    } else {
        setMedia(null);
    }
  }, [capturedAttachment]);

  const cleanupRecording = useCallback(() => {
    if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (recognitionRef.current && recognitionActiveRef.current) {
        recognitionRef.current.stop();
    }
    animationFrameIdRef.current = null;
    audioContextRef.current = null;
    streamRef.current = null;
    setIsRecording(false);
    setIsPaused(false);
    setVolume(0);
  }, []);
  
  // Setup Speech Recognition
  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
        console.warn("Speech recognition not supported by this browser.");
        return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
        recognitionActiveRef.current = true;
    };

    recognition.onresult = (event: any) => {
        let final_transcript = '';
        let interim_transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
             if (event.results[i].isFinal) {
                final_transcript += event.results[i][0].transcript;
            } else {
                interim_transcript += event.results[i][0].transcript;
            }
        }
         if (final_transcript) {
           setTranscript(prev => (prev ? `${prev} ${final_transcript}` : final_transcript).trim());
        } else if (interim_transcript) {
            // Optional: show interim results for better feedback
            // setTranscript(prev => (prev.split(' ').slice(0, -1).join(' ') + ' ' + interim_transcript).trim());
        }
    };

    recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        // Let the 'onend' event handle the cleanup and restart logic
    };

    recognition.onend = () => {
        recognitionActiveRef.current = false;
        if (isRecordingRef.current && !isPausedRef.current) {
            try {
                recognitionRef.current?.start();
            } catch (err) {
                console.error("Recognition restart failed after onend:", err);
                cleanupRecording();
            }
        }
    };
    
    return cleanupRecording;
  }, [cleanupRecording]);

  const handleStartRecording = async () => {
    if (isRecording || recognitionActiveRef.current || !recognitionRef.current) return;
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        
        analyser.fftSize = 32;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const visualizerLoop = () => {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((acc, val) => acc + val, 0) / bufferLength;
            setVolume(average);
            animationFrameIdRef.current = requestAnimationFrame(visualizerLoop);
        };
        visualizerLoop();

        setTranscript('');
        setIsPaused(false);
        setIsRecording(true);
        recognitionRef.current.lang = language === 'ar' ? 'ar-SA' : 'en-US';
        recognitionRef.current.start();

    } catch(err) {
        console.error("Failed to start recording:", err);
        cleanupRecording();
    }
  };

  const handlePauseToggle = () => {
    if (!recognitionRef.current) return;
    const willBePaused = !isPaused;
    setIsPaused(willBePaused);
    if (willBePaused) {
      if (recognitionActiveRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      if (!recognitionActiveRef.current) {
        recognitionRef.current.start();
      }
    }
  };

  const handleCancelRecording = () => {
    cleanupRecording();
    setTranscript('');
  };

  const handleConfirmRecording = () => {
    const finalTranscript = transcript;
    cleanupRecording();
    setText(prev => (prev ? `${prev} ${finalTranscript}` : finalTranscript).trim());
    setTranscript('');
  };


  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  };

  useEffect(autoResizeTextarea, [text]);

  useEffect(() => {
    if (currentGenerationMode === 'project_generation' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [currentGenerationMode]);
  
  const handleSend = () => {
    if (!isLoading && (text.trim().length > 0 || media)) {
      if (editingMessage) {
        onConfirmEdit(text);
      } else {
        onSendMessage(text, media || undefined);
      }
      setText('');
      setMedia(null);
      clearCapturedAttachment();
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleToggleProjectMode = () => {
      const newMode = currentGenerationMode === 'project_generation' ? 'chat' : 'project_generation';
      setCurrentGenerationMode(newMode);
      if (newMode === 'project_generation') {
        clearProjectContext();
      }
  };

  const getProjectIcon = () => {
    if (!currentProjectContext) return 'file-code';
    switch (currentProjectContext.type) {
      case 'HTML': return 'code-xml';
      case 'JavaScript': return 'zap';
      case 'Android': return 'smartphone';
      default: return 'file-code';
    }
  };
  
  if (isDrawingMode) {
    return (
        <div className="flex-shrink-0 w-full p-3">
            <div className={`grid w-full p-2 rounded-3xl shadow-lg bg-white dark:bg-neutral-800`}>
                <div className="[grid-area:1/1] transition-all duration-300 ease-in-out flex flex-col w-full justify-center items-center py-2 min-h-[104px]">
                    <button
                        onClick={onCancelDrawing}
                        className="px-5 py-2 text-sm font-semibold bg-slate-200 dark:bg-neutral-700 text-gray-800 dark:text-gray-200 rounded-full shadow-md hover:bg-slate-300 dark:hover:bg-neutral-600 transition-colors flex items-center gap-2"
                    >
                        <Icon name="x" className="w-4 h-4" />
                        {t('cancelDrawing')}
                    </button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-shrink-0 w-full p-3">
        <div className={`grid w-full p-2 rounded-3xl shadow-lg bg-white dark:bg-neutral-800`}>
            {/* Standard Input View */}
            <div className={`[grid-area:1/1] transition-all duration-300 ease-in-out flex flex-col ${isRecording ? 'opacity-0 scale-95 -translate-y-2 pointer-events-none' : 'opacity-100 scale-100 translate-y-0'}`}>
                <div className="w-full">
                    {currentProjectContext && !isContextLocked && (
                        <div className="px-2 pt-1 pb-2 animate-fade-in">
                            <div className="flex items-center gap-2 overflow-hidden bg-blue-100 dark:bg-blue-900/40 px-3 py-1.5 rounded-full text-xs">
                                <Icon name={getProjectIcon()} className="w-4 h-4 text-blue-500 dark:text-blue-300 flex-shrink-0" />
                                <p className="font-semibold text-blue-600 dark:text-blue-300 truncate flex-1">
                                    {t('editing_project_in_context')}: <span className="font-medium text-gray-700 dark:text-gray-300">{currentProjectContext.prompt}</span>
                                </p>
                                <Tooltip text={t('clear_context')}>
                                  <button onClick={clearProjectContext} className="p-1 rounded-full text-gray-500 md:hover:bg-red-500/20 md:hover:text-red-500 transition-colors duration-200 flex-shrink-0">
                                      <Icon name="x" className="w-4 h-4" />
                                  </button>
                                </Tooltip>
                            </div>
                        </div>
                    )}
                    <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    className="w-full p-2 bg-transparent focus:outline-none resize-none text-sm max-h-[250px] custom-scrollbar text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder={currentProjectContext && !isContextLocked ? t('describeChanges') : t('askAboutCoding')}
                    disabled={isLoading}
                    />
                    {media && !editingMessage && (
                      <div className="p-2">
                        <div
                          className="inline-block cursor-pointer"
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                              if (media.mimeType.startsWith('image/')) {
                                  onOpenModal('imageEditor', { dataUrl: media.dataUrl, name: media.name });
                              }
                          }}
                          onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                  if (media.mimeType.startsWith('image/')) {
                                      onOpenModal('imageEditor', { dataUrl: media.dataUrl, name: media.name });
                                  }
                              }
                          }}
                        >
                          <FileAttachment
                              dataUrl={media.dataUrl}
                              name={media.name}
                              mimeType={media.mimeType}
                              onClear={() => { setMedia(null); clearCapturedAttachment(); }}
                          />
                        </div>
                      </div>
                    )}
                </div>
                <div className="flex items-center justify-between w-full mt-2">
                    <div className="flex items-center gap-1">
                        {!hideAttachmentButton && (
                            <Tooltip text={t('attachMedia')}>
                              <button onClick={() => onOpenModal('mediaAttachment')} className="flex items-center justify-center w-11 h-11 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 text-gray-700 dark:text-gray-300 md:hover:bg-slate-200 md:dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading || !!editingMessage}>
                                  <Icon name="plus" />
                              </button>
                            </Tooltip>
                        )}

                        <Tooltip text={t('createProject')}>
                          <button 
                              onClick={handleToggleProjectMode} 
                              disabled={isLoading || isContextLocked || !!editingMessage}
                              className={`transition-all duration-300 flex items-center justify-center w-11 h-11 rounded-full focus:outline-none flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${isContextLocked || currentGenerationMode === 'project_generation' ? 'bg-slate-900 text-white dark:bg-white dark:text-black scale-105' : 'text-gray-700 dark:text-gray-300 md:hover:bg-slate-200 md:dark:hover:bg-neutral-700'}`}
                          >
                              <Icon name="drafting-compass" className="w-5 h-5" />
                          </button>
                        </Tooltip>
                        
                        <Tooltip text={t('aiTools')}>
                          <button
                              onClick={() => onOpenModal('aiToolsSheet')}
                              disabled={isLoading || !!editingMessage}
                              className="transition-all duration-300 flex items-center justify-center w-11 h-11 rounded-full focus:outline-none flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 md:hover:bg-slate-200 md:dark:hover:bg-neutral-700"
                          >
                              <Icon name="sliders-horizontal" className="w-5 h-5" />
                          </button>
                        </Tooltip>
                    </div>
                    <div className="flex items-center gap-1">
                        {(() => {
                            if (isLoading && !isRecording) {
                                return (
                                    <Tooltip text={t('stopResponse')}>
                                      <button
                                          onClick={onStopGeneration}
                                          className="font-bold w-11 h-11 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 focus:outline-none flex items-center justify-center flex-shrink-0 bg-slate-200 dark:bg-neutral-700 text-gray-800 dark:text-gray-200 hover:bg-slate-300 dark:hover:bg-neutral-600"
                                      >
                                          <Icon name="square" className="w-5 h-5" />
                                      </button>
                                    </Tooltip>
                                );
                            }

                            if (editingMessage) {
                                return (
                                    <div className="flex items-center gap-1">
                                        <Tooltip text={t('cancel')}>
                                          <button onClick={onCancelEdit} className="flex items-center justify-center w-11 h-11 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 bg-slate-200 dark:bg-neutral-700 text-gray-800 dark:text-gray-200 md:hover:bg-slate-300 md:dark:hover:bg-neutral-600">
                                              <Icon name="x" />
                                          </button>
                                        </Tooltip>
                                        <Tooltip text={t('save')}>
                                          <button onClick={handleSend} className="flex items-center justify-center w-11 h-11 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 bg-slate-800 text-white dark:bg-slate-200 dark:text-black hover:bg-slate-700 dark:hover:bg-slate-300">
                                              <Icon name="check" />
                                          </button>
                                        </Tooltip>
                                    </div>
                                );
                            }

                            const hasContent = text.trim().length > 0 || media;

                            return (
                                <>
                                    {/* Small Mic Button (appears with content) */}
                                    <Tooltip text={t('speak')}>
                                      <button
                                          onClick={handleStartRecording}
                                          disabled={isLoading}
                                          className={`flex items-center justify-center h-11 rounded-full transition-all duration-200 ease-out focus:outline-none flex-shrink-0 text-gray-700 dark:text-gray-300 md:hover:bg-slate-200 md:dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed
                                          ${hasContent ? 'w-11 opacity-100' : 'w-0 opacity-0'}`}
                                          style={{ transform: hasContent ? 'scale(1)' : 'scale(0.7)' }}
                                      >
                                          <Icon name="mic" className="w-5 h-5" />
                                      </button>
                                    </Tooltip>
                            
                                    {/* Container for Send/Big Mic buttons */}
                                    <div className="relative w-11 h-11">
                                        {/* Send Button */}
                                        <button
                                            onClick={handleSend}
                                            disabled={isLoading}
                                            className={`font-bold w-11 h-11 rounded-full transition-all duration-300 ease-in-out transform focus:outline-none flex items-center justify-center flex-shrink-0 bg-slate-800 text-white dark:bg-slate-200 dark:text-black md:hover:bg-slate-700 md:dark:hover:bg-slate-300 absolute inset-0
                                            ${hasContent ? 'opacity-100 scale-100 hover:scale-105 active:scale-95' : 'opacity-0 scale-50 pointer-events-none'}`}
                                        >
                                            <Icon key="send" name="arrow-up" className="w-5 h-5" />
                                        </button>
                            
                                        {/* Big Mic Button */}
                                        <Tooltip text={t('speak')}>
                                          <button
                                              onClick={handleStartRecording}
                                              disabled={isLoading}
                                              className={`font-bold w-11 h-11 rounded-full transition-all duration-300 ease-in-out transform focus:outline-none flex items-center justify-center flex-shrink-0 bg-slate-800 text-white dark:bg-slate-200 dark:text-black md:hover:bg-slate-700 md:dark:hover:bg-slate-300 absolute inset-0
                                              ${!hasContent ? 'opacity-100 scale-100 hover:scale-105 active:scale-95' : 'opacity-0 scale-50 pointer-events-none'}`}
                                          >
                                              <Icon key="mic" name="mic" className="w-5 h-5" />
                                          </button>
                                        </Tooltip>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>
            {/* Recording View */}
            <div className={`[grid-area:1/1] transition-all duration-300 ease-in-out flex flex-col w-full gap-2 ${isRecording ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
                 <div className="w-full text-center px-4 min-h-[24px] text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words font-semibold">
                    {transcript || (isPaused ? <span className="text-gray-500 dark:text-gray-400 font-medium">{t('recordingPaused')}</span> : <span>&nbsp;</span>)}
                 </div>
                 <div className="flex items-center w-full gap-2">
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <Tooltip text={t('cancel')}>
                           <button onClick={handleCancelRecording} className="flex items-center justify-center w-11 h-11 rounded-full transition-colors duration-200 focus:outline-none bg-slate-200 dark:bg-neutral-700 text-red-600 dark:text-red-400 md:hover:bg-slate-300 md:dark:hover:bg-neutral-600">
                              <Icon name="x" className="w-5 h-5" />
                          </button>
                        </Tooltip>
                        <Tooltip text={isPaused ? t('resumeRecording') : t('pauseRecording')}>
                           <button onClick={handlePauseToggle} className="flex items-center justify-center w-11 h-11 rounded-full transition-colors duration-200 focus:outline-none bg-slate-200 dark:bg-neutral-700 text-gray-800 dark:text-gray-200 md:hover:bg-slate-300 md:dark:hover:bg-neutral-600">
                              <Icon name={isPaused ? 'mic' : 'pause'} className="w-5 h-5" />
                          </button>
                        </Tooltip>
                    </div>

                    <div className="flex-1 flex items-center justify-center bg-slate-100 dark:bg-neutral-700/50 rounded-3xl min-h-[44px] relative overflow-hidden">
                        <FullWidthSoundWaveVisualizer volume={volume} isPaused={isPaused} />
                    </div>
                    
                    <Tooltip text={t('confirm')}>
                      <button onClick={handleConfirmRecording} disabled={!transcript} className="flex items-center justify-center w-11 h-11 rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0 bg-slate-800 text-white dark:bg-slate-200 dark:text-black hover:bg-slate-700 dark:hover:bg-slate-300 disabled:opacity-50">
                          <Icon name="check" className="w-5 h-5" />
                      </button>
                    </Tooltip>
                 </div>
            </div>
        </div>
    </div>
  );
};

export default InputArea;
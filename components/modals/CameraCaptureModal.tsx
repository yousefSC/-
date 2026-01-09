import React, { useState, useRef, useEffect, useCallback } from 'react';
import Icon from '../Icon';
import { TranslationKey } from '../../types';
import Tooltip from '../ui/Tooltip';

interface CameraCaptureModalProps {
  onClose: () => void;
  onCapture: (dataUrl: string, name: string) => void;
  t: (key: TranslationKey) => string;
  isDesktop: boolean;
}

const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ onClose, onCapture, t, isDesktop }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>();
  const [isDeviceListOpen, setIsDeviceListOpen] = useState(false);

  // Enumerate devices on mount
  useEffect(() => {
    const getDevices = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ video: true }); // Request permission first
            const allDevices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
            setDevices(videoDevices);
            if (videoDevices.length > 0) {
                // Set default camera
                setSelectedDeviceId(videoDevices[0].deviceId);
            }
        } catch (err) {
            console.error("Error enumerating devices:", err);
            setError(t('cameraAccessDenied'));
        }
    };
    getDevices();
  }, [t]);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    
    const currentStream = stream;
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    const openCamera = async () => {
      setIsLoading(true);
      setError(null);
      setTorchSupported(false);
      setTorchOn(false);

      if (!isDesktop && devices.length === 0) {
        // Pre-populate for mobile flip camera logic
        setDevices([{ deviceId: 'user', kind: 'videoinput', label: 'Front' } as MediaDeviceInfo, { deviceId: 'environment', kind: 'videoinput', label: 'Back' } as MediaDeviceInfo]);
      }
      
      const constraints: MediaStreamConstraints = {
          video: isDesktop 
              ? (selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true)
              : { facingMode }
      };

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("Camera API not supported.");
        }
        activeStream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(activeStream);
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
        }

        // Delay capability check slightly to ensure track is ready
        setTimeout(() => {
            if (!activeStream) return;
            const videoTrack = activeStream.getVideoTracks()[0];
            if (videoTrack) {
                try {
                    const capabilities = videoTrack.getCapabilities();
                    if ('torch' in capabilities) {
                        setTorchSupported(true);
                    }
                } catch(e) {
                    console.warn("Could not get track capabilities:", e);
                }
            }
        }, 200);

      } catch (err) {
        console.error("Error accessing camera: ", err);
        setError(t('cameraAccessDenied'));
      } finally {
        setIsLoading(false);
      }
    };

    // Only run if we have a device selected (for desktop) or on mobile
    if ((isDesktop && selectedDeviceId) || !isDesktop) {
        openCamera();
    }


    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode, selectedDeviceId, isDesktop, t]);

  const handleCapture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');

      const isFrontCamera = isDesktop 
        ? devices.find(d => d.deviceId === selectedDeviceId)?.label.toLowerCase().includes('face')
        : facingMode === 'user';
        
      if (context) {
        // Mirror the image for front-facing camera
        if (isFrontCamera) {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onCapture(dataUrl, `capture_${Date.now()}.jpg`);
      }
    }
  }, [facingMode, onCapture, isDesktop, devices, selectedDeviceId]);

  const handleFlipCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  const handleToggleTorch = useCallback(() => {
    if (!stream || !torchSupported) return;
    const videoTrack = stream.getVideoTracks()[0];
    const newTorchState = !torchOn;
    videoTrack.applyConstraints({
        advanced: [{ torch: newTorchState }]
    } as any).then(() => {
        setTorchOn(newTorchState);
    }).catch(e => {
        console.error("Failed to toggle torch", e);
    });
  }, [stream, torchSupported, torchOn]);

  const handleSelectDevice = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setIsDeviceListOpen(false);
  }

  const videoScaleX = isDesktop 
      ? (devices.find(d => d.deviceId === selectedDeviceId)?.label.toLowerCase().includes('face') ? '-scale-x-100' : '')
      : (facingMode === 'user' ? '-scale-x-100' : '');

  // DESKTOP VIEW
  if (isDesktop) {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div 
              className="shadow-2xl rounded-2xl max-w-3xl w-full bg-slate-100 dark:bg-neutral-900 flex flex-col max-h-[90vh] animate-pop-in" 
              onClick={(e) => e.stopPropagation()}
            >
                <header className="p-3 flex justify-between items-center border-b border-slate-200 dark:border-neutral-800 flex-shrink-0 z-10">
                    <h3 className="font-bold text-gray-800 dark:text-gray-200">{t('captureImage')}</h3>
                    <Tooltip text={t('close')}>
                      <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-neutral-700">
                          <Icon name="x" className="w-5 h-5" />
                      </button>
                    </Tooltip>
                </header>

                <main className="flex-1 flex flex-col p-4 bg-black/10 dark:bg-black/20 min-h-0">
                    <div className="relative w-full flex-1 rounded-lg overflow-hidden">
                        {isLoading && <div className="absolute inset-0 flex items-center justify-center"><div className="w-12 h-12 border-4 border-gray-400 border-t-gray-800 dark:border-t-gray-200 rounded-full animate-spin"></div></div>}
                        {error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-slate-200 dark:bg-neutral-800 rounded-lg">
                                <Icon name="video-off" className="w-12 h-12 mx-auto mb-3 text-red-500" />
                                <h3 className="font-semibold text-gray-700 dark:text-gray-200">{t('errorOccurred')}</h3>
                                <p className="text-xs text-gray-500 mt-1">{error}</p>
                            </div>
                        )}
                         <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-contain transform ${videoScaleX} ${isLoading || error ? 'hidden' : 'block'}`}
                        />
                    </div>
                </main>

                <footer className="p-3 border-t border-slate-200 dark:border-neutral-800 flex justify-between items-center flex-shrink-0 z-10">
                    <div className="flex-1 flex justify-start">
                         {devices.length > 1 && (
                            <div className="relative">
                                <Tooltip text={t('selectCamera')}>
                                <button
                                    onClick={() => setIsDeviceListOpen(p => !p)}
                                    className="w-10 h-10 rounded-full text-gray-700 dark:text-gray-200 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
                                >
                                    <Icon name="camera" className="w-5 h-5" />
                                </button>
                                </Tooltip>
                                {isDeviceListOpen && (
                                    <div className="absolute bottom-full mb-2 w-max max-w-xs bg-white dark:bg-neutral-800 shadow-lg border border-slate-200 dark:border-neutral-700 rounded-lg p-1 animate-pop-in">
                                        <ul className="text-gray-800 dark:text-gray-200 text-sm">
                                            {devices.map(device => (
                                                <li key={device.deviceId}>
                                                    <button
                                                        onClick={() => handleSelectDevice(device.deviceId)}
                                                        className={`w-full text-left rtl:text-right px-3 py-2 rounded-md hover:bg-slate-100 dark:hover:bg-neutral-700 ${selectedDeviceId === device.deviceId ? 'font-bold' : ''}`}
                                                    >
                                                        {device.label || `Camera ${devices.indexOf(device) + 1}`}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                         )}
                    </div>
                    <div className="flex-1 flex justify-center">
                         <Tooltip text={t('captureImage')}>
                            <button
                                onClick={handleCapture}
                                disabled={!stream || !!error || isLoading}
                                className="w-16 h-16 p-1 bg-transparent rounded-full disabled:opacity-50 focus:outline-none ring-4 ring-gray-300 dark:ring-neutral-600 active:ring-gray-400 dark:active:ring-neutral-500 transition"
                            >
                                <div className="w-full h-full bg-slate-200 dark:bg-neutral-700 rounded-full"></div>
                            </button>
                        </Tooltip>
                    </div>
                    <div className="flex-1 flex justify-end">
                        <Tooltip text={t('toggleFlash')}>
                            <button
                                onClick={handleToggleTorch}
                                disabled={!torchSupported}
                                className="w-10 h-10 rounded-full text-gray-700 dark:text-gray-200 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
                            >
                                <Icon name={torchOn ? 'zap' : 'zap-off'} className="w-5 h-5" />
                            </button>
                        </Tooltip>
                    </div>
                </footer>
            </div>
            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
    );
  }

  // MOBILE VIEW (Fullscreen)
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col animate-fade-in" role="dialog" aria-modal="true">
        <main className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
            {isLoading && <div className="w-12 h-12 border-4 border-gray-600 border-t-white rounded-full animate-spin"></div>}
            {error && (
                <div className="text-center p-4 text-white">
                    <Icon name="video-off" className="w-16 h-16 mx-auto mb-4 text-red-500" />
                    <h3 className="font-bold text-lg mb-2">{t('errorOccurred')}</h3>
                    <p className="text-sm text-gray-300">{error}</p>
                </div>
            )}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform ${videoScaleX} ${isLoading || error ? 'hidden' : 'block'}`}
            />

            {/* Controls Overlay */}
            {!isLoading && !error && (
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {/* Top Control: Close button */}
                    <div className="flex justify-end p-4 bg-gradient-to-b from-black/50 to-transparent pointer-events-auto">
                        <Tooltip text={t('close')}>
                          <button onClick={onClose} className="p-2 rounded-full bg-black/40 text-white backdrop-blur-sm md:hover:bg-black/60 transition-colors">
                              <Icon name="x" className="w-6 h-6" />
                          </button>
                        </Tooltip>
                    </div>
                    
                    {/* Bottom Controls */}
                    <div className="relative flex justify-center items-center p-6 bg-gradient-to-t from-black/50 to-transparent pointer-events-auto">
                        <div className="flex justify-around items-center w-full max-w-sm bg-black/30 backdrop-blur-md rounded-full p-2">
                            <Tooltip text={t('toggleFlash')}>
                               <button
                                  onClick={handleToggleTorch}
                                  disabled={!torchSupported}
                                  className="w-12 h-12 rounded-full text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                              >
                                  <Icon name={torchOn ? 'zap' : 'zap-off'} className="w-6 h-6" />
                              </button>
                            </Tooltip>

                            <Tooltip text={t('captureImage')}>
                              <button
                                  onClick={handleCapture}
                                  disabled={!stream || !!error}
                                  className="w-16 h-16 p-1 bg-transparent rounded-full disabled:opacity-50 focus:outline-none ring-4 ring-white/30 active:ring-white/80 transition"
                              >
                                  <div className="w-full h-full bg-white rounded-full"></div>
                              </button>
                            </Tooltip>
                            
                             <Tooltip text={t('flipCamera')}>
                                <button
                                    onClick={handleFlipCamera}
                                    className="w-12 h-12 rounded-full text-white flex items-center justify-center hover:bg-white/10 transition-colors"
                                >
                                    <Icon name="refresh-cw" className="w-6 h-6" />
                                </button>
                            </Tooltip>
                        </div>
                    </div>
                </div>
            )}
        </main>
        <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
};

export default CameraCaptureModal;
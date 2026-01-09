import React, { useState, useRef, useEffect, useCallback } from 'react';
import Icon from '../Icon';
import { TranslationKey } from '../../types';

interface CustomVideoPlayerProps {
  src: string;
  t: (key: TranslationKey) => string;
}

const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({ src, t }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [areControlsVisible, setAreControlsVisible] = useState(true);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => {
      if (!video.duration) return;
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
    };
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleVolumeChange = () => {
      setIsMuted(video.muted);
      setVolume(video.volume);
    };
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const hideControls = useCallback(() => {
    if (videoRef.current?.paused) return;
    setAreControlsVisible(false);
  }, []);
  
  const showControls = useCallback(() => {
    setAreControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(hideControls, 3000);
  }, [hideControls]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('mouseenter', showControls);
    container.addEventListener('mousemove', showControls);
    container.addEventListener('mouseleave', () => {
       if (videoRef.current?.paused) return;
       setAreControlsVisible(false);
    });

    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (container) {
        container.removeEventListener('mouseenter', showControls);
        container.removeEventListener('mousemove', showControls);
        container.removeEventListener('mouseleave', () => setAreControlsVisible(false));
      }
    };
  }, [showControls]);

  // Player control functions
  const togglePlay = () => {
    const video = videoRef.current;
    if (video) {
      video.paused ? video.play() : video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    const video = videoRef.current;
    if (video) {
      video.volume = newVolume;
      video.muted = newVolume === 0;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressEl = progressRef.current;
    const video = videoRef.current;
    if (!progressEl || !video || !video.duration) return;

    const rect = progressEl.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
  };
  
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    }
  };

  // Formatting helpers
  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds) || timeInSeconds === 0) return '00:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const VolumeIcon = isMuted || volume === 0 ? 'volume-x' : volume < 0.5 ? 'volume-1' : 'volume-2';

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-auto max-h-64 aspect-video bg-black flex items-center justify-center overflow-hidden rounded-md group/player"
    >
      <video
        ref={videoRef} 
        src={src} 
        playsInline
        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
        className="w-full h-full object-contain" 
      />
      
      <div 
        className={`absolute inset-0 transition-opacity duration-300 ${areControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Central Play Button */}
        {!isPlaying && (
            <div 
                className="absolute inset-0 flex items-center justify-center"
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            >
                <div className="w-16 h-16 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white transform hover:scale-110 transition-transform">
                    <Icon name='play' className="w-8 h-8" fill="white" />
                </div>
            </div>
        )}

        {/* Controls Bar */}
        <div 
          className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent"
          onClick={e => e.stopPropagation()}
        >
          {/* Progress Bar */}
          <div 
            ref={progressRef}
            onClick={(e) => { e.stopPropagation(); handleSeek(e); }}
            className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer group/progress mb-2"
          >
            <div className="bg-blue-500 h-full rounded-full relative" style={{ width: `${progress}%` }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity"></div>
            </div>
          </div>
          
          {/* Bottom Controls */}
          <div className="flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="p-1">
                <Icon name={isPlaying ? 'pause' : 'play'} className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1 group/volume">
                <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="p-1">
                  <Icon name={VolumeIcon} className="w-5 h-5" />
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onClick={e => e.stopPropagation()}
                  onChange={handleVolumeChange}
                  className="w-0 group-hover/volume:w-16 transition-all duration-300 h-1 accent-white"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs font-mono">
                <span>{formatTime(currentTime)}</span> / <span>{formatTime(duration)}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} className="p-1">
                <Icon name="maximize" className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomVideoPlayer;

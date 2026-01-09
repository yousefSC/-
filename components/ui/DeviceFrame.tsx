import React, { useRef, useLayoutEffect, useState } from 'react';
import { SimulationDevice } from '../../types';

interface DeviceFrameProps {
  device: SimulationDevice;
  children: React.ReactNode;
  isRotated?: boolean;
}

const deviceDimensions = {
  smartphone: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  laptop: { width: 1280, height: 800 },
};

const DeviceFrame: React.FC<DeviceFrameProps> = ({ device, children, isRotated }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    if (device === 'none' || !wrapperRef.current) return;

    const calculateScale = () => {
      if (!wrapperRef.current) return;

      const { width: containerWidth, height: containerHeight } = wrapperRef.current.getBoundingClientRect();
      let { width: deviceWidth, height: deviceHeight } = deviceDimensions[device as keyof typeof deviceDimensions];
      
      if (isRotated) {
        [deviceWidth, deviceHeight] = [deviceHeight, deviceWidth];
      }
      
      const padding = 64; 
      const scaleX = (containerWidth - padding) / deviceWidth;
      const scaleY = (containerHeight - padding) / deviceHeight;
      
      setScale(Math.min(scaleX, scaleY, 1));
    };

    calculateScale();

    const resizeObserver = new ResizeObserver(calculateScale);
    resizeObserver.observe(wrapperRef.current);

    return () => resizeObserver.disconnect();
  }, [device, isRotated]);

  if (device === 'none') {
    return <div className="w-full h-full">{children}</div>;
  }
  
  const dimensions = deviceDimensions[device as keyof typeof deviceDimensions];
  const rotationTransform = isRotated ? 'rotate(90deg)' : '';
  
  const contentWrapperStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
  };

  if (isRotated && device === 'smartphone') {
    // The frame-content is WxH, but rotated, so it appears as HxW on screen.
    // We counter-rotate the content and scale it down uniformly to fit.
    // This creates a letterbox effect and prevents content distortion.
    const scaleFactor = dimensions.width / dimensions.height;
    contentWrapperStyle.transform = `rotate(-90deg) scale(${scaleFactor})`;
    contentWrapperStyle.transformOrigin = 'center center';
  }

  return (
    <div ref={wrapperRef} className="w-full h-full flex items-center justify-center">
      <div 
        className={`device-frame device-${device}`} 
        style={{ 
          width: `${dimensions.width}px`, 
          height: `${dimensions.height}px`,
          transform: `scale(${scale}) ${rotationTransform}`,
          transformOrigin: 'center center',
        }}
      >
        <div className="device-frame-content">
          <div style={contentWrapperStyle}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceFrame;

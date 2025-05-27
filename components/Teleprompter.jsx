import React, { useRef, useEffect, useState, useMemo } from 'react';
import Draggable from 'react-draggable';

export const Teleprompter = ({ isVisible, content, onContentChange, recordingDuration, selectedAspectRatio, onClose }) => {
  const textareaRef = useRef(null);
  const nodeRef = useRef(null);
  const [teleprompterSpeed, setTeleprompterSpeed] = useState(50);
  const speedTrackRef = useRef(null);
  const speedHandleRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const lastScrollTimeRef = useRef(null);
  const startScrollPositionRef = useRef(0);

  const initialHandlePosition = useMemo(() => {
    const minSpeed = 10;
    const maxSpeed = 100;
    const trackWidth = 100;
    const position = ((teleprompterSpeed - minSpeed) / (maxSpeed - minSpeed)) * trackWidth;
    return { x: position, y: 0 };
  }, [teleprompterSpeed]);

  const teleprompterStyles = useMemo(() => {
    switch (selectedAspectRatio) {
      case '9:16':
        return {
          width: 'w-[80%]',
          maxWidth: 'max-w-[400px]',
          height: 'h-[300px]',
          top: 'top-[10%]',
          left: 'left-[50%]',
          translateX: '-translate-x-1/2',
          translateY: 'translate-y-0',
        };
      case '1:1':
        return {
          width: 'w-4/5',
          maxWidth: 'max-w-[500px]',
          height: 'h-[250px]',
          top: 'top-[8%]',
          left: 'left-[50%]',
          translateX: '-translate-x-1/2',
          translateY: 'translate-y-0',
        };
      case '4:3':
        return {
          width: 'w-4/5',
          maxWidth: 'max-w-[550px]',
          height: 'h-[220px]',
          top: 'top-[6%]',
          left: 'left-[50%]',
          translateX: '-translate-x-1/2',
          translateY: 'translate-y-0',
        };
      case '16:9':
      default:
        return {
          width: 'w-4/5',
          maxWidth: 'max-w-[600px]',
          height: 'h-[200px]',
          top: 'top-[5%]',
          left: 'left-[20%]',
          translateX: '-translate-x-1/2',
          translateY: 'translate-y-0',
        };
    }
  }, [selectedAspectRatio]);

  useEffect(() => {
    if (!textareaRef.current || !isVisible) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      lastScrollTimeRef.current = null;
      return;
    }

    if (recordingDuration > 0 && lastScrollTimeRef.current === null) {
      lastScrollTimeRef.current = performance.now();
      startScrollPositionRef.current = textareaRef.current.scrollTop;
      const animateScroll = (currentTime) => {
        if (!lastScrollTimeRef.current || !textareaRef.current) return;

        const deltaTime = (currentTime - lastScrollTimeRef.current) / 1000;
        const linesPerSecond = teleprompterSpeed / 60;
        const lineHeight = parseInt(getComputedStyle(textareaRef.current).lineHeight);
        const pixelsPerSecond = linesPerSecond * lineHeight;
        const expectedScrollPosition = recordingDuration * pixelsPerSecond;
        const scrollStep = pixelsPerSecond * deltaTime;

        textareaRef.current.scrollTop += scrollStep;
        lastScrollTimeRef.current = currentTime;

        if (textareaRef.current.scrollTop < textareaRef.current.scrollHeight - textareaRef.current.clientHeight) {
          animationFrameIdRef.current = requestAnimationFrame(animateScroll);
        } else {
          animationFrameIdRef.current = null;
        }
      };
      animationFrameIdRef.current = requestAnimationFrame(animateScroll);
    } else if (recordingDuration === 0 && animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
      lastScrollTimeRef.current = null;
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      lastScrollTimeRef.current = null;
    };
  }, [recordingDuration, teleprompterSpeed, isVisible]);

  if (!isVisible) return null;

  return (
    <Draggable nodeRef={nodeRef} handle=".handle" bounds="parent">
      <div ref={nodeRef} className={`absolute ${teleprompterStyles.top} ${teleprompterStyles.left} ${teleprompterStyles.translateX} ${teleprompterStyles.translateY} ${teleprompterStyles.width} ${teleprompterStyles.maxWidth} ${teleprompterStyles.height} bg-black/70 text-white p-5 rounded-lg z-50 resize overflow-hidden flex flex-col`}>
        <div className="handle flex justify-between items-center mb-2.5 pb-2.5 border-b border-white/10">
          <div className="cursor-grab px-2.5">....</div>
          <div className="flex items-center gap-1.5">
            <span>Speed:</span>
            <div ref={speedTrackRef} className="w-[100px] h-2 bg-white/20 rounded relative cursor-pointer">
              {speedTrackRef.current && speedHandleRef.current && (
                <Draggable
                  axis="x"
                  bounds="parent"
                  position={initialHandlePosition}
                  onDrag={(e, data) => {
                    const trackWidth = speedTrackRef.current?.offsetWidth || 100;
                    const minSpeed = 10;
                    const maxSpeed = 100;
                    const newSpeed = minSpeed + (data.x / trackWidth) * (maxSpeed - minSpeed);
                    setTeleprompterSpeed(Math.round(newSpeed));
                  }}
                  nodeRef={speedHandleRef}
                >
                  <div ref={speedHandleRef} className="w-4 h-4 bg-blue-500 rounded-full absolute -top-1 left-0 cursor-grab"></div>
                </Draggable>
              )}
            </div>
            <span>{teleprompterSpeed}</span>
          </div>
          <button onClick={onClose} className="cursor-pointer px-2.5">X</button>
        </div>
        <div className="flex-grow overflow-y-scroll scrollbar-none flex flex-col">
          <textarea
            ref={textareaRef}
            className="flex-grow w-full h-full bg-transparent text-white text-2xl text-center border-none outline-none resize-none p-0 m-0 whitespace-pre-wrap leading-relaxed"
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Your teleprompter text goes here."
          />
        </div>
      </div>
    </Draggable>
  );
}; 
import React, { useRef, useEffect } from 'react';

export const PlayerModal = ({ isOpen, videoUrl, onClose, recordingType }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    // Clean up the object URL when the modal is closed or the videoUrl changes
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  if (!isOpen || !videoUrl) return null;

  const downloadRecording = () => {
    if (!videoUrl) return;

    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = videoUrl;
    a.download = `recording-${new Date().toISOString()}.${recordingType === 'audio' ? 'webm' : 'webm'}`;
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-lg w-[90%] max-w-4xl p-6">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-xl font-bold"
        >
          &times;
        </button>
        <div className="w-full aspect-video bg-black flex items-center justify-center">
          <video ref={videoRef} src={videoUrl} className="w-full h-full object-contain" controls autoPlay />
        </div>
        <div className="mt-4 flex justify-center">
          <button
            onClick={downloadRecording}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors mr-2"
          >
            Download Recording
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}; 
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="relative bg-white rounded-lg shadow-lg w-[90%] max-w-4xl p-6">
        {/* Video Player Area */}
        <div className="w-full aspect-video bg-black flex items-center justify-center rounded-lg overflow-hidden mb-4">
          <video ref={videoRef} src={videoUrl} className="w-full h-full object-contain" controls autoPlay />
        </div>
        {/* Placeholder Controls (Mimicking Veed Layout) */}
        <div className="flex justify-around items-center py-4 border-t border-gray-200">
            {/* Download Button */}
           <button
             onClick={downloadRecording}
             className="flex flex-col items-center text-gray-700 hover:text-green-600 transition-colors"
           >
             💾
             <span className="text-xs mt-1">Download</span>
           </button>
           {/* Placeholder Layouts */}
           <div className="flex flex-col items-center text-gray-400 cursor-not-allowed">
             🖼️
             <span className="text-xs mt-1">Layouts</span>
           </div>
           {/* Placeholder Background */}
           <div className="flex flex-col items-center text-gray-400 cursor-not-allowed">
             🏞️
             <span className="text-xs mt-1">Background</span>
           </div>
           {/* Placeholder Magic (Highlight) */}
           <div className="flex flex-col items-center text-purple-600 cursor-not-allowed">
             ✨
             <span className="text-xs mt-1">Magic</span>
           </div>
           {/* Placeholder Settings */}
           <div className="flex flex-col items-center text-gray-400 cursor-not-allowed">
             ⚙️
             <span className="text-xs mt-1">Settings</span>
           </div>
           {/* Close Button */}
           <button
             onClick={onClose}
             className="flex flex-col items-center text-gray-700 hover:text-red-600 transition-colors"
           >
             ✖️
             <span className="text-xs mt-1">Close</span>
           </button>
        </div>
      </div>
    </div>
  );
}; 
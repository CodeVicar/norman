'use client';

import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Player } from "@remotion/player";
import { Teleprompter } from "../../components/camera/Teleprompter";
import { PlayerModal } from "../../components/camera/PlayerModal";

const VIDEO_FPS = 30; // Keep FPS constant here

// Define ASPECT_RATIOS here or import if it's shared
const ASPECT_RATIOS = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
};

const CameraRecorderPage = () => {
  const [recordingType, setRecordingType] = useState('camera'); // Start directly in camera mode
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [teleprompterContent, setTeleprompterContent] = useState("");
  const [isTeleprompterVisible, setIsTeleprompterVisible] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState("");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('16:9');
  const [isMuted, setIsMuted] = useState(false);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState("");
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const previewVideoRef = useRef(null); // Still needed for PlayerModal cleanup logic
  const recordingStartTimeRef = useRef(null);

  // Ref for the recorded video element
  const recordedVideoRef = useRef(null);

  // Effect to enumerate devices on mount
  useEffect(() => {
    const getDevices = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
          console.warn("enumerateDevices() not supported.");
          return;
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        setVideoDevices(videoInputs);
        if (videoInputs.length > 0) {
          setSelectedVideoDevice(videoInputs[0].deviceId);
        }
        setAudioDevices(audioInputs);
        if (audioInputs.length > 0) {
          setSelectedAudioDevice(audioInputs[0].deviceId);
        }
      } catch (err) {
        console.error("Error enumerating devices:", err);
      }
    };

    getDevices();

    navigator.mediaDevices.addEventListener('devicechange', getDevices);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getDevices);
    };
  }, []);

  // Effect to enable camera stream when recordingType becomes 'camera'
  useEffect(() => {
    const enableCameraStream = async () => {
      // Only enable stream if type is camera and no video is recorded yet
      if (recordingType !== 'camera' || recordedVideoUrl) {
        return;
      }

      const { width, height } = ASPECT_RATIOS[selectedAspectRatio];

      try {
        const constraints = {
          video: {
            deviceId: selectedVideoDevice ? { exact: selectedVideoDevice } : undefined,
            width: { ideal: width },
            height: { ideal: height },
            frameRate: VIDEO_FPS,
          },
          audio: isMuted ? false : (selectedAudioDevice ? { exact: selectedAudioDevice } : true),
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        // Reset to initial state on error
        setRecordingType(null);
        setRecordedVideoUrl(null);
        setRecordedChunks([]);
        setIsRecording(false);
        setIsPlayerModalOpen(false);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        if (videoRef.current) {
           videoRef.current.srcObject = null;
        }
      }
    };

    enableCameraStream();

    // Cleanup function to stop stream when component unmounts or dependencies change
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      // Revoke the recorded video URL if it exists when the component unmounts
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, [recordingType, recordedVideoUrl, selectedVideoDevice, selectedAspectRatio, isMuted, selectedAudioDevice]);

  // Effect to load the recorded video into the video element when URL is available
  useEffect(() => {
    if (recordedVideoUrl && recordedVideoRef.current) {
      recordedVideoRef.current.src = recordedVideoUrl;
      recordedVideoRef.current.load(); // Load the video
    }
  }, [recordedVideoUrl]);

  const startRecording = useCallback(async () => {
    if (!streamRef.current) {
      console.error("Stream not available.");
      return;
    }

    // Clear any previous recording URL before starting a new one
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
      setRecordedVideoUrl(null);
    }

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp9', // Explicitly video/webm for camera
      });

      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Ensure the stream is stopped after recording stops
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        setRecordedChunks(chunks);
        setIsRecording(false);
        setRecordingDuration(0);
        recordingStartTimeRef.current = null;
        
        const blob = new Blob(chunks, {
          type: 'video/webm', // Explicitly video/webm for camera
        });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setIsPlayerModalOpen(true); // Open the modal after recording stops
        
        if (videoRef.current) {
          videoRef.current.srcObject = null; // Clear live preview
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      recordingStartTimeRef.current = Date.now();

      // Update recording duration
      const durationInterval = setInterval(() => {
        if (recordingStartTimeRef.current) {
          setRecordingDuration((Date.now() - recordingStartTimeRef.current) / 1000);
        } else {
           clearInterval(durationInterval); // Stop interval if start time is cleared
        }
      }, 100);

      // Clear interval when recording stops
      mediaRecorderRef.current.addEventListener('stop', () => {
        clearInterval(durationInterval);
      });

    } catch (err) {
      console.error("Error starting recording:", err);
      setIsRecording(false);
      // Reset state on error
      setRecordingType(null); // Allow selecting type again
      setRecordedVideoUrl(null);
      setRecordedChunks([]);
      setIsPlayerModalOpen(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
       if (videoRef.current) {
         videoRef.current.srcObject = null;
       }
    }
  }, [isRecording, recordedVideoUrl, streamRef, selectedAspectRatio, selectedVideoDevice, isMuted, selectedAudioDevice]); // Added dependencies


  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      // State updates and stream cleanup now happen primarily in mediaRecorder.onstop
     }
  }, [isRecording]);


  const handleNewRecording = useCallback(() => {
    // Clear all recording-related state to go back to initial selection or setup
    // URL.revokeObjectURL is now handled by the useEffect cleanup
    setRecordedChunks([]);
    // Stay on the camera page, but reset state to allow new recording
    setRecordedVideoUrl(null);
    setRecordingDuration(0);
    setIsRecording(false);
    // Stream will be re-enabled by useEffect because recordedVideoUrl is null

    // Ensure video element is clean
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Ensure recorded video element is clean
    if (recordedVideoRef.current) {
      recordedVideoRef.current.src = '';
    }

    // Re-enumerate devices in case anything changed
    const getDevices = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
          console.warn("enumerateDevices() not supported.");
          return;
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(device => device.kind === 'videoinput');
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        setVideoDevices(videoInputs);
        if (videoInputs.length > 0) {
          setSelectedVideoDevice(videoInputs[0].deviceId);
        }
        setAudioDevices(audioInputs);
        if (audioInputs.length > 0) {
          setSelectedAudioDevice(audioInputs[0].deviceId);
        }
      } catch (err) {
        console.error("Error enumerating devices:", err);
      }
    };
     getDevices();

  }, [recordedVideoUrl]); // Dependency on recordedVideoUrl to ensure cleanup

  const toggleMute = useCallback(() => {
    setIsMuted(prevMuted => !prevMuted);
    // Re-enable stream effect to apply new mute state
  }, []); // No dependencies needed as it toggles based on previous state

    // Download function is now in PlayerModal, no longer needed here

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Video/Preview Area */}
          {/* Adjusted class to allow inner div to control aspect ratio height */}
          {/* Conditional Rendering for Live Feed or Recorded Video */}
          {(!recordedVideoUrl) ? (
             // Live Video Feed (Camera) - Only show if no recorded video URL
             <div className="w-full bg-black flex items-center justify-center min-h-[300px] md:min-h-[400px]">
               {/* Only show live feed if recordingType is camera and not recording or recorded */}
               {(recordingType === 'camera') && (
                 <div className={`relative h-full ${
                  selectedAspectRatio === '9:16' ? 'aspect-[9/16] max-w-[400px]' :
                  selectedAspectRatio === '1:1' ? 'aspect-square max-w-[600px]' :
                  selectedAspectRatio === '4:3' ? 'aspect-[4/3] max-w-[700px]' :
                  'aspect-video max-w-full'
                }`}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
              </div>
               )}

               {/* Placeholder/Message when no live feed or recorded video is shown */}
               {(!recordingType) && ( // Show initial state message or nothing if recorded video is handled by modal
                  <div className="text-white text-lg">Select Camera to start setup.</div>
               )}

             </div>
          ) : (
             // Recorded Video Playback - Show if recorded video URL exists
             <div className="w-full bg-white flex items-center justify-center min-h-[300px] md:min-h-[400px]">
               <div className={`relative h-full ${ // Use similar aspect ratio styling for playback
                  selectedAspectRatio === '9:16' ? 'aspect-[9/16] max-w-[400px]' :
                  selectedAspectRatio === '1:1' ? 'aspect-square max-w-[600px]' :
                  selectedAspectRatio === '4:3' ? 'aspect-[4/3] max-w-[700px]' :
                  'aspect-video max-w-full'
               }`}>
                <video
                   ref={recordedVideoRef}
                   className="w-full h-full object-contain bg-black" // Keep black background for the video itself
                   controls
                   autoPlay
                />
               </div>
             </div>
          )}

          <div className="p-4 bg-gray-50 border-t">
            {/* Initial state: Select Camera button */} 
            {(recordingType === null && !isRecording && !recordedVideoUrl) && ( // Only show initial state if recordingType is explicitly null (shouldn't happen initially now)
              <div className="flex flex-col gap-4 items-center">
                 {/* Initial Camera and Aspect Ratio Selection before 'Use Camera' */}
                {videoDevices.length > 0 && (
                  <select
                    className="px-4 py-2 rounded bg-white border border-gray-300 text-gray-700"
                    value={selectedVideoDevice}
                    onChange={(e) => setSelectedVideoDevice(e.target.value)}
                  >
                    {videoDevices.map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId}`}
                      </option>
                    ))}
                  </select>
                )}

                <select
                  className="px-4 py-2 rounded bg-white border border-gray-300 text-gray-700"
                  value={selectedAspectRatio}
                  onChange={(e) => setSelectedAspectRatio(e.target.value)}
                >
                  {Object.keys(ASPECT_RATIOS).map(ratio => (
                    <option key={ratio} value={ratio}>
                      {ratio}
                    </option>
                  ))}
                </select>

                <button
                    onClick={() => setRecordingType('camera')}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                    disabled={videoDevices.length === 0}
                  >
                    Use Camera
                  </button>
              </div>
            )}

            {/* Controls visible after selecting Camera type, before recording */}
            {(recordingType === 'camera' && !isRecording && !recordedVideoUrl) && ( // This block is now the default view before recording
              <div className="flex flex-col gap-4 items-center">
                <div className="flex gap-4 justify-center w-full flex-wrap">
                  {/* Camera Device Selection */}
                   {videoDevices.length > 0 && (
                    <select
                      className="px-4 py-2 rounded bg-white border border-gray-300 text-gray-700"
                      value={selectedVideoDevice}
                      onChange={(e) => setSelectedVideoDevice(e.target.value)}
                    >
                      {videoDevices.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${device.deviceId}`}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Audio Device Selection */}
                  {audioDevices.length > 0 && (
                    <select
                      className="px-4 py-2 rounded bg-white border border-gray-300 text-gray-700"
                      value={selectedAudioDevice}
                      onChange={(e) => setSelectedAudioDevice(e.target.value)}
                    >
                      {audioDevices.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Microphone ${device.deviceId}`}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Aspect Ratio Selection */}
                  <select
                    className="px-4 py-2 rounded bg-white border border-gray-300 text-gray-700"
                    value={selectedAspectRatio}
                    onChange={(e) => setSelectedAspectRatio(e.target.value)}
                  >
                    {Object.keys(ASPECT_RATIOS).map(ratio => (
                      <option key={ratio} value={ratio}>
                        {ratio}
                      </option>
                    ))}
                  </select>

                  {/* Mute Toggle */}
                  <button
                    onClick={toggleMute}
                    className={`px-4 py-2 rounded transition-colors ${
                      isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-500 hover:bg-gray-600'
                    } text-white`}
                  >
                    {isMuted ? 'Unmute' : 'Mute'} Mic
                  </button>

                  {/* Teleprompter Toggle */}
                  <button
                    onClick={() => setIsTeleprompterVisible(!isTeleprompterVisible)}
                    className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                  >
                    {isTeleprompterVisible ? 'Hide' : 'Show'} Teleprompter
                  </button>
                </div>

                {/* Start Recording Button */}
                <button
                  onClick={startRecording}
                  className="px-8 py-3 bg-green-500 text-white text-lg font-semibold rounded-full hover:bg-green-600 transition-colors mt-4"
                >
                  Start Recording
                </button>
              </div>
            )}

            {/* Recording in progress state */}
            {isRecording && (
              <div className="flex gap-4 justify-center">
                <button
                  onClick={stopRecording}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  Stop Recording
                </button>
                <div className="px-4 py-2 bg-gray-200 rounded">
                  Recording: {recordingDuration.toFixed(1)}s
                </div>
              </div>
            )}

            {/* Post-recording state (Download and New Recording) */}
            {(!isRecording && recordedVideoUrl) && ( // Show this state when a video is recorded
              <div className="flex flex-col gap-4 items-center">
                <div className="flex gap-4">
                   <button
                     onClick={handleNewRecording}
                     className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                   >
                     New Recording
                   </button>
                   {recordedVideoUrl && (
                     <a
                        href={recordedVideoUrl}
                        download={`recording-${new Date().toISOString()}.webm`}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center"
                     >
                        💾 Download
                     </a>
                   )}
                </div>
              </div>
            )}

          </div> {/* End of p-4 bg-gray-50 border-t */}
        </div> {/* End of relative bg-white rounded-lg... */}
      </div> {/* End of container mx-auto... */}

      {/* Teleprompter Component */}
      <Teleprompter
        isVisible={isTeleprompterVisible}
        content={teleprompterContent}
        onContentChange={setTeleprompterContent}
        recordingDuration={recordingDuration}
        selectedAspectRatio={selectedAspectRatio}
        onClose={() => setIsTeleprompterVisible(false)}
      />

      {/* Player Modal Component - Removed */}

    </div> /* End of min-h-screen bg-gray-100 */
  );
};

export default CameraRecorderPage;
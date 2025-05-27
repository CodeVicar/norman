'use client';

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Teleprompter } from "../../components/screen/Teleprompter";

const VIDEO_FPS = 30;

const ASPECT_RATIOS = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
};

const FIT_TO_SCREEN_RATIO = 'Fit to Screen';

const ScreenRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [teleprompterContent, setTeleprompterContent] = useState("");
  const [isTeleprompterVisible, setIsTeleprompterVisible] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('16:9');
  const [isMuted, setIsMuted] = useState(false);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState("");
  const [actualScreenDimensions, setActualScreenDimensions] = useState(null);

  const hasRequestedScreen = useRef(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const previewVideoRef = useRef(null);
  const recordingStartTimeRef = useRef(null);

  useEffect(() => {
    const getAudioDevices = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
          console.warn("enumerateDevices() not supported.");
          return;
        }
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        setAudioDevices(audioInputs);
        if (audioInputs.length > 0) {
          setSelectedAudioDevice(audioInputs[0].deviceId);
        }
      } catch (err) {
        console.error("Error enumerating devices:", err);
      }
    };

    getAudioDevices();
    navigator.mediaDevices.addEventListener('devicechange', getAudioDevices);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getAudioDevices);
    };
  }, []);

  useEffect(() => {
    const enableStream = async () => {
      if (recordedVideoUrl) return;

      const selectedDims = ASPECT_RATIOS[selectedAspectRatio];
      const width = selectedAspectRatio === FIT_TO_SCREEN_RATIO && actualScreenDimensions ? actualScreenDimensions.width : selectedDims.width;
      const height = selectedAspectRatio === FIT_TO_SCREEN_RATIO && actualScreenDimensions ? actualScreenDimensions.height : selectedDims.height;

      if (hasRequestedScreen.current) return;

      try {
        hasRequestedScreen.current = true;
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: width },
            height: { ideal: height },
            frameRate: VIDEO_FPS,
          },
          audio: false,
        });

        let audioStream = null;
        if (!isMuted) {
          try {
            audioStream = await navigator.mediaDevices.getUserMedia({
              audio: selectedAudioDevice ? { exact: selectedAudioDevice } : true,
              video: false,
            });
          } catch (audioErr) {
            console.error("Error accessing audio for screen recording:", audioErr);
          }
        }

        const tracks = ['video'].flatMap(kind => screenStream.getTracks().filter(track => track.kind === kind));
        if (audioStream) {
          tracks.push(...audioStream.getTracks().filter(track => track.kind === 'audio'));
        }

        const combinedStream = new MediaStream(tracks);
        streamRef.current = combinedStream;

        // Get and store the actual screen dimensions
        const videoTrack = screenStream.getVideoTracks()[0];
        if (videoTrack) {
          const settings = videoTrack.getSettings();
          setActualScreenDimensions({ width: settings.width, height: settings.height });
        }

        if (videoRef.current) {
          videoRef.current.srcObject = combinedStream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error("Error accessing screen media:", err);
      }
    };

    enableStream();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
        setRecordedVideoUrl(null);
      }
    };
  }, [recordedVideoUrl, selectedAspectRatio, isMuted, selectedAudioDevice]);

  const startRecording = useCallback(async () => {
    if (!streamRef.current) {
      console.error("Stream not available.");
      return;
    }

    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
      setRecordedVideoUrl(null);
    }

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp9',
      });

      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        setRecordedChunks(chunks);
        setIsRecording(false);
        setRecordingDuration(0);
        recordingStartTimeRef.current = null;
        
        const blob = new Blob(chunks, {
          type: 'video/webm',
        });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      recordingStartTimeRef.current = Date.now();

      const durationInterval = setInterval(() => {
        if (recordingStartTimeRef.current) {
          setRecordingDuration((Date.now() - recordingStartTimeRef.current) / 1000);
        }
      }, 100);

      mediaRecorderRef.current.addEventListener('stop', () => {
        clearInterval(durationInterval);
      });
    } catch (err) {
      console.error("Error starting recording:", err);
      setIsRecording(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [recordedVideoUrl, streamRef]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const downloadRecording = useCallback(() => {
    if (recordedChunks.length === 0 || !recordedVideoUrl) return;

    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = recordedVideoUrl;
    a.download = `screen-recording-${new Date().toISOString()}.webm`;
    a.click();
    document.body.removeChild(a);
  }, [recordedChunks, recordedVideoUrl]);

  const handleNewRecording = useCallback(() => {
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
    }
    setRecordedChunks([]);
    setRecordedVideoUrl(null);
    setRecordingDuration(0);
    setIsRecording(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [recordedVideoUrl, streamRef]);

  const toggleMute = useCallback(() => {
    setIsMuted(prevMuted => !prevMuted);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="w-full bg-black flex items-center justify-center">
            {!recordedVideoUrl && (
              <div className={`relative h-full ${
                 selectedAspectRatio === '9:16' ? 'aspect-[9/16] max-w-[400px]' :
                 selectedAspectRatio === '1:1' ? 'aspect-square max-w-[600px]' :
                 selectedAspectRatio === '4:3' ? 'aspect-[4/3] max-w-[700px]' : 
                 'aspect-video max-w-full'
               }`}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  autoPlay
                  playsInline
                  muted
                />
              </div>
            )}

            {recordedVideoUrl && (
              <div className={`relative ${
                selectedAspectRatio === '9:16' ? 'w-1/2 max-w-[400px] aspect-[9/16]' :
                selectedAspectRatio === '1:1' ? 'w-3/4 max-w-[600px] aspect-square' :
                selectedAspectRatio === '4:3' ? 'w-3/4 max-w-[700px] aspect-[4/3]' :
                'w-full aspect-video'
              }`}>
                <video
                  ref={previewVideoRef}
                  src={recordedVideoUrl}
                  className="w-full h-full object-contain block"
                  controls
                />
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-50 border-t">
            {!isRecording && recordedChunks.length === 0 && (
              <div className="flex flex-col gap-4 items-center">
                <div className="flex gap-4 justify-center w-full flex-wrap">
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

                    <select
                      className="px-4 py-2 rounded bg-white border border-gray-300 text-gray-700"
                      value={selectedAspectRatio}
                      onChange={(e) => setSelectedAspectRatio(e.target.value)}
                    >
                      {Object.keys(ASPECT_RATIOS).map(ratio => {
                        // Exclude 'Fit to Screen' from standard options if actual dimensions not available
                        if (ratio === FIT_TO_SCREEN_RATIO && !actualScreenDimensions) {
                          return null;
                        }
                        return (
                          <option key={ratio} value={ratio}>
                            {ratio}
                          </option>
                        );
                      })}
                      {actualScreenDimensions && selectedAspectRatio !== FIT_TO_SCREEN_RATIO && (
                         <option key={FIT_TO_SCREEN_RATIO} value={FIT_TO_SCREEN_RATIO}>
                           Fit to Screen
                         </option>
                      )}
                    </select>

                  <button
                    onClick={toggleMute}
                    className={`px-4 py-2 rounded transition-colors ${
                      isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-500 hover:bg-gray-600'
                    } text-white`}
                  >
                    {isMuted ? 'Unmute' : 'Mute'} Mic
                  </button>

                  <button
                    onClick={() => setIsTeleprompterVisible(!isTeleprompterVisible)}
                    className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                  >
                    {isTeleprompterVisible ? 'Hide' : 'Show'} Teleprompter
                  </button>
                </div>

                <button
                  onClick={startRecording}
                  className="px-8 py-3 bg-green-500 text-white text-lg font-semibold rounded-full hover:bg-green-600 transition-colors mt-4"
                >
                  Start Screen Recording
                </button>
              </div>
            )}

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

            {!isRecording && recordedChunks.length > 0 && (
              <div className="flex flex-col gap-4 items-center">
                <div className="flex gap-4">
                  <button
                    onClick={downloadRecording}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                  >
                    Download Recording
                  </button>
                   <button
                     onClick={handleNewRecording}
                     className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                   >
                     New Recording
                   </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <Teleprompter
          isVisible={isTeleprompterVisible}
          content={teleprompterContent}
          onContentChange={setTeleprompterContent}
          recordingDuration={recordingDuration}
          selectedAspectRatio={selectedAspectRatio}
          onClose={() => setIsTeleprompterVisible(false)}
        />
      </div>
    </div>
  );
};

export default ScreenRecorder; 
'use client';

import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Player } from "@remotion/player";
import { Teleprompter } from "../../components/Teleprompter";

const VIDEO_WIDTH = 1920;
const VIDEO_HEIGHT = 1080;
const VIDEO_FPS = 30;
const DURATION_IN_FRAMES = 300;

const ASPECT_RATIOS = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
};

const Home = () => {
  const [text, setText] = useState("Welcome to the video recorder!");
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordingType, setRecordingType] = useState(null);
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

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const previewVideoRef = useRef(null);
  const recordingStartTimeRef = useRef(null);

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

  useEffect(() => {
    const enableStream = async () => {
      if (!recordingType) return;

      const { width, height } = ASPECT_RATIOS[selectedAspectRatio];

      if (recordingType === 'camera') {
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
          setRecordingType(null);
        }
      } else if (recordingType === 'screen') {
        try {
          const stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
              width: { ideal: width },
              height: { ideal: height },
              frameRate: VIDEO_FPS,
            },
            audio: isMuted ? false : (selectedAudioDevice ? { exact: selectedAudioDevice } : true),
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
          }
        } catch (err) {
          console.error("Error accessing screen media:", err);
          setRecordingType(null);
        }
      } else if (recordingType === 'audio') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: isMuted ? false : (selectedAudioDevice ? { exact: selectedAudioDevice } : true),
            video: false,
          });
          streamRef.current = stream;
        } catch (err) {
          console.error("Error accessing audio:", err);
          setRecordingType(null);
        }
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
  }, [recordingType, recordedVideoUrl, selectedVideoDevice, selectedAspectRatio, isMuted, selectedAudioDevice]);

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
        mimeType: recordingType === 'audio' ? 'audio/webm' : 'video/webm;codecs=vp9',
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
          type: recordingType === 'audio' ? 'audio/webm' : 'video/webm',
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
      setRecordingType(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [recordingType, recordedVideoUrl, streamRef]);

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
    a.download = `recording-${new Date().toISOString()}.${recordingType === 'audio' ? 'webm' : 'webm'}`;
    a.click();
    document.body.removeChild(a);

  }, [recordedChunks, recordingType, recordedVideoUrl]);

  const handleNewRecording = useCallback(() => {
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
    }
    setRecordedChunks([]);
    setRecordingType(null);
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
            {(recordingType === 'camera' || recordingType === 'screen') && !recordedVideoUrl && (
              <div className={`relative ${
                selectedAspectRatio === '9:16' ? 'w-[33.33%] aspect-[9/16]' :
                selectedAspectRatio === '1:1' ? 'w-[75%] aspect-square' :
                selectedAspectRatio === '4:3' ? 'w-[75%] aspect-[4/3]' : 
                'w-full aspect-video'
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

            {(recordingType === 'camera' || recordingType === 'screen') && recordedVideoUrl && (
              <div className={`relative ${
                selectedAspectRatio === '9:16' ? 'w-[33.33%] aspect-[9/16]' :
                selectedAspectRatio === '1:1' ? 'w-[75%] aspect-square' :
                selectedAspectRatio === '4:3' ? 'w-[75%] aspect-[4/3]' : 
                'w-full aspect-video'
              }`}>
                <video
                  ref={previewVideoRef}
                  src={recordedVideoUrl}
                  className="w-full h-full object-contain"
                  controls
                />
              </div>
            )}
            
            {recordingType === 'audio' && !recordedVideoUrl && (
                <div className="text-white text-lg">Recording Audio...</div>
            )}
            
            {recordingType === 'audio' && recordedVideoUrl && (
                <div className="text-white text-lg">Audio Recorded. Ready to download.</div>
            )}

          </div>

          <div className="p-4 bg-gray-50 border-t">
            {!recordingType && !isRecording && recordedChunks.length === 0 && (
              <div className="flex flex-col gap-4 items-center">
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

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setRecordingType('camera')}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
                    disabled={videoDevices.length === 0}
                  >
                    Camera
                  </button>
                  <button
                    onClick={() => setRecordingType('screen')}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Screen
                  </button>
                  <button
                    onClick={() => setRecordingType('audio')}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    Audio
                  </button>
                </div>
              </div>
            )}

            {recordingType && !isRecording && recordedChunks.length === 0 && (
              <div className="flex flex-col gap-4 items-center">
                <div className="flex gap-4 justify-center w-full flex-wrap">
                  {(recordingType === 'camera') && videoDevices.length > 0 && (
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

                  {(recordingType === 'camera' || recordingType === 'screen') && (
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
                  )}

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
                  Start Recording ({recordingType})
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
        />
      </div>
    </div>
  );
};

export default Home; 
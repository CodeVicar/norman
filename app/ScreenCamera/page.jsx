'use client';

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Teleprompter } from "../../components/camera/Teleprompter"; // Reusing Teleprompter from camera as it's generic
import { createCombinedStream } from "../../utils/mediaRecorderUtils"; // Import the utility function

const VIDEO_FPS = 30;

// Define ASPECT_RATIOS here or import if it's shared
const ASPECT_RATIOS = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
};

const FIT_TO_SCREEN_RATIO = 'Fit to Screen';

const ScreenCameraRecorderPage = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [teleprompterContent, setTeleprompterContent] = useState("");
  const [isTeleprompterVisible, setIsTeleprompterVisible] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState("");
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState("");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('16:9');
  const [isMuted, setIsMuted] = useState(false);
  const [actualScreenDimensions, setActualScreenDimensions] = useState(null); // For 'Fit to Screen'

  const hasRequestedMedia = useRef(false); // To prevent requesting media multiple times
  const mediaRecorderRef = useRef(null);
  const screenStreamRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const screenVideoRef = useRef(null); // Ref for the main screen video element
  const cameraVideoRef = useRef(null); // Ref for the small camera video element
  const recordingStartTimeRef = useRef(null);
  const canvasRef = useRef(null); // Ref for the hidden canvas
  const combinedStreamRef = useRef(null); // Ref for the stream captured from the canvas

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

  // Effect to get screen and camera streams
  useEffect(() => {
    const enableStreams = async () => {
      // Only enable streams if we haven't requested media yet or if device/mute settings change
      // and we are not currently recording or playing a recorded video.
      if (recordedVideoUrl || isRecording) {
          // If we are recording or playing back, don't try to get new streams
          return;
      }

      // If streams are already active with current settings, no need to re-get unless explicitly resetting
      // This check is more complex as it depends on device IDs and mute state.
      // For simplicity and to ensure streams are fresh when settings change, we will stop existing streams below.

      // Stop any existing streams before attempting to get new ones
      if (screenStreamRef.current) {
         screenStreamRef.current.getTracks().forEach(track => {
             if (track.kind === 'video') {
                track.onended = null; // Remove listener before stopping
             }
             track.stop();
          });
         screenStreamRef.current = null;
      }
       if (cameraStreamRef.current) {
         cameraStreamRef.current.getTracks().forEach(track => track.stop());
         cameraStreamRef.current = null;
      }
       // Also stop audio tracks that might have been added to previous streams
       // Note: If audio was from a separate getUserMedia, it should also be stopped.
       // The cleanup return function handles stopping the audio stream obtained separately.

       console.log("Requesting screen and camera streams with updated settings..."); // Debug log

      const screenConstraints = {
        video: { frameRate: VIDEO_FPS }, // Let user select screen resolution
        audio: false, // Capture audio separately
      };

      const { width, height } = ASPECT_RATIOS[selectedAspectRatio];
      const cameraConstraints = {
        video: {
          deviceId: selectedVideoDevice ? { exact: selectedVideoDevice } : undefined,
          width: { ideal: width }, // Use selected aspect ratio for camera preview
          height: { ideal: height },
          frameRate: VIDEO_FPS,
        },
        audio: false, // Capture audio separately
      };

      try {
        // Request screen stream
        const screenStream = await navigator.mediaDevices.getDisplayMedia(screenConstraints);
        screenStreamRef.current = screenStream;
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = screenStream;
          await screenVideoRef.current.play();
        }

        // Get and store actual screen dimensions once stream is active
         const screenVideoTrack = screenStream.getVideoTracks()[0];
         if (screenVideoTrack) {
           const settings = screenVideoTrack.getSettings();
           setActualScreenDimensions({ width: settings.width, height: settings.height });

            // Listen for the 'ended' event on the screen track (e.g., user stops sharing)
            screenVideoTrack.onended = () => {
               console.log("Screen sharing ended.");
               // Stop recording if screen sharing ends unexpectedly
               if (isRecording) {
                 stopRecording();
               }
                // Reset state to allow starting a new recording
               handleNewRecording();
            };
         }


        // Request camera stream
        const cameraStream = await navigator.mediaDevices.getUserMedia(cameraConstraints);
        cameraStreamRef.current = cameraStream;
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = cameraStream;
          await cameraVideoRef.current.play();
        }
        console.log("Camera stream obtained.", cameraStream);

         // Request audio stream separately
         let audioStream = null;
         // Only request audio if not muted and we have selected an audio device or default
         if (!isMuted) {
            try {
              audioStream = await navigator.mediaDevices.getUserMedia({
                audio: selectedAudioDevice ? { exact: selectedAudioDevice } : true,
                video: false,
              });
               // Add audio tracks to both video streams for potential future use or monitoring
               // Note: This doesn't automatically combine them into a single recording.
               audioStream.getAudioTracks().forEach(track => {
                 if (screenStreamRef.current) screenStreamRef.current.addTrack(track);
                 if (cameraStreamRef.current) cameraStreamRef.current.addTrack(track);
               });
               console.log("Audio stream obtained.", audioStream);

            } catch (audioErr) {
              console.error("Error accessing audio:", audioErr);
              // If audio fails, we can still proceed with screen/camera if they were obtained.
              // Optionally, handle this error by showing a message to the user.
            }
         }

        hasRequestedMedia.current = true; // Set ref to true AFTER successfully getting streams

      } catch (err) {
        console.error("Error accessing media devices:", err);
        // Reset hasRequestedMedia on error to allow retrying
        hasRequestedMedia.current = false;
        // Reset state on error
        handleNewRecording(); // Use the reset function to clean up
      }
    };

    enableStreams();

    // Cleanup function to stop streams when component unmounts or dependencies change
    return () => {
      console.log("Cleaning up streams..."); // Debug log
      // Ensure streams are stopped properly on cleanup
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => {
           if (track.kind === 'video') {
              track.onended = null; // Remove listener before stopping
           }
           track.stop();
        });
        screenStreamRef.current = null;
         if (screenVideoRef.current) {
           screenVideoRef.current.srcObject = null;
         }
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
        cameraStreamRef.current = null;
         if (cameraVideoRef.current) {
           cameraVideoRef.current.srcObject = null;
         }
      }
       // Revoke the recorded video URL if it exists
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
       // Keep hasRequestedMedia.current as true here. It is reset by handleNewRecording
       // when starting a new recording or explicitly on component mount logic if needed.
       // The ref's purpose is to prevent re-requesting WITHIN a mount cycle initiated
       // by dependency changes or initial mount, unless streams were successfully obtained.
    };
     // Add dependencies that should trigger re-getting streams if they change
  }, [recordedVideoUrl, selectedVideoDevice, selectedAudioDevice, isMuted, selectedAspectRatio]);


  const startRecording = useCallback(async () => {
    // Check if both screen and camera streams are available before attempting to record
    if (!screenStreamRef.current || !cameraStreamRef.current) {
      console.error("Screen or camera streams not available for recording.");
      return;
    }

    // Clear any previous recording URL before starting a new one
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
      setRecordedVideoUrl(null);
    }

    try {
      // Determine output dimensions based on selected aspect ratio (using screen dimensions if available for 'Fit to Screen')
      const outputWidth = selectedAspectRatio === FIT_TO_SCREEN_RATIO && actualScreenDimensions
        ? actualScreenDimensions.width
        : ASPECT_RATIOS[selectedAspectRatio].width;
      const outputHeight = selectedAspectRatio === FIT_TO_SCREEN_RATIO && actualScreenDimensions
        ? actualScreenDimensions.height
        : ASPECT_RATIOS[selectedAspectRatio].height;

      // Use the utility function to create the combined stream from the canvas
      const combinedStream = await createCombinedStream(
        screenVideoRef.current, // Pass the screen video element
        cameraVideoRef.current, // Pass the camera video element
        isMuted ? null : screenStreamRef.current, // Pass audio stream (assuming audio is added to screen stream ref)
        outputWidth,
        outputHeight,
        VIDEO_FPS
      );

      if (!combinedStream) {
         console.error("Failed to create combined stream.");
         return;
      }

      combinedStreamRef.current = combinedStream; // Store the combined stream ref

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9,opus', // Include opus for audio
      });

      mediaRecorderRef.current = mediaRecorder;
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Stop the canvas drawing loop when recording stops
        if (combinedStreamRef.current && combinedStreamRef.current.stopDrawing) {
          combinedStreamRef.current.stopDrawing();
        }
         // Stop tracks on the combined stream explicitly after recording stops
         if(combinedStreamRef.current) {
            combinedStreamRef.current.getTracks().forEach(track => track.stop());
         }

        setRecordedChunks(chunks);
        setIsRecording(false);
        setRecordingDuration(0);
        recordingStartTimeRef.current = null;

        const blob = new Blob(chunks, {
          type: 'video/webm',
        });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);

         // The original screen and camera streams are stopped in the useEffect cleanup
         // or handleNewRecording, depending on the state transitions.
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
      // Ensure drawing loop is stopped on error
       if (combinedStreamRef.current && combinedStreamRef.current.stopDrawing) {
         combinedStreamRef.current.stopDrawing();
       }
       // Stop tracks on the combined stream on error
       if(combinedStreamRef.current) {
          combinedStreamRef.current.getTracks().forEach(track => track.stop());
       }
      // Reset state on error
      handleNewRecording(); // Use the reset function to clean up
    }
  }, [recordedVideoUrl, screenStreamRef, cameraStreamRef, isRecording, isMuted, selectedAudioDevice, selectedAspectRatio, actualScreenDimensions]); // Added dependencies

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      // State updates, stream cleanup, and drawing loop stop now happen primarily in mediaRecorder.onstop
     }
  }, [isRecording]);

    const handleNewRecording = useCallback(() => {
      // Clear all recording-related state to go back to initial selection or setup
      console.log("Handling new recording - resetting state and streams."); // Debug log

      // Stop the canvas drawing loop if it's active
       if (combinedStreamRef.current && combinedStreamRef.current.stopDrawing) {
         combinedStreamRef.current.stopDrawing();
          // Also stop tracks on the combined stream if it exists
         combinedStreamRef.current.getTracks().forEach(track => track.stop());
          combinedStreamRef.current = null;
       }

      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
      setRecordedChunks([]);
      setRecordedVideoUrl(null); // This state update will trigger the useEffect to enable streams again
      setRecordingDuration(0);
      setIsRecording(false);

      // Stop original streams to ensure they are fresh on next attempt
      // Note: This is also handled by the useEffect cleanup if dependencies change,
      // but explicitly stopping here on New Recording button click ensures cleanup.
      if (screenStreamRef.current) {
         screenStreamRef.current.getTracks().forEach(track => {
             if (track.kind === 'video') {
                track.onended = null; // Remove listener before stopping
             }
             track.stop();
          });
         screenStreamRef.current = null;
      }
       if (cameraStreamRef.current) {
         cameraStreamRef.current.getTracks().forEach(track => track.stop());
         cameraStreamRef.current = null;
      }

      // Clear video sources
       if (screenVideoRef.current) {
         screenVideoRef.current.srcObject = null;
       }
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = null;
       }

       // Reset hasRequestedMedia here when we explicitly want to request new streams
       hasRequestedMedia.current = false; // Reset ref to allow effect to fetch streams again

    }, [recordedVideoUrl]); // Dependency on recordedVideoUrl for cleanup logic related to URL

  const toggleMute = useCallback(() => {
    setIsMuted(prevMuted => !prevMuted);
     // Note: Changing mute state during an active stream requires stopping and
     // re-getting the audio stream or dynamically enabling/disabling audio tracks.
     // For simplicity, the current implementation primarily applies mute state
     // when the streams are initially obtained before recording starts.
     // To apply mid-recording, you'd need more complex stream manipulation.
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Video/Preview Area */}
          {/* Add the hidden canvas for drawing */}
           <canvas ref={canvasRef} className="hidden"></canvas>

          <div className="w-full bg-black flex items-center justify-center relative"> {/* Added relative for absolute positioning of camera */}
             {/* Screen Video Feed - Main Display */}
             {(!recordedVideoUrl) ? (
                <div className={`relative h-full w-full ${ // Screen feed takes full width
                   selectedAspectRatio === '9:16' ? 'aspect-[9/16] max-w-[400px]' :
                   selectedAspectRatio === '1:1' ? 'aspect-square max-w-[600px]' :
                   selectedAspectRatio === '4:3' ? 'aspect-[4/3] max-w-[700px]' :
                   'aspect-video max-w-full' // Default for 16:9 and others
                 }`}>
                   <video
                     ref={screenVideoRef}
                     className="w-full h-full object-contain" // Use object-contain for screen to show full content
                     autoPlay
                     playsInline
                     muted // Mute the local preview to avoid echo
                   />
                </div>
             ) : (
                // Recorded Video Playback - Show if recorded video URL exists
                // Note: This will play the screen recording. Combining streams
                // for playback in a single element is also complex.
                <div className={`relative h-full w-full ${ // Match preview aspect ratio
                   selectedAspectRatio === '9:16' ? 'aspect-[9/16] max-w-[400px]' :
                   selectedAspectRatio === '1:1' ? 'aspect-square max-w-[600px]' :
                   selectedAspectRatio === '4:3' ? 'aspect-[4/3] max-w-[700px]' :
                   'aspect-video max-w-full'
                }`}>
                  <video
                    ref={screenVideoRef} // Reusing screenVideoRef for playback
                    src={recordedVideoUrl}
                    className="w-full h-full object-contain bg-black"
                    controls
                    autoPlay
                  />
                </div>
             )}


            {/* Camera Video Feed - Overlay (Visible only when not playing recorded video) */}
            {(!recordedVideoUrl && cameraStreamRef.current) && ( // Show camera overlay if streams are active and not playing recorded video
              <div className="absolute bottom-4 left-4 w-[150px] h-[100px] bg-gray-700 rounded-lg overflow-hidden shadow-lg border-2 border-white"> {/* Adjust size and position as needed */}
                <video
                  ref={cameraVideoRef}
                  className="w-full h-full object-cover" // Use object-cover for camera
                  autoPlay
                  playsInline
                  muted // Always mute the camera preview overlay
                />
              </div>
            )}
          </div>

          <div className="p-4 bg-gray-50 border-t">
            {/* Controls visible before recording starts */}
            {(!isRecording && !recordedVideoUrl) && (
              <div className="flex flex-col gap-4 items-center">
                <div className="flex gap-4 justify-center w-full flex-wrap">
                   {/* Camera Device Selection */}
                   {videoDevices.length > 0 && (
                    <select
                      className="px-4 py-2 rounded bg-white border border-gray-300 text-gray-700"
                      value={selectedVideoDevice}
                      onChange={(e) => setSelectedVideoDevice(e.target.value)}
                      disabled={isRecording} // Disable device selection during recording
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
                       disabled={isRecording} // Disable device selection during recording
                    >
                      {audioDevices.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Microphone ${device.deviceId}`}
                        </option>
                      ))}
                    </select>
                  )}

                   {/* Aspect Ratio Selection (Primarily affects screen preview layout) */}
                    <select
                      className="px-4 py-2 rounded bg-white border border-gray-300 text-gray-700"
                      value={selectedAspectRatio}
                      onChange={(e) => setSelectedAspectRatio(e.target.value)}
                       disabled={isRecording} // Disable during recording
                    >
                      {Object.keys(ASPECT_RATIOS).map(ratio => (
                        <option key={ratio} value={ratio}>
                          {ratio}
                        </option>
                      ))}
                       {/* 'Fit to Screen' option - might require different handling for recording */}
                       {/* <option key={FIT_TO_SCREEN_RATIO} value={FIT_TO_SCREEN_RATIO}>
                         {FIT_TO_SCREEN_RATIO}
                       </option> */}
                    </select>

                  {/* Mute Toggle */}
                  <button
                    onClick={toggleMute}
                    className={`px-4 py-2 rounded transition-colors ${
                      isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-500 hover:bg-gray-600'
                    } text-white`}
                     disabled={isRecording} // Disable during recording
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
                  className="px-8 py-3 bg-green-500 text-white text-lg font-semibold rounded-full hover:bg-green-600 transition-colors mt-4 disabled:opacity-50"
                   disabled={!screenStreamRef.current || isRecording} // Disable if streams not ready or already recording
                >
                  Start Screen & Camera Recording
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
                        download={`screen-camera-recording-${new Date().toISOString()}.webm`}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center"
                     >
                        💾 Download Screen Recording
                     </a>
                   )}
                </div>
                 <p className="text-sm text-gray-600 mt-2">
                    {/* Update note to reflect combined recording attempt */}
                    Note: Attempting to record screen and camera combined. Playback and download should include both feeds.
                 </p>
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
        selectedAspectRatio={selectedAspectRatio} // Pass screen aspect ratio
        onClose={() => setIsTeleprompterVisible(false)}
      />

    </div> /* End of min-h-screen bg-gray-100 */
  );
};

export default ScreenCameraRecorderPage;
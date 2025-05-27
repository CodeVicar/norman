/**
 * Creates a combined MediaStream from screen and camera video elements and an audio stream
 * by drawing the video frames onto a canvas and capturing the canvas as a stream.
 *
 * @param {HTMLVideoElement} screenVideoElement The video element displaying the screen share.
 * @param {HTMLVideoElement} cameraVideoElement The video element displaying the camera feed.
 * @param {MediaStream} audioStream The audio stream from the microphone.
 * @param {number} outputWidth The desired width of the output video.
 * @param {number} outputHeight The desired height of the output video.
 * @param {number} fps The desired frame rate for the output video.
 * @returns {Promise<MediaStream|null>} A promise that resolves with the combined MediaStream or null if streams are not available.
 */
export const createCombinedStream = async (
  screenVideoElement,
  cameraVideoElement,
  audioStream,
  outputWidth,
  outputHeight,
  fps
) => {
  if (!screenVideoElement || !cameraVideoElement || !screenVideoElement.srcObject || !cameraVideoElement.srcObject) {
    console.error("Screen or camera video elements/srcObjects are not available.");
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    console.error("Could not get canvas context.");
    return null;
  }

  // Position and size for the camera overlay (bottom-left)
  const cameraOverlayWidth = outputWidth * 0.2; // 20% of output width
  const cameraOverlayHeight = cameraOverlayWidth / (ASPECT_RATIOS['16:9'].width / ASPECT_RATIOS['16:9'].height); // Maintain camera aspect ratio (assuming 16:9 camera)
  const cameraOverlayPadding = 20; // Padding from bottom and left
  const cameraOverlayX = cameraOverlayPadding;
  const cameraOverlayY = outputHeight - cameraOverlayHeight - cameraOverlayPadding;

  let animationFrameId = null;
  const drawFrame = () => {
    if (!screenVideoElement || !cameraVideoElement || screenVideoElement.paused || cameraVideoElement.paused) {
         animationFrameId = requestAnimationFrame(drawFrame); // Continue requesting if paused, maybe streams not ready
         return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, outputWidth, outputHeight);

    // Draw screen video (scaled to cover the canvas while maintaining aspect ratio)
    // Calculate aspect ratios
    const canvasAspectRatio = outputWidth / outputHeight;
    const screenAspectRatio = screenVideoElement.videoWidth / screenVideoElement.videoHeight;

    let screenDrawWidth, screenDrawHeight, screenDrawX, screenDrawY;

    if (screenAspectRatio > canvasAspectRatio) {
      // Screen is wider than canvas aspect ratio, fit height and center horizontally
      screenDrawHeight = outputHeight;
      screenDrawWidth = outputHeight * screenAspectRatio;
      screenDrawX = (outputWidth - screenDrawWidth) / 2;
      screenDrawY = 0;
    } else {
      // Screen is taller or same aspect ratio, fit width and center vertically
      screenDrawWidth = outputWidth;
      screenDrawHeight = outputWidth / screenAspectRatio;
      screenDrawX = 0;
      screenDrawY = (outputHeight - screenDrawHeight) / 2;
    }

     try {
       ctx.drawImage(screenVideoElement, screenDrawX, screenDrawY, screenDrawWidth, screenDrawHeight);
     } catch (e) {
        console.error("Error drawing screen video:", e);
     }


    // Draw camera video overlay
     try {
       ctx.drawImage(
         cameraVideoElement,
         cameraOverlayX,
         cameraOverlayY,
         cameraOverlayWidth,
         cameraOverlayHeight
       );
     } catch (e) {
        console.error("Error drawing camera video overlay:", e);
     }


    // Request next frame
    animationFrameId = requestAnimationFrame(drawFrame);
  };

  // Start the drawing loop
  drawFrame();

  // Capture stream from canvas
  const canvasStream = canvas.captureStream(fps);

  // Add audio track from the original audio stream
  if (audioStream) {
    audioStream.getAudioTracks().forEach(track => {
      canvasStream.addTrack(track);
    });
  }

   // Function to stop the drawing loop
   canvasStream.stopDrawing = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
       // Clean up canvas element if it was created here (and not needed in DOM)
       if (canvas && canvas.parentNode === null) {
          // If the canvas was not appended to the DOM, we can remove it from memory implicitly
          // If it was appended (e.g., for debugging), you'd need to canvas.remove()
       }
   };


  return canvasStream;
}; // Note: ASPECT_RATIOS is used here, might need to pass it or import it if not globally available

// Assuming ASPECT_RATIOS is defined or imported elsewhere if needed within this utility
// For now, copying a minimal definition for the utility to work standalone
const ASPECT_RATIOS = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
}; 
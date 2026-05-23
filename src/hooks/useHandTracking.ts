import { useEffect, useRef, useState } from 'react';
import { HandLandmarker, FilesetResolver, NormalizedLandmark } from '@mediapipe/tasks-vision';

export type HandTrackingStatus = 'loading' | 'ready' | 'error' | 'no-permission';

interface UseHandTrackingProps {
  onHandUpdate?: (indexFinger: NormalizedLandmark | null, middleFinger: NormalizedLandmark | null) => void;
}

interface UseHandTrackingResult {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: HandTrackingStatus;
  errorMessage: string;
}

export function useHandTracking({ onHandUpdate }: UseHandTrackingProps = {}): UseHandTrackingResult {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<HandTrackingStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);
  const onHandUpdateRef = useRef(onHandUpdate);

  useEffect(() => {
    onHandUpdateRef.current = onHandUpdate;
  }, [onHandUpdate]);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720, facingMode: 'user' } 
        });
        
        if (!active) return;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) videoRef.current.play();
          };
        }

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
        );
        
        if (!active) return;

        handLandmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        setStatus('ready');
        predictWebcam();

      } catch (err: any) {
        if (!active) return;
        if (err.name === 'NotAllowedError') {
          setStatus('no-permission');
          setErrorMessage('请允许摄像头权限以使用涂鸦功能');
        } else {
          setStatus('error');
          setErrorMessage(err.message || '加载手势识别模型失败');
        }
      }
    }

    init();

    return () => {
      active = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const predictWebcam = () => {
    const video = videoRef.current;
    const handLandmarker = handLandmarkerRef.current;

    // Check if video is ready and has valid dimensions
    if (video && handLandmarker && video.videoWidth > 0 && video.videoHeight > 0 && video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      
      const startTimeMs = performance.now();
      const results = handLandmarker.detectForVideo(video, startTimeMs);

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        // Index finger tip is 8, Middle finger tip is 12
        if (onHandUpdateRef.current) {
          onHandUpdateRef.current(landmarks[8], landmarks[12]);
        }
      } else {
        if (onHandUpdateRef.current) {
          onHandUpdateRef.current(null, null);
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(predictWebcam);
  };

  return {
    videoRef,
    status,
    errorMessage,
  };
}

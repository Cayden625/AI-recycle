
import React, { useRef, useEffect, useState } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';

interface CameraViewProps {
  onCapture: (base64Image: string) => void;
  onCancel: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Could not access camera. Please check permissions.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const base64 = canvas.toDataURL('image/png').split(',')[1];
        onCapture(base64);
      }
    }
  };

  return (
    <div className="relative h-[calc(100vh-160px)] bg-black rounded-3xl overflow-hidden shadow-2xl animate-scaleIn">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="absolute top-4 right-4">
        <button 
          onClick={onCancel}
          className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="absolute bottom-10 left-0 right-0 flex justify-center">
        <button 
          onClick={takePhoto}
          className="group relative flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-white/20 rounded-full scale-150 animate-pulse" />
          <div className="relative bg-white p-1 rounded-full border-4 border-emerald-500 shadow-2xl active:scale-90 transition-transform">
            <div className="bg-emerald-600 text-white p-5 rounded-full">
              <Camera size={32} />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default CameraView;

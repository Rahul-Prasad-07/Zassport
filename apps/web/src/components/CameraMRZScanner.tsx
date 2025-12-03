'use client';

import React, { useState, useRef, useCallback } from 'react';
import { createWorker, Worker } from 'tesseract.js';
import { MRZData } from '@/lib/nfc/types';
import { parseMRZ } from '@/lib/nfc/icao9303';

interface CameraMRZScannerProps {
  onMRZScanned: (mrz: MRZData) => void;
  onError?: (error: string) => void;
  onClose: () => void;
}

export function CameraMRZScanner({ onMRZScanned, onError, onClose }: CameraMRZScannerProps) {
  console.log('🎬 [CameraScanner] Component rendering...');
  
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);

  // Log when component mounts
  React.useEffect(() => {
    console.log('✨ [CameraScanner] Component mounted and ready');
    return () => {
      console.log('💀 [CameraScanner] Component unmounting, cleaning up...');
    };
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      console.log('🎥 [CameraScanner] Starting camera...');
      setStatus('Starting camera...');
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }
      
      console.log('📸 [CameraScanner] Requesting camera permission...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      console.log('✅ [CameraScanner] Camera permission granted');
      console.log('📹 [CameraScanner] Video tracks:', mediaStream.getVideoTracks().map(t => ({
        label: t.label,
        enabled: t.enabled,
        settings: t.getSettings()
      })));

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setStatus('Camera ready. Position passport MRZ in frame and click Capture');
        console.log('✅ [CameraScanner] Camera started successfully');
      }
    } catch (error: any) {
      console.error('❌ [CameraScanner] Camera error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      const errorMsg = error.name === 'NotAllowedError'
        ? 'Camera access denied. Please enable camera permissions in your browser settings.'
        : error.name === 'NotFoundError'
        ? 'No camera found on this device.'
        : error.name === 'NotReadableError'
        ? 'Camera is already in use by another application.'
        : `Camera error: ${error.message}`;
        
      setStatus(errorMsg);
      onError?.(errorMsg);
    }
  }, [onError]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, [stream]);

  // Capture and process image
  const captureAndProcess = useCallback(async () => {
    console.log('📸 [CameraScanner] Starting capture and process...');
    
    if (!videoRef.current || !canvasRef.current) {
      console.error('❌ [CameraScanner] Missing video or canvas ref');
      onError?.('Internal error: Missing video or canvas element');
      return;
    }

    setIsScanning(true);
    setStatus('Capturing image...');
    setProgress(0);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    console.log('📹 [CameraScanner] Video dimensions:', {
      videoWidth: video.videoWidth,
      videoHeight: video.videoHeight,
      readyState: video.readyState
    });

    if (!context) {
      console.error('❌ [CameraScanner] Canvas not supported');
      onError?.('Canvas not supported');
      setIsScanning(false);
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    console.log('🖼️ [CameraScanner] Canvas size set:', canvas.width, 'x', canvas.height);

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Crop to MRZ area (bottom 30% of image)
    const mrzHeight = Math.floor(canvas.height * 0.3);
    const mrzY = canvas.height - mrzHeight;
    
    console.log('✂️ [CameraScanner] Cropping MRZ area:', {
      mrzY,
      mrzHeight,
      width: canvas.width
    });
    
    const mrzImageData = context.getImageData(0, mrzY, canvas.width, mrzHeight);
    
    // Create new canvas with cropped MRZ area
    const mrzCanvas = document.createElement('canvas');
    mrzCanvas.width = canvas.width;
    mrzCanvas.height = mrzHeight;
    const mrzContext = mrzCanvas.getContext('2d');
    if (mrzContext) {
      mrzContext.putImageData(mrzImageData, 0, 0);
    }

    setStatus('Processing with OCR...');
    setProgress(20);

    try {
      console.log('🔧 [CameraScanner] Initializing Tesseract...');
      
      // Initialize Tesseract worker
      if (!workerRef.current) {
        console.log('🆕 [CameraScanner] Creating new Tesseract worker...');
        workerRef.current = await createWorker('eng', 1, {
          logger: (m) => {
            console.log('📊 [Tesseract]', m.status, m.progress);
            if (m.status === 'recognizing text') {
              setProgress(20 + Math.floor(m.progress * 60));
            }
          }
        });
        console.log('✅ [CameraScanner] Tesseract worker created');
      }

      const worker = workerRef.current;
      
      console.log('⚙️ [CameraScanner] Configuring Tesseract for MRZ...');
      // Configure for MRZ recognition
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
      });

      setProgress(30);
      setStatus('Recognizing text...');

      console.log('👁️ [CameraScanner] Starting OCR recognition...');
      // Perform OCR on MRZ area
      const { data: { text } } = await worker.recognize(mrzCanvas);
      
      console.log('📝 [CameraScanner] OCR raw text:', text);
      console.log('📏 [CameraScanner] Text length:', text.length);
      
      setProgress(90);
      setStatus('Parsing MRZ data...');

      // Clean and parse MRZ text
      const lines = text
        .split('\n')
        .map(line => line.trim().replace(/\s/g, ''))
        .filter(line => line.length > 30); // MRZ lines are typically 30-44 chars

      console.log('📋 [CameraScanner] Filtered MRZ lines:', lines);
      console.log('📊 [CameraScanner] Number of valid lines:', lines.length);

      if (lines.length < 2) {
        throw new Error('Could not detect MRZ. Please ensure passport is well-lit and MRZ is clearly visible.');
      }

      // Try to parse MRZ
      const mrzLines = lines.slice(0, 3); // Take first 2-3 lines
      console.log('🔍 [CameraScanner] Parsing MRZ lines:', mrzLines);
      
      const mrzData = parseMRZ(mrzLines);
      
      console.log('✅ [CameraScanner] MRZ parsed successfully:', mrzData);

      setProgress(100);
      setStatus('MRZ detected successfully!');
      
      // Wait a moment then callback
      setTimeout(() => {
        stopCamera();
        onMRZScanned(mrzData);
      }, 500);

    } catch (error: any) {
      console.error('❌ [CameraScanner] OCR Error:', error);
      console.error('Error stack:', error.stack);
      
      const errorMsg = error.message || 'Failed to read MRZ. Please try again or enter manually.';
      setStatus(errorMsg);
      onError?.(errorMsg);
      setIsScanning(false);
    }
  }, [onMRZScanned, onError, stopCamera]);

  // Start camera only once on mount
  React.useEffect(() => {
    console.log('🎬 [CameraScanner] useEffect - Starting camera once on mount');
    let mounted = true;
    
    const initCamera = async () => {
      if (mounted) {
        await startCamera();
      }
    };
    
    initCamera();
    
    // Cleanup on unmount
    return () => {
      console.log('🧹 [CameraScanner] useEffect cleanup - Stopping camera');
      mounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once!

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.95)' }}>
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Scan Passport MRZ</h2>
            <p className="text-slate-400 text-sm mt-1">Position the MRZ (bottom of passport) in the frame</p>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Camera View */}
        <div className="relative rounded-xl overflow-hidden" style={{ background: '#000' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto"
            style={{ maxHeight: '60vh' }}
          />
          
          {/* MRZ Guide Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-0 left-0 right-0 h-1/3 border-2 border-emerald-500 border-t-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: '#10b981', color: '#fff' }}>
                Position MRZ Here
              </div>
            </div>
          </div>

          {/* Processing Overlay */}
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0, 0, 0, 0.8)' }}>
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white font-semibold">{status}</p>
                <div className="w-64 h-2 bg-slate-700 rounded-full mt-4 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Controls */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex-1">
            <p className="text-sm text-slate-400">{status || 'Ready to scan'}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-6 py-3 rounded-xl font-semibold transition-all"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff'
              }}
            >
              Cancel
            </button>
            <button
              onClick={captureAndProcess}
              disabled={isScanning || !stream}
              className="px-8 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: isScanning ? '#6b7280' : 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: isScanning ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.4)'
              }}
            >
              {isScanning ? 'Processing...' : 'Capture & Scan'}
            </button>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <h3 className="text-sm font-semibold text-emerald-400 mb-2">📸 Tips for best results:</h3>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• Ensure good lighting - avoid shadows</li>
            <li>• Keep passport flat and steady</li>
            <li>• MRZ should be clearly visible in the frame</li>
            <li>• Use the guide box to align properly</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

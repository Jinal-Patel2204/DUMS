'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined';
import CameraAltOutlined from '@mui/icons-material/CameraAltOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import FlipCameraIosOutlined from '@mui/icons-material/FlipCameraIosOutlined';

export interface ImageUploadProps {
  value?: string | null;
  onChange: (file: File | null, previewUrl: string | null) => void;
  placeholder?: string;
  maxSizeMB?: number;
  accept?: string;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
}

export function ImageUpload({
  value,
  onChange,
  placeholder = 'Upload image or take photo',
  maxSizeMB = 5,
  accept = 'image/jpeg,image/png,image/webp',
  width = '100%',
  height = 180,
  borderRadius = 12,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check if device has camera
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        setHasCamera(devices.some(d => d.kind === 'videoinput'));
      }).catch(() => setHasCamera(false));
    }
  }, []);

  const handleFile = useCallback((file: File | null) => {
    setError('');
    if (!file) { setPreview(null); onChange(null, null); return; }
    if (file.size > maxSizeMB * 1024 * 1024) { setError(`File too large. Max ${maxSizeMB}MB.`); return; }
    if (!file.type.startsWith('image/')) { setError('Only image files allowed.'); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    onChange(file, url);
  }, [maxSizeMB, onChange]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0] || null);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files?.[0] || null);
  };

  const handleRemove = () => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    setPreview(null); onChange(null, null);
  };

  // ─── CAMERA ──────────────────────────────────────────

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const openCamera = () => { setCameraOpen(true); };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        handleFile(file);
      }
      stopCamera();
      setCameraOpen(false);
    }, 'image/jpeg', 0.9);
  };

  const flipCamera = () => {
    stopCamera();
    setFacingMode(f => f === 'user' ? 'environment' : 'user');
  };

  // Start camera when dialog opens
  useEffect(() => {
    if (!cameraOpen) return;
    let cancelled = false;
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        if (!cancelled) { setCameraOpen(false); }
      }
    };
    init();
    return () => { cancelled = true; stopCamera(); };
  }, [cameraOpen, facingMode]);

  return (
    <Box>
      <input ref={fileInputRef} type="file" accept={accept} hidden onChange={handleFileInput} />

      {preview ? (
        <Box sx={{ position: 'relative', width, height, borderRadius: `${borderRadius}px`, overflow: 'hidden' }}>
          <Box component="img" src={preview} alt="Preview" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <IconButton size="small" onClick={handleRemove} sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}>
            <DeleteOutlined sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      ) : (
        <Box
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          sx={{
            width, height, borderRadius: `${borderRadius}px`,
            border: '2px dashed', borderColor: dragOver ? 'secondary.main' : 'divider',
            bgcolor: dragOver ? 'rgba(99,102,241,0.04)' : 'background.default',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 1.5, cursor: 'pointer', transition: 'all 0.2s',
            '&:hover': { borderColor: 'secondary.main', bgcolor: 'rgba(99,102,241,0.02)' },
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <CloudUploadOutlined sx={{ fontSize: 32, color: 'text.disabled' }} />
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', px: 2 }}>
            {placeholder}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" variant="outlined" startIcon={<CloudUploadOutlined sx={{ fontSize: 14 }} />}
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              sx={{ textTransform: 'none', fontSize: '0.75rem', borderRadius: 1.5, borderColor: 'divider', color: 'text.secondary' }}>
              Upload
            </Button>
            {hasCamera && (
              <Button size="small" variant="outlined" startIcon={<CameraAltOutlined sx={{ fontSize: 14 }} />}
                onClick={(e) => { e.stopPropagation(); openCamera(); }}
                sx={{ textTransform: 'none', fontSize: '0.75rem', borderRadius: 1.5, borderColor: 'divider', color: 'text.secondary' }}>
                Camera
              </Button>
            )}
          </Box>
        </Box>
      )}

      {error && <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block' }}>{error}</Typography>}

      {/* Camera Dialog */}
      <Dialog open={cameraOpen} onClose={() => { stopCamera(); setCameraOpen(false); }} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, overflow: 'hidden' } } }}>
        <Box sx={{ position: 'relative', bgcolor: 'black' }}>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', display: 'block', maxHeight: '70vh' }} />
          <Box sx={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <IconButton onClick={flipCamera} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
              <FlipCameraIosOutlined />
            </IconButton>
            <IconButton onClick={capturePhoto} sx={{ bgcolor: 'white', color: 'secondary.main', width: 56, height: 56, '&:hover': { bgcolor: 'grey.100' } }}>
              <CameraAltOutlined sx={{ fontSize: 28 }} />
            </IconButton>
            <Button size="small" onClick={() => { stopCamera(); setCameraOpen(false); }} sx={{ color: 'white', textTransform: 'none' }}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}

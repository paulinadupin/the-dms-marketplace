import { useState, useRef, useEffect } from 'react';
import { StorageService } from '../services/storage.service';

interface ImageInputProps {
  mode: 'url' | 'upload';
  url: string;
  file: File | null;
  onUrlChange: (url: string) => void;
  onFileChange: (file: File | null) => void;
  onModeChange: (mode: 'url' | 'upload') => void;
  currentImageUrl?: string; // For edit mode - shows existing image
}

export function ImageInput({
  mode,
  url,
  file,
  onUrlChange,
  onFileChange,
  onModeChange,
  currentImageUrl,
}: ImageInputProps) {
  const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl || url || '');
  const [compressing, setCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState('');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when URL changes
  useEffect(() => {
    if (mode === 'url' && url) {
      setPreviewUrl(url);
      setError('');
    }
  }, [url, mode]);

  // Update preview when file changes
  useEffect(() => {
    if (mode === 'upload' && file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [file, mode]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    onUrlChange(newUrl);
    setError('');
  };

  const handleFileSelect = async (selectedFile: File) => {
    setError('');
    setCompressing(true);
    setCompressionProgress('Validating file...');

    try {
      // Validate file type and size
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
      if (!validTypes.includes(selectedFile.type)) {
        throw new Error('Invalid file type. Please upload PNG, JPG, WEBP, or GIF images only.');
      }

      const maxSize = 2 * 1024 * 1024; // 2MB
      if (selectedFile.size > maxSize) {
        throw new Error('File size exceeds 2MB limit. Please choose a smaller image.');
      }

      setCompressionProgress(`Compressing... (Original: ${(selectedFile.size / 1024).toFixed(0)} KB)`);

      // Note: Actual compression will happen during upload in the modal
      // For now, just accept the file for preview
      onFileChange(selectedFile);
      setCompressionProgress(`Ready to upload (Size: ${(selectedFile.size / 1024).toFixed(0)} KB)`);
    } catch (err: any) {
      setError(err.message);
      onFileChange(null);
    } finally {
      setCompressing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleClear = () => {
    onFileChange(null);
    onUrlChange('');
    setPreviewUrl('');
    setError('');
    setCompressionProgress('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ marginBottom: '15px' }}>
      {/* Mode Toggle */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
          <input
            type="radio"
            checked={mode === 'url'}
            onChange={() => {
              onModeChange('url');
              setError('');
            }}
          />
          Image URL
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
          <input
            type="radio"
            checked={mode === 'upload'}
            onChange={() => {
              onModeChange('upload');
              setError('');
            }}
          />
          Upload File
        </label>
      </div>

      {/* URL Input Mode */}
      {mode === 'url' && (
        <div>
          <input
            type="url"
            value={url}
            onChange={handleUrlChange}
            placeholder="https://example.com/image.jpg"
            className="form-input"
            style={{ width: '100%', marginBottom: '10px' }}
          />
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '5px 0' }}>
            Paste a direct link to an image
          </p>
        </div>
      )}

      {/* Upload File Mode */}
      {mode === 'upload' && (
        <div>
          <div
            className={`image-input-container ${isDragging ? 'drag-over' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? 'var(--color-button-primary)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '30px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: isDragging ? 'var(--background-card-secondary)' : 'transparent',
              transition: 'all 0.2s',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />

            {!file && (
              <div>
                <p style={{ margin: '0 0 10px 0', fontSize: '16px', color: 'var(--color-text-primary)' }}>
                  📁 Click to browse or drag and drop
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  PNG, JPG, WEBP, or GIF (max 2MB)
                </p>
              </div>
            )}

            {file && (
              <div>
                <p style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                  ✓ {file.name}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  Click to replace
                </p>
              </div>
            )}
          </div>

          {compressing && (
            <p className="image-upload-progress" style={{ marginTop: '10px', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              {compressionProgress}
            </p>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          backgroundColor: 'var(--danger-zone)',
          border: '1px solid var(--color-button-danger)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-button-danger)',
          fontSize: '14px',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Image Preview */}
      {previewUrl && !error && (
        <div style={{ marginTop: '15px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
          }}>
            <strong style={{ fontSize: '14px' }}>Preview:</strong>
            <button
              type="button"
              onClick={handleClear}
              className="btn btn-secondary btn-sm"
            >
              Clear Image
            </button>
          </div>
          <div style={{
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '10px',
            backgroundColor: 'var(--background-card-secondary)',
            textAlign: 'center',
          }}>
            <img
              src={previewUrl}
              alt="Preview"
              className="image-preview"
              style={{
                maxWidth: '100%',
                maxHeight: '200px',
                borderRadius: 'var(--radius-md)',
                objectFit: 'contain',
              }}
              onError={() => {
                setError('Failed to load image. Please check the URL or try a different file.');
                setPreviewUrl('');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

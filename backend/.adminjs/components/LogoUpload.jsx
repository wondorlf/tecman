import React, { useState } from 'react';
import { Box, Label, Button, Text, DropZone, MessageBox } from '@adminjs/design-system';

// ── Validation constants ──────────────────────────────────────────────────────
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const FORMATTED_TYPES = 'PNG, JPG, WebP, GIF, SVG';
const FORMATTED_MAX_SIZE = '5 MB';

/**
 * Validate a file before upload.
 * Returns null if valid, or an error message string if invalid.
 */
function validateFile(file) {
  if (!file) return 'No se ha seleccionado ningún archivo.';

  // Check file extension as fallback (some browsers might not set MIME correctly for SVGs)
  const ext = file.name?.split('.').pop()?.toLowerCase();
  const mimeOk = ALLOWED_TYPES.includes(file.type);
  const extOk = ALLOWED_EXTENSIONS.includes(ext);

  if (!mimeOk && !extOk) {
    return `Tipo de archivo no válido: "${file.type || ext}". Solo se permiten imágenes: ${FORMATTED_TYPES}.`;
  }

  if (file.size > MAX_SIZE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return `El archivo es demasiado grande (${mb} MB). El tamaño máximo es ${FORMATTED_MAX_SIZE}.`;
  }

  return null;
}

const LogoUpload = (props) => {
  const { property, record, onChange } = props;
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(
    record?.params?.[property.name] || ''
  );

  const currentValue = record?.params?.[property.name] || '';

  const handleUpload = async (files) => {
    const file = files?.[0] || files;
    if (!file) return;

    // ── Client-side validation ──────────────────────────────────────────
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/storage/public-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Error del servidor (${response.status})`);
      }

      const data = await response.json();
      const url = data.url;

      setPreviewUrl(url);
      onChange(property.name, url);
    } catch (err) {
      setUploadError(err.message || 'Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl('');
    onChange(property.name, '');
  };

  return (
    <Box marginBottom="lg">
      <Label>{property.label}</Label>

      {/* Current logo preview */}
      {(previewUrl || currentValue) && (
        <Box marginBottom="default">
          <img
            src={previewUrl || currentValue}
            alt="Logo preview"
            style={{
              maxHeight: 80,
              maxWidth: 200,
              objectFit: 'contain',
              border: '1px solid #e2e8f0',
              borderRadius: 8,
              padding: 8,
              background: '#fff',
              display: 'block',
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </Box>
      )}

      {/* File upload via DropZone */}
      <DropZone
        onChange={(files) => handleUpload(files)}
        validate={{
          mimeTypes: ALLOWED_TYPES,
          maxSize: MAX_SIZE_BYTES,
        }}
      />

      {/* Validation hints */}
      <Text variant="xs" color="grey60" marginTop="xs">
        Formatos aceptados: {FORMATTED_TYPES}. Tamaño máximo: {FORMATTED_MAX_SIZE}.
      </Text>

      {uploading && (
        <Text variant="sm" marginTop="sm" color="grey80">
          Subiendo archivo...
        </Text>
      )}

      {uploadError && (
        <MessageBox
          variant="danger"
          marginTop="sm"
          message={uploadError}
        />
      )}

      {/* Current value indicator */}
      {currentValue && (
        <Box marginTop="sm">
          <Text variant="xs" color="grey60">
            URL actual: {currentValue}
          </Text>
        </Box>
      )}

      {/* Remove button */}
      {currentValue && (
        <Box marginTop="sm">
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleRemove}
          >
            Eliminar logo
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default LogoUpload;

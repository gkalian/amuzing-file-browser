// Small helper utilities extracted for simple unit tests

export function isTextLike(mimeType: string | false) {
  if (!mimeType) return false;
  return (
    mimeType.startsWith('text/') ||
    ['application/json', 'application/xml', 'application/yaml', 'application/x-yaml'].includes(
      mimeType
    )
  );
}

export function isImageLike(mimeType: string | false) {
  if (!mimeType) return false;
  return mimeType.startsWith('image/');
}

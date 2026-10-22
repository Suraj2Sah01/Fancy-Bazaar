export async function copyToClipboard(text: string): Promise<boolean> {
  // If navigator.clipboard is not available, use the deprecated execCommand
  if (!navigator.clipboard) {
    return fallbackCopyToClipboard(text);
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy using navigator.clipboard: ', err);
    // If it's a focus error, we might try again after a small delay if focus is regained,
    // but usually fallback is better.
    return fallbackCopyToClipboard(text);
  }
}

function fallbackCopyToClipboard(text: string): boolean {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  
  // Ensure the textarea is not visible but part of the document
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  textArea.style.top = "0";
  document.body.appendChild(textArea);
  
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback copy failed: ', err);
    document.body.removeChild(textArea);
    return false;
  }
}

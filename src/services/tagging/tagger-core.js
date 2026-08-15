import { generateTags as generateHeuristicTags } from '../../utils/tagger.js';
import { showToast } from '../../utils/dom.js';

let mlTagger = null;

/**
 * Generate tags for an APOD object.
 * It will use heuristic tags immediately.
 * If ML tags are requested (via UI interaction), it dynamically imports ML logic.
 * 
 * @param {Object} apod - The APOD object from the NASA API.
 * @returns {Promise<string[]>} - An array of tags.
 */
export async function getInitialTags(apod) {
  // Use heuristic tagger as the baseline so we don't block the UI
  return await generateHeuristicTags(apod);
}

/**
 * Generates advanced tags using Local Machine Learning (MobileNet).
 * This dynamically loads the TensorFlow model only when called.
 * 
 * @param {HTMLImageElement} imageElement - The DOM image element
 * @returns {Promise<string[]>}
 */
export async function generateAITags(imageElement) {
  try {
    // Lazy load the ML module so it doesn't block Vite's initial bundle
    if (!mlTagger) {
      showToast('✦ Preparing cosmic intelligence...', 'info');
      mlTagger = await import('./ml-tagger.js');
    }
    
    showToast('✦ Analyzing image locally...', 'info');
    
    // Create a CORS-friendly duplicate image for TFJS to read
    const proxyImg = new Image();
    proxyImg.crossOrigin = 'anonymous';
    // Use a CORS proxy so we can draw it to WebGL
    proxyImg.src = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageElement.src)}`;
    
    await new Promise((resolve, reject) => {
      proxyImg.onload = resolve;
      proxyImg.onerror = () => reject(new Error("CORS Proxy Failed"));
    });
    
    const tags = await mlTagger.generateMLTags(proxyImg);
    showToast('✓ Tags generated locally', 'success');
    return tags;
  } catch (err) {
    console.error("ML tagging failed, falling back", err);
    showToast('Local AI tagging is unavailable on this device.', 'error');
    return null;
  }
}

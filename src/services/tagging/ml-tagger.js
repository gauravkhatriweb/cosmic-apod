import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

let model = null;
let isLoading = false;

/**
 * Initialize the MobileNet model lazily.
 */
export async function initMLModel() {
  if (model) return model;
  if (isLoading) {
    // Wait until it finishes loading
    while (isLoading) {
      await new Promise(r => setTimeout(r, 100));
    }
    return model;
  }
  
  try {
    isLoading = true;
    
    // Ensure WebGL backend is used if possible for performance
    await tf.setBackend('webgl').catch(() => tf.setBackend('cpu'));
    await tf.ready();

    model = await mobilenet.load({ version: 2, alpha: 0.5 }); // Lightweight version
    
    return model;
  } catch (error) {
    console.error('Failed to load ML model:', error);
    throw error;
  } finally {
    isLoading = false;
  }
}

/**
 * Generate ML tags for an image.
 * 
 * @param {HTMLImageElement} imageElement - The image element to classify.
 * @returns {Promise<string[]>} - An array of tags.
 */
export async function generateMLTags(imageElement) {
  try {
    const loadedModel = await initMLModel();
    if (!loadedModel) throw new Error("Model failed to load");

    // Classify the image
    const predictions = await loadedModel.classify(imageElement);
    
    // MobileNet might return random Earth-like things for abstract space images.
    // We filter for high probability or take top 3.
    const tags = predictions
      .filter(p => p.probability > 0.05)
      .map(p => {
        // MobileNet returns classes like "space shuttle", we capitalize it
        const className = p.className.split(',')[0].trim();
        return className.charAt(0).toUpperCase() + className.slice(1);
      });
      
    // Always append "AI Generated" to distinguish from heuristic tags
    if (tags.length > 0) {
      return [...tags.slice(0, 3), 'AI Generated'];
    }
    
    return ['Deep Space', 'AI Generated'];
  } catch (error) {
    console.error('ML tagging failed:', error);
    throw error;
  }
}

/**
 * Intelligent Tagging System for Cosmic APOD.
 * 
 * Extracts relevant cosmic tags from APOD titles and explanations.
 * This is a lightweight, synchronous heuristic tagger.
 * It is fully isolated and decoupled, so it can be swapped with 
 * a real TensorFlow.js/ONNX model later if needed, without rewriting the app.
 */

// A simple dictionary mapping keywords to core tags.
const TAG_DICTIONARY = {
  'Galaxy': ['galaxy', 'galaxies', 'milky way', 'andromeda'],
  'Nebula': ['nebula', 'nebulas', 'nebulae'],
  'Planet': ['planet', 'planets', 'jupiter', 'saturn', 'mars', 'venus', 'mercury', 'uranus', 'neptune', 'pluto'],
  'Moon': ['moon', 'lunar', 'eclipse', 'apollo'],
  'Star': ['star', 'stars', 'stellar', 'sun', 'solar'],
  'Black Hole': ['black hole', 'event horizon', 'singularity', 'quasar'],
  'Earth': ['earth', 'terrestrial', 'globe'],
  'Solar System': ['solar system', 'asteroid', 'comet', 'meteor'],
  'Spacecraft': ['spacecraft', 'probe', 'satellite', 'telescope', 'hubble', 'webb', 'iss', 'station', 'rover'],
  'Astronaut': ['astronaut', 'spacewalk', 'eva'],
  'Supernova': ['supernova', 'remnant', 'explosion'],
  'Cluster': ['cluster', 'globular', 'pleiades'],
  'Deep Space': ['deep space', 'cosmos', 'universe', 'background radiation'],
  'Landscape': ['landscape', 'horizon', 'skyline', 'mountain', 'observatory'],
  'Night Sky': ['night sky', 'aurora', 'constellation', 'meteor shower', 'night']
};

/**
 * Generate tags for an APOD object based on its text content.
 * 
 * @param {Object} apod - The APOD object from the NASA API.
 * @returns {Promise<string[]>} - An array of tags.
 */
export async function generateTags(apod) {
  // If the APOD already has tags (cached or provided), return them.
  if (apod.tags && Array.isArray(apod.tags)) {
    return apod.tags;
  }

  // Combine title and explanation for analysis. Convert to lowercase for matching.
  const textContent = `${apod.title} ${apod.explanation}`.toLowerCase();
  const matchedTags = new Set();

  for (const [tag, keywords] of Object.entries(TAG_DICTIONARY)) {
    for (const keyword of keywords) {
      // Use word boundary regex to match whole words/phrases
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(textContent)) {
        matchedTags.add(tag);
        break; // Once a tag is matched, no need to check other keywords for this tag
      }
    }
  }

  // Fallback if no tags found
  if (matchedTags.size === 0) {
    if (apod.media_type === 'image') matchedTags.add('Night Sky');
    else matchedTags.add('Deep Space');
  }

  // Limit to max 4 tags
  return Array.from(matchedTags).slice(0, 4);
}

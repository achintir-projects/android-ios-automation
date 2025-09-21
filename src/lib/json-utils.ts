// Utility functions for JSON cleaning and validation
export function cleanAndValidateJSON(content: string): any {
  try {
    // Remove markdown formatting
    let cleanContent = content.trim();
    cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    cleanContent = cleanContent.replace(/#{1,6}\s.*$/gm, '');
    cleanContent = cleanContent.replace(/^\s*[-*+]\s.*$/gm, '');
    cleanContent = cleanContent.replace(/^\s*\d+\.\s.*$/gm, '');
    
    // Extract JSON object
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanContent = jsonMatch[0];
    }
    
    // Fix common JSON issues
    cleanContent = cleanContent.replace(/,\s*([}\]])/g, '$1');
    cleanContent = cleanContent.replace(/(\w+)\s*:/g, '"$1":');
    cleanContent = cleanContent.replace(/:\s*'([^']*)'/g, ': "$1"');
    
    // Try to parse
    return JSON.parse(cleanContent);
  } catch (error) {
    console.error('Failed to clean and validate JSON:', error);
    throw new Error('Invalid JSON format');
  }
}

export function isValidJSON(content: string): boolean {
  try {
    cleanAndValidateJSON(content);
    return true;
  } catch {
    return false;
  }
}
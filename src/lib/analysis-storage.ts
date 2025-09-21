// Shared storage for analysis results
// In a production application, this would be replaced with a proper database

// Global singleton instance - this will be shared across all imports
declare global {
  var _analysisResultsStorage: Map<string, any> | undefined;
}

// Create or get the singleton instance
const analysisResults = global._analysisResultsStorage || new Map<string, any>();

// Store it globally for future imports
if (!global._analysisResultsStorage) {
  global._analysisResultsStorage = analysisResults;
}

// Helper functions for managing analysis results
export const storeAnalysisResult = (responseId: string, result: any) => {
  console.log(`Storing analysis result for ${responseId}:`, JSON.stringify(result, null, 2));
  const storedResult = {
    ...result,
    responseId,
    status: 'completed',
    completedAt: new Date().toISOString()
  };
  analysisResults.set(responseId, storedResult);
  console.log(`Stored result for ${responseId}:`, storedResult.status);
  console.log(`Total stored results: ${analysisResults.size}`);
  console.log('Available responseIds:', Array.from(analysisResults.keys()));
};

export const getAnalysisResult = (responseId: string) => {
  const result = analysisResults.get(responseId);
  console.log(`Retrieving analysis result for ${responseId}:`, result ? 'Found' : 'Not found');
  return result;
};

export const deleteAnalysisResult = (responseId: string) => {
  return analysisResults.delete(responseId);
};

// Clean up old results (older than 1 hour)
export const cleanupOldResults = () => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  let cleanedCount = 0;
  for (const [responseId, result] of analysisResults.entries()) {
    if (new Date(result.completedAt).getTime() < oneHourAgo) {
      analysisResults.delete(responseId);
      cleanedCount++;
    }
  }
  console.log(`Cleaned up ${cleanedCount} old results`);
};

// Debug function to list all stored results
export const listStoredResults = () => {
  console.log('Currently stored results:');
  for (const [responseId, result] of analysisResults.entries()) {
    console.log(`- ${responseId}: ${result.status} at ${result.completedAt}`);
  }
  return analysisResults.size;
};

// Run cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupOldResults, 60 * 60 * 1000);
}
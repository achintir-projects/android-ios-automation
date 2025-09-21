// Mock vector database implementation for development
// In production, this would use a real vector database like Supabase with pgvector

export class VectorDatabase {
  private knowledgeStore: Map<string, any[]> = new Map();

  constructor() {
    // Initialize with empty knowledge store
  }

  // Initialize the vector database with required tables
  async initialize() {
    console.log('Mock vector database initialized successfully');
  }

  // Add documents to the knowledge base
  async addDocuments(documents: any[]) {
    try {
      for (const doc of documents) {
        if (!this.knowledgeStore.has(doc.domain)) {
          this.knowledgeStore.set(doc.domain, []);
        }
        this.knowledgeStore.get(doc.domain)!.push(doc);
      }
      
      console.log(`Added ${documents.length} documents to knowledge base`);
      return documents;
    } catch (error) {
      console.error('Failed to add documents:', error);
      throw error;
    }
  }

  // Search for relevant documents using vector similarity (mock implementation)
  async searchRelevantContext(query: string, domain: string, limit: number = 5): Promise<string[]> {
    try {
      const domainDocuments = this.knowledgeStore.get(domain) || [];
      
      if (domainDocuments.length === 0) {
        console.warn(`No documents found for domain: ${domain}`);
        return [];
      }
      
      // Simple keyword-based matching for mock implementation
      const queryWords = query.toLowerCase().split(/\s+/);
      const scoredDocs = domainDocuments.map(doc => {
        const content = doc.content.toLowerCase();
        const score = queryWords.reduce((acc, word) => {
          return acc + (content.includes(word) ? 1 : 0);
        }, 0);
        return { doc, score };
      });
      
      // Sort by score and return top results
      const topDocs = scoredDocs
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.doc.content);
      
      return topDocs;
    } catch (error) {
      console.error('Failed to search knowledge base:', error);
      return [];
    }
  }

  // Generate embedding for text (mock implementation)
  private async generateEmbedding(text: string): Promise<number[]> {
    // Mock embedding generation
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(1536).fill(0); // Standard embedding size
    
    words.forEach((word, index) => {
      const hash = this.simpleHash(word);
      embedding[index % embedding.length] = (hash % 1000) / 1000;
    });
    
    return embedding;
  }

  // Simple hash function for mock embeddings
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Get all domains in the knowledge base
  async getDomains(): Promise<string[]> {
    return Array.from(this.knowledgeStore.keys());
  }
}

// Types for the knowledge base
export interface KnowledgeDocument {
  id: string;
  domain: string;
  content: string;
  metadata: {
    source: string;
    type: 'feature' | 'requirement' | 'user_story' | 'best_practice';
    tags: string[];
  };
  embedding: number[];
}

// Singleton instance
export const vectorDb = new VectorDatabase();
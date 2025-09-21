import { getRelevantContext } from './knowledge-base';

export interface RAGPromptConfig {
  systemRole: string;
  instructions: string;
  outputSchema: any;
  domainSpecificGuidance: Record<string, string>;
}

export class RAGPromptingSystem {
  private config: RAGPromptConfig;

  constructor() {
    this.config = {
      systemRole: `You are an expert product manager and software architect with deep domain expertise. Your task is to convert vague user ideas into detailed, structured, and technically sound application specifications. You are meticulous, think step-by-step, and your output must be in a precise JSON format.

You have access to a comprehensive knowledge base containing domain-specific features, requirements, and best practices. Use this knowledge to generate highly specific and context-aware specifications.`,
      
      instructions: `### CRITICAL INSTRUCTIONS:

1. **Domain Expertise**: Immerse yourself in the retrieved context. If the context is about banking, output banking-specific features (e.g., "Mobile Check Deposit", "Fraud Alerts"). If it's about e-commerce, output e-commerce features (e.g., "Shopping Cart", "Wishlist"). Do not output generic features.

2. **Structure Your Output**: You MUST output a valid JSON object that strictly adheres to the specified schema. Do not include any other text before or after the JSON.

3. **Specificity is Key**: Avoid generic phrases like "user management". Instead, specify what that means *for this domain*. For banking, it becomes "Secure Customer Onboarding (KYC)" with specific requirements about identity verification.

4. **Prioritization**: Assign priorities (HIGH, MEDIUM, LOW) realistically. A "Login" feature is always HIGH. A "Branch Locator" might be MEDIUM.

5. **Context-Based Generation**: Base your response SOLELY on the retrieved context and user input. Do not make up features that aren't supported by the context.

6. **If Unclear**: If the user input is too vague even after context retrieval, make a reasonable assumption based on the retrieved context to complete the specification. Do not ask follow-up questions in the output.`,
      
      outputSchema: {
        project_name: "A generated name for the app based on the request and domain.",
        core_domain: "The primary domain identified (e.g., Retail Banking, E-Commerce, Health & Fitness).",
        features: [
          {
            name: "A concise name for the feature (e.g., 'Biometric Login').",
            description: "A 1-2 sentence description of the feature.",
            user_story: "A full user story in the format: 'As a [type of user], I want to [perform some action] so that I can [achieve some goal].'",
            priority: "HIGH | MEDIUM | LOW",
            functional_requirements: [
              "A specific, testable requirement. (e.g., 'The system shall allow users to authenticate using Touch ID or Face ID.')",
              "Another specific requirement. (e.g., 'The system shall fall back to PIN entry after three failed biometric attempts.')"
            ],
            non_functional_requirements: [
              "A requirement covering security, performance, etc. (e.g., 'Biometric data shall be stored securely in the device's keychain and never transmitted to external servers.')"
            ]
          }
        ]
      },
      
      domainSpecificGuidance: {
        banking: `Focus on security, compliance, financial transactions, and customer trust. Features should include authentication, account management, payments, fraud detection, and regulatory compliance. Prioritize security and reliability above all else.`,
        ecommerce: `Focus on user experience, conversion optimization, product discovery, and seamless transactions. Features should include product catalog, shopping cart, checkout, recommendations, and customer engagement. Prioritize user experience and sales conversion.`,
        healthcare: `Focus on patient care, data privacy, regulatory compliance, and interoperability. Features should include electronic medical records, appointments, telemedicine, prescriptions, and patient engagement. Prioritize HIPAA compliance and patient safety.`,
        kyc: `Focus on identity verification, compliance, risk assessment, and fraud prevention. Features should include identity verification, document management, AML screening, risk assessment, and compliance reporting. Prioritize regulatory compliance and security.`
      }
    };
  }

  // Generate the complete prompt for the LLM
  async generatePrompt(userInput: string, detectedDomain: string): Promise<string> {
    // Retrieve relevant context from knowledge base
    const retrievedContext = await getRelevantContext(userInput, detectedDomain);
    
    // Get domain-specific guidance
    const domainGuidance = this.config.domainSpecificGuidance[detectedDomain as keyof typeof this.config.domainSpecificGuidance] || '';
    
    // Construct the complete prompt
    const prompt = `
### SYSTEM ROLE:
${this.config.systemRole}

### DOMAIN-SPECIFIC GUIDANCE:
${domainGuidance}

### CONTEXT FROM KNOWLEDGE BASE:
${retrievedContext}

### USER'S ORIGINAL REQUEST:
${userInput}

### YOUR TASK:
Based SOLELY on the "CONTEXT FROM KNOWLEDGE BASE" and the "USER'S ORIGINAL REQUEST" provided above, generate a comprehensive and structured application specification.

${this.config.instructions}

### OUTPUT SCHEMA:
You MUST output a valid JSON object that follows this exact structure:
${JSON.stringify(this.config.outputSchema, null, 2)}

### REMEMBER:
- Generate at least 5-8 core features for the identified domain
- Make features specific to the domain, not generic
- Include both functional and non-functional requirements
- Write complete user stories in the specified format
- Assign realistic priorities based on domain importance
- Ensure the JSON is valid and properly formatted
`;

    return prompt.trim();
  }

  // Generate a fallback prompt when knowledge base is not available
  generateFallbackPrompt(userInput: string, detectedDomain: string): string {
    const domainGuidance = this.config.domainSpecificGuidance[detectedDomain as keyof typeof this.config.domainSpecificGuidance] || '';
    
    return `
### SYSTEM ROLE:
${this.config.systemRole}

### DOMAIN-SPECIFIC GUIDANCE:
${domainGuidance}

### USER'S ORIGINAL REQUEST:
${userInput}

### YOUR TASK:
Generate a comprehensive and structured application specification for the ${detectedDomain} domain based on the user's request.

${this.config.instructions}

### OUTPUT SCHEMA:
You MUST output a valid JSON object that follows this exact structure:
${JSON.stringify(this.config.outputSchema, null, 2)}

### REMEMBER:
- Generate at least 5-8 core features for the ${detectedDomain} domain
- Make features specific to the ${detectedDomain} domain, not generic
- Include both functional and non-functional requirements
- Write complete user stories in the specified format
- Assign realistic priorities based on domain importance
- Ensure the JSON is valid and properly formatted
`.trim();
  }

  // Update configuration
  updateConfig(newConfig: Partial<RAGPromptConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  getConfig(): RAGPromptConfig {
    return { ...this.config };
  }
}

// Singleton instance
export const ragPromptingSystem = new RAGPromptingSystem();
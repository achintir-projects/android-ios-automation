import { KnowledgeDocument } from './vector-db';

// Domain-specific knowledge base content
export const domainKnowledgeBase: Record<string, KnowledgeDocument[]> = {
  banking: [
    {
      id: 'banking_auth_001',
      domain: 'banking',
      content: `Secure Customer Authentication: Banking applications require multi-factor authentication including biometric verification (fingerprint, facial recognition), PIN entry, and one-time passwords (OTP) via SMS or authenticator apps. Security must comply with PCI DSS standards and financial regulations.`,
      metadata: {
        source: 'PCI DSS Security Standards',
        type: 'best_practice',
        tags: ['security', 'authentication', 'compliance']
      },
      embedding: [] // Will be populated by vector DB
    },
    {
      id: 'banking_check_deposit_001',
      domain: 'banking',
      content: `Mobile Check Deposit: Users can deposit checks by capturing images of front and back. System must perform OCR validation, detect fraud patterns, verify endorsements, and provide real-time status updates. Must comply with Check 21 Act and banking regulations.`,
      metadata: {
        source: 'Banking Feature Documentation',
        type: 'feature',
        tags: ['mobile', 'deposit', 'ocr', 'compliance']
      },
      embedding: []
    },
    {
      id: 'banking_account_dashboard_001',
      domain: 'banking',
      content: `Real-Time Account Dashboard: Comprehensive overview showing all account balances, recent transactions, spending analytics, and quick actions. Must update in real-time with data no older than 60 seconds. Include balance alerts and transaction notifications.`,
      metadata: {
        source: 'Banking UX Best Practices',
        type: 'feature',
        tags: ['dashboard', 'real-time', 'analytics', 'notifications']
      },
      embedding: []
    },
    {
      id: 'banking_fraud_detection_001',
      domain: 'banking',
      content: `Advanced Fraud Detection: Real-time monitoring of transactions using machine learning algorithms to detect unusual patterns. Must include velocity checks, geolocation validation, behavioral analysis, and immediate alert system for suspicious activities.`,
      metadata: {
        source: 'Financial Security Guidelines',
        type: 'feature',
        tags: ['fraud', 'security', 'ml', 'real-time']
      },
      embedding: []
    },
    {
      id: 'banking_bill_pay_001',
      domain: 'banking',
      content: `Bill Payment System: Users can schedule one-time and recurring payments to payees. Must support electronic checks, ACH transfers, and wire transfers. Include payment reminders, confirmation tracking, and integration with biller networks.`,
      metadata: {
        source: 'Banking Payment Systems',
        type: 'feature',
        tags: ['payments', 'scheduling', 'integration', 'tracking']
      },
      embedding: []
    },
    {
      id: 'banking_card_controls_001',
      domain: 'banking',
      content: `Card Management Controls: Users can temporarily lock/unlock cards, set spending limits, restrict transaction types, and enable/disable international usage. Real-time controls with immediate effect and transaction notifications.`,
      metadata: {
        source: 'Card Management Best Practices',
        type: 'feature',
        tags: ['cards', 'controls', 'limits', 'security']
      },
      embedding: []
    }
  ],
  
  ecommerce: [
    {
      id: 'ecommerce_cart_001',
      domain: 'ecommerce',
      content: `Shopping Cart System: Persistent shopping cart that saves items across sessions. Support for quantity adjustments, item removal, promo codes, gift wrapping options, and estimated tax/shipping calculations. Must handle inventory validation in real-time.`,
      metadata: {
        source: 'E-commerce Platform Documentation',
        type: 'feature',
        tags: ['cart', 'persistence', 'inventory', 'promotions']
      },
      embedding: []
    },
    {
      id: 'ecommerce_checkout_001',
      domain: 'ecommerce',
      content: `Streamlined Checkout Process: Multi-step checkout with guest checkout option, address validation, multiple payment methods (credit cards, digital wallets, buy-now-pay-later), order review, and order confirmation. Must support saved payment methods and shipping addresses.`,
      metadata: {
        source: 'E-commerce UX Guidelines',
        type: 'feature',
        tags: ['checkout', 'payments', 'addresses', 'ux']
      },
      embedding: []
    },
    {
      id: 'ecommerce_product_search_001',
      domain: 'ecommerce',
      content: `Advanced Product Search: Full-text search with filters for category, price range, brand, ratings, and specifications. Include autocomplete suggestions, search history, spelling corrections, and relevance ranking based on popularity and user behavior.`,
      metadata: {
        source: 'E-commerce Search Best Practices',
        type: 'feature',
        tags: ['search', 'filters', 'autocomplete', 'relevance']
      },
      embedding: []
    },
    {
      id: 'ecommerce_recommendations_001',
      domain: 'ecommerce',
      content: `Personalized Recommendations: AI-driven product recommendations based on browsing history, purchase behavior, similar users, and trending items. Include "frequently bought together", "customers who bought this also bought", and "you might also like" sections.`,
      metadata: {
        source: 'E-commerce Personalization',
        type: 'feature',
        tags: ['recommendations', 'ai', 'personalization', 'analytics']
      },
      embedding: []
    },
    {
      id: 'ecommerce_reviews_001',
      domain: 'ecommerce',
      content: `Customer Reviews System: Users can write reviews with ratings, photos, and videos. Include review moderation, helpfulness voting, review filtering by rating, and review highlights. Must prevent fake reviews and display authentic customer feedback.`,
      metadata: {
        source: 'E-commerce Community Features',
        type: 'feature',
        tags: ['reviews', 'ratings', 'moderation', 'community']
      },
      embedding: []
    },
    {
      id: 'ecommerce_inventory_001',
      domain: 'ecommerce',
      content: `Real-Time Inventory Management: Synchronized inventory across all sales channels with stock level alerts, backorder management, and low-stock notifications. Support for multiple warehouses, dropshipping, and inventory forecasting.`,
      metadata: {
        source: 'E-commerce Operations',
        type: 'feature',
        tags: ['inventory', 'synchronization', 'forecasting', 'operations']
      },
      embedding: []
    }
  ],
  
  healthcare: [
    {
      id: 'healthcare_emr_001',
      domain: 'healthcare',
      content: `Electronic Medical Records (EMR): Secure storage and management of patient health records including medical history, medications, allergies, lab results, and imaging studies. Must comply with HIPAA regulations and support interoperability with other healthcare systems.`,
      metadata: {
        source: 'Healthcare IT Standards',
        type: 'feature',
        tags: ['emr', 'hipaa', 'interoperability', 'security']
      },
      embedding: []
    },
    {
      id: 'healthcare_appointments_001',
      domain: 'healthcare',
      content: `Appointment Scheduling System: Online booking, rescheduling, and cancellation of appointments with healthcare providers. Include calendar integration, automated reminders via SMS/email, waitlist management, and telemedicine appointment options.`,
      metadata: {
        source: 'Healthcare Practice Management',
        type: 'feature',
        tags: ['appointments', 'scheduling', 'reminders', 'telemedicine']
      },
      embedding: []
    },
    {
      id: 'healthcare_telemedicine_001',
      domain: 'healthcare',
      content: `Telemedicine Platform: Secure video consultations between patients and healthcare providers. Include virtual waiting room, screen sharing capabilities, prescription sending, and integration with medical devices. Must ensure end-to-end encryption and HIPAA compliance.`,
      metadata: {
        source: 'Telemedicine Guidelines',
        type: 'feature',
        tags: ['telemedicine', 'video', 'security', 'hipaa']
      },
      embedding: []
    },
    {
      id: 'healthcare_prescriptions_001',
      domain: 'healthcare',
      content: `E-Prescription System: Digital prescription management with drug interaction checking, allergy alerts, dosage calculations, and electronic transmission to pharmacies. Include medication history, refill requests, and adherence tracking.`,
      metadata: {
        source: 'Pharmacy Management Systems',
        type: 'feature',
        tags: ['prescriptions', 'medications', 'interactions', 'pharmacy']
      },
      embedding: []
    },
    {
      id: 'healthcare_billing_001',
      domain: 'healthcare',
      content: `Medical Billing System: Insurance verification, claims processing, billing statements, and payment processing. Support for multiple insurance providers, co-pay calculations, deductible tracking, and explanation of benefits (EOB) generation.`,
      metadata: {
        source: 'Healthcare Revenue Cycle',
        type: 'feature',
        tags: ['billing', 'insurance', 'claims', 'payments']
      },
      embedding: []
    },
    {
      id: 'healthcare_patient_portal_001',
      domain: 'healthcare',
      content: `Patient Portal: Secure online access for patients to view medical records, test results, appointment schedules, and billing information. Include messaging with healthcare providers, educational resources, and health tracking tools.`,
      metadata: {
        source: 'Patient Engagement Platforms',
        type: 'feature',
        tags: ['portal', 'access', 'messaging', 'engagement']
      },
      embedding: []
    }
  ],
  
  kyc: [
    {
      id: 'kyc_identity_verification_001',
      domain: 'kyc',
      content: `Identity Verification System: Multi-layered identity verification using government-issued IDs, biometric data, and document authentication. Include liveness detection, facial recognition, OCR document extraction, and identity proofing with confidence scoring.`,
      metadata: {
        source: 'KYC Compliance Guidelines',
        type: 'feature',
        tags: ['identity', 'verification', 'biometrics', 'ocr']
      },
      embedding: []
    },
    {
      id: 'kyc_aml_screening_001',
      domain: 'kyc',
      content: `AML Screening Engine: Real-time screening against global watchlists, sanctions lists (OFAC, UN, EU), and PEP databases. Include ongoing monitoring, risk scoring, suspicious activity reporting, and audit trail maintenance for regulatory compliance.`,
      metadata: {
        source: 'Anti-Money Laundering Regulations',
        type: 'feature',
        tags: ['aml', 'screening', 'compliance', 'monitoring']
      },
      embedding: []
    },
    {
      id: 'kyc_document_management_001',
      domain: 'kyc',
      content: `Document Management System: Secure storage and management of KYC documents with OCR capabilities, version control, and document expiration tracking. Support for multiple document types (passports, driver's licenses, utility bills) and automated data extraction.`,
      metadata: {
        source: 'Document Management Best Practices',
        type: 'feature',
        tags: ['documents', 'ocr', 'storage', 'automation']
      },
      embedding: []
    },
    {
      id: 'kyc_risk_assessment_001',
      domain: 'kyc',
      content: `Risk Assessment Engine: Dynamic risk scoring based on customer profile, transaction patterns, geographic location, and behavior analysis. Include risk-based due diligence levels, ongoing risk monitoring, and automated risk alerts.`,
      metadata: {
        source: 'Risk Management Framework',
        type: 'feature',
        tags: ['risk', 'scoring', 'monitoring', 'compliance']
      },
      embedding: []
    },
    {
      id: 'kyc_compliance_reporting_001',
      domain: 'kyc',
      content: `Compliance Reporting System: Automated generation of regulatory reports including SARs, CTRs, and audit trails. Include customizable report templates, scheduled report generation, and integration with regulatory filing systems.`,
      metadata: {
        source: 'Regulatory Compliance Requirements',
        type: 'feature',
        tags: ['reporting', 'compliance', 'automation', 'audit']
      },
      embedding: []
    },
    {
      id: 'kyc_customer_onboarding_001',
      domain: 'kyc',
      content: `Digital Customer Onboarding: Streamlined onboarding process with automated data collection, identity verification, risk assessment, and compliance checks. Include progress tracking, document upload, and real-time status updates.`,
      metadata: {
        source: 'Customer Onboarding Best Practices',
        type: 'feature',
        tags: ['onboarding', 'automation', 'customer_experience', 'compliance']
      },
      embedding: []
    }
  ],
  
  general: [
    {
      id: 'general_user_management_001',
      domain: 'general',
      content: `User Management System: Comprehensive user account management with registration, login, profile management, and role-based access control. Include password reset, email verification, and user activity tracking.`,
      metadata: {
        source: 'General Application Best Practices',
        type: 'feature',
        tags: ['users', 'authentication', 'profiles', 'access_control']
      },
      embedding: []
    },
    {
      id: 'general_data_management_001',
      domain: 'general',
      content: `Data Management System: Robust data storage, retrieval, and management capabilities with proper data modeling, validation, and integrity checks. Include backup systems, data migration tools, and data analytics.`,
      metadata: {
        source: 'Data Management Best Practices',
        type: 'feature',
        tags: ['data', 'storage', 'validation', 'analytics']
      },
      embedding: []
    },
    {
      id: 'general_security_framework_001',
      domain: 'general',
      content: `Security Framework: Comprehensive security measures including authentication, authorization, encryption, input validation, and audit logging. Implement industry-standard security practices and regular security assessments.`,
      metadata: {
        source: 'Application Security Guidelines',
        type: 'feature',
        tags: ['security', 'authentication', 'encryption', 'audit']
      },
      embedding: []
    },
    {
      id: 'general_api_integration_001',
      domain: 'general',
      content: `API Integration Layer: RESTful API design with proper documentation, versioning, rate limiting, and error handling. Include third-party service integrations, webhooks, and real-time data synchronization.`,
      metadata: {
        source: 'API Design Best Practices',
        type: 'feature',
        tags: ['api', 'integration', 'documentation', 'webhooks']
      },
      embedding: []
    },
    {
      id: 'general_ui_components_001',
      domain: 'general',
      content: `User Interface Components: Responsive and accessible UI components with proper UX design patterns, form validation, error handling, and user feedback. Include mobile-first design and cross-browser compatibility.`,
      metadata: {
        source: 'UI/UX Design Guidelines',
        type: 'feature',
        tags: ['ui', 'ux', 'responsive', 'accessibility']
      },
      embedding: []
    },
    {
      id: 'general_analytics_reporting_001',
      domain: 'general',
      content: `Analytics and Reporting: Comprehensive analytics dashboard with data visualization, custom reports, and real-time monitoring. Include user behavior tracking, performance metrics, and business intelligence insights.`,
      metadata: {
        source: 'Analytics Best Practices',
        type: 'feature',
        tags: ['analytics', 'reporting', 'visualization', 'monitoring']
      },
      embedding: []
    }
  ]
};

// Function to initialize the knowledge base
export async function initializeKnowledgeBase() {
  const { vectorDb } = await import('./vector-db');
  
  // Initialize vector database
  await vectorDb.initialize();
  
  // Add all documents to the vector database
  for (const [domain, documents] of Object.entries(domainKnowledgeBase)) {
    try {
      await vectorDb.addDocuments(documents);
      console.log(`Initialized knowledge base for domain: ${domain}`);
    } catch (error) {
      console.error(`Failed to initialize knowledge base for ${domain}:`, error);
    }
  }
}

// Function to get relevant context for a query
export async function getRelevantContext(query: string, domain: string): Promise<string> {
  const { vectorDb } = await import('./vector-db');
  
  const relevantDocuments = await vectorDb.searchRelevantContext(query, domain, 5);
  
  if (relevantDocuments.length === 0) {
    console.warn(`No relevant context found for domain: ${domain}`);
    return '';
  }
  
  // Join the relevant documents into a single context string
  return relevantDocuments.join('\n\n');
}

// Function to get all available domains
export async function getAvailableDomains(): Promise<string[]> {
  const { vectorDb } = await import('./vector-db');
  return await vectorDb.getDomains();
}
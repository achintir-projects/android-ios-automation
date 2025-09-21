import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for saved apps (in production, this would use a database)
export const savedApps = new Map();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const isTemplate = searchParams.get('template') === 'true';
    
    // Filter apps based on template status
    const apps = Array.from(savedApps.values()).filter(app => 
      isTemplate ? app.isTemplate : true
    );
    
    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedApps = apps.slice(startIndex, endIndex);
    
    return NextResponse.json({
      success: true,
      data: paginatedApps,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(apps.length / limit),
        totalItems: apps.length,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching saved apps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved apps' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      originalInput,
      domain,
      requirements,
      specifications,
      metadata = {},
      isTemplate = false,
      tags = []
    } = body;
    
    // Validate required fields
    if (!name || !originalInput || !requirements) {
      return NextResponse.json(
        { error: 'Missing required fields: name, originalInput, requirements' },
        { status: 400 }
      );
    }
    
    // Create new saved app
    const savedApp = {
      id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description: description || '',
      originalInput,
      domain: domain || 'general',
      requirements: typeof requirements === 'string' ? requirements : JSON.stringify(requirements),
      specifications: specifications ? (typeof specifications === 'string' ? specifications : JSON.stringify(specifications)) : '{}',
      metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata),
      isTemplate,
      tags: typeof tags === 'string' ? tags : JSON.stringify(tags),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store the app
    savedApps.set(savedApp.id, savedApp);
    
    console.log(`Saved app: ${savedApp.name} (${savedApp.id})`);
    
    return NextResponse.json({
      success: true,
      data: savedApp,
      message: 'App saved successfully'
    });
  } catch (error) {
    console.error('Error saving app:', error);
    return NextResponse.json(
      { error: 'Failed to save app' },
      { status: 500 }
    );
  }
}
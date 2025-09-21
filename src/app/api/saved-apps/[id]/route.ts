import { NextRequest, NextResponse } from 'next/server';
import { savedApps } from '../../route';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const app = savedApps.get(id);
    
    if (!app) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: app
    });
  } catch (error) {
    console.error('Error fetching saved app:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved app' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const existingApp = savedApps.get(id);
    
    if (!existingApp) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 }
      );
    }
    
    // Update the app
    const updatedApp = {
      ...existingApp,
      ...body,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };
    
    // Handle nested objects that need to be stringified
    if (body.requirements && typeof body.requirements !== 'string') {
      updatedApp.requirements = JSON.stringify(body.requirements);
    }
    
    if (body.specifications && typeof body.specifications !== 'string') {
      updatedApp.specifications = JSON.stringify(body.specifications);
    }
    
    if (body.metadata && typeof body.metadata !== 'string') {
      updatedApp.metadata = JSON.stringify(body.metadata);
    }
    
    if (body.tags && typeof body.tags !== 'string') {
      updatedApp.tags = JSON.stringify(body.tags);
    }
    
    savedApps.set(id, updatedApp);
    
    console.log(`Updated app: ${updatedApp.name} (${id})`);
    
    return NextResponse.json({
      success: true,
      data: updatedApp,
      message: 'App updated successfully'
    });
  } catch (error) {
    console.error('Error updating saved app:', error);
    return NextResponse.json(
      { error: 'Failed to update saved app' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const app = savedApps.get(id);
    
    if (!app) {
      return NextResponse.json(
        { error: 'App not found' },
        { status: 404 }
      );
    }
    
    savedApps.delete(id);
    
    console.log(`Deleted app: ${app.name} (${id})`);
    
    return NextResponse.json({
      success: true,
      message: 'App deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting saved app:', error);
    return NextResponse.json(
      { error: 'Failed to delete saved app' },
      { status: 500 }
    );
  }
}
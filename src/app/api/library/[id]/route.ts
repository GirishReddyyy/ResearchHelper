import { NextResponse } from 'next/server';
import { mongoLibraryRepo } from '@/lib/repositories/mongoLibraryRepository';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const id = decodeURIComponent(params.id);
    const saved = await mongoLibraryRepo.isSaved(id);
    return NextResponse.json({ saved });
  } catch (error: any) {
    console.error("Library [id] GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const id = decodeURIComponent(params.id);
    await mongoLibraryRepo.remove(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Library [id] DELETE Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { mongoLibraryRepo } from '@/lib/repositories/mongoLibraryRepository';
import { Paper } from '@/lib/types';

export async function GET() {
  try {
    const papers = await mongoLibraryRepo.getAll();
    return NextResponse.json({ papers });
  } catch (error: any) {
    console.error("Library GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const paper: Paper = await request.json();
    
    if (!paper || !paper.id) {
      return NextResponse.json({ error: 'Invalid paper data' }, { status: 400 });
    }

    await mongoLibraryRepo.save(paper);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Library POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json(
        { error: 'Resolutions backup not available in this environment.' },
        { status: 503 }
    );
}

export async function POST() {
    return NextResponse.json(
        { error: 'Resolutions restore not available in this environment.' },
        { status: 503 }
    );
}

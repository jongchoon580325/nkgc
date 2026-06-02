import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json(
        { error: 'Gallery backup not available in this environment.' },
        { status: 503 }
    );
}

export async function POST() {
    return NextResponse.json(
        { error: 'Gallery restore not available in this environment.' },
        { status: 503 }
    );
}

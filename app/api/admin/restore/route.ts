import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import AdmZip from 'adm-zip';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
            return NextResponse.json(
                { error: 'Unauthorized - Please login' },
                { status: 401 }
            );
        }

        if (session.user.role?.toLowerCase() !== 'admin') {
        }

        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(bytes);

        // Create temporary directory for extraction
        const tempDir = path.join(process.cwd(), 'temp_restore');
        await fs.mkdir(tempDir, { recursive: true });

        try {
            // Extract ZIP file
            const zip = new AdmZip(buffer);
            const dbDest = path.join(process.cwd(), 'prisma', 'dev.db');
            try {
                await fs.access(dbSource);
                await fs.copyFile(dbSource, dbDest);
            }

            // Restore data directory
            const dataSource = path.join(tempDir, 'data');
            const dataDest = path.join(process.cwd(), 'data');
            try {
                await fs.access(dataSource);
                // Remove existing data directory and replace with backup
                await fs.rm(dataDest, { recursive: true, force: true });
                await copyDirectory(dataSource, dataDest);
            }

            // Restore uploads directory
            const uploadsSource = path.join(tempDir, 'uploads');
            const uploadsDest = path.join(process.cwd(), 'public', 'uploads');
            try {
                await fs.access(uploadsSource);
                // Remove existing uploads directory and replace with backup
                await fs.rm(uploadsDest, { recursive: true, force: true });
                await copyDirectory(uploadsSource, uploadsDest);
            }

            // Clean up temp directory
            await fs.rm(tempDir, { recursive: true, force: true });

        } catch (extractError) {
            // Clean up on error
            await fs.rm(tempDir, { recursive: true, force: true });
            throw extractError;
        }

    } catch (error) {
        console.error('Restore error:', error);
        return NextResponse.json(
            { error: 'Failed to restore backup', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

// Helper function to recursively copy directory
async function copyDirectory(src: string, dest: string) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            await copyDirectory(srcPath, destPath);
        } else {
            await fs.copyFile(srcPath, destPath);
        }
    }
}

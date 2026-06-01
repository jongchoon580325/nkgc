import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdmZip from 'adm-zip';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Unauthorized - Please login' },
                { status: 401 }
            );
        }

        if (session.user.role?.toLowerCase() !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized - Admin access required' },
                { status: 401 }
            );
        }


        // Get the uploaded file
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }


        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create temporary directory for extraction
        const tempDir = path.join(process.cwd(), 'temp_restore');
        await fs.mkdir(tempDir, { recursive: true });

        try {
            // Extract ZIP file
            const zip = new AdmZip(buffer);
            zip.extractAllTo(tempDir, true);

            // Restore database
            const dbSource = path.join(tempDir, 'database', 'dev.db');
            const dbDest = path.join(process.cwd(), 'prisma', 'dev.db');
            try {
                await fs.access(dbSource);
                await fs.copyFile(dbSource, dbDest);
            } catch (err) {
            }

            // Restore data directory
            const dataSource = path.join(tempDir, 'data');
            const dataDest = path.join(process.cwd(), 'data');
            try {
                await fs.access(dataSource);
                // Remove existing data directory and replace with backup
                await fs.rm(dataDest, { recursive: true, force: true });
                await copyDirectory(dataSource, dataDest);
            } catch (err) {
            }

            // Restore uploads directory
            const uploadsSource = path.join(tempDir, 'uploads');
            const uploadsDest = path.join(process.cwd(), 'public', 'uploads');
            try {
                await fs.access(uploadsSource);
                // Remove existing uploads directory and replace with backup
                await fs.rm(uploadsDest, { recursive: true, force: true });
                await copyDirectory(uploadsSource, uploadsDest);
            } catch (err) {
            }

            // Clean up temp directory
            await fs.rm(tempDir, { recursive: true, force: true });

            return NextResponse.json({
                success: true,
                message: 'System restored successfully'
            });

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

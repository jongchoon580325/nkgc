import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import archiver from 'archiver';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        console.log('Session:', session);
        console.log('User role:', session?.user?.role);

        if (!session || !session.user) {
            console.log('No session or user found');
            return NextResponse.json(
                { error: 'Unauthorized - Please login' },
                { status: 401 }
            );
        }

        if (session.user.role?.toLowerCase() !== 'admin') {
            console.log('User is not admin, role is:', session.user.role);
            return NextResponse.json(
                { error: 'Unauthorized - Admin access required' },
                { status: 401 }
            );
        }

        console.log('Authentication passed, creating backup...');

        // Create a new archiver instance
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });

        // Paths to backup
        const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
        const dataPath = path.join(process.cwd(), 'data');
        const uploadsPath = path.join(process.cwd(), 'public', 'uploads');

        // Collect chunks
        const chunks: Buffer[] = [];

        return new Promise<Response>((resolve, reject) => {
            // Set up event listeners BEFORE adding files
            archive.on('data', (chunk: Buffer) => {
                chunks.push(chunk);
            });

            archive.on('end', () => {
                const buffer = Buffer.concat(chunks);
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];

                resolve(new Response(buffer, {
                    headers: {
                        'Content-Type': 'application/zip',
                        'Content-Disposition': `attachment; filename="nkgc-backup-${timestamp}.zip"`,
                    },
                }));
            });

            archive.on('error', (err) => {
                console.error('Archive error:', err);
                reject(NextResponse.json(
                    { error: 'Failed to create backup', details: err.message },
                    { status: 500 }
                ));
            });

            // Now add files
            (async () => {
                try {
                    // Add database file
                    try {
                        await fs.access(dbPath);
                        archive.file(dbPath, { name: 'database/dev.db' });
                        console.log('Added database to backup');
                    } catch {
                        console.log('Database file not found, skipping...');
                    }

                    // Add data directory (JSON files)
                    try {
                        await fs.access(dataPath);
                        archive.directory(dataPath, 'data');
                        console.log('Added data directory to backup');
                    } catch {
                        console.log('Data directory not found, skipping...');
                    }

                    // Add uploads directory
                    try {
                        await fs.access(uploadsPath);
                        archive.directory(uploadsPath, 'uploads');
                        console.log('Added uploads directory to backup');
                    } catch {
                        console.log('Uploads directory not found, skipping...');
                    }

                    // Finalize the archive after adding all files
                    await archive.finalize();
                    console.log('Archive finalized');
                } catch (error) {
                    console.error('Error adding files to archive:', error);
                    reject(NextResponse.json(
                        { error: 'Failed to add files to backup' },
                        { status: 500 }
                    ));
                }
            })();
        });

    } catch (error) {
        console.error('Backup error:', error);
        return NextResponse.json(
            { error: 'Failed to create backup' },
            { status: 500 }
        );
    }
}

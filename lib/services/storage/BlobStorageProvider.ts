import { put, del } from '@vercel/blob';
import { IStorageProvider } from './StorageInterface';

export class BlobStorageProvider implements IStorageProvider {
    async upload(file: Buffer, fileName: string, mimeType: string): Promise<string> {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const pathname = `media/${year}/${month}/${fileName}`;

        const { url } = await put(pathname, file, {
            access: 'public',
            contentType: mimeType,
        });

        return url;
    }

    async delete(urlOrPath: string): Promise<void> {
        if (urlOrPath.startsWith('https://')) {
            await del(urlOrPath);
        }
        // 로컬 경로(/uploads/...)는 Vercel에서 삭제 불필요 — silently skip
    }
}

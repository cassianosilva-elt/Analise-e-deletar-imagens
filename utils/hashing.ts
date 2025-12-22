import { FolderItem, FileItem, ItemType } from '../types';

const hashBuffer = async (buffer: ArrayBuffer): Promise<string> => {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const getContentFingerprint = async (file: File): Promise<string> => {
    if (file.size === 0) return 'empty';

    // Sample head and tail (64KB each)
    const headSize = Math.min(file.size, 64 * 1024);
    const tailStart = Math.max(0, file.size - 64 * 1024);

    const head = file.slice(0, headSize);
    const tail = file.slice(tailStart);

    const headBuffer = await head.arrayBuffer();
    const tailBuffer = await tail.arrayBuffer();

    // Combine buffers for hashing
    const combined = new Uint8Array(headBuffer.byteLength + tailBuffer.byteLength);
    combined.set(new Uint8Array(headBuffer), 0);
    combined.set(new Uint8Array(tailBuffer), headBuffer.byteLength);

    return await hashBuffer(combined.buffer);
};

export const generateFolderHash = async (folder: FolderItem): Promise<string> => {
    const fileHashes: string[] = [];

    // Process all images for fingerprinting
    const images = folder.children.filter(child => child.type === ItemType.IMAGE) as FileItem[];
    images.sort((a, b) => a.name.localeCompare(b.name));

    for (const item of images) {
        const file = item.fileObject;
        if (file) {
            // For robust caching, we sample content AND metadata
            const fingerprint = await getContentFingerprint(file);
            fileHashes.push(`${item.name}:${fingerprint}:${file.size}:${file.lastModified}`);
        } else {
            fileHashes.push(item.name);
        }
    }

    const manifest = fileHashes.sort().join('|');
    const encoder = new TextEncoder();
    return await hashBuffer(encoder.encode(manifest).buffer);
};

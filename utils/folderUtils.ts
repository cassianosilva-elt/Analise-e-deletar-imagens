import { FolderItem, ItemType } from '../types';

export const countFolders = (folder: FolderItem): number => {
    let count = 0;
    folder.children.forEach(child => {
        if (child.type === ItemType.FOLDER) {
            count += 1 + countFolders(child as FolderItem);
        }
    });
    return count;
};

export const getAllSubfolders = (folder: FolderItem): FolderItem[] => {
    let folders: FolderItem[] = [];
    folder.children.forEach(child => {
        if (child.type === ItemType.FOLDER) {
            folders.push(child as FolderItem);
            folders = folders.concat(getAllSubfolders(child as FolderItem));
        }
    });
    return folders;
};

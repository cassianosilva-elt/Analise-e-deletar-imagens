import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { db } from '../db/db';
import { historyService, HistoryEntry } from './historyService';

export const syncService = {
    async enqueueSync(folderName: string, payload: any) {
        // Skip sync if Supabase is not configured
        if (!isSupabaseConfigured) {
            console.log(`[Sync] Skipped (Supabase not configured): ${folderName}`);
            return;
        }

        // Always write to IndexedDB first (Local-first)
        await db.syncQueue.put({
            folderName,
            payload,
            timestamp: Date.now()
        });

        console.log(`[Sync] Enqueued sync for ${folderName}`);

        // Attempt to process immediately if online
        if (navigator.onLine) {
            this.processQueue();
        }
    },

    async processQueue() {
        if (!isSupabaseConfigured || !navigator.onLine) return;

        const pending = await db.syncQueue.toArray();
        if (pending.length === 0) return;

        console.log(`[Sync] Processing queue: ${pending.length} items`);

        for (const item of pending) {
            try {
                await historyService.saveAnalysis(item.payload);
                await db.syncQueue.delete(item.id!);
                console.log(`[Sync] Successfully synced ${item.folderName}`);
            } catch (error) {
                console.warn(`[Sync] Failed to sync ${item.folderName}:`, error);
                // Stop processing on error - will retry later
                break;
            }
        }
    },

    startSyncListeners() {
        if (!isSupabaseConfigured) {
            console.log('[Sync] Listeners disabled (Supabase not configured)');
            return;
        }

        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                console.log('[Sync] Online detected. Processing queue...');
                this.processQueue();
            });
            // Also process on start
            this.processQueue();
        }
    },

    async syncFolder(folderName: string, localResult: any) {
        return localResult;
    },

    async getRemoteEntry(folderName: string): Promise<HistoryEntry | null> {
        if (!isSupabaseConfigured) return null;

        try {
            const { data, error } = await supabase
                .from('analyses_history')
                .select('*')
                .eq('folder_name', folderName)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            return data as HistoryEntry | null;
        } catch (error) {
            console.warn('[Sync] Failed to get remote entry:', error);
            return null;
        }
    }
};

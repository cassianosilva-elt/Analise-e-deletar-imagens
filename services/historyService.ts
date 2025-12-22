import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AnalysisStatus } from '../types';

export interface HistoryEntry {
    id: string;
    user_id: string;
    folder_name: string;
    status: AnalysisStatus;
    summary: string | null;
    observation: string | null;
    selected_files: string[];
    created_at: string;
}

export const historyService = {
    async saveAnalysis(entry: Omit<HistoryEntry, 'id' | 'user_id' | 'created_at'>) {
        if (!isSupabaseConfigured) {
            console.log('[History] Skipped save (Supabase not configured)');
            return null;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.warn('[History] Skipped save (user not authenticated)');
                return null;
            }

            const { data, error } = await supabase
                .from('analyses_history')
                .insert({
                    ...entry,
                    user_id: user.id
                })
                .select()
                .single();

            if (error) throw error;
            return data as HistoryEntry;
        } catch (error) {
            console.warn('[History] Failed to save analysis:', error);
            return null;
        }
    },

    async getHistory(): Promise<HistoryEntry[]> {
        if (!isSupabaseConfigured) {
            console.log('[History] Skipped fetch (Supabase not configured)');
            return [];
        }

        try {
            const { data, error } = await supabase
                .from('analyses_history')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as HistoryEntry[];
        } catch (error) {
            console.warn('[History] Failed to get history:', error);
            return [];
        }
    },

    async deleteEntry(id: string): Promise<boolean> {
        if (!isSupabaseConfigured) {
            console.log('[History] Skipped delete (Supabase not configured)');
            return false;
        }

        try {
            const { error } = await supabase
                .from('analyses_history')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return true;
        } catch (error) {
            console.warn('[History] Failed to delete entry:', error);
            return false;
        }
    }
};

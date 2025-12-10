/**
 * Equipment Service - On-Demand Fetching
 * Fetches equipment data only when needed (for uploaded folders)
 * Caches found equipment for fast O(1) lookups
 */

import { EquipmentInfo } from '../types';

const API_URL = 'https://script.google.com/macros/s/AKfycbzXpzgaA64P147rIqeaLEkCZ4YQcz5rJOn89Ag8Pf3p8EIg0Beisa9dS0OL-UEOsIWL/exec';

// In-memory cache for found equipment (O(1) lookup)
const equipmentByNParada: Map<number, EquipmentInfo> = new Map();
const equipmentByNEletro: Map<string, EquipmentInfo> = new Map();

// Track pending lookups to avoid duplicate requests
const pendingLookups: Map<string, Promise<EquipmentInfo | null>> = new Map();

interface APIResponse {
    status: string;
    count: number;
    total: number;
    data: APIEquipmentRecord[];
}

interface APIEquipmentRecord {
    "Nº Eletro": string;
    "Nº Parada": number;
    "Identificador do Local": string;
    "Ponto": string;
    "Área de Trabalho": string;
    "Endereço": string;
    "Bairro": string;
    "Cidade": string;
    "Estado": string;
    "Praça": string;
    "Tipo de Equipamento": string;
    "Tipo de Estabelecimento": string;
    "Latitude": number;
    "Longitude": number;
    "Status": string;
    "Data Cadastro": string;
    "Filial": string;
    "Área de Risco": string;
    "Modelo de Abrigo": string;
    "Tipo de Adesivo": string;
    "Tipo de Piso": string;
    "Energizado": string;
    "Luminária": string;
    "Abrigo Amigo": string;
    "Wi-Fi": string;
    "Câmera": string;
    "Altura do Totem": string;
    "Painel Digital": string;
    "Painel Digital - Tipo": string;
    "Painel Digital - Posição": string;
    "Painel Estático": string;
    "Painel Estático - Tipo": string;
    "Painel Estático - Posição": string;
    "Link Operações": string;
    "Foto Referência": string;
    "Observações": string;
}

/**
 * Transform API record to our EquipmentInfo interface
 */
function transformRecord(record: APIEquipmentRecord): EquipmentInfo {
    return {
        nEletro: record["Nº Eletro"],
        nParada: record["Nº Parada"],
        endereco: record["Endereço"],
        bairro: record["Bairro"],
        cidade: record["Cidade"],
        estado: record["Estado"],
        modeloAbrigo: record["Modelo de Abrigo"],
        linkOperacoes: record["Link Operações"],
        tipoEquipamento: record["Tipo de Equipamento"],
        painelDigital: record["Painel Digital"],
        painelEstatico: record["Painel Estático"],
        latitude: record["Latitude"],
        longitude: record["Longitude"],
        ponto: record["Ponto"],
        areaTrabalho: record["Área de Trabalho"],
        status: record["Status"],
    };
}

/**
 * Add equipment to in-memory cache
 */
function cacheEquipment(info: EquipmentInfo) {
    if (info.nParada) {
        equipmentByNParada.set(info.nParada, info);
    }
    if (info.nEletro) {
        equipmentByNEletro.set(info.nEletro.toUpperCase(), info);
    }
}

/**
 * Search API for equipment by Nº Parada or Nº Eletro
 * The API supports searching via query parameters
 */
async function searchEquipmentFromAPI(type: 'parada' | 'eletro', value: number | string): Promise<EquipmentInfo | null> {
    try {
        // Build search URL - the API searches through all records
        // We fetch in pages and search for our value
        let offset = 0;
        const pageSize = 1000;

        while (true) {
            const url = `${API_URL}?offset=${offset}&limit=${pageSize}`;
            const response = await fetch(url);

            if (!response.ok) {
                console.error(`[Equipment] API error: ${response.status}`);
                return null;
            }

            const data: APIResponse = await response.json();

            // Search in this page
            for (const record of data.data) {
                if (type === 'parada' && record["Nº Parada"] === value) {
                    const info = transformRecord(record);
                    cacheEquipment(info);
                    console.log(`[Equipment] Found by N° Parada: ${value}`);
                    return info;
                }
                if (type === 'eletro' && record["Nº Eletro"]?.toUpperCase() === (value as string).toUpperCase()) {
                    const info = transformRecord(record);
                    cacheEquipment(info);
                    console.log(`[Equipment] Found by N° Eletro: ${value}`);
                    return info;
                }
            }

            // Check if we've fetched all data
            if (offset + data.count >= data.total) {
                console.log(`[Equipment] Not found: ${type} = ${value}`);
                return null;
            }

            offset += data.count;

            // Small delay between pages
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    } catch (error) {
        console.error(`[Equipment] Search error:`, error);
        return null;
    }
}

/**
 * Look up equipment by Nº Parada (from cache or API)
 */
export async function lookupByNParada(nParada: number): Promise<EquipmentInfo | null> {
    // Check cache first
    const cached = equipmentByNParada.get(nParada);
    if (cached) return cached;

    // Check if there's already a pending lookup
    const lookupKey = `parada_${nParada}`;
    if (pendingLookups.has(lookupKey)) {
        return pendingLookups.get(lookupKey)!;
    }

    // Fetch from API
    const lookupPromise = searchEquipmentFromAPI('parada', nParada);
    pendingLookups.set(lookupKey, lookupPromise);

    try {
        const result = await lookupPromise;
        return result;
    } finally {
        pendingLookups.delete(lookupKey);
    }
}

/**
 * Look up equipment by Nº Eletro (from cache or API)
 */
export async function lookupByNEletro(nEletro: string): Promise<EquipmentInfo | null> {
    const upperEletro = nEletro.toUpperCase();

    // Check cache first
    const cached = equipmentByNEletro.get(upperEletro);
    if (cached) return cached;

    // Check if there's already a pending lookup
    const lookupKey = `eletro_${upperEletro}`;
    if (pendingLookups.has(lookupKey)) {
        return pendingLookups.get(lookupKey)!;
    }

    // Fetch from API
    const lookupPromise = searchEquipmentFromAPI('eletro', upperEletro);
    pendingLookups.set(lookupKey, lookupPromise);

    try {
        const result = await lookupPromise;
        return result;
    } finally {
        pendingLookups.delete(lookupKey);
    }
}

/**
 * Extract equipment code from folder name
 * Handles multiple formats:
 * - Pure number: "480014794"
 * - Nº Eletro format: "A08802"
 * - Mixed with description: "480014794 - Abrigo Centro"
 * - Combined: "480014794_A08802"
 */
export function extractEquipmentCode(folderName: string): { type: 'parada' | 'eletro'; value: number | string } | null {
    if (!folderName) return null;

    // Clean the folder name
    const cleaned = folderName.trim();

    // Pattern 1: Try to find Nº Eletro format (A + 5 digits) - check first as it's more specific
    const eletroMatch = cleaned.match(/\b([A-Z]\d{5})\b/i);
    if (eletroMatch) {
        return { type: 'eletro', value: eletroMatch[1].toUpperCase() };
    }

    // Pattern 2: Try to find Nº Parada (9 digit number starting with 4, 5, or 6)
    const paradaMatch = cleaned.match(/\b([4-6]\d{8})\b/);
    if (paradaMatch) {
        return { type: 'parada', value: parseInt(paradaMatch[1], 10) };
    }

    // Pattern 3: Any long numeric sequence (fallback)
    const numericMatch = cleaned.match(/\b(\d{8,})\b/);
    if (numericMatch) {
        return { type: 'parada', value: parseInt(numericMatch[1], 10) };
    }

    return null;
}

/**
 * Look up equipment from folder name (async - may fetch from API)
 */
export async function lookupFromFolderName(folderName: string): Promise<EquipmentInfo | null> {
    const code = extractEquipmentCode(folderName);
    if (!code) return null;

    if (code.type === 'parada') {
        return lookupByNParada(code.value as number);
    } else {
        return lookupByNEletro(code.value as string);
    }
}

/**
 * Synchronous lookup from cache only (for immediate display)
 * Returns null if not in cache yet
 */
export function lookupFromCacheSync(folderName: string): EquipmentInfo | null {
    const code = extractEquipmentCode(folderName);
    if (!code) return null;

    if (code.type === 'parada') {
        return equipmentByNParada.get(code.value as number) || null;
    } else {
        return equipmentByNEletro.get((code.value as string).toUpperCase()) || null;
    }
}

/**
 * Get count of cached equipment
 */
export function getCachedEquipmentCount(): number {
    return equipmentByNParada.size;
}

/**
 * Check if equipment service is ready (always ready for on-demand)
 */
export function isEquipmentCacheReady(): boolean {
    return true; // Always ready for on-demand lookup
}

/**
 * Get equipment count (for display)
 */
export function getEquipmentCount(): number {
    return equipmentByNParada.size;
}

/**
 * No-op for compatibility - on-demand doesn't need initialization
 */
export async function initializeEquipmentCache(): Promise<void> {
    // On-demand mode doesn't need pre-initialization
    console.log('[Equipment] On-demand mode active - equipment will be fetched as folders are uploaded');
    return;
}

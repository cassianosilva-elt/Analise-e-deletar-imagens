/**
 * Equipment Service - On-Demand Fetching
 * Fetches equipment data only when needed (for uploaded folders)
 * Caches found equipment for fast O(1) lookups
 */

import { EquipmentInfo } from '../types';

interface ParsedFolderInfo {
    nEletroCandidate?: {
        prefix: string; // "A", "T", or empty
        digits: string; // "2267"
        raw: string;    // "A2267" or "2267"
    };
    nEletro?: string; // Legacy field for compat
    rawEletro?: string; // Legacy field for compat
    nParada?: number;
    address?: string;
    addressNumber?: string;
}

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
    "Nº Do Endereço"?: string | number;
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
 * Clean string for comparison
 */
function normalizeString(str: string): string {
    return str.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
        .replace(/[^\w\s]/g, "") // remove special chars
        .replace(/\s+/g, " ") // normalize spaces
        .trim();
}

/**
 * Search API by Address and Number
 * This is an expensive operation as it might scan many pages. We limit to first 10 pages for now to be safe.
 */
async function searchEquipmentByAddress(searchAddress: string, searchNumber: string): Promise<EquipmentInfo | null> {
    try {
        let offset = 0;
        const pageSize = 1000;
        const maxPages = 10; // Scan up to 10k records
        let pagesScanned = 0;

        const normalizedSearchAddr = normalizeString(searchAddress);
        const searchNum = searchNumber.trim();

        while (pagesScanned < maxPages) {
            const url = `${API_URL}?offset=${offset}&limit=${pageSize}`;
            const response = await fetch(url);
            if (!response.ok) return null;

            const data: APIResponse = await response.json();

            for (const record of data.data) {
                const recordAddr = record["Endereço"] || "";

                // Fuzzy Match Logic:
                // 1. Record address contains key parts of search address?
                // 2. Record address contains the number?

                const normalizedRecordAddr = normalizeString(recordAddr);

                // Check if number exists in record address
                // Use word boundary to avoid partial matches (e.g. 12 matching 1200)
                const numberRegex = new RegExp(`\\b${searchNum}\\b`);
                // Check explicit "Nº Do Endereço" field if available, or regex in address string
                // Note: APIEquipmentRecord interface update might be needed if "Nº Do Endereço" is real, 
                // but based on typical data, it might just be in the address string. 
                // Using regex on address string is safest fallback.
                const hasNumber = numberRegex.test(recordAddr);

                if (hasNumber && normalizedRecordAddr.includes(normalizedSearchAddr)) {
                    const info = transformRecord(record);
                    cacheEquipment(info);
                    console.log(`[Equipment] Found by Address: ${searchAddress}, ${searchNumber}`);
                    return info;
                }
            }

            if (offset + data.count >= data.total) break;
            offset += data.count;
            pagesScanned++;
            // Small delay to be nice to API
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        return null;
    } catch (error) {
        console.error(`[Equipment] Address search error:`, error);
        return null;
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
 * Advanced folder name parsing based on specific user rules
 */
export function extractParsedInfo(folderName: string): ParsedFolderInfo {
    const result: ParsedFolderInfo = {};
    if (!folderName) return result;

    let cleaned = folderName.trim();

    // Normalization Step:
    // 1. Remove leading delimiters
    cleaned = cleaned.replace(/^[\s,.-]+/, "");
    // 2. Remove common prefixes ("Cod.", "id", "ref", etc.) followed by space or punctuation
    cleaned = cleaned.replace(/^(cod|codigo|code|id|ref|num|nº|no)\.?\s*/i, "");
    // 3. Replace remaining delimiters with space to allow clean tokenization
    cleaned = cleaned.replace(/[,.-]/g, " ");
    // 4. Collapse spaces
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    // 1. Start Analysis: N° Eletro vs N° Parada
    // Match start of string, optional prefix letter, then digits
    const startMatch = cleaned.match(/^([a-zA-Z])?(\d{1,9})/);

    let idUsedForStart = false;

    if (startMatch) {
        const fullMatch = startMatch[0];
        const prefix = startMatch[1] ? startMatch[1].toUpperCase() : '';
        const digits = startMatch[2];
        const numVal = parseInt(digits, 10);

        // Logic: Number <= 5 digits is likely NEletro (or part of it)
        // Number > 5 digits is NParada
        // "210002122" is distinctly NParada
        if (digits.length <= 5) {
            result.nEletroCandidate = {
                prefix: prefix,
                digits: digits,
                raw: fullMatch
            };
            // Legacy compat
            if (prefix) result.nEletro = prefix + digits;
            else result.rawEletro = digits;

            idUsedForStart = true;
        } else {
            // Likely NParada
            result.nParada = numVal;
            idUsedForStart = true;
        }
    }

    // 2. End Analysis: Address Number
    // Find the LAST separate numeric token in the string
    const numberTokens = cleaned.match(/\b\d+\b/g);
    if (numberTokens && numberTokens.length > 0) {
        const lastNum = numberTokens[numberTokens.length - 1];

        // Validation: Address number shouldn't be the same as the ID we just found
        // if the string is *mostly* just the ID.
        // E.g. "210002122" -> Start match captures it. Last token captures it.
        // We shouldn't treat it as address number.

        let isSameAsId = false;
        if (idUsedForStart) {
            if (result.nParada && String(result.nParada) === lastNum) isSameAsId = true;
            if (result.nEletroCandidate && result.nEletroCandidate.digits === lastNum) isSameAsId = true;
        }

        if (!isSameAsId) {
            result.addressNumber = lastNum;
        }
    }

    // 3. Address Text
    // Remove the ID and the Number, what's left is address
    let addressPart = cleaned;

    // Remove start ID if found
    if (startMatch) addressPart = addressPart.replace(startMatch[0], "").trim();

    // Remove end number if found
    if (result.addressNumber) {
        addressPart = addressPart.replace(new RegExp(`\\b${result.addressNumber}$`), "").trim();
    }

    // Cleanup simple leftovers
    addressPart = addressPart.trim();

    if (addressPart.length > 3) {
        result.address = addressPart;
    }

    return result;
}

/**
 * Helper to generate candidate list for Eletro lookup
 */
function generateEletroCandidates(info: ParsedFolderInfo): string[] {
    if (!info.nEletroCandidate) return [];

    const { prefix, digits, raw } = info.nEletroCandidate;
    const candidates: string[] = [];
    const paddedDigits = digits.padStart(5, '0');

    if (prefix) {
        // Prefix exists (e.g. A2267) -> prioritize padded "A02267", then raw "A2267"
        candidates.push(`${prefix}${paddedDigits}`);
        candidates.push(`${prefix}${digits}`);
    } else {
        // No prefix (e.g. 2267) -> try A+Padded, T+Padded, A+Raw, T+Raw
        candidates.push(`A${paddedDigits}`);
        candidates.push(`T${paddedDigits}`);
        // Fallbacks
        // candidates.push(`A${digits}`);
        // candidates.push(`T${digits}`);
    }

    return Array.from(new Set(candidates));
}

/**
 * Look up equipment from folder name (async - may fetch from API)
 */
export async function lookupFromFolderName(folderName: string): Promise<EquipmentInfo | null> {
    const info = extractParsedInfo(folderName);
    console.log(`[Equipment] Analyzing folder: "${folderName}"`, info);

    // Priority 1: N° Eletro Candidate with Permutations
    if (info.nEletroCandidate) {
        const candidates = generateEletroCandidates(info);
        for (const candidate of candidates) {
            console.log(`[Equipment] Trying candidate: ${candidate}`);
            const res = await lookupByNEletro(candidate);
            if (res) {
                console.log(`[Equipment] Match found for ${candidate}`);
                return res;
            }
        }
    }

    // Priority 2: N° Parada
    if (info.nParada) {
        const res = await lookupByNParada(info.nParada);
        if (res) return res;
    }

    // Priority 3: Address + Number
    if (info.address && info.addressNumber) {
        console.log(`[Equipment] Fallback to address search: "${info.address}", num: ${info.addressNumber}`);
        const res = await searchEquipmentByAddress(info.address, info.addressNumber);
        if (res) return res;
    }

    return null;
}

/**
 * Synchronous lookup from cache only (for immediate display)
 * Returns null if not in cache yet
 */
export function lookupFromCacheSync(folderName: string): EquipmentInfo | null {
    const info = extractParsedInfo(folderName);

    // Try finding in cache with same priority steps
    if (info.nEletroCandidate) {
        const candidates = generateEletroCandidates(info);
        for (const candidate of candidates) {
            const cached = equipmentByNEletro.get(candidate.toUpperCase());
            if (cached) return cached;
        }
    }

    if (info.nParada) {
        const cached = equipmentByNParada.get(info.nParada);
        if (cached) return cached;
    }

    // Cache lookup by address is not supported efficiently yet unless we scan the whole map
    // or add a secondary index. For now, skipping address sync lookup.

    return null;
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

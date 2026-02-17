import type { Recipe, Video, RecipeDetails } from '@/types';
import { MOCK_RECIPES, MOCK_VIDEOS, MOCK_RECIPE_DETAILS } from './mockData';

const BASE_URL = import.meta.env.VITE_SPOONACULAR_API_BASE_URL;
const API_KEYS = (import.meta.env.VITE_SPOONACULAR_API_KEY || '').split(',').map((k: string) => k.trim()).filter(Boolean);

console.log(`Spoonacular Service: Loaded ${API_KEYS.length} API keys.`);

// Cache configuration
const CACHE_PREFIX = 'pantrypal_api_v2_';
const TTL_RECIPES = 24 * 60 * 60 * 1000; // 24 hours
const TTL_VIDEOS = 3 * 24 * 60 * 60 * 1000; // 3 days
const TTL_DETAILS = 7 * 24 * 60 * 60 * 1000; // 7 days

const getFromCache = (key: string) => {
    try {
        const item = localStorage.getItem(CACHE_PREFIX + key);
        if (!item) return null;
        const { data, expiry } = JSON.parse(item);
        if (Date.now() > expiry) {
            localStorage.removeItem(CACHE_PREFIX + key);
            return null;
        }
        return data;
    } catch {
        return null;
    }
};

const saveToCache = (key: string, data: any, ttl: number) => {
    try {
        const item = { data, expiry: Date.now() + ttl };
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
    } catch (e) {
        console.warn('Failed to save to cache:', e);
    }
};

// Key rotation state management
const STORAGE_KEY = 'pantrypal_api_key_index';
let currentKeyIndex = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10);
if (isNaN(currentKeyIndex) || currentKeyIndex >= API_KEYS.length) {
    currentKeyIndex = 0;
}

const getCurrentKey = () => API_KEYS[currentKeyIndex];

const rotateKey = (failedKey: string) => {
    if (API_KEYS.length <= 1) return false;
    
    // Check if the key that failed is still the current one
    // (Prevents double-rotation when multiple parallel requests fail)
    if (getCurrentKey() === failedKey) {
        currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
        localStorage.setItem(STORAGE_KEY, currentKeyIndex.toString());
        console.log(`Rotating to API Key #${currentKeyIndex + 1} (Previous failed: ${failedKey.substring(0, 4)}...)`);
        return true;
    }
    
    console.log(`Key already rotated by another request. Now using #${currentKeyIndex + 1}`);
    return true;
};

// Centralized fetch wrapper with rotation logic and caching
async function fetchWithRotation(
    label: string, 
    urlBuilder: (apiKey: string) => string, 
    mockFallback: any,
    cacheTtl?: number
): Promise<any> {
    // 1. Generate a stable cache key (URL without the apiKey part)
    // We remove the apiKey parameter entirely to make the key unique to the query/params
    const rawUrl = urlBuilder('STABLE_KEY');
    const stableUrl = rawUrl
        .replace(/[?&]apiKey=[^&]+/, '') // Remove apiKey param
        .replace(/\?&/, '?')             // Clean up if apiKey was first param
        .replace(/&&+/, '&')             // Clean up multiple ampersands
        .replace(/[&?]$/, '');           // Clean up trailing delimiters

    // We use the stableUrl itself as a suffix for the cache key.
    // LocalStorage keys are strings, so we don't strictly need btoa if we prefix it safely.
    // However, to keep keys manageable and avoid issues with any weird chars, 
    // we'll just use a sanitized version of the string or the string itself.
    const cacheKey = stableUrl;

    // 2. Try Cache First
    if (cacheTtl) {
        const cachedData = getFromCache(cacheKey);
        if (cachedData) {
            console.log(`${label}: Serving from cache. Key: ${cacheKey.substring(0, 50)}...`);
            return cachedData;
        }
    }

    if (API_KEYS.length === 0) {
        console.warn(`${label}: No Spoonacular API Key found. Using MOCK data.`);
        return mockFallback;
    }

    const maxAttempts = API_KEYS.length;
    let attempts = 0;

    while (attempts < maxAttempts) {
        const apiKey = getCurrentKey();
        const url = urlBuilder(apiKey);
        
        console.log(`${label} [Attempt ${attempts + 1}]: Using Key #${currentKeyIndex + 1}`);
        
        try {
            const response = await fetch(url);

            if (response.ok) {
                const data = await response.json();
                console.log(`${label}: Success from API!`);
                
                // Save to cache on success
                if (cacheTtl) {
                    console.log(`${label}: Saving to cache. Key: ${cacheKey.substring(0, 50)}...`);
                    saveToCache(cacheKey, data, cacheTtl);
                }
                
                return data;
            }

            // Handle quota (402) or invalid key (401)
            if (response.status === 402 || response.status === 401) {
                console.warn(`${label}: Key #${currentKeyIndex + 1} failed (${response.status}).`);
                rotateKey(apiKey);
                attempts++;
                continue; 
            }

            // Other HTTP errors
            const errorText = await response.text();
            console.error(`${label}: API Error ${response.status}:`, errorText);
            break; 

        } catch (error) {
            console.error(`${label}: Network error:`, error);
            break; 
        }
        attempts++;
    }

    console.warn(`${label}: All keys failed. Falling back to MOCK data.`);
    return mockFallback;
}

export const getRecipesByIngredients = async (ingredients: string[]): Promise<Recipe[]> => {
  if (ingredients.length === 0) return [];
  
  const ingredientsString = ingredients.join(',+');
  console.log("calling recipes api");
  return fetchWithRotation(
    'Recipes',
    (apiKey: string) => `${BASE_URL}/recipes/findByIngredients?ingredients=${ingredientsString}&number=12&apiKey=${apiKey}`,
    MOCK_RECIPES,
    TTL_RECIPES
  );
};

export const searchFoodVideos = async (query: string): Promise<{ videos: Video[] }> => {
  if (!query) return { videos: [] };

  console.log("calling video api");

  const data = await fetchWithRotation(
    'Videos',
    (apiKey: string) => `${BASE_URL}/food/videos/search?query=${query}&number=12&apiKey=${apiKey}`,
    { videos: MOCK_VIDEOS },
    TTL_VIDEOS
  );
  return data;
};

export const getRecipeInformation = async (id: number): Promise<RecipeDetails> => {
  console.log("calling recipe api");
  return fetchWithRotation(
    'Details',
    (apiKey: string) => `${BASE_URL}/recipes/${id}/information?includeNutrition=false&apiKey=${apiKey}`,
    { ...MOCK_RECIPE_DETAILS, id },
    TTL_DETAILS
  );
};


import type { Recipe, Video, RecipeDetails } from "@/types";
import { MOCK_RECIPES, MOCK_VIDEOS, MOCK_RECIPE_DETAILS } from "./mockData";

const BASE_URL = import.meta.env.VITE_SPOONACULAR_API_BASE_URL;
const API_KEYS = (import.meta.env.VITE_SPOONACULAR_API_KEY || "")
  .split(",")
  .map((k: string) => k.trim())
  .filter(Boolean);

console.log(`Spoonacular Service: Loaded ${API_KEYS.length} API keys.`);

const STORAGE_KEY = "pantrypal_api_key_index";

//Fetching the current stored index and converting to number using base-10
let currentKeyIndex = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);
if (Number.isNaN(currentKeyIndex) || currentKeyIndex >= API_KEYS.length) {
  currentKeyIndex = 0;
}

const getCurrentKey = () => API_KEYS[currentKeyIndex];

const rotateKey = (failedKey: string) => {
  if (API_KEYS.length <= 1) return false;
  if (getCurrentKey() === failedKey) {
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    localStorage.setItem(STORAGE_KEY, currentKeyIndex.toString());
    console.log(`Rotating to API Key #${currentKeyIndex + 1}`);
  }
  return true;
};

async function fetchWithRotation<T>(
  label: string,
  urlBuilder: (apiKey: string) => string,
  mockData: T,
): Promise<T> {
  if (API_KEYS.length === 0) {
    console.warn(`${label}: No Spoonacular API Key found. Using MOCK data.`);
    return mockData;
  }
  let attempts = 0;
  while (attempts < API_KEYS.length) {
    const apiKey = getCurrentKey();

    try {
      const response = await fetch(urlBuilder(apiKey));

      if (response.ok) {
        return (await response.json()) as T;
      }

      if (response.status === 401 || response.status === 402) {
        rotateKey(apiKey);
        attempts++;
        continue;
      }

      const errorText = await response.text();
      console.error(`${label}: API Error ${response.status}:`, errorText);
      break;
    } catch (error) {
      console.error(`${label}: Network error:`, error);
      break;
    }
  }
  console.warn(`${label}: All keys failed. Falling back to MOCK data.`);
  return mockData;
}

const normalizeIngredients = (ingredients: string[]) =>
  Array.from(new Set(ingredients.map((name) => name.trim()).filter(Boolean)));

export const getRecipesByIngredients = async (
  ingredients: string[],
): Promise<Recipe[]> => {
  const normalizedIngredients = normalizeIngredients(ingredients);
  if (normalizedIngredients.length === 0) return [];
  //Convert text into URL Safe format
  const ingredientsString = encodeURIComponent(normalizedIngredients.join(","));
  return fetchWithRotation(
    "Recipes",
    (apiKey: string) =>
      `${BASE_URL}/recipes/findByIngredients?ingredients=${ingredientsString}&number=12&ranking=1&ignorePantry=true&apiKey=${apiKey}`,
    MOCK_RECIPES,
  );
};

export const searchFoodVideos = async (
  query: string,
): Promise<{ videos: Video[] }> => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return { videos: [] };

  return fetchWithRotation(
    "Videos",
    (apiKey: string) =>
      `${BASE_URL}/food/videos/search?query=${encodeURIComponent(normalizedQuery)}&number=12&apiKey=${apiKey}`,
    { videos: MOCK_VIDEOS },
  );
};

export const getRecipeInformation = async (
  id: number,
): Promise<RecipeDetails> => {
  return fetchWithRotation(
    "Details",
    (apiKey: string) =>
      `${BASE_URL}/recipes/${id}/information?includeNutrition=false&apiKey=${apiKey}`,
    { ...MOCK_RECIPE_DETAILS, id },
  );
};

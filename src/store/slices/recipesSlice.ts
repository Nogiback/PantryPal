import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getRecipesByIngredients,
  searchFoodVideos,
  getRecipeInformation,
} from "@/services/spoonacular";
import type { Recipe, Video, RecipeDetails, AppliedRecipeFilters } from "@/types";
import type { RootState } from "../index";

interface RecipesState {
  items: Recipe[];
  appliedFilters: AppliedRecipeFilters | null;
  videos: Video[];
  selectedRecipeDetails: RecipeDetails | null;
  detailsStatus: "idle" | "loading" | "succeeded" | "failed";
  status: "idle" | "loading" | "succeeded" | "failed";
  videoStatus: "idle" | "loading" | "succeeded" | "failed";
  lastRecipeSignature: string;
  lastVideoSignature: string;
  error: string | null;
  videoError: string | null;
}

const initialState: RecipesState = {
  items: [],
  appliedFilters: null,
  videos: [],
  selectedRecipeDetails: null,
  detailsStatus: "idle",
  status: "idle",
  videoStatus: "idle",
  lastRecipeSignature: "",
  lastVideoSignature: "",
  error: null,
  videoError: null,
};

const createIngredientSignature = (ingredients: string[]) =>
  ingredients
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .join(",");

export const fetchRecipes = createAsyncThunk(
  "recipes/fetchByIngredients",
  async (_, { getState }) => {
    const state = getState() as RootState;
    
    const sortedIngredients = [...state.ingredients.items].sort((a, b) => {
      const aExpiry = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
      const bExpiry = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
      return aExpiry - bExpiry;
    });

    const includeIngredients = sortedIngredients.map((i) => i.name);
    const onboarding = state.preferences.onboarding;
    const intolerances = onboarding?.allergies ?? [];
    const excludeIngredients = onboarding?.customAvoid ?? [];
    const dietaryPreference = onboarding?.dietaryPreference;
    const goals = onboarding?.goals;

    const signature = createIngredientSignature(includeIngredients);
    const result = await getRecipesByIngredients(
      includeIngredients,
      intolerances,
      excludeIngredients,
      { dietaryPreference, goals },
    );
    return { ...result, signature };
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as RootState;
      if (state.recipes.status === "loading") return false;
      const nextSignature = createIngredientSignature(
        state.ingredients.items.map((i) => i.name),
      );
      return nextSignature !== state.recipes.lastRecipeSignature;
    },
  },
);

export const fetchVideos = createAsyncThunk(
  "recipes/fetchVideos",
  async (ingredients: string[]) => {
    const query = ingredients
      .map((item) => item.trim())
      .filter(Boolean)
      .join(" ");
    const videosResponse = await searchFoodVideos(query);
    return videosResponse.videos;
  },
  {
    condition: (ingredients, { getState }) => {
      const state = getState() as RootState;
      if (state.recipes.videoStatus === "loading") return false;
      const nextSignature = createIngredientSignature(ingredients);
      return nextSignature !== state.recipes.lastVideoSignature;
    },
  },
);

export const fetchRecipeDetails = createAsyncThunk(
  "recipes/fetchDetails",
  async (id: number) => {
    return await getRecipeInformation(id);
  },
);

const recipesSlice = createSlice({
  name: "recipes",
  initialState,
  reducers: {
    clearSelectedRecipe: (state) => {
      state.selectedRecipeDetails = null;
      state.detailsStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecipes.pending, (state) => {
        state.status = "loading";
        state.items = [];
        state.appliedFilters = null;
        state.error = null;
        state.videoStatus = "idle"; // Reset videos so they refresh when user visits the tab
        state.videos = []; // Clear old videos
      })
      .addCase(fetchRecipes.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.recipes;
        state.appliedFilters = action.payload.applied;
        state.lastRecipeSignature = action.payload.signature;
      })
      .addCase(fetchRecipes.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Failed to fetch recipes";
      })
      .addCase(fetchVideos.pending, (state) => {
        state.videoStatus = "loading";
        state.videos = []; // Clear old videos when fetching new ones
      })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        state.videoStatus = "succeeded";
        state.videos = action.payload;
        state.lastVideoSignature = createIngredientSignature(action.meta.arg);
      })
      .addCase(fetchVideos.rejected, (state, action) => {
        state.videoStatus = "failed";
        state.videoError = action.error.message || "Failed to fetch videos";
      })
      .addCase(fetchRecipeDetails.pending, (state) => {
        state.detailsStatus = "loading";
      })
      .addCase(fetchRecipeDetails.fulfilled, (state, action) => {
        state.detailsStatus = "succeeded";
        state.selectedRecipeDetails = action.payload;
      })
      .addCase(fetchRecipeDetails.rejected, (state) => {
        state.detailsStatus = "failed";
      });
  },
});

export const { clearSelectedRecipe } = recipesSlice.actions;
export default recipesSlice.reducer;

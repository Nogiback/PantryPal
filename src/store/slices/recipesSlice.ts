import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getRecipesByIngredients, searchFoodVideos, getRecipeInformation } from '@/services/spoonacular';
import type { Recipe, Video, RecipeDetails } from '@/types';
import { addIngredient, removeIngredient } from './ingredientsSlice';

interface RecipesState {
  items: Recipe[];
  videos: Video[];
  selectedRecipeDetails: RecipeDetails | null;
  detailsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  videoStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  videoError: string | null;
}

const initialState: RecipesState = {
  items: [],
  videos: [],
  selectedRecipeDetails: null,
  detailsStatus: 'idle',
  status: 'idle',
  videoStatus: 'idle',
  error: null,
  videoError: null,
};

export const fetchRecipes = createAsyncThunk(
  'recipes/fetchByIngredients',
  async (ingredients: string[]) => {
    const recipesResponse = await getRecipesByIngredients(ingredients);
    return recipesResponse;
  }
);

export const fetchVideos = createAsyncThunk(
  'recipes/fetchVideos',
  async (query: string) => {
    const videosResponse = await searchFoodVideos(query);
    return videosResponse.videos;
  }
);

export const fetchRecipeDetails = createAsyncThunk(
  'recipes/fetchDetails',
  async (id: number) => {
    return await getRecipeInformation(id);
  }
);

const recipesSlice = createSlice({
  name: 'recipes',
  initialState,
  reducers: {
    clearSelectedRecipe: (state) => {
      state.selectedRecipeDetails = null;
      state.detailsStatus = 'idle';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecipes.pending, (state) => {
        state.status = 'loading';
        state.videoStatus = 'idle'; // Reset videos so they refresh when user visits the tab
        state.videos = []; // Clear old videos
      })
      .addCase(fetchRecipes.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchRecipes.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch recipes';
      })
      .addCase(fetchVideos.pending, (state) => {
        state.videoStatus = 'loading';
        state.videos = []; // Clear old videos when fetching new ones
      })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        state.videoStatus = 'succeeded';
        state.videos = action.payload;
      })
      .addCase(fetchVideos.rejected, (state, action) => {
        state.videoStatus = 'failed';
        state.videoError = action.error.message || 'Failed to fetch videos';
      })
      .addCase(fetchRecipeDetails.pending, (state) => {
        state.detailsStatus = 'loading';
      })
      .addCase(fetchRecipeDetails.fulfilled, (state, action) => {
        state.detailsStatus = 'succeeded';
        state.selectedRecipeDetails = action.payload;
      })
      .addCase(fetchRecipeDetails.rejected, (state) => {
        state.detailsStatus = 'failed';
      })
      // invalidate caches when ingredients change
      .addCase(addIngredient, (state) => {
        state.status = 'idle';
        state.videoStatus = 'idle';
      })
      .addCase(removeIngredient, (state) => {
        state.status = 'idle';
        state.videoStatus = 'idle';
      });
  },
});

export const { clearSelectedRecipe } = recipesSlice.actions;
export default recipesSlice.reducer;


import { configureStore } from '@reduxjs/toolkit';
import ingredientsReducer from './slices/ingredientsSlice';
import recipesReducer from './slices/recipesSlice';
import preferencesReducer from './slices/preferencesSlice';
import mealPlannerReducer from './slices/mealPlannerSlice';

export const store = configureStore({
  reducer: {
    ingredients: ingredientsReducer,
    recipes: recipesReducer,
    preferences: preferencesReducer,
    mealPlanner: mealPlannerReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

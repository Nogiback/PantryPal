import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { MealPlanRecipe } from '@/types';

interface MealPlannerState {
  plannedRecipes: MealPlanRecipe[];
  shoppingListText: string;
}

const initialState: MealPlannerState = {
  plannedRecipes: [],
  shoppingListText: '',
};

export const mealPlannerSlice = createSlice({
  name: 'mealPlanner',
  initialState,
  reducers: {
    addRecipeToPlan: (state, action: PayloadAction<MealPlanRecipe>) => {
      const exists = state.plannedRecipes.find(r => r.id === action.payload.id);
      if (!exists) {
        state.plannedRecipes.push(action.payload);
      }
    },
    removeRecipeFromPlan: (state, action: PayloadAction<string>) => {
      state.plannedRecipes = state.plannedRecipes.filter(r => r.id !== action.payload);
    },
    clearPlan: (state) => {
      state.plannedRecipes = [];
    },
    setShoppingListText: (state, action: PayloadAction<string>) => {
      state.shoppingListText = action.payload;
    },
  },
});

export const { addRecipeToPlan, removeRecipeFromPlan, clearPlan, setShoppingListText } = mealPlannerSlice.actions;

export default mealPlannerSlice.reducer;

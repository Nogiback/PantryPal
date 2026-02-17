import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Ingredient } from '@/types';

interface IngredientsState {
  items: Ingredient[];
}

const initialState: IngredientsState = {
  items: [],
};

export const ingredientsSlice = createSlice({
  name: 'ingredients',
  initialState,
  reducers: {
    addIngredient: (state, action: PayloadAction<string>) => {
      if (!action.payload.trim()) return;
      state.items.push({
        id: crypto.randomUUID(),
        name: action.payload.trim(),
      });
    },
    removeIngredient: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
});

export const { addIngredient, removeIngredient } = ingredientsSlice.actions;

export default ingredientsSlice.reducer;

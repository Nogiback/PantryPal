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
    addIngredient: (state, action: PayloadAction<string | { name: string; quantity?: string }>) => {
      const payload = typeof action.payload === 'string' ? { name: action.payload } : action.payload;
      if (!payload.name.trim()) return;
      state.items.push({
        id: crypto.randomUUID(),
        name: payload.name.trim(),
        quantity: payload.quantity?.trim(),
      });
    },
    removeIngredient: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
});

export const { addIngredient, removeIngredient } = ingredientsSlice.actions;

export default ingredientsSlice.reducer;

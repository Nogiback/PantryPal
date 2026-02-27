import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Ingredient } from '@/types';

interface IngredientsState {
  items: Ingredient[];
}

const initialState: IngredientsState = {
  items: [],
};

type AddIngredientPayload = { name: string; quantity?: string };

export const ingredientsSlice = createSlice({
  name: 'ingredients',
  initialState,
  reducers: {
    addIngredient: (state, action: PayloadAction<AddIngredientPayload>) => {
      if (!action.payload.name.trim()) return;
      state.items.push({
        id: crypto.randomUUID(),
        name: action.payload.name.trim(),
        quantity: action.payload.quantity?.trim(),
      });
    },
    removeIngredient: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
});

export const { addIngredient, removeIngredient } = ingredientsSlice.actions;

export default ingredientsSlice.reducer;

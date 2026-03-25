import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Ingredient } from '@/types';

interface IngredientsState {
  items: Ingredient[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  saveStatus: "idle" | "loading" | "succeeded" | "failed";
  saveError: string | null;
}

const initialState: IngredientsState = {
  items: [],
  status: "idle",
  error: null,
  saveStatus: "idle",
  saveError: null,
};

type AddIngredientPayload = { name: string; quantity?: string };

export const fetchPantry = createAsyncThunk("ingredients/fetchPantry", async () => {
  const token = localStorage.getItem("auth_token");
  if (!token) throw new Error("Signed out.");
  const res = await fetch("/api/pantry/me", { method: "GET", headers: { Authorization: `Bearer ${token}` } });
  const data = (await res.json().catch(() => ({}))) as { pantry?: unknown; items?: unknown; error?: unknown };
  if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not load pantry.");
  const pantry = Array.isArray(data.pantry) ? data.pantry : Array.isArray(data.items) ? data.items : [];
  return pantry as Ingredient[];
});

export const savePantry = createAsyncThunk(
  "ingredients/savePantry",
  async (_, { getState }) => {
    const token = localStorage.getItem("auth_token");
    if (!token) throw new Error("Signed out.");
    const state = getState() as { ingredients: IngredientsState };
    const res = await fetch("/api/pantry/me", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ items: state.ingredients.items }),
    });
    const data = (await res.json().catch(() => ({}))) as { pantry?: unknown; items?: unknown; error?: unknown };
    if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Could not save pantry.");
    const pantry = Array.isArray(data.pantry) ? data.pantry : Array.isArray(data.items) ? data.items : null;
    return (pantry ? (pantry as Ingredient[]) : state.ingredients.items) as Ingredient[];
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { ingredients: IngredientsState };
      return state.ingredients.saveStatus !== "loading";
    },
  },
);

export const ingredientsSlice = createSlice({
  name: 'ingredients',
  initialState,
  reducers: {
    setIngredients: (state, action: PayloadAction<Ingredient[]>) => {
      state.items = action.payload;
      state.status = "succeeded";
      state.error = null;
    },
    clearIngredients: (state) => {
      state.items = [];
      state.status = "idle";
      state.error = null;
    },
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
  extraReducers: (builder) => {
    builder
      .addCase(fetchPantry.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.items = [];
      })
      .addCase(fetchPantry.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchPantry.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Could not load pantry.";
        state.items = [];
      })
      .addCase(savePantry.pending, (state) => {
        state.saveStatus = "loading";
        state.saveError = null;
      })
      .addCase(savePantry.fulfilled, (state, action) => {
        state.saveStatus = "succeeded";
        state.items = action.payload;
        state.saveError = null;
      })
      .addCase(savePantry.rejected, (state, action) => {
        state.saveStatus = "failed";
        state.saveError = action.error.message || "Could not save pantry.";
      });
  },
});

export const { addIngredient, removeIngredient, setIngredients, clearIngredients } = ingredientsSlice.actions;

export default ingredientsSlice.reducer;

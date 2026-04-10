import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getAuthMode, getLocalPreferences } from "@/lib/localAuth";

type Onboarding = {
  dietaryPreference: string;
  allergies: string[];
  customAvoid: string[];
  taste: { flavors: string[]; spiceLevel: number };
  goals: string[];
};

type PreferencesState = {
  onboarding: Onboarding | null;
  onboardingCompleted: boolean;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const initialState: PreferencesState = {
  onboarding: null,
  onboardingCompleted: false,
  status: "idle",
  error: null,
};

export const fetchPreferences = createAsyncThunk("preferences/fetch", async () => {
  const token = localStorage.getItem("auth_token");
  if (!token) throw new Error("Signed out.");
  if (getAuthMode() === "local") {
    return getLocalPreferences();
  }
  const res = await fetch("/api/onboarding/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json().catch(() => ({}))) as {
    onboardingCompleted?: unknown;
    onboarding?: unknown;
    error?: unknown;
  };
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Could not load preferences.");
  }
  return {
    onboardingCompleted: data.onboardingCompleted === true,
    onboarding: (data.onboarding ?? null) as Onboarding | null,
  };
});

export const preferencesSlice = createSlice({
  name: "preferences",
  initialState,
  reducers: {
    setPreferences: (state, action: { payload: { onboarding: Onboarding; onboardingCompleted?: boolean } }) => {
      state.onboarding = action.payload.onboarding;
      state.onboardingCompleted = action.payload.onboardingCompleted ?? true;
      state.status = "succeeded";
      state.error = null;
    },
    clearPreferences: (state) => {
      state.onboarding = null;
      state.onboardingCompleted = false;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPreferences.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPreferences.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.onboarding = action.payload.onboarding;
        state.onboardingCompleted = action.payload.onboardingCompleted;
      })
      .addCase(fetchPreferences.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Could not load preferences.";
      });
  },
});

export const { setPreferences, clearPreferences } = preferencesSlice.actions;
export default preferencesSlice.reducer;

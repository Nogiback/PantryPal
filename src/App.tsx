
import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { LandingPage } from '@/components/LandingPage';
import { DashboardView } from '@/components/views/DashboardView';
import { PantryView } from '@/components/views/PantryView';
import { ScanView } from '@/components/views/ScanView';
import { RecipesView } from '@/components/views/RecipesView';
import { AiRecipesView } from '@/components/views/AiRecipesView';
import { LoginView } from '@/components/views/LoginView';
import { SignupView } from '@/components/views/SignupView';
import { OnboardingView } from '@/components/views/OnboardingView';
import { ProfileView } from '@/components/views/ProfileView';
import { MealPlannerView } from '@/components/views/MealPlannerView';
import { useAppDispatch } from '@/store/hooks';
import { fetchPantry, clearIngredients, setIngredients } from '@/store/slices/ingredientsSlice';
import { fetchPreferences, clearPreferences, setPreferences } from '@/store/slices/preferencesSlice';
import {
  clearAuthMode,
  getAuthMode,
  getLocalPantry,
  getLocalPreferences,
  reviveLocalSessionFromStoredUser,
} from '@/lib/localAuth';

function App() {
  const dispatch = useAppDispatch();
  const [view, setView] = useState<'landing' | 'login' | 'signup' | 'onboarding' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pantry' | 'scan' | 'recipes' | 'ai-recipes' | 'profile' | 'meal-planner'>('dashboard');
  const [isBooting, setIsBooting] = useState(true);

  const hydrateLocalState = () => {
    const localPreferences = getLocalPreferences();
    dispatch(setIngredients(getLocalPantry()));
    if (localPreferences.onboarding) {
      dispatch(
        setPreferences({
          onboarding: localPreferences.onboarding,
          onboardingCompleted: localPreferences.onboardingCompleted,
        }),
      );
    } else {
      dispatch(clearPreferences());
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const authMode = getAuthMode();
    if (!token) {
      setIsBooting(false);
      return;
    }

    if (authMode === 'local') {
      hydrateLocalState();
      setView('app');
      setIsBooting(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/auth/me', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          setView('landing');
          return;
        }

        const data = (await res.json().catch(() => ({}))) as { user?: unknown };
        localStorage.setItem('auth_user', JSON.stringify(data.user ?? null));

        setView('app');

        // Hydrate Redux with server-backed data for the signed-in user.
        localStorage.setItem('auth_mode', 'server');
        dispatch(fetchPreferences());
        dispatch(fetchPantry());
      } catch {
        const revivedUser = reviveLocalSessionFromStoredUser();
        if (revivedUser) {
          hydrateLocalState();
          setView('app');
        } else {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          clearAuthMode();
          setView('landing');
        }
      } finally {
        setIsBooting(false);
      }
    })();
  }, []);

  const handleAuthSuccess = () => {
    setActiveTab('dashboard');
    setView('app');
    if (getAuthMode() === 'local') {
      hydrateLocalState();
      return;
    }

    dispatch(fetchPreferences());
    dispatch(fetchPantry());
  };

  if (isBooting) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (view === 'landing') {
    return <LandingPage onLogin={() => setView('login')} onSignUp={() => setView('signup')} />;
  }

  if (view === 'login') {
    return (
      <LoginView
        onBack={() => setView('landing')}
        onGoToSignup={() => setView('signup')}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  if (view === 'signup') {
    return (
      <SignupView
        onBack={() => setView('landing')}
        onGoToLogin={() => setView('login')}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  if (view === 'onboarding') {
    return <OnboardingView onFinish={() => setView('app')} />;
  }

  return (
    <Layout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSignOut={() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        clearAuthMode();
        dispatch(clearPreferences());
        dispatch(clearIngredients());
        setActiveTab('dashboard');
        setView('landing');
      }}
    >
      {activeTab === 'dashboard' && <DashboardView onNavigate={setActiveTab} />}
      {activeTab === 'pantry' && (
        <PantryView onGoToScan={() => setActiveTab('scan')} />
      )}
      {activeTab === 'scan' && <ScanView />}
      {activeTab === 'recipes' && <RecipesView />}
      {activeTab === 'ai-recipes' && <AiRecipesView />}
      {activeTab === 'meal-planner' && <MealPlannerView />}
      {activeTab === 'profile' && <ProfileView />}
    </Layout>
  );
}

export default App;

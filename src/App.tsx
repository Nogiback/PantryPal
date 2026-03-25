
import { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { LandingPage } from '@/components/LandingPage';
import { PantryView } from '@/components/views/PantryView';
import { ScanView } from '@/components/views/ScanView';
import { RecipesView } from '@/components/views/RecipesView';
import { VideosView } from '@/components/views/VideosView';
import { LoginView } from '@/components/views/LoginView';
import { SignupView } from '@/components/views/SignupView';
import { OnboardingView } from '@/components/views/OnboardingView';
import { ProfileView } from '@/components/views/ProfileView';
import { useAppDispatch } from '@/store/hooks';
import { fetchPantry, clearIngredients } from '@/store/slices/ingredientsSlice';
import { fetchPreferences, clearPreferences } from '@/store/slices/preferencesSlice';

function App() {
  const dispatch = useAppDispatch();
  const [view, setView] = useState<'landing' | 'login' | 'signup' | 'onboarding' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState<'pantry' | 'scan' | 'recipes' | 'videos' | 'profile'>('pantry');
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
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

        const user = data.user as { onboardingCompleted?: unknown } | null;
        const onboardingCompleted = user?.onboardingCompleted === true;
        setView(onboardingCompleted ? 'app' : 'onboarding');

        // Hydrate Redux with server-backed data for the signed-in user.
        dispatch(fetchPreferences());
        dispatch(fetchPantry());
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setView('landing');
      } finally {
        setIsBooting(false);
      }
    })();
  }, []);

  const handleAuthSuccess = () => {
    const raw = localStorage.getItem('auth_user');
    const user = raw ? (JSON.parse(raw) as { onboardingCompleted?: unknown } | null) : null;
    const onboardingCompleted = user?.onboardingCompleted === true;
    setView(onboardingCompleted ? 'app' : 'onboarding');

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
        dispatch(clearPreferences());
        dispatch(clearIngredients());
        setActiveTab('pantry');
        setView('landing');
      }}
    >
      {activeTab === 'pantry' && (
        <PantryView onGoToScan={() => setActiveTab('scan')} />
      )}
      {activeTab === 'scan' && <ScanView />}
      {activeTab === 'recipes' && <RecipesView />}
      {activeTab === 'videos' && <VideosView />}
      {activeTab === 'profile' && <ProfileView />}
    </Layout>
  );
}

export default App;

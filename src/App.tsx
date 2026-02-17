
import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { LandingPage } from '@/components/LandingPage';
import { PantryView } from '@/components/views/PantryView';
import { ScanView } from '@/components/views/ScanView';
import { RecipesView } from '@/components/views/RecipesView';
import { VideosView } from '@/components/views/VideosView';

function App() {
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState<'pantry' | 'scan' | 'recipes' | 'videos'>('pantry');

  if (view === 'landing') {
    return <LandingPage onEnterApp={() => setView('app')} />;
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'pantry' && (
        <PantryView />
      )}
      {activeTab === 'scan' && <ScanView />}
      {activeTab === 'recipes' && <RecipesView />}
      {activeTab === 'videos' && <VideosView />}
    </Layout>
  );
}

export default App;

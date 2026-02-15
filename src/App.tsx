import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { LandingPage } from '@/components/LandingPage';
import { PantryView } from '@/components/views/PantryView';
import { ScanView } from '@/components/views/ScanView';
import { RecipesView } from '@/components/views/RecipesView';

export type Ingredient = {
  id: string;
  name: string;
  quantity?: string;
};

function App() {
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState<'pantry' | 'scan' | 'recipes'>('pantry');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  const addIngredient = (name: string, quantity?: string) => {
    if (!name.trim()) return;
    const newIngredient: Ingredient = {
      id: crypto.randomUUID(),
      name: name.trim(),
      quantity: quantity?.trim() || undefined,
    };
    setIngredients((prev) => [...prev, newIngredient]);
  };

  const removeIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((ing) => ing.id !== id));
  };

  if (view === 'landing') {
    return <LandingPage onEnterApp={() => setView('app')} />;
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'pantry' && (
        <PantryView 
          ingredients={ingredients} 
          onAdd={addIngredient} 
          onRemove={removeIngredient} 
        />
      )}
      {activeTab === 'scan' && <ScanView onAddIngredients={(ings) => ings.forEach((item) => addIngredient(item.name, item.quantity))} />}
      {activeTab === 'recipes' && <RecipesView ingredients={ingredients} />}
    </Layout>
  );
}

export default App;

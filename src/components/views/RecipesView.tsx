import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChefHat, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import type { Ingredient } from '@/App';

interface RecipesViewProps {
  ingredients: Ingredient[];
}

interface RecipeResponse {
  text?: string;
}

interface RecipeItem {
  name: string;
  quantity: string;
  fromPantry: boolean;
}

interface GeneratedRecipe {
  title: string;
  servings: string;
  estimatedTime: string;
  ingredients: RecipeItem[];
  instructions: string[];
  finalDish: string;
  imageUrl?: string;
}

interface RecipeCollection {
  recipes: GeneratedRecipe[];
}

const createDishImageDataUrl = (title: string) => {
  const safeTitle = title.trim() || 'Dish';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#f3f4f6" />
          <stop offset="100%" stop-color="#e5e7eb" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#bg)" />
      <circle cx="400" cy="250" r="100" fill="#d1d5db" />
      <circle cx="400" cy="250" r="74" fill="#f9fafb" />
      <text x="400" y="265" text-anchor="middle" font-size="46" fill="#374151">🍽</text>
      <text x="400" y="400" text-anchor="middle" font-size="34" fill="#111827" font-family="Arial, sans-serif">${safeTitle}</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const normalizeRecipe = (raw: unknown): GeneratedRecipe => {
  const data = (raw ?? {}) as Partial<GeneratedRecipe>;
  const ingredients = Array.isArray(data.ingredients) ? data.ingredients : [];
  const instructions = Array.isArray(data.instructions) ? data.instructions : [];

  return {
    title: typeof data.title === 'string' ? data.title.trim() : '',
    servings: typeof data.servings === 'string' ? data.servings.trim() : '',
    estimatedTime: typeof data.estimatedTime === 'string' ? data.estimatedTime.trim() : '',
    ingredients: ingredients
      .map((item) => ({
        name: typeof item?.name === 'string' ? item.name.trim() : '',
        quantity: typeof item?.quantity === 'string' ? item.quantity.trim() : 'as needed',
        fromPantry: Boolean(item?.fromPantry),
      }))
      .filter((item) => item.name.length > 0),
    instructions: instructions
      .map((step) => (typeof step === 'string' ? step.trim() : ''))
      .filter((step) => step.length > 0),
    finalDish: typeof data.finalDish === 'string' ? data.finalDish.trim() : '',
    imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl.trim() : '',
  };
};

const parseRecipeJson = (rawText: string): RecipeCollection => {
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const parsed = JSON.parse(cleaned) as { recipes?: unknown[] };
  const recipes = Array.isArray(parsed.recipes) ? parsed.recipes : [];
  const normalized = recipes
    .map((item) => normalizeRecipe(item))
    .filter((item) => item.title.length > 0 && item.instructions.length > 0 && item.finalDish.length > 0);

  if (normalized.length === 0) {
    throw new Error('Recipe response did not include valid recipes.');
  }

  return { recipes: normalized.slice(0, 3) };
};

export function RecipesView({ ingredients }: RecipesViewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipes, setRecipes] = useState<GeneratedRecipe[]>([]);
  const [openRecipeTitle, setOpenRecipeTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pantryPayload = useMemo(
    () =>
      ingredients.map((item) => ({
        name: item.name.trim(),
        quantity: item.quantity?.trim() || 'unknown',
      })),
    [ingredients],
  );

  const generateRecipe = async () => {
    if (pantryPayload.length === 0) {
      setError('Add ingredients in Pantry or Scan before generating a recipe.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/recipes/aws', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ingredients: pantryPayload }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Recipe request failed (${response.status}): ${errorText}.`);
      }

      const data = (await response.json()) as RecipeResponse;
      if (!data.text) {
        throw new Error('AWS model returned empty recipes.');
      }

      const generated = parseRecipeJson(data.text);
      const sorted = [...generated.recipes].sort((a, b) => {
        const aPantryCount = a.ingredients.filter((item) => item.fromPantry).length;
        const bPantryCount = b.ingredients.filter((item) => item.fromPantry).length;
        return bPantryCount - aPantryCount;
      });

      setRecipes(sorted);
      setOpenRecipeTitle(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate recipe.';
      setError(message);
      setRecipes([]);
      setOpenRecipeTitle(null);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">AI Recipe Generator</h2>
        <p className="text-muted-foreground">Get 3 ranked recipe suggestions from your pantry ({ingredients.length} items).</p>
      </div>

      <ScrollArea className="h-[calc(100vh-12rem)] pr-2 md:pr-4">
        {ingredients.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            <ChefHat className="h-12 w-12 mb-4 opacity-20" />
            <h3 className="text-lg font-semibold">No pantry items yet</h3>
            <p>Add more ingredients to your pantry to generate a recipe.</p>
          </div>
        ) : (
          <div className="space-y-6 pb-6 pr-2 md:pr-4">
            <Button onClick={generateRecipe} disabled={isGenerating} className="w-full md:w-auto">
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating recipe...
                </>
              ) : (
                'Generate 3 Recipe Suggestions'
              )}
            </Button>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {recipes.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {recipes.map((recipe, index) => {
                  const pantryCount = recipe.ingredients.filter((item) => item.fromPantry).length;
                  const isOpen = openRecipeTitle === recipe.title;
                  const imageUrl = recipe.imageUrl || createDishImageDataUrl(recipe.title);

                  return (
                    <Card key={`${recipe.title}-${index}`} className="overflow-hidden">
                      <div className="h-44 w-full bg-muted/40">
                        <img
                          src={imageUrl}
                          alt={recipe.title}
                          className="h-full w-full object-contain"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(event) => {
                            event.currentTarget.src = createDishImageDataUrl(recipe.title);
                          }}
                        />
                      </div>
                      <CardHeader className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-lg">{recipe.title}</CardTitle>
                          <Badge>#{index + 1}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm">
                          <Badge variant="outline">Time: {recipe.estimatedTime || 'N/A'}</Badge>
                          <Badge variant="outline">Portion: {recipe.servings || 'N/A'}</Badge>
                          <Badge variant="secondary">Pantry Match: {pantryCount}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="mb-2 text-sm font-medium">Ingredients</p>
                          <div className="flex flex-wrap gap-2">
                            {recipe.ingredients.map((item) => (
                              <Badge
                                key={`${item.name}-${item.quantity}`}
                                variant="outline"
                                className={item.fromPantry ? 'text-green-700' : ''}
                              >
                                {item.name} ({item.quantity})
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setOpenRecipeTitle(isOpen ? null : recipe.title)}
                        >
                          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          Instructions
                        </Button>

                        {isOpen && (
                          <div className="space-y-3 text-sm text-muted-foreground">
                            <ol className="list-decimal list-inside space-y-2">
                              {recipe.instructions.map((step, stepIndex) => (
                                <li key={`${recipe.title}-${stepIndex + 1}`}>{step}</li>
                              ))}
                            </ol>
                            <p>{recipe.finalDish}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
}

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChefHat, ExternalLink } from 'lucide-react';
import type { Ingredient } from '@/App';

interface RecipesViewProps {
  ingredients: Ingredient[];
}

interface Recipe {
  id: string;
  title: string;
  description: string;
  requiredIngredients: string[];
}

const MOCK_RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Pasta Carbonara',
    description: 'A classic Roman pasta dish made with eggs, hard cheese, cured pork, and black pepper.',
    requiredIngredients: ['Pasta', 'Eggs', 'Cheese', 'Bacon', 'Pepper'],
  },
  {
    id: '2',
    title: 'Grilled Cheese Sandwich',
    description: 'Bread, cheese, and butter fried until golden and melted.',
    requiredIngredients: ['Bread', 'Cheese', 'Butter'],
  },
  {
    id: '3',
    title: 'Spinach & Tomato Salad',
    description: 'Fresh spinach tossed with tomatoes and olive oil.',
    requiredIngredients: ['Spinach', 'Tomato', 'Olive Oil'],
  },
  {
    id: '4',
    title: 'Scrambled Eggs',
    description: 'Fluffy eggs beaten and fried.',
    requiredIngredients: ['Eggs', 'Butter', 'Salt'],
  },
  {
    id: '5',
    title: 'Tomato Soup',
    description: 'Warm and comforting soup made from fresh tomatoes.',
    requiredIngredients: ['Tomato', 'Onion', 'Garlic', 'Cream'],
  }
];

export function RecipesView({ ingredients }: RecipesViewProps) {
  // Simple normalization for matching (lowercase, trim)
  const userIngredientNames = new Set(ingredients.map(i => i.name.toLowerCase().trim()));

  const matchedRecipes = MOCK_RECIPES.map(recipe => {
    const matched = recipe.requiredIngredients.filter(req => 
      userIngredientNames.has(req.toLowerCase())
    );
    const missing = recipe.requiredIngredients.filter(req => 
      !userIngredientNames.has(req.toLowerCase())
    );
    
    // Calculate a simple score: percentage of ingredients owned
    const matchPercentage = matched.length / recipe.requiredIngredients.length;

    return { ...recipe, matched, missing, matchPercentage };
  }).filter(r => r.matched.length > 0) // Only show if at least 1 ingredient is matched
    .sort((a, b) => b.matchPercentage - a.matchPercentage);

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Suggested Recipes</h2>
        <p className="text-muted-foreground">Based on your pantry ({ingredients.length} items).</p>
      </div>

      <ScrollArea className="h-[calc(100vh-12rem)]">
        {matchedRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            <ChefHat className="h-12 w-12 mb-4 opacity-20" />
            <h3 className="text-lg font-semibold">No matches yet</h3>
            <p>Add more ingredients to your pantry to see suggestions!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-6">
            {matchedRecipes.map((recipe) => (
              <Card key={recipe.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex justify-between items-start gap-2">
                    {recipe.title}
                    <Badge variant={recipe.matchPercentage === 1 ? 'default' : 'secondary'}>
                      {Math.round(recipe.matchPercentage * 100)}% Match
                    </Badge>
                  </CardTitle>
                  <CardDescription>{recipe.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">You Have:</p>
                      <div className="flex flex-wrap gap-1">
                        {recipe.matched.map(ing => (
                          <Badge key={ing} variant="outline" className="text-green-600 border-green-200 bg-green-50">
                            {ing}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {recipe.missing.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 text-muted-foreground">Missing:</p>
                        <div className="flex flex-wrap gap-1">
                          {recipe.missing.map(ing => (
                            <Badge key={ing} variant="outline" className="text-muted-foreground">
                              {ing}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                   <Button variant="outline" className="w-full">
                     <ExternalLink className="mr-2 h-4 w-4" /> View Instructions
                   </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
}

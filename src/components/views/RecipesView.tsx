import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChefHat, Loader2, Search } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchRecipes, fetchRecipeDetails } from '@/store/slices/recipesSlice';
import type { IngredientInfo } from '@/types';
import { RecipeDetailsModal } from '@/components/RecipeDetailsModal';

export function RecipesView() {
  const dispatch = useAppDispatch();
  const ingredients = useAppSelector((state) => state.ingredients.items);
  const { items: recipes, status, error, selectedRecipeDetails, detailsStatus } = useAppSelector((state) => state.recipes);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    if (ingredients.length > 0 && status === 'idle') {
       const ingredientNames = ingredients.map(i => i.name);
       dispatch(fetchRecipes(ingredientNames));
    }
  }, [ingredients, status, dispatch]);

  const handleSearch = () => {
    if (ingredients.length > 0) {
      const ingredientNames = ingredients.map(i => i.name);
      dispatch(fetchRecipes(ingredientNames));
    }
  };

  const handleViewRecipe = (id: number) => {
      dispatch(fetchRecipeDetails(id));
      setIsDetailsOpen(true);
  };

  const handleCloseDetails = () => {
      setIsDetailsOpen(false);
  };

  return (
    <motion.div 
      className="space-y-6 h-[calc(100vh-8rem)]"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Suggested Recipes</h2>
                <p className="text-muted-foreground">Based on your pantry ({ingredients.length} items).</p>
            </div>
            <Button onClick={handleSearch} disabled={ingredients.length === 0 || status === 'loading'}>
                {status === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Find Recipes
            </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 text-red-500 bg-red-50 rounded-md">
            Error: {error}
        </div>
      )}

      {/* Main Content Area - Full width now */}
      <div className="h-full min-h-0">
         <ScrollArea className="h-full pr-4">
            {recipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20 h-full">
                <ChefHat className="h-12 w-12 mb-4 opacity-20" />
                <h3 className="text-lg font-semibold">No recipes found</h3>
                <p className="text-sm">Add ingredients to your pantry and we'll find matching recipes!</p>
            </div>
            ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-20">
                {recipes.map((recipe) => (
                    <motion.div
                    key={recipe.id}
                    whileHover={{ y: -5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    >
                    <Card className="flex flex-col h-full overflow-hidden shadow-sm hover:shadow-md transition-shadow border-muted/60">
                        <div className="relative h-48 w-full overflow-hidden">
                        <img 
                            src={recipe.image} 
                            alt={recipe.title}
                            className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                            <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 drop-shadow-sm">
                                {recipe.title}
                            </h3>
                        </div>
                        </div>
                        
                        <CardContent className="flex-1 p-4 space-y-4">
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-2">
                            <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-100">
                                {recipe.usedIngredientCount} Used
                            </span>
                            <span className="flex items-center gap-1 bg-orange-50 text-orange-700 px-2 py-1 rounded-full border border-orange-100">
                                {recipe.missedIngredientCount} Missing
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pantry Match</p>
                            <div className="flex flex-wrap gap-1.5">
                                {recipe.usedIngredients.map((ing: IngredientInfo) => (
                                <Badge key={ing.id} variant="secondary" className="bg-green-100/50 text-green-800 hover:bg-green-100 border-0">
                                    {ing.name}
                                </Badge>
                                ))}
                            </div>
                            </div>
                            
                            {recipe.missedIngredientCount > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">You Need</p>
                                <div className="flex flex-wrap gap-1.5">
                                {recipe.missedIngredients.map((ing: IngredientInfo) => (
                                    <Badge key={ing.id} variant="outline" className="text-muted-foreground border-dashed">
                                    {ing.name}
                                    </Badge>
                                ))}
                                </div>
                            </div>
                            )}
                        </div>
                        </CardContent>
                        <div className="p-4 pt-0 mt-auto">
                        <Button 
                            variant="default" 
                            className="w-full bg-primary/90 hover:bg-primary"
                            onClick={() => handleViewRecipe(recipe.id)}
                        >
                            View Recipe
                        </Button>
                        </div>
                    </Card>
                    </motion.div>
                ))}
            </div>
            )}
        </ScrollArea>
      </div>

      <RecipeDetailsModal 
        recipe={selectedRecipeDetails} 
        isOpen={isDetailsOpen} 
        onClose={handleCloseDetails} 
        isLoading={detailsStatus === 'loading'}
      />
    </motion.div>
  );
}

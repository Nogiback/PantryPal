import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChefHat, Loader2, RefreshCw, Search } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchRecipes, fetchRecipeDetails } from "@/store/slices/recipesSlice";
import type { IngredientInfo } from "@/types";
import { RecipeDetailsModal } from "@/components/RecipeDetailsModal";

export function RecipesView() {
  const dispatch = useAppDispatch();
  const ingredients = useAppSelector((state) => state.ingredients.items);
  const {
    items: recipes,
    status,
    error,
    appliedFilters,
    selectedRecipeDetails,
    detailsStatus,
  } = useAppSelector((state) => state.recipes);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const now = new Date();
  const expiringSoonNames = useMemo(() => {
    return new Set(
      ingredients
        .filter((ing) => {
          if (!ing.expiryDate) return false;
          const diffDays = (new Date(ing.expiryDate).getTime() - now.getTime()) / (1000 * 3600 * 24);
          return diffDays <= 7;
        })
        .map((ing) => ing.name.toLowerCase().trim())
    );
  }, [ingredients]);

  const isExpiringMatch = (ingName: string) => {
    const lower = ingName.toLowerCase();
    for (const expiringName of expiringSoonNames) {
      if (lower.includes(expiringName) || expiringName.includes(lower)) return true;
    }
    return false;
  };

  const ingredientSignature = useMemo(
    () =>
      ingredients
        .map((item) => item.name.trim().toLowerCase())
        .filter(Boolean)
        .join(","),
    [ingredients],
  );

  // If pantry changes while recipes are already loading, queue a refresh so we don't miss the update.
  const lastRequestedSignatureRef = useRef<string>("");
  const queuedSignatureRef = useRef<string>("");

  useEffect(() => {
    if (ingredients.length === 0) return;

    if (status === "loading") {
      queuedSignatureRef.current = ingredientSignature;
      return;
    }

    if (ingredientSignature && ingredientSignature !== lastRequestedSignatureRef.current) {
      lastRequestedSignatureRef.current = ingredientSignature;
      dispatch(fetchRecipes());
    }
  }, [dispatch, ingredientSignature, ingredients.length, status]);

  useEffect(() => {
    if (status === "loading") return;
    const queued = queuedSignatureRef.current;
    if (!queued) return;
    if (queued === lastRequestedSignatureRef.current) {
      queuedSignatureRef.current = "";
      return;
    }
    lastRequestedSignatureRef.current = queued;
    queuedSignatureRef.current = "";
    dispatch(fetchRecipes());
  }, [dispatch, status]);

  const handleSearch = () => {
    if (ingredients.length > 0 && status !== "loading") {
      lastRequestedSignatureRef.current = ingredientSignature;
      dispatch(fetchRecipes());
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
      className="space-y-6 h-[calc(100vh-10rem)]"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Suggested recipes</h2>
          <p className="text-muted-foreground">
            Based on your pantry ({ingredients.length} items).
          </p>
          {appliedFilters &&
            (appliedFilters.diet ||
              appliedFilters.intolerances.length > 0 ||
              appliedFilters.excludeIngredients.length > 0 ||
              Object.keys(appliedFilters.tuning || {}).length > 0) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {appliedFilters.diet && (
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-800 border border-emerald-100">
                    Diet: {appliedFilters.diet}
                  </Badge>
                )}
                {appliedFilters.intolerances.map((item) => (
                  <Badge key={item} variant="outline" className="border-dashed">
                    Avoid: {item}
                  </Badge>
                ))}
                {appliedFilters.excludeIngredients.slice(0, 3).map((item) => (
                  <Badge key={item} variant="outline" className="border-dashed">
                    Exclude: {item}
                  </Badge>
                ))}
                {"maxReadyTime" in (appliedFilters.tuning || {}) &&
                  typeof (appliedFilters.tuning as { maxReadyTime?: unknown }).maxReadyTime === "number" && (
                    <Badge variant="secondary" className="bg-slate-50 text-slate-700 border border-slate-200">
                      ≤ {(appliedFilters.tuning as { maxReadyTime: number }).maxReadyTime} min
                    </Badge>
                  )}
                {"sort" in (appliedFilters.tuning || {}) &&
                  typeof (appliedFilters.tuning as { sort?: unknown }).sort === "string" && (
                    <Badge variant="secondary" className="bg-slate-50 text-slate-700 border border-slate-200">
                      Sort: {(appliedFilters.tuning as { sort: string }).sort}
                    </Badge>
                  )}
                {appliedFilters.excludeIngredients.length > 3 && (
                  <Badge variant="secondary" className="bg-slate-50 text-slate-700 border border-slate-200">
                    +{appliedFilters.excludeIngredients.length - 3} more excludes
                  </Badge>
                )}
              </div>
            )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSearch}
            disabled={ingredients.length === 0 || status === "loading"}
          >
            {status === "loading" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button
            onClick={handleSearch}
            disabled={ingredients.length === 0 || status === "loading"}
          >
            {status === "loading" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Find
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
          {status === "loading" && recipes.length === 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-20">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Card
                  key={idx}
                  className="overflow-hidden shadow-sm border-muted/60 animate-pulse"
                >
                  <div className="h-48 bg-muted" />
                  <CardContent className="p-4 space-y-4">
                    <div className="h-4 w-3/4 bg-muted rounded" />
                    <div className="h-3 w-2/3 bg-muted rounded" />
                    <div className="flex gap-2">
                      <div className="h-6 w-16 bg-muted rounded-full" />
                      <div className="h-6 w-20 bg-muted rounded-full" />
                    </div>
                    <div className="h-9 w-full bg-muted rounded-md" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20 h-full">
              <ChefHat className="h-12 w-12 mb-4 opacity-20" />
              <h3 className="text-lg font-semibold">No recipes found</h3>
              <p className="text-sm">
                Add ingredients to your pantry and we'll find matching recipes!
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-20">
              {recipes.map((recipe) => (
                <motion.div
                  key={recipe.id}
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="flex flex-col h-full overflow-hidden shadow-sm hover:shadow-md transition-shadow border-muted/60">
                    <div className="relative h-48 w-full overflow-hidden">
                      <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent flex items-end p-4">
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
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Pantry Match
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {recipe.usedIngredients.map(
                              (ing: IngredientInfo) => {
                                const expiresSoon = isExpiringMatch(ing.name);
                                return (
                                  <Badge
                                    key={ing.id}
                                    variant="secondary"
                                    className={
                                      expiresSoon
                                        ? "bg-orange-100/80 text-orange-800 hover:bg-orange-200 border-0"
                                        : "bg-green-100/50 text-green-800 hover:bg-green-100 border-0"
                                    }
                                  >
                                    {ing.name}
                                    {expiresSoon && <span className="ml-1" title="Expiring soon">⏳</span>}
                                  </Badge>
                                );
                              }
                            )}
                          </div>
                        </div>

                        {recipe.missedIngredientCount > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              You Need
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {recipe.missedIngredients.map(
                                (ing: IngredientInfo) => (
                                  <Badge
                                    key={ing.id}
                                    variant="outline"
                                    className="text-muted-foreground border-dashed"
                                  >
                                    {ing.name}
                                  </Badge>
                                ),
                              )}
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
        isLoading={detailsStatus === "loading"}
      />
    </motion.div>
  );
}

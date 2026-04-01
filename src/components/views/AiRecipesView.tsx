import { useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChefHat, Loader2, RefreshCw, Sparkles, CheckCircle2, Clock, Users } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAiRecipes } from "@/store/slices/recipesSlice";

export function AiRecipesView() {
  const dispatch = useAppDispatch();
  const ingredients = useAppSelector((state) => state.ingredients.items);
  const { aiRecipes, aiStatus, aiError } = useAppSelector((state) => state.recipes);

  const handleGenerate = () => {
    dispatch(fetchAiRecipes());
  };

  useEffect(() => {
    if (aiStatus === "idle" && aiRecipes.length === 0 && ingredients.length > 0) {
      dispatch(fetchAiRecipes());
    }
  }, [dispatch, aiStatus, aiRecipes.length, ingredients.length]);

  return (
    <motion.div
      className="flex flex-col h-[calc(100vh-8rem)] space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" /> AI Kitchen
          </h2>
          <p className="text-muted-foreground">
            Custom recipes hand-crafted by AI specifically for your pantry ({ingredients.length} items).
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={ingredients.length === 0 || aiStatus === "loading"}
            className="bg-primary hover:bg-primary/90 rounded-full shadow-sm"
          >
            {aiStatus === "loading" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Regenerate
          </Button>
        </div>
      </div>

      {aiError && (
        <div className="p-4 text-red-500 bg-red-50 rounded-xl border border-red-200 shadow-sm">
          Error: {aiError}
        </div>
      )}

      <div className="h-full min-h-0">
        <ScrollArea className="h-full pr-4 pb-12">
          {aiStatus === "loading" && aiRecipes.length === 0 ? (
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 pb-20">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Card
                  key={idx}
                  className="overflow-hidden shadow-sm border-primary/20 bg-background/50 animate-pulse rounded-3xl"
                >
                  <div className="h-56 bg-primary/10" />
                  <CardContent className="p-6 space-y-4">
                    <div className="h-6 w-3/4 bg-primary/10 rounded-xl" />
                    <div className="h-4 w-1/2 bg-primary/5 rounded-xl" />
                    <div className="h-24 w-full bg-primary/5 rounded-xl mt-6" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : aiStatus !== "loading" && aiRecipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed border-primary/20 rounded-3xl bg-primary/5 h-64">
              <ChefHat className="h-16 w-16 mb-4 text-primary/40" />
              <h3 className="text-xl font-bold text-primary">Ready to cook?</h3>
              <p className="text-sm mt-2 mb-6 max-w-sm">
                Add some items to your pantry, then ask the AI Chef to brainstorm unique recipes for you!
              </p>
              <Button onClick={handleGenerate} disabled={ingredients.length === 0} className="rounded-full shadow-md">
                Generate First Recipes
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 pb-20">
              {aiRecipes.map((recipe, index) => {
                const usedCount = recipe.ingredients.filter(i => i.fromPantry).length;
                const totalCount = recipe.ingredients.length;
                
                return (
                  <motion.div
                    key={index}
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Card className="flex flex-col h-full overflow-hidden shadow-sm hover:shadow-xl transition-all border-primary/20 rounded-3xl bg-linear-to-b from-background to-primary/5">
                      <div className="relative h-64 w-full overflow-hidden">
                        {recipe.imageUrl ? (
                          <img
                            src={recipe.imageUrl}
                            alt={recipe.title}
                            className="object-cover w-full h-full transition-transform duration-700 hover:scale-110"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                            <ChefHat className="h-12 w-12 text-primary/30" />
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/90 via-black/50 to-transparent p-6 pt-16">
                          <h3 className="text-white font-bold text-2xl leading-tight drop-shadow-md">
                            {recipe.title}
                          </h3>
                        </div>
                        <div className="absolute top-4 right-4">
                          <Badge variant="secondary" className="bg-white/95 text-primary border-none shadow-md backdrop-blur flex items-center gap-1.5 py-1 px-3">
                            <Sparkles className="h-3.5 w-3.5" /> AI Generated
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="flex-1 p-6 flex flex-col gap-6">
                        <div className="flex items-center gap-6 text-sm font-semibold text-muted-foreground bg-primary/5 p-3 rounded-2xl border border-primary/10">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-emerald-600" />
                            {recipe.estimatedTime}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600" />
                            {recipe.servings} Servings
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
                                Ingredients
                              </h4>
                              <span className="text-xs font-bold bg-primary text-white px-2.5 py-1 rounded-full shadow-sm">
                                {usedCount}/{totalCount} from Pantry
                              </span>
                            </div>
                            <ul className="space-y-2.5 bg-background border border-border/50 p-4 rounded-2xl shadow-xs">
                              {recipe.ingredients.map((ing, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm">
                                  {ing.fromPantry ? (
                                    <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                                  ) : (
                                    <div className="h-4.5 w-4.5 rounded-full border-2 border-muted-foreground/30 shrink-0 mt-0.5" />
                                  )}
                                  <span className={ing.fromPantry ? "font-semibold text-foreground leading-snug" : "text-muted-foreground leading-snug"}>
                                    <span className="font-bold">{ing.quantity}</span> {ing.name}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="pt-2">
                            <h4 className="text-sm font-bold uppercase tracking-wider text-primary mb-3">
                              Instructions
                            </h4>
                            <ol className="space-y-4 text-sm text-foreground/90 list-none">
                              {recipe.instructions.map((step, i) => (
                                <li key={i} className="flex gap-3 leading-relaxed">
                                  <span className="flex-none flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs mt-0.5">
                                    {i + 1}
                                  </span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                        
                        <div className="mt-auto pt-4">
                          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 text-sm font-medium italic text-muted-foreground/80 text-center">
                            "{recipe.finalDish}"
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    </motion.div>
  );
}

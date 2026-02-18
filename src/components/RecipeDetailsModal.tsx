
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { RecipeDetails } from '@/types';
import { Clock, Users, ExternalLink, Info, ChefHat, CheckCircle2, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface RecipeDetailsProps {
  recipe: RecipeDetails | null;
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
}

export function RecipeDetailsModal({ recipe, isOpen, onClose, isLoading }: RecipeDetailsProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden h-[90vh] md:h-[85vh] flex flex-col gap-0 border-0 rounded-2xl shadow-2xl bg-background/95 backdrop-blur-md">
        
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center flex-col gap-6 bg-gradient-to-br from-background to-muted/20">
             <div className="relative">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary border-r-4 border-r-transparent"></div>
             </div>
             <div className="flex flex-col items-center gap-2">
                <p className="text-xl font-bold tracking-tight text-foreground/80">Crafting your recipe...</p>
                <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-primary"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                        />
                    ))}
                </div>
             </div>
          </div>
        ) : !recipe ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                <Info className="h-16 w-16 mb-6 opacity-20 text-primary" />
                <h3 className="text-2xl font-bold text-foreground mb-2">Recipe details unavailable</h3>
                <p className="max-w-xs mb-8">We couldn't retrieve the details for this dish right now.</p>
                <Button variant="default" onClick={onClose} className="rounded-full px-8">Return to Search</Button>
            </div>
        ) : (
          <div className="flex flex-col h-full w-full relative">
            {/* Close button hint for accessibility if needed, but Dialog provides it */}
            
            <div className="flex flex-col md:flex-row h-full overflow-hidden">
                {/* Visual Section - Left column on Desktop */}
                <div className="w-full md:w-[30%] h-64 md:h-auto flex-shrink-0 relative overflow-hidden group">
                    <motion.img
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        src={recipe.image}
                        alt={recipe.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    
                    {/* Floating Meta Cards - Desktop only or stack on mobile image */}
                    <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-3">
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex-1 min-w-[120px]"
                        >
                            <div className="flex items-center gap-2 text-white/90 mb-1">
                                <Clock className="w-4 h-4 text-primary-foreground" />
                                <span className="text-xs font-semibold uppercase tracking-wider">Time</span>
                            </div>
                            <div className="text-white text-lg font-bold">{recipe.readyInMinutes} mins</div>
                        </motion.div>
                        
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex-1 min-w-[120px]"
                        >
                            <div className="flex items-center gap-2 text-white/90 mb-1">
                                <Users className="w-4 h-4 text-primary-foreground" />
                                <span className="text-xs font-semibold uppercase tracking-wider">Servings</span>
                            </div>
                            <div className="text-white text-lg font-bold">{recipe.servings} people</div>
                        </motion.div>
                    </div>
                </div>

                {/* Content Section - Right column on Desktop */}
                <div className="flex-1 flex flex-col h-full min-h-0 bg-background overflow-hidden">
                    <header className="px-6 md:px-10 pt-8 pb-6 space-y-4 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-20">
                        <DialogDescription className="sr-only">
                            Detailed view of recipe for {recipe.title}
                        </DialogDescription>
                        <div className="flex justify-between items-start">
                            <div className="flex flex-wrap gap-2 pr-12">
                                {recipe.dishTypes?.slice(0, 4).map((type, idx) => (
                                    <motion.div
                                        key={type}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.1 * idx }}
                                    >
                                        <Badge variant="outline" className="capitalize bg-primary/5 text-primary border-primary/10 px-2.5 py-1 text-[10px] font-bold tracking-wider">
                                            {type}
                                        </Badge>
                                    </motion.div>
                                ))}
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={onClose}
                                className="h-10 w-10 rounded-full hover:bg-muted shrink-0 transition-colors"
                            >
                                <X className="h-5 w-5 text-muted-foreground" />
                            </Button>
                        </div>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <DialogTitle className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-foreground leading-[1.15] drop-shadow-sm">
                                {recipe.title}
                            </DialogTitle>
                        </motion.div>
                    </header>

                    <ScrollArea className="flex-1 h-full min-h-0">
                        <div className="px-6 md:px-10 py-8 space-y-12">
                            {/* Summary / About */}
                            <section className="space-y-4">
                                <h3 className="text-lg font-bold uppercase tracking-widest text-primary/80 flex items-center gap-2">
                                    <Info className="w-4 h-4" /> About this dish
                                </h3>
                                <div 
                                    className="text-muted-foreground leading-relaxed text-base prose prose-sm max-w-none [&>a]:text-primary [&>a]:underline [&>b]:text-foreground [&>b]:font-semibold"
                                    dangerouslySetInnerHTML={{ __html: recipe.summary }}
                                />
                            </section>

                            <div className="grid lg:grid-cols-1 gap-12">
                                {/* Ingredients */}
                                <section className="space-y-6">
                                    <div className="flex items-center justify-between border-b pb-4">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <ChefHat className="w-6 h-6 text-primary" /> 
                                            Ingredients
                                        </h3>
                                        <Badge variant="outline" className="rounded-full">{recipe.extendedIngredients?.length || 0} items</Badge>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {recipe.extendedIngredients?.map((ing: any, idx: number) => (
                                            <motion.div 
                                                key={`${ing.id}-${idx}`}
                                                initial={{ opacity: 0, y: 10 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: (idx % 10) * 0.05 }}
                                                className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-transparent hover:border-primary/20 hover:bg-muted/50 transition-all group"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-white p-2 shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform">
                                                    <img 
                                                        src={`https://spoonacular.com/cdn/ingredients_100x100/${ing.image}`} 
                                                        alt={ing.name}
                                                        className="w-full h-full object-contain mix-blend-multiply" 
                                                        loading="lazy"
                                                    />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-bold text-foreground truncate capitalize">{ing.name}</span>
                                                    <span className="text-sm text-muted-foreground">{ing.amount} {ing.unit}</span>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </section>

                                {/* Dietary Tags */}
                                <section className="bg-muted/20 rounded-3xl p-6 border border-muted-foreground/10">
                                    <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Dietary Highlights</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            { key: 'vegetarian', label: 'Vegetarian', color: 'bg-green-50 text-green-700 border-green-100' },
                                            { key: 'vegan', label: 'Vegan', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                                            { key: 'glutenFree', label: 'Gluten Free', color: 'bg-orange-50 text-orange-700 border-orange-100' },
                                            { key: 'dairyFree', label: 'Dairy Free', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                                            { key: 'veryHealthy', label: 'Heart Healthy', color: 'bg-rose-50 text-rose-700 border-rose-100' },
                                            { key: 'cheap', label: 'Budget Friendly', color: 'bg-amber-50 text-amber-700 border-amber-100' },
                                        ].map(tag => recipe[tag.key as keyof RecipeDetails] ? (
                                            <Badge 
                                                key={tag.key} 
                                                variant="outline" 
                                                className={`px-3 py-1.5 rounded-full border shadow-sm ${tag.color}`}
                                            >
                                                {tag.label}
                                            </Badge>
                                        ) : null)}
                                    </div>
                                </section>

                                {/* Instructions */}
                                <section className="space-y-8">
                                    <div className="flex items-center justify-between border-b pb-4">
                                        <h3 className="text-xl font-bold flex items-center gap-3">
                                            <CheckCircle2 className="w-6 h-6 text-primary" /> 
                                            Preparation
                                        </h3>
                                    </div>
                                    
                                    {recipe.analyzedInstructions?.[0]?.steps?.length > 0 ? (
                                        <ol className="space-y-10 relative">
                                            {/* Vertical Line for steps */}
                                            <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-muted"></div>
                                            
                                            {recipe.analyzedInstructions[0].steps.map((step) => (
                                                <motion.li 
                                                    key={step.number} 
                                                    initial={{ opacity: 0, x: 20 }}
                                                    whileInView={{ opacity: 1, x: 0 }}
                                                    viewport={{ once: true }}
                                                    transition={{ delay: 0.1 }}
                                                    className="relative pl-12 group"
                                                >
                                                    <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-background border-4 border-muted group-hover:border-primary transition-colors flex items-center justify-center font-black text-primary shadow-sm z-10">
                                                        {step.number}
                                                    </div>
                                                    <div className="space-y-4">
                                                        <p className="text-lg leading-relaxed text-foreground/90 font-medium tracking-tight">
                                                            {step.step}
                                                        </p>
                                                        {/* Step Meta (Equipment/Ingredients) could go here if we wanted deeper details */}
                                                    </div>
                                                </motion.li>
                                            ))}
                                        </ol>
                                    ) : (
                                        <div className="p-12 text-center bg-muted/20 rounded-3xl border-2 border-dashed flex flex-col items-center gap-6">
                                            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center">
                                                <ExternalLink className="w-8 h-8 text-muted-foreground" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-xl font-bold">More details needed?</p>
                                                <p className="text-muted-foreground max-w-xs mx-auto">Full cooking directions are available on the creator's website.</p>
                                            </div>
                                            <Button variant="outline" asChild className="rounded-full px-8 bg-background shadow-sm hover:shadow-md transition-all">
                                                <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                                    View Original Recipe <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </Button>
                                        </div>
                                    )}
                                </section>
                            </div>

                            {/* Footer / Call to Action */}
                            <Separator />
                            <footer className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6">
                                <div className="space-y-1 text-center sm:text-left">
                                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Recipe Source</p>
                                    <p className="font-bold text-foreground">{recipe.sourceName || new URL(recipe.sourceUrl).hostname}</p>
                                </div>
                                <Button asChild size="lg" className="rounded-full px-10 shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all font-bold">
                                    <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                        Full Details <ExternalLink className="w-4 h-4" />
                                    </a>
                                </Button>
                            </footer>
                        </div>
                    </ScrollArea>
                </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

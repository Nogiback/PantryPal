import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ScanLine, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  removeIngredient,
  savePantry,
} from "@/store/slices/ingredientsSlice";
import { AddPantryItemModal } from "@/components/AddPantryItemModal";
import type { Ingredient } from "@/types";

interface PantryViewProps {
  onGoToScan?: () => void;
}

const CATEGORY_ORDER = [
  "Dairy & Eggs",
  "Meat & Poultry",
  "Produce",
  "Spices & Herbs",
  "Condiments & Oils",
  "Seafood",
  "Other",
];

const CATEGORY_ICONS: Record<string, string> = {
  "Dairy & Eggs": "🧀",
  "Meat & Poultry": "🥩",
  "Produce": "🥦",
  "Spices & Herbs": "🌶️",
  "Condiments & Oils": "🫙",
  "Seafood": "🐟",
  "Other": "📦"
};

export function PantryView({ onGoToScan }: PantryViewProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const ingredients = useAppSelector((state) => state.ingredients.items);
  const saveStatus = useAppSelector((state) => state.ingredients.saveStatus);
  const saveError = useAppSelector((state) => state.ingredients.saveError);
  const dispatch = useAppDispatch();

  const ingredientSignature = useMemo(
    () =>
      ingredients
        .map((item) => `${item.id}:${item.name}:${item.quantity ?? ""}:${item.expiryDate ?? ""}`)
        .join("|"),
    [ingredients],
  );

  const lastSavedSignatureRef = useRef<string>("");
  const queuedSignatureRef = useRef<string>("");
  const debounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    if (!ingredientSignature) return;
    if (ingredientSignature === lastSavedSignatureRef.current) return;

    if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = window.setTimeout(() => {
      if (saveStatus === "loading") {
        queuedSignatureRef.current = ingredientSignature;
        return;
      }
      lastSavedSignatureRef.current = ingredientSignature;
      dispatch(savePantry());
    }, 450);

    return () => {
      if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
    };
  }, [dispatch, ingredientSignature, saveStatus]);

  useEffect(() => {
    if (saveStatus === "loading") return;
    const queued = queuedSignatureRef.current;
    if (!queued) return;
    if (queued === lastSavedSignatureRef.current) {
      queuedSignatureRef.current = "";
      return;
    }
    lastSavedSignatureRef.current = queued;
    queuedSignatureRef.current = "";
    dispatch(savePantry());
  }, [dispatch, saveStatus]);

  const handleRemove = (id: string) => {
    dispatch(removeIngredient(id));
  };

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  // Group items by category
  const groupedIngredients = useMemo(() => {
    const groups: Record<string, Ingredient[]> = {};
    CATEGORY_ORDER.forEach(cat => groups[cat] = []);
    
    ingredients.forEach(ing => {
      const cat = ing.category || "Other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(ing);
    });
    
    // Clean empty categories to not show them, unless we want to show empty ones
    // We will show all standard categories even if empty to match the UI, except "Other" which only shows if it has items.
    if (groups["Other"] && groups["Other"].length === 0) {
      delete groups["Other"];
    }
    
    return groups;
  }, [ingredients]);

  const now = new Date();
  
  // Expiry states
  const expiringSoon = useMemo(() => {
    return ingredients.filter(ing => {
      if (!ing.expiryDate) return false;
      const expiry = new Date(ing.expiryDate);
      const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 7 && diffDays >= 0;
    }).sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime());
  }, [ingredients]);

  const expired = useMemo(() => {
    return ingredients.filter(ing => {
      if (!ing.expiryDate) return false;
      const expiry = new Date(ing.expiryDate);
      return expiry.getTime() < now.getTime();
    }).sort((a, b) => new Date(b.expiryDate!).getTime() - new Date(a.expiryDate!).getTime());
  }, [ingredients]);

  const getExpiryBadge = (dateString?: string) => {
    if (!dateString) return null;
    const expiry = new Date(dateString);
    const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 3600 * 24);
    
    if (diffDays < 0) {
      return <Badge variant="secondary" className="bg-red-100/50 text-red-700 hover:bg-red-100 border-0 ml-auto mr-2">Expired</Badge>;
    } else if (diffDays <= 7) {
      return <Badge variant="secondary" className="bg-orange-100/50 text-orange-700 hover:bg-orange-100 border-0 ml-auto mr-2">{Math.ceil(diffDays)}d left</Badge>;
    }
    return <Badge variant="secondary" className="bg-green-100/50 text-green-700 hover:bg-green-100 border-0 ml-auto mr-2">Fresh</Badge>;
  };

  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">My Pantry</h2>
          <p className="text-muted-foreground">
            {ingredients.length} items - {expiringSoon.length} expiring soon
            {saveStatus === "loading" && " (Saving…)"}
          </p>
        </div>
        
        <div className="flex gap-2">
          {onGoToScan && (
            <Button variant="outline" className="rounded-full" onClick={onGoToScan}>
              <ScanLine className="h-4 w-4 mr-2" />
              Scan
            </Button>
          )}
          <Button onClick={() => setIsAddModalOpen(true)} className="rounded-full">
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      {saveError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {saveError}
        </div>
      )}

      {expired.length > 0 && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium flex items-center">
          {expired.length} item{expired.length !== 1 ? 's' : ''} have expired.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        {/* Left Side: Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(groupedIngredients).map(([category, items]) => {
            const isCollapsed = collapsedCategories[category];
            const expiredInCat = items.filter(ing => {
              if (!ing.expiryDate) return false;
              return new Date(ing.expiryDate).getTime() < now.getTime();
            }).length;

            return (
              <Card key={category} className="rounded-3xl border-border/60 bg-background/70 backdrop-blur overflow-hidden flex flex-col h-fit py-0 gap-0">
                <div 
                  className="px-5 py-4 flex flex-row items-center justify-between cursor-pointer bg-muted hover:bg-muted/80 transition-colors"
                  onClick={() => toggleCategory(category)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-primary">
                      {CATEGORY_ICONS[category] && <span className="text-lg leading-none">{CATEGORY_ICONS[category]}</span>}
                      {category}
                    </span>
                    <span className="text-xs text-muted-foreground">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
                    {expiredInCat > 0 && (
                      <span className="text-xs text-red-500 font-medium">• {expiredInCat} expired</span>
                    )}
                  </div>
                  {isCollapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
                </div>
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <CardContent className="p-0">
                        {items.length === 0 ? (
                          <div className="p-4 text-sm text-muted-foreground text-center italic opacity-60">
                            empty
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            {items.map((ing, i) => (
                              <div key={ing.id} className={`p-4 flex items-center justify-between group ${i !== items.length - 1 ? 'border-b border-border/40' : ''}`}>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-sm">{ing.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {(ing.quantity || "") + " " + (ing.unit || "")}
                                    {ing.expiryDate ? ` • Expires ${ing.expiryDate}` : ''}
                                  </span>
                                  {ing.notes && <span className="text-xs text-muted-foreground italic mt-0.5">{ing.notes}</span>}
                                </div>
                                <div className="flex items-center">
                                  {getExpiryBadge(ing.expiryDate)}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                                    onClick={(e) => { e.stopPropagation(); handleRemove(ing.id); }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>

        {/* Right Side: Expiring Soon Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm uppercase tracking-wider">Expiring Soon</h3>
            {expiringSoon.length > 0 && (
              <span className="text-xs text-primary font-medium cursor-pointer hover:underline">See all</span>
            )}
          </div>
          
          {expiringSoon.length === 0 && expired.length === 0 ? (
            <div className="text-sm text-muted-foreground bg-muted/20 p-4 rounded-2xl border border-dashed text-center">
              No items expiring soon.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {[...expired, ...expiringSoon].slice(0, 10).map((ing) => (
                <div key={ing.id} className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{ing.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(ing.expiryDate!) < now ? 'Expired' : `Expires ${ing.expiryDate}`}
                    </span>
                  </div>
                  {getExpiryBadge(ing.expiryDate)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddPantryItemModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </motion.div>
  );
}

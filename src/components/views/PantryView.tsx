import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Plus, ScanLine, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addIngredient,
  removeIngredient,
  savePantry,
} from "@/store/slices/ingredientsSlice";

interface PantryViewProps {
  onGoToScan?: () => void;
}

export function PantryView({ onGoToScan }: PantryViewProps) {
  const [nameValue, setNameValue] = useState("");
  const [quantityValue, setQuantityValue] = useState("");
  const ingredients = useAppSelector((state) => state.ingredients.items);
  const saveStatus = useAppSelector((state) => state.ingredients.saveStatus);
  const saveError = useAppSelector((state) => state.ingredients.saveError);
  const dispatch = useAppDispatch();

  const ingredientSignature = useMemo(
    () =>
      ingredients
        .map((item) => `${item.id}:${item.name}:${item.quantity ?? ""}`)
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

  const handleAdd = () => {
    if (nameValue.trim()) {
      dispatch(addIngredient({ name: nameValue, quantity: quantityValue }));
      setNameValue("");
      setQuantityValue("");
    }
  };

  const handleRemove = (id: string) => {
    dispatch(removeIngredient(id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAdd();
    }
  };

  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Your ingredients</h2>
        <p className="text-muted-foreground">
          Add items manually or scan an image in the Scan tab.
        </p>
        {onGoToScan && (
          <div className="pt-1">
            <Button variant="outline" className="rounded-full" onClick={onGoToScan}>
              <ScanLine className="h-4 w-4" />
              Scan an image
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 md:items-start">
        <Card className="rounded-3xl border-border/60 bg-background/70 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl">Quick add</CardTitle>
            <CardDescription>
              Add an item (optionally with a quantity).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-2">
              <Input
                placeholder="e.g. Tomatoes"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-11 rounded-xl bg-background/60"
              />
              <Input
                placeholder="Qty (optional)"
                value={quantityValue}
                onChange={(e) => setQuantityValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-11 rounded-xl bg-background/60"
              />
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/60 bg-background/70 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-xl">Pantry list</CardTitle>
            <CardDescription>
              {ingredients.length} items.
              {saveStatus === "loading" ? " Saving…" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {saveError && (
              <div className="mb-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {saveError}
              </div>
            )}
            <div className="w-full">
              {ingredients.length === 0 ? (
                <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-2xl bg-muted/20">
                  <p className="font-medium">Your pantry is empty</p>
                  <p className="text-sm">
                    Add ingredients below or scan an image in the Scan tab.
                  </p>
                  {onGoToScan && (
                    <div className="pt-4">
                      <Button className="rounded-full" onClick={onGoToScan}>
                        <ScanLine className="h-4 w-4" />
                        Scan to add items
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((ingredient) => (
                    <Badge
                      key={ingredient.id}
                      variant="secondary"
                      className="text-sm py-1.5 pl-3 pr-1.5 flex items-center gap-2 rounded-full"
                    >
                      <span className="font-medium">
                        {ingredient.name}
                      </span>
                      {ingredient.quantity && (
                        <span className="text-muted-foreground">
                          {ingredient.quantity}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleRemove(ingredient.id)}
                        aria-label={`Remove ${ingredient.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addIngredient,
  removeIngredient,
} from "@/store/slices/ingredientsSlice";

export function PantryView() {
  const [inputValue, setInputValue] = useState("");
  const ingredients = useAppSelector((state) => state.ingredients.items);
  const dispatch = useAppDispatch();

  const handleAdd = () => {
    if (inputValue.trim()) {
      dispatch(addIngredient({ name: inputValue }));
      setInputValue("");
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
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">My Pantry</h2>
        <p className="text-muted-foreground">
          Manage your available ingredients here.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add Ingredients</CardTitle>
            <CardDescription>
              Manually add items to your pantry.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Input
                placeholder="e.g. Tomato, Pasta, Basil"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:row-span-2">
          <CardHeader>
            <CardTitle>Current Ingredients</CardTitle>
            <CardDescription>
              You have {ingredients.length} items.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-100 w-full pr-4">
              {ingredients.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No ingredients added yet.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((ingredient) => (
                    <Badge
                      key={ingredient.id}
                      variant="secondary"
                      className="text-sm py-1 pl-3 pr-1 flex items-center gap-1"
                    >
                      {ingredient.quantity
                        ? `${ingredient.name} (${ingredient.quantity})`
                        : ingredient.name}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded-full hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleRemove(ingredient.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

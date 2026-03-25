import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChefHat,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAppDispatch } from "@/store/hooks";
import { fetchPreferences } from "@/store/slices/preferencesSlice";

type Diet =
  | "No restrictions"
  | "Vegetarian"
  | "Vegan"
  | "Pescatarian"
  | "Keto"
  | "Halal"
  | "Gluten-free";

type Flavor = "Spicy" | "Sweet" | "Savory" | "Tangy" | "Mild";

const dietOptions: Diet[] = [
  "No restrictions",
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Keto",
  "Halal",
  "Gluten-free",
];

const allergyOptions = ["Nuts", "Dairy", "Eggs", "Shellfish", "Soy", "Gluten"] as const;
const flavorOptions: Flavor[] = ["Spicy", "Sweet", "Savory", "Tangy", "Mild"];

const goalOptions = [
  "Eat healthier",
  "Lose weight",
  "Gain muscle",
  "Save money",
  "Quick meals",
  "Explore cuisines",
] as const;

const progressPercent = (step: number, total: number) =>
  Math.round((step / total) * 100);

const stepMeta = [
  { step: 1, label: "Diet", icon: "🥗" },
  { step: 2, label: "Allergies", icon: "🚫" },
  { step: 3, label: "Taste", icon: "🌶️" },
  { step: 4, label: "Goals", icon: "🎯" },
] as const;

const uiSpring = { type: "spring", stiffness: 500, damping: 35 } as const;

const TogglePill = ({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileHover={{ y: -1, scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    transition={uiSpring}
    className={[
      "w-full text-left rounded-xl border px-3 py-2 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
      selected
        ? "border-primary/30 bg-gradient-to-br from-primary/10 via-background/40 to-teal-200/10 text-foreground shadow-sm ring-1 ring-primary/15"
        : "border-border/60 bg-background/50 hover:bg-muted/30 hover:border-primary/25 hover:shadow-sm text-foreground",
    ].join(" ")}
  >
    <div className="flex items-center justify-between">
      <span className="font-medium">{label}</span>
      <span
        className={[
          "h-3.5 w-3.5 rounded-full border grid place-items-center",
          selected ? "border-primary bg-primary shadow-[0_0_0_3px_rgba(16,185,129,0.18)]" : "border-muted-foreground/40",
        ].join(" ")}
      />
    </div>
  </motion.button>
);

const CheckboxPill = ({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) => (
  <motion.button
    type="button"
    onClick={onToggle}
    whileHover={{ y: -1 }}
    whileTap={{ scale: 0.98 }}
    transition={uiSpring}
    className={[
      "inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
      checked
        ? "border-primary/30 bg-gradient-to-br from-primary/10 via-background/50 to-teal-200/10 shadow-sm ring-1 ring-primary/15"
        : "border-border/60 bg-background/50 hover:bg-muted/30 hover:border-primary/25 hover:shadow-sm",
    ].join(" ")}
  >
    <span
      className={[
        "h-3.5 w-3.5 rounded border",
        checked ? "border-primary bg-primary" : "border-muted-foreground/40",
      ].join(" ")}
    />
    <span className="font-medium">{label}</span>
  </motion.button>
);

export function OnboardingView({ onFinish }: { onFinish: () => void }) {
  const dispatch = useAppDispatch();
  const totalSteps = 4;
  const [step, setStep] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dietaryPreference, setDietaryPreference] = useState<Diet>("No restrictions");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [customAvoid, setCustomAvoid] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");

  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [spiceLevel, setSpiceLevel] = useState(2);

  const [goals, setGoals] = useState<string[]>([]);

  const header = useMemo(() => {
    if (isComplete) return { icon: "🎉", title: "You're all set", desc: "We’ll tailor recipes to your preferences." };
    if (step === 1) return { icon: "🥗", title: "Dietary preference", desc: "Tell us what best describes your diet." };
    if (step === 2) return { icon: "🚫", title: "Allergies & restrictions", desc: "We’ll avoid these in your recipes." };
    if (step === 3) return { icon: "🌶️", title: "Taste preferences", desc: "Help us match flavors you’ll love." };
    return { icon: "🎯", title: "Goals", desc: "What are you optimizing for?" };
  }, [isComplete, step]);

  const toggleArrayItem = (list: string[], item: string) =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item];

  const handleAddCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (customAvoid.some((x) => x.toLowerCase() === trimmed.toLowerCase())) {
      setCustomInput("");
      return;
    }
    setCustomAvoid([...customAvoid, trimmed]);
    setCustomInput("");
  };

  const next = () => setStep((s) => Math.min(totalSteps, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const save = async () => {
    setError(null);
    setIsSaving(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setError("You are signed out. Please log in again.");
        return;
      }

      const payload = {
        dietaryPreference,
        allergies,
        customAvoid,
        taste: { flavors, spiceLevel },
        goals,
      };

      const res = await fetch("/api/onboarding/me", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: unknown };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save onboarding.");
        return;
      }

      const stored = localStorage.getItem("auth_user");
      const parsed = stored ? (JSON.parse(stored) as Record<string, unknown> | null) : null;
      const updated = { ...(parsed || {}), onboardingCompleted: true, onboarding: payload };
      localStorage.setItem("auth_user", JSON.stringify(updated));

      // Re-fetch from server so Redux matches what is actually stored in auth.json.
      dispatch(fetchPreferences());

      setIsComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save onboarding.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-background to-emerald-200/15" />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[34rem] w-[34rem] rounded-full bg-teal-300/20 blur-3xl" />
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_15%,rgba(16,185,129,0.35),transparent_50%),radial-gradient(circle_at_80%_85%,rgba(20,184,166,0.22),transparent_55%)]" />
      </div>

      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <ChefHat className="h-6 w-6" />
            <span>PantryPal</span>
          </div>
          <Badge variant="secondary" className="rounded-full">
            Step {step} of {totalSteps}
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 relative">
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{isComplete ? "Completed" : `Step ${step} of ${totalSteps}`}</span>
              <span>{isComplete ? "100%" : `${progressPercent(step, totalSteps)}%`}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all shadow-[0_0_0_1px_rgba(0,0,0,0.03)]"
                style={{ width: `${isComplete ? 100 : progressPercent(step, totalSteps)}%` }}
              />
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-b from-emerald-200/35 via-primary/10 to-teal-200/25 p-[1px] shadow-lg">
            <Card className="rounded-3xl border-border/60 bg-background/75 backdrop-blur">
              <CardHeader className="space-y-2">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl shrink-0"
                    animate={{ y: [0, -2, 0], rotate: [0, -1, 0] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {header.icon}
                  </motion.div>
                  <div>
                    <CardTitle className="text-2xl">{header.title}</CardTitle>
                    <CardDescription>{header.desc}</CardDescription>
                  </div>
                </div>
                {!isComplete && (
                  <div className="pt-2 flex flex-wrap gap-2">
                    {stepMeta.map((s) => {
                      const isActive = s.step === step;
                      const isDone = s.step < step;
                      const canJumpBack = s.step <= step;
                      return (
                        <button
                          key={s.step}
                          type="button"
                          onClick={() => {
                            if (!canJumpBack) return;
                            if (s.step === step) return;
                            setStep(s.step);
                          }}
                          className={[
                            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                            isActive
                              ? "border-primary/30 bg-gradient-to-br from-primary/10 via-background/40 to-teal-200/10 text-foreground shadow-sm ring-1 ring-primary/15"
                              : isDone
                                ? "border-border/60 bg-background/60 hover:bg-muted/30 hover:border-primary/25"
                                : "border-border/60 bg-background/40 text-muted-foreground",
                          ].join(" ")}
                        >
                          <span>{s.icon}</span>
                          <span className="font-semibold">{s.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-5">
                {isComplete ? (
                  <div className="space-y-5">
                    <div className="flex items-start gap-4 rounded-2xl border border-border/60 bg-background/50 p-4">
                      <div className="h-11 w-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-lg">Onboarding completed</p>
                        <p className="text-sm text-muted-foreground">
                          Recipes will be suggested based on your diet, allergies, tastes, and goals.
                        </p>
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span>Personalization is ready.</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                        <p className="text-sm font-semibold mb-2">Your profile</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge className="rounded-full" variant="secondary">
                            Diet: {dietaryPreference}
                          </Badge>
                          <Badge className="rounded-full" variant="secondary">
                            Spice: {["Mild", "Medium", "Hot", "Very hot", "Fire"][spiceLevel]}
                          </Badge>
                          {flavors.length > 0 && (
                            <Badge className="rounded-full" variant="secondary">
                              Flavors: {flavors.join(", ")}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                        <p className="text-sm font-semibold mb-2">We’ll avoid</p>
                        {allergies.length === 0 && customAvoid.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No restrictions selected.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {[...allergies, ...customAvoid].map((item) => (
                              <Badge key={item} variant="outline" className="rounded-full text-muted-foreground">
                                {item}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {goals.length > 0 && (
                      <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                        <p className="text-sm font-semibold mb-2">Your goals</p>
                        <div className="flex flex-wrap gap-2">
                          {goals.map((g) => (
                            <Badge key={g} variant="secondary" className="rounded-full">
                              {g}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex">
                      <Button className="rounded-full" onClick={onFinish}>
                        Start adding pantry items
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`step-${step}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                        {step === 1 && (
                          <div className="grid sm:grid-cols-2 gap-2">
                            {dietOptions.map((diet) => (
                              <TogglePill
                                key={diet}
                                label={diet}
                              selected={dietaryPreference === diet}
                              onClick={() => setDietaryPreference(diet)}
                            />
                          ))}
                        </div>
                      )}

                        {step === 2 && (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold">Select what to avoid</p>
                              <Badge variant="secondary" className="rounded-full">
                                {allergies.length + customAvoid.length} selected
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {allergyOptions.map((item) => (
                                <CheckboxPill
                                  key={item}
                                  label={item}
                                  checked={allergies.includes(item)}
                                  onToggle={() => setAllergies(toggleArrayItem(allergies, item))}
                                />
                              ))}
                            </div>

                            <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                              <Label htmlFor="custom-avoid">Add custom ingredient to avoid</Label>
                              <div className="mt-2 flex gap-2">
                                <Input
                                  id="custom-avoid"
                                  placeholder="e.g. Sesame"
                                  className="h-11 rounded-xl bg-background/60"
                                  value={customInput}
                                  onChange={(e) => setCustomInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleAddCustom();
                                    }
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="h-11 rounded-xl"
                                  onClick={handleAddCustom}
                                >
                                  + Add
                                </Button>
                              </div>

                              {customAvoid.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {customAvoid.map((item) => (
                                    <Badge key={item} variant="secondary" className="rounded-full">
                                      {item}
                                      <button
                                        type="button"
                                        className="ml-2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setCustomAvoid(customAvoid.filter((x) => x !== item))}
                                        aria-label={`Remove ${item}`}
                                      >
                                        ×
                                      </button>
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            <p className="text-sm text-muted-foreground">
                              Note: We’ll always avoid these in your recipes.
                            </p>
                          </div>
                        )}

                      {step === 3 && (
                        <div className="space-y-6">
                          <div>
                            <p className="text-sm font-semibold mb-2">What flavors do you enjoy?</p>
                            <div className="flex flex-wrap gap-2">
                                {flavorOptions.map((f) => (
                                  <CheckboxPill
                                    key={f}
                                    label={f}
                                    checked={flavors.includes(f)}
                                    onToggle={() => setFlavors(toggleArrayItem(flavors, f) as Flavor[])}
                                  />
                                ))}
                              </div>
                            </div>

                          <div className="rounded-2xl border border-border/60 bg-background/50 p-4">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold">Spice level</p>
                              <Badge variant="outline" className="rounded-full">
                                {["Mild", "Medium", "Hot", "Very hot", "Fire"][spiceLevel]}
                              </Badge>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={4}
                              value={spiceLevel}
                              onChange={(e) => setSpiceLevel(Number(e.target.value))}
                              className="mt-4 w-full accent-[color:var(--primary)]"
                            />
                            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                              <span>Mild 🙂</span>
                              <span>Very spicy 🔥</span>
                            </div>
                          </div>
                        </div>
                      )}

                        {step === 4 && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                              <Target className="h-4 w-4 text-primary" />
                              What are your food goals?
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {goalOptions.map((g) => (
                                <CheckboxPill
                                  key={g}
                                  label={g}
                                  checked={goals.includes(g)}
                                  onToggle={() => setGoals(toggleArrayItem(goals, g))}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                  </AnimatePresence>
                )}

              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              {!isComplete && (
                <div className="flex items-center justify-between pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={back}
                    disabled={step === 1 || isSaving}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>

                  <div className="flex items-center gap-2">
                    {step === 2 && (
                      <Button type="button" variant="ghost" className="rounded-full" onClick={next} disabled={isSaving}>
                        Skip
                      </Button>
                    )}

                    {step < totalSteps ? (
                      <Button type="button" className="rounded-full" onClick={next} disabled={isSaving}>
                        Continue
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    ) : (
                      <Button type="button" className="rounded-full" onClick={save} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Finish"}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

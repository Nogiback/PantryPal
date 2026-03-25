import { useState } from "react";
import { motion } from "framer-motion";
import { ChefHat, Sparkles, ShieldCheck, Timer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignupViewProps {
  onBack: () => void;
  onSuccess: () => void;
  onGoToLogin: () => void;
}

export function SignupView({ onBack, onSuccess, onGoToLogin }: SignupViewProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!password) {
      setError("Please create a password.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        token?: unknown;
        user?: unknown;
        error?: unknown;
      };

      if (!response.ok) {
        setError(typeof data.error === "string" ? data.error : "Signup failed.");
        return;
      }

      if (typeof data.token === "string") {
        localStorage.setItem("auth_token", data.token);
      }
      localStorage.setItem("auth_user", JSON.stringify(data.user ?? null));

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-background to-emerald-200/15 dark:to-primary/10" />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl dark:bg-primary/15" />
        <div className="absolute -bottom-40 -right-40 h-[34rem] w-[34rem] rounded-full bg-teal-300/20 blur-3xl dark:bg-primary/15" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(16,185,129,0.16),transparent_55%),radial-gradient(circle_at_75%_85%,rgba(20,184,166,0.12),transparent_60%)] dark:bg-[radial-gradient(circle_at_30%_10%,rgba(34,197,94,0.18),transparent_55%),radial-gradient(circle_at_75%_85%,rgba(34,197,94,0.12),transparent_60%)]" />
      </div>

      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-2 font-bold text-xl text-primary"
            onClick={onBack}
          >
            <ChefHat className="h-6 w-6" />
            <span>PantryPal</span>
          </button>
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10 relative">
        <motion.div
          className="w-full max-w-4xl"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="grid md:grid-cols-2 gap-6 items-stretch">
            <div className="hidden md:flex flex-col justify-between rounded-3xl border border-border/60 bg-gradient-to-br from-primary/14 via-background/50 to-muted/60 p-8 shadow-sm">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 text-primary font-bold text-xl">
                  <ChefHat className="h-6 w-6" />
                  PantryPal
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight">
                  Create your account.
                </h1>
                <p className="text-muted-foreground leading-relaxed">
                  Start with your pantry and let PantryPal do the rest — scans, suggestions, and smarter meals.
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
                  <div className="h-9 w-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Timer className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Set up in minutes</p>
                    <p className="text-muted-foreground">Add items or scan a receipt</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
                  <div className="h-9 w-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">Better recipe ideas</p>
                    <p className="text-muted-foreground">Based on your ingredients</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/60 px-4 py-3">
                  <div className="h-9 w-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">No spam</p>
                    <p className="text-muted-foreground">Only product updates</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-b from-emerald-200/35 via-primary/10 to-teal-200/25 p-[1px] shadow-lg">
              <Card className="rounded-3xl border-border/60 bg-background/75 backdrop-blur">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-2xl">Sign up</CardTitle>
                  <CardDescription>Create an account to get started.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Name</Label>
                      <Input
                        id="signup-name"
                        autoComplete="name"
                        placeholder="Jane Doe"
                        className="h-11 rounded-xl bg-background/60"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        className="h-11 rounded-xl bg-background/60"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        className="h-11 rounded-xl bg-background/60"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm">Confirm password</Label>
                      <Input
                        id="signup-confirm"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Repeat password"
                        className="h-11 rounded-xl bg-background/60"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>

                    {error && (
                      <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full rounded-full h-11 shadow-sm"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
                    </Button>

                    <div className="text-sm text-muted-foreground text-center">
                      Already have an account?{" "}
                      <Button type="button" variant="link" className="px-0" onClick={onGoToLogin}>
                        Log in
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

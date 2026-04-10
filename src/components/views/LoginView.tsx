import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cacheLocalAuthUser, createLocalSession, getStoredPublicUser, loginLocalUser, setAuthMode } from "@/lib/localAuth";

interface LoginViewProps {
  onBack: () => void;
  onSuccess: () => void;
  onGoToSignup: () => void;
}

export function LoginView({ onBack, onSuccess, onGoToSignup }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completeLocalLogin = () => {
    const fallbackUser = loginLocalUser({ email, password });
    createLocalSession({
      id: fallbackUser.id,
      name: fallbackUser.name,
      email: fallbackUser.email,
      onboardingCompleted: fallbackUser.onboardingCompleted,
      onboarding: fallbackUser.onboarding,
    });
    onSuccess();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        token?: unknown;
        user?: unknown;
        error?: unknown;
      };

      if (!response.ok) {
        if (response.status >= 500) {
          completeLocalLogin();
          return;
        }
        setError(typeof data.error === "string" ? data.error : "Login failed.");
        return;
      }

      if (typeof data.token === "string") {
        localStorage.setItem("auth_token", data.token);
      }
      localStorage.setItem("auth_user", JSON.stringify(data.user ?? null));
      setAuthMode("server");
      if (data.user && typeof data.user === "object" && "email" in data.user && "name" in data.user && "id" in data.user) {
        cacheLocalAuthUser(
          data.user as { id: string; name: string; email: string; onboardingCompleted?: boolean; onboarding?: unknown },
          password,
        );
      }

      onSuccess();
    } catch (err) {
      try {
        completeLocalLogin();
        return;
      } catch {
        const storedUser = getStoredPublicUser();
        if (storedUser?.email?.toLowerCase() === email.trim().toLowerCase()) {
          cacheLocalAuthUser(storedUser, password);
          createLocalSession(storedUser);
          onSuccess();
          return;
        }
      }

      setError(
        err instanceof Error
          ? `${err.message} Pantry Pal can fall back locally after you have logged in once on this device.`
          : "Login failed. Start `npm run dev:user` if the local auth server is not running."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#10120f]">
      <header className="w-full">
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="flex items-center gap-3 text-sm font-semibold tracking-[0.04em] text-[#10120f]"
            onClick={onBack}
          >
            <span className="brand-pill">PP</span>
            Pantry Pal
          </button>
          <button type="button" className="text-sm font-semibold text-primary" onClick={onGoToSignup}>
            Create account
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1180px] justify-center px-4 pb-20 pt-2 sm:px-6 lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: "easeOut" }}
          className="w-full max-w-[440px]"
        >
          <div className="auth-stack">
            <div>
              <h1 className="page-title text-[#10120f]">
                Welcome back
              </h1>
              <p className="mt-4 text-[0.96rem] leading-7 text-[#6d726a]">
                Log in to access the improved Pantry Pal AI workspace and continue where you left off.
              </p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="auth-label">
                Email address
                <Input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>

              <label className="auth-label">
                Password
                <div className="relative">
                  <Input
                    className="pr-16"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button className="auth-inline-action" type="button">Show</button>
                </div>
              </label>

              <div className="flex items-center justify-between gap-4 text-sm">
                <label className="auth-check">
                  <input type="checkbox" />
                  <span>Keep me signed in</span>
                </label>
                <button type="button" className="font-semibold text-primary">Forgot password?</button>
              </div>

              {error && (
                <div className="rounded-[8px] border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <button className="auth-submit" disabled={isSubmitting} type="submit">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log in"}
              </button>
            </form>

            <div className="auth-support-card">
              <p className="text-[0.96rem] font-semibold text-[#2c2e2a]">Having trouble logging in?</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <button type="button" className="font-semibold text-primary">Chat with support</button>
                <span className="text-[#cfd4cc]">|</span>
                <button type="button" className="text-[#b3b9b1]">Run npm run dev:user</button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm text-[#667067]">
              <span>New to Pantry Pal?</span>
              <button type="button" className="font-semibold text-primary" onClick={onGoToSignup}>
                Create an account
              </button>
            </div>

            <div className="pt-3 text-center">
              <button type="button" className="text-sm font-medium text-primary underline underline-offset-4">
                See why home cooks choose Pantry Pal
              </button>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}

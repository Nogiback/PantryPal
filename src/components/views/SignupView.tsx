import { useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cacheLocalAuthUser, createLocalSession, setAuthMode, signupLocalUser } from "@/lib/localAuth";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completeLocalSignup = () => {
    const fallbackUser = signupLocalUser({ name, email, password });
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
        if (response.status >= 500) {
          completeLocalSignup();
          return;
        }
        setError(typeof data.error === "string" ? data.error : "Signup failed.");
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
        completeLocalSignup();
        return;
      } catch (localError) {
        setError(
          localError instanceof Error
            ? localError.message
            : err instanceof Error
              ? `${err.message} Start \`npm run dev:user\` if the local auth server is not running.`
              : "Signup failed. Start `npm run dev:user` if the local auth server is not running."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const [firstName, ...rest] = name.trim().split(" ");
  const lastName = rest.join(" ");

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#10120f]">
      <header className="w-full">
        <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="flex items-center gap-3 text-sm font-semibold tracking-[0.04em] text-[#10120f]"
            onClick={onBack}
          >
            <span className="brand-pill">
              <Heart className="h-4 w-4" />
            </span>
            Pantry Pal
          </button>
          <button type="button" className="text-sm font-semibold text-[#10120f]" onClick={onGoToLogin}>
            Log in
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
                Let&apos;s get started
              </h1>
              <p className="mt-4 text-[0.96rem] text-[rgba(16,18,15,0.62)]">
                Create your Pantry Pal account, then move directly into your pantry workspace.
              </p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="auth-label">
                  First name
                  <Input
                    className="auth-input"
                    placeholder="Your first name"
                    value={firstName || ""}
                    onChange={(e) => setName(`${e.target.value} ${lastName}`.trim())}
                  />
                </label>
                <label className="auth-label">
                  Last name
                  <Input
                    className="auth-input"
                    placeholder="Your last name"
                    value={lastName}
                    onChange={(e) => setName(`${firstName || ""} ${e.target.value}`.trim())}
                  />
                </label>
              </div>

              <label className="auth-label">
                Household name
                <Input className="auth-input" placeholder="What should we call your kitchen?" />
              </label>

              <label className="auth-label">
                Email address
                <Input
                  className="auth-input"
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
                    className="auth-input pr-16"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password (min. of 8 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button className="auth-inline-action" type="button" onClick={() => setShowPassword((current) => !current)}>
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              <label className="auth-label">
                Confirm password
                <div className="relative">
                  <Input
                    className="auth-input pr-16"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repeat password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button className="auth-inline-action" type="button" onClick={() => setShowConfirmPassword((current) => !current)}>
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              <label className="auth-check auth-check-start">
                <input type="checkbox" />
                <span>
                  I have read, understood and agree to Pantry Pal&apos;s{" "}
                  <button type="button" className="text-[#10120f] underline underline-offset-2">Privacy Policy</button>{" "}
                  and{" "}
                  <button type="button" className="text-[#10120f] underline underline-offset-2">Terms and Conditions</button>.
                </span>
              </label>

              <label className="auth-check auth-check-start">
                <input defaultChecked type="checkbox" />
                <span>
                  Join Pantry Pal updates for new features, kitchen planning tips, and helpful product news.
                </span>
              </label>

              {error && (
                <div className="rounded-[8px] border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <button className="auth-submit auth-submit--primary" disabled={isSubmitting} type="submit">
                {isSubmitting ? "Creating account..." : "Create account"}
              </button>
            </form>

            <div className="auth-support-card">
              <p className="text-[0.96rem] font-semibold text-[#10120f]">Need help creating your account?</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <button type="button" className="font-semibold text-[#10120f]">Chat with us</button>
                <span className="text-[#e8eaec]">|</span>
                <button type="button" className="text-[rgba(16,18,15,0.48)]">Run npm run dev:user</button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm text-[rgba(16,18,15,0.62)]">
              <span>Already have an account?</span>
              <button type="button" className="font-semibold text-[#10120f]" onClick={onGoToLogin}>
                Log in
              </button>
            </div>

            <div className="pt-3 text-center">
              <button type="button" className="text-sm font-medium text-[#10120f] underline underline-offset-4">
                Why households are switching to Pantry Pal
              </button>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}

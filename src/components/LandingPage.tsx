import { motion } from 'framer-motion';
import { ChefHat, ScanLine, Utensils, Users, ArrowRight, Leaf, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface LandingPageProps {
  onLogin: () => void;
  onSignUp: () => void;
}

export function LandingPage({ onLogin, onSignUp }: LandingPageProps) {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground relative overflow-hidden">
      {/* Subtle background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-background to-emerald-200/15 dark:to-primary/10" />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl dark:bg-primary/15" />
        <div className="absolute -bottom-40 -right-40 h-[34rem] w-[34rem] rounded-full bg-teal-300/20 blur-3xl dark:bg-primary/15" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(16,185,129,0.16),transparent_55%),radial-gradient(circle_at_75%_85%,rgba(20,184,166,0.12),transparent_60%)] dark:bg-[radial-gradient(circle_at_30%_10%,rgba(34,197,94,0.18),transparent_55%),radial-gradient(circle_at_75%_85%,rgba(34,197,94,0.12),transparent_60%)]" />
      </div>
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <ChefHat className="h-6 w-6" />
            <span>PantryPal</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a>
            <a href="#community" className="hover:text-primary transition-colors">Community</a>
          </nav>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="rounded-full" onClick={onLogin}>Login</Button>
            <Button className="rounded-full" onClick={onSignUp}>Sign Up <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative">
        {/* Hero Section */}
        <section className="py-16 md:py-28 container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
          <motion.div 
            className="flex-1 space-y-6 text-center md:text-left order-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-semibold text-primary shadow-xs">
              <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
              Smart pantry + recipes
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Cook smarter with what you{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                already have
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto md:mx-0 leading-relaxed">
              Snap a receipt, auto-build your pantry, and get recipe matches in seconds.
              Reduce waste and make weeknight cooking feel effortless.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button size="lg" className="rounded-full text-base h-12 px-8 shadow-sm" onClick={onSignUp}>
                Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full text-base h-12 px-8 bg-background/50"
                onClick={onLogin}
              >
                I already have an account
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3 max-w-xl mx-auto md:mx-0">
              {[
                { icon: <ScanLine className="h-4 w-4" />, label: "Scan receipts" },
                { icon: <Utensils className="h-4 w-4" />, label: "Find recipes" },
                { icon: <Leaf className="h-4 w-4" />, label: "Reduce waste" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-border/60 bg-background/50 backdrop-blur px-3 py-3 text-sm text-muted-foreground shadow-xs flex flex-col items-center gap-2"
                >
                  <div className="h-9 w-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="font-medium text-foreground/85">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1 text-amber-500">
                {'★★★★★'}
              </div>
              <span>5.0 from 120+ reviews</span>
              <span className="hidden sm:inline text-border">•</span>
              <span>No credit card</span>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex-1 relative order-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden border border-border/60 bg-gradient-to-br from-emerald-200/25 via-background/50 to-teal-200/25 shadow-2xl flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.00),rgba(0,0,0,0.06))]" />
              <ChefHat className="h-32 w-32 text-primary/20" />

              <div className="absolute left-6 top-6 rounded-2xl border border-border/60 bg-background/70 backdrop-blur px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Pantry Snapshot
                </p>
                <p className="mt-1 text-sm font-bold">12 ingredients</p>
              </div>

              <div className="absolute inset-x-6 bottom-6 p-4 bg-background/70 backdrop-blur rounded-2xl shadow-lg border border-border/60">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Sparkles size={20}/>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">Recipe Match</p>
                    <p className="text-xs text-muted-foreground">Suggestions tailored to your pantry</p>
                  </div>
                  <Button size="sm" className="rounded-full" onClick={onSignUp}>
                    Try
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 text-center space-y-12">
             <div className="space-y-4">
               <h2 className="text-primary font-semibold tracking-wide uppercase text-sm">How It Works</h2>
               <h3 className="text-3xl md:text-4xl font-bold">From groceries to great meals in 3 steps</h3>
             </div>

             <motion.div 
               className="grid md:grid-cols-3 gap-8 relative"
               variants={staggerContainer}
               initial="initial"
               whileInView="animate"
               viewport={{ once: true }}
             >
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-border -z-10" />

                {[
                  { 
                    icon: <ScanLine className="h-8 w-8 text-primary" />, 
                    step: 1, 
                    title: 'Snap or Enter Groceries', 
                    desc: 'Upload a receipt photo or manually add items to your digital pantry in seconds.' 
                  },
                  { 
                    icon: <ChefHat className="h-8 w-8 text-primary" />, 
                    step: 2, 
                    title: 'Get Recipe Suggestions', 
                    desc: 'Discover recipes tailored to what you already have, filtered by your preferences.' 
                  },
                  { 
                    icon: <Users className="h-8 w-8 text-primary" />, 
                    step: 3, 
                    title: 'Cook & Share', 
                    desc: 'Prepare delicious meals and share your creations, tips, and stories with the community.' 
                  }
                ].map((item, idx) => (
                  <motion.div key={idx} variants={fadeInUp} className="flex flex-col items-center space-y-4 bg-background/50 p-6 rounded-2xl md:bg-transparent md:p-0">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center mb-4">
                        {item.icon}
                      </div>
                      <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm border-4 border-background">
                        {item.step}
                      </div>
                    </div>
                    <h4 className="text-xl font-bold">{item.title}</h4>
                    <p className="text-muted-foreground max-w-xs">{item.desc}</p>
                  </motion.div>
                ))}
             </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 space-y-4">
               <h2 className="text-primary font-semibold tracking-wide uppercase text-sm">Features</h2>
               <h3 className="text-3xl md:text-4xl font-bold">Everything you need to cook smarter</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
               {[
                 {
                   icon: <ScanLine className="h-6 w-6 text-primary" />,
                   title: "Receipt Scanning",
                   desc: "Snap a photo of your grocery receipt and watch your pantry populate automatically."
                 },
                 {
                   icon: <Utensils className="h-6 w-6 text-primary" />,
                   title: "Smart Recipe Matching",
                   desc: "Get personalized recipe ideas based on what's in your pantry and your dietary needs."
                 },
                 {
                   icon: <Leaf className="h-6 w-6 text-primary" />,
                   title: "Digital Pantry",
                   desc: "Track your ingredients, quantities, and expiry dates in one organized place."
                 },
                 {
                   icon: <Users className="h-6 w-6 text-primary" />,
                   title: "Community Feed",
                   desc: "Share dishes, swap tips, celebrate food traditions, and join cooking challenges."
                 }
               ].map((feature, idx) => (
                 <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    viewport={{ once: true }}
                 >
                   <Card className="h-full border-none shadow-sm hover:shadow-md transition-shadow bg-muted/20">
                     <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                       <div className="h-12 w-12 rounded-xl bg-background flex items-center justify-center shadow-sm shrink-0">
                         {feature.icon}
                       </div>
                       <div className="space-y-1">
                         <CardTitle className="text-xl">{feature.title}</CardTitle>
                         <CardDescription className="text-base leading-relaxed">{feature.desc}</CardDescription>
                       </div>
                     </CardHeader>
                   </Card>
                 </motion.div>
               ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-primary text-primary-foreground py-12">
           <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2 font-bold text-xl">
                <ChefHat className="h-6 w-6" />
                <span>PantryPal</span>
              </div>
              <p className="text-primary-foreground/80 text-sm">
                © 2026 PantryPal. All rights reserved.
              </p>
           </div>
        </footer>
      </main>
    </div>
  );
}

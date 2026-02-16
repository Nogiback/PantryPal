import { motion } from 'framer-motion';
import { ChefHat, ScanLine, Utensils, Users, ArrowRight, Leaf, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface LandingPageProps {
  onEnterApp: () => void;
}

export function LandingPage({ onEnterApp }: LandingPageProps) {
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
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
            <Button variant="ghost" onClick={onEnterApp}>Login</Button>
            <Button onClick={onEnterApp}>Sign Up <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 container mx-auto px-4 flex flex-col-reverse md:flex-row items-center gap-12">
          <motion.div 
            className="flex-1 space-y-6 text-center md:text-left"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20">
              Try it now
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-primary">
              Cook smarter with what you <span className="italic text-primary/80">already have</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto md:mx-0">
              From snapping your grocery receipt to discovering recipes tailored to your pantry, PantryPal helps you reduce waste and enjoy cooking more.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button size="lg" className="rounded-full text-lg h-12 px-8" onClick={onEnterApp}>
                Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-1 text-sm text-muted-foreground">
               <div className="flex text-amber-500">
                 {'★★★★★'}
               </div>
               <span className="ml-2">5.0 from 120+ reviews</span>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex-1 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
             <div className="relative aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 border shadow-2xl flex items-center justify-center">
                <ChefHat className="h-32 w-32 text-primary/20" />
                <div className="absolute inset-x-8 bottom-8 p-4 bg-background/90 backdrop-blur rounded-xl shadow-lg border">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                            <Sparkles size={20}/>
                        </div>
                        <div>
                            <p className="font-bold text-sm">Recipe Match!</p>
                            <p className="text-xs text-muted-foreground">Based on your 12 ingredients</p>
                        </div>
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

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ScanViewProps {
  onAddIngredients: (ingredients: string[]) => void;
}

export function ScanView({ onAddIngredients }: ScanViewProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState<string[]>([]);

  const handleSimulateScan = () => {
    setIsScanning(true);
    setScannedItems([]);
    
    // Simulate AI processing delay
    setTimeout(() => {
      const mockDetectedIngredients = ['Eggs', 'Milk', 'Cheddar Cheese', 'Spinach'];
      setScannedItems(mockDetectedIngredients);
      onAddIngredients(mockDetectedIngredients);
      setIsScanning(false);
    }, 2500);
  };

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Scan Receipt</h2>
        <p className="text-muted-foreground">Upload a photo of your receipt to automatically add ingredients.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload Image</CardTitle>
            <CardDescription>Drag and drop or click to upload.</CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center space-y-4 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={!isScanning ? handleSimulateScan : undefined}
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Analyzing receipt...</p>
                </>
              ) : (
                <>
                  <div className="bg-primary/10 p-4 rounded-full">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-medium">Click to simulate scan</p>
                    <p className="text-xs text-muted-foreground">Supports JPG, PNG (Mock)</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        {scannedItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Scanned Results</CardTitle>
              <CardDescription>Recently added items.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                   <CheckCircle2 className="h-5 w-5" />
                   <span className="font-medium">Successfully added {scannedItems.length} items!</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {scannedItems.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
                <div className="pt-4">
                    <Button variant="outline" className="w-full" onClick={() => setScannedItems([])}>
                        Scan Another
                    </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}

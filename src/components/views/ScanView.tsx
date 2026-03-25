import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, Loader2, CheckCircle2, Trash2, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch } from "@/store/hooks";
import { addIngredient, savePantry } from "@/store/slices/ingredientsSlice";

interface ExtractedItem {
  id: string;
  name: string;
  quantity: string;
}

interface AwsResponse {
  text?: string;
}

interface PreparedImagePayload {
  base64: string;
  mimeType: string;
}

export function ScanView() {
  const dispatch = useAppDispatch();
  // UI state for scan lifecycle and user feedback.
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scannedItems, setScannedItems] = useState<ExtractedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(
    null,
  );
  const [isSaved, setIsSaved] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create a temporary browser URL so the user can preview the chosen image.
  // Revoke it on cleanup to avoid memory leaks.
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [selectedFile]);

  // Build a "clean output preview" from current editable rows.
  // This is what we show in the Raw JSON panel.
  const extractedJson = useMemo(
    () =>
      JSON.stringify(
        {
          items: scannedItems.map((item) => ({
            name: item.name,
            quantity: item.quantity || "1",
          })),
        },
        null,
        2,
      ),
    [scannedItems],
  );

  // Normalize unknown errors into a readable message for the UI.
  const getErrorMessage = (err: unknown) => {
    if (err instanceof Error) {
      return err.message;
    }

    return "Failed to analyze image. Please try again.";
  };

  // Convert image bytes into base64 because backend expects JSON payload,
  // not multipart/form-data.
  const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== "string") {
          reject(new Error("Unable to process selected image."));
          return;
        }

        const base64 = result.split(",")[1];
        if (!base64) {
          reject(new Error("Unable to process selected image."));
          return;
        }

        resolve(base64);
      };
      reader.onerror = () =>
        reject(new Error("Unable to read selected image data."));
      reader.readAsDataURL(blob);
    });

  // Resize large images before upload to improve speed and lower model payload size.
  // If the image is already small enough, return it as-is.
  const resizeImageIfNeeded = (file: File, maxDimension = 1500) =>
    new Promise<Blob>((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        const width = image.naturalWidth;
        const height = image.naturalHeight;
        const largestDimension = Math.max(width, height);

        if (!largestDimension || largestDimension <= maxDimension) {
          URL.revokeObjectURL(objectUrl);
          resolve(file);
          return;
        }

        const scale = maxDimension / largestDimension;
        const targetWidth = Math.max(1, Math.round(width * scale));
        const targetHeight = Math.max(1, Math.round(height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const context = canvas.getContext("2d");
        if (!context) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("Unable to resize selected image."));
          return;
        }

        context.drawImage(image, 0, 0, targetWidth, targetHeight);

        const outputMimeType = file.type || "image/jpeg";
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);
            if (!blob) {
              reject(new Error("Unable to resize selected image."));
              return;
            }
            resolve(blob);
          },
          outputMimeType,
          0.9,
        );
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Unable to load selected image."));
      };

      image.src = objectUrl;
    });

  const prepareImagePayload = async (
    file: File,
  ): Promise<PreparedImagePayload> => {
    const processedImage = await resizeImageIfNeeded(file, 1500);
    const base64 = await blobToBase64(processedImage);
    const mimeType = processedImage.type || file.type || "image/jpeg";
    return { base64, mimeType };
  };

  // Parse model output safely and tolerate markdown code fences if returned.
  // Then normalize each row into the local editable item shape.
  const safeParseJsonItems = (rawText: string): ExtractedItem[] => {
    const cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned) as {
      items?: Array<{ name?: unknown; quantity?: unknown }>;
    };
    const rows = Array.isArray(parsed.items) ? parsed.items : [];

    return rows
      .map((item) => ({
        id: crypto.randomUUID(),
        name: typeof item.name === "string" ? item.name.trim() : "",
        quantity:
          typeof item.quantity === "string" ? item.quantity.trim() : "1",
      }))
      // Ignore empty names so users only see valid candidate rows.
      .filter((item) => item.name.length > 0);
  };

  // Send image to backend endpoint that talks to AWS Bedrock,
  // then parse the returned JSON text into editable rows.
  const extractItemsWithAws = async (file: File): Promise<ExtractedItem[]> => {
    const imagePayload = await prepareImagePayload(file);
    const response = await fetch("/api/scan/aws", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        imageBase64: imagePayload.base64,
        mimeType: imagePayload.mimeType,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `AWS request failed (${response.status}): ${errorText}. Make sure dev API server is running.`,
      );
    }

    const data = (await response.json()) as AwsResponse;
    const rawText = data.text;
    if (!rawText) {
      throw new Error("AWS model returned an empty response.");
    }

    const items = safeParseJsonItems(rawText);
    if (items.length === 0) {
      throw new Error("No grocery items were detected in this image.");
    }

    return items;
  };

  // Main scan action:
  // 1) validate input
  // 2) reset old result state
  // 3) run scan request
  // 4) update UI with success or error
  const handleAnalyzeImage = async () => {
    if (!selectedFile) {
      setError("Please upload an image first.");
      return;
    }

    setError(null);
    setIsSaved(false);
    setScanSuccessMessage(null);
    setScannedItems([]);
    setIsScanning(true);
    setScanProgress(0);

    const progressTimer = window.setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.max(2, Math.floor((100 - prev) / 8));
      });
    }, 180);

    try {
      const items = await extractItemsWithAws(selectedFile);
      setScannedItems(items);
      setScanProgress(100);
      setScanSuccessMessage(
        `Scan finished. Found ${items.length} item(s). Review and edit below.`,
      );
    } catch (err) {
      setScannedItems([]);
      setScanProgress(0);
      setError(getErrorMessage(err));
    } finally {
      window.clearInterval(progressTimer);
      setIsScanning(false);
    }
  };
  const updateItem = (
    id: string,
    field: "name" | "quantity",
    value: string,
  ) => {
    setScannedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const removeItem = (id: string) => {
    setScannedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addManualItem = () => {
    setScannedItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", quantity: "1" },
    ]);
  };

  // Full reset for scan workflow and hidden file input.
  const clearScan = () => {
    setSelectedFile(null);
    setScannedItems([]);
    setError(null);
    setScanSuccessMessage(null);
    setIsSaved(false);
    setShowRawJson(false);
    setScanProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Commit edited rows into Redux pantry store.
  // We trim user input and skip empty names.
  const saveToPantry = () => {
    const cleanedItems = scannedItems
      .map((item) => ({
        name: item.name.trim(),
        quantity: item.quantity.trim() || "1",
      }))
      .filter((item) => item.name.length > 0);

    if (cleanedItems.length === 0) {
      setError("Add at least one valid item before saving.");
      return;
    }

    cleanedItems.forEach((item) => dispatch(addIngredient(item)));
    dispatch(savePantry());
    setIsSaved(true);
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Scan a grocery image</h2>
        <p className="text-muted-foreground">
          Upload a receipt or pantry photo, review extracted items, then save to your pantry.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border-border/60 bg-background/70 backdrop-blur">
          <CardHeader>
            <CardTitle>Image Upload</CardTitle>
            <CardDescription>
              Upload a receipt, grocery photo, pantry shelf, or spice rack
              image.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setSelectedFile(file);
                  setError(null);
                  setScanSuccessMessage(null);
                  setIsSaved(false);
                  setScanProgress(0);
                }}
              />

              {!previewUrl ? (
                <div
                  className="border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center space-y-4 hover:bg-muted/40 transition-colors cursor-pointer bg-background/40"
                  onClick={() => !isScanning && fileInputRef.current?.click()}
                >
                  <div className="bg-primary/10 p-4 rounded-full">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-medium">Click to upload image</p>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, WEBP
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="w-full rounded-2xl overflow-hidden border border-border/60 cursor-pointer bg-background/40"
                  onClick={() => !isScanning && fileInputRef.current?.click()}
                >
                  <img
                    src={previewUrl}
                    alt="Uploaded grocery"
                    className="block w-full h-auto"
                  />
                </button>
              )}

              {(isScanning || scanProgress > 0) && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {isScanning ? "Scanning image..." : "Scan complete"}
                    </span>
                    <span>{scanProgress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleAnalyzeImage}
                  disabled={isScanning || !selectedFile}
                  className="flex-1"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    "Scan Image"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={clearScan}
                  disabled={isScanning}
                >
                  Reset
                </Button>
              </div>

              {error && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/60 bg-background/70 backdrop-blur">
          <CardHeader>
            <CardTitle>Extraction Result</CardTitle>
            <CardDescription>
              Edit item name and quantity before saving.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scanSuccessMessage && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">{scanSuccessMessage}</span>
                </div>
              )}

              {scannedItems.length === 0 ? (
                <div className="border-2 border-dashed rounded-2xl py-12 text-center text-muted-foreground bg-muted/20">
                  Scan an image to see editable extraction results here.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <span>Item Name</span>
                    <span>Quantity</span>
                    <span className="text-right">Actions</span>
                  </div>
                  <div className="space-y-2">
                    {scannedItems.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center rounded-xl border border-border/60 p-2 bg-background/40"
                      >
                        <Input
                          value={item.name}
                          onChange={(e) =>
                            updateItem(item.id, "name", e.target.value)
                          }
                          placeholder="Item name"
                          className="rounded-lg bg-background/60"
                        />
                        <Input
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(item.id, "quantity", e.target.value)
                          }
                          placeholder="Quantity"
                          className="rounded-lg bg-background/60"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.id)}
                          className="justify-self-end hover:text-destructive"
                          aria-label="Remove row"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    onClick={addManualItem}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4" /> Add Row
                  </Button>

                  <Button className="w-full" onClick={saveToPantry}>
                    Add to Your Pantry
                  </Button>

                  {isSaved && (
                    <div className="flex items-center gap-2 text-green-700 bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">
                        Pantry updated successfully.
                      </span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowRawJson((prev) => !prev)}
                      className="w-full"
                    >
                      {showRawJson ? "Hide raw JSON" : "Show raw JSON"}
                    </Button>
                    {showRawJson && (
                      <>
                        <p className="text-sm font-medium">JSON Extraction</p>
                        <pre className="text-xs bg-muted rounded-md p-3 overflow-auto max-h-40">
                          {extractedJson}
                        </pre>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

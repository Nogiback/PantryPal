import { motion } from "framer-motion";
import { VideoIcon } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

export function VideosView() {
  const ingredients = useAppSelector((state) => state.ingredients.items);

  return (
    <motion.div
      className="space-y-6 h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="flex flex-col space-y-2">
        <h2 className="page-title text-[#10120f]">Recipe videos</h2>
        <p className="text-[rgba(16,18,15,0.62)]">
          Video guidance will appear here once this section is connected to live recipe video results.
        </p>
      </div>

      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[24px] border border-[#e8eaec] bg-white px-8 py-12 text-center">
        <VideoIcon className="h-12 w-12 text-[#00c755]" />
        <h3 className="mt-5 text-lg font-medium text-[#10120f]">No videos available yet</h3>
        <p className="mt-3 max-w-md text-sm leading-6 text-[rgba(16,18,15,0.58)]">
          {ingredients.length > 0
            ? "Your pantry is ready. Once video support is wired back in, matching cooking videos will appear here."
            : "Add ingredients to Pantry Pal first, then this area can surface matching cooking videos later on."}
        </p>
      </div>
    </motion.div>
  );
}

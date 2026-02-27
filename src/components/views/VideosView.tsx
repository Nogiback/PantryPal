
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { VideoIcon } from 'lucide-react';
import { fetchVideos } from '@/store/slices/recipesSlice';
import { VideoList } from '@/components/VideoList';
import { VideoModal } from '@/components/VideoModal';
import type { Video } from '@/types';

export function VideosView() {
  const dispatch = useAppDispatch();
  const ingredients = useAppSelector((state) => state.ingredients.items);
  const { videos, videoStatus } = useAppSelector((state) => state.recipes);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  useEffect(() => {
    if (ingredients.length > 0) {
      const ingredientNames = ingredients.map(i => i.name);
      dispatch(fetchVideos(ingredientNames));
    }
  }, [ingredients, dispatch]);

  return (
    <motion.div 
      className="space-y-6 h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Recipe Videos</h2>
        <p className="text-muted-foreground">Watch how to prepare matching dishes.</p>
      </div>

      <div className="h-full min-h-0">
        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20 h-64 mt-8">
            {videoStatus === 'loading' ? (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            ) : (
                <VideoIcon className="h-12 w-12 mb-4 opacity-20" />
            )}
            <h3 className="text-lg font-semibold">No videos available</h3>
            <p className="text-sm">Search for recipes in the "Find Recipes" tab to see related videos here.</p>
          </div>
        ) : (
          <div className="pb-20">
             <VideoList videos={videos} onVideoClick={setSelectedVideo} />
          </div>
        )}
      </div>

      {selectedVideo && (
        <VideoModal
          videoId={selectedVideo.youTubeId}
          title={selectedVideo.title}
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </motion.div>
  );
}

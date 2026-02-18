
import { useState } from 'react';
import { VideoList } from './VideoList';
import { VideoModal } from './VideoModal';
import type { Video } from '@/types';

interface SidebarVideosProps {
  videos: Video[];
}

export function SidebarVideos({ videos }: SidebarVideosProps) {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  if (videos.length === 0) return null;

  return (
    <>
      <VideoList videos={videos} onVideoClick={setSelectedVideo} />
      
      {selectedVideo && (
        <VideoModal 
          videoId={selectedVideo.youTubeId}
          title={selectedVideo.title}
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </>
  );
}

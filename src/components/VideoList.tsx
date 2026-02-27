import { Card } from "@/components/ui/card";
import { PlayCircle } from "lucide-react";
import type { Video } from "@/types";

interface VideoListProps {
  videos: Video[];
  onVideoClick: (video: Video) => void;
}

export function VideoList({ videos, onVideoClick }: VideoListProps) {
  if (videos.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {videos.map((video) => (
          <Card
            key={video.youTubeId}
            className="overflow-hidden group cursor-pointer hover:shadow-md transition-all flex flex-col h-full"
            onClick={() => onVideoClick(video)}
          >
            <div className="relative aspect-video overflow-hidden">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <PlayCircle className="w-12 h-12 text-white opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {Math.floor(video.length / 60)}:
                {String(video.length % 60).padStart(2, "0")}
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <h4 className="font-semibold line-clamp-2 text-sm leading-tight group-hover:text-primary transition-colors">
                {video.title}
              </h4>
              <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground border-t pt-2">
                <span>{video.views.toLocaleString()} views</span>
                <span>{video.rating.toFixed(1)} ★</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

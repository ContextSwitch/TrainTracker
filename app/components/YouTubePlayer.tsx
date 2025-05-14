'use client';

import React, { useEffect, useRef } from 'react';

interface YouTubePlayerProps {
  videoUrl: string;
  width?: string;
  height?: string;
  autoplay?: boolean;
}

/**
 * Component to embed a YouTube video
 */
const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoUrl,
  width = '100%',
  height = '100%',
  autoplay = true
}) => {
  const playerRef = useRef<HTMLIFrameElement>(null);

  // Function to extract video ID from various YouTube URL formats
  const getYoutubeEmbedUrl = (url: string): string => {
    try {
      if (url.includes('youtube.com/watch')) {
        // Extract video ID from watch URL
        const videoId = new URL(url).searchParams.get('v');
        return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? '1' : '0'}`;
      } else if (url.includes('youtube.com/live')) {
        // Extract video ID from live URL
        const parts = url.split('/');
        const videoId = parts[parts.length - 1];
        return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? '1' : '0'}`;
      } else if (url.includes('youtu.be')) {
        // Extract video ID from short URL
        const parts = url.split('/');
        const videoId = parts[parts.length - 1];
        return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? '1' : '0'}`;
      } else if (url.includes('railstream.net')) {
        // For railstream.net, we'll need to handle this differently
        // This is a placeholder - we might need to adjust based on how railstream.net embeds work
        return url;
      }
      
      // If we can't parse it, return the original URL
      return url;
    } catch (error) {
      console.error('Error parsing YouTube URL:', error);
      return url;
    }
  };

  // Get the embed URL
  const embedUrl = getYoutubeEmbedUrl(videoUrl);

  // Update the iframe src when the video URL changes
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.src = getYoutubeEmbedUrl(videoUrl);
    }
  }, [videoUrl]);

  return (
    <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 aspect ratio */ }}>
      <iframe
        ref={playerRef}
        src={embedUrl}
        className="absolute top-0 left-0 w-full h-full"
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default YouTubePlayer;

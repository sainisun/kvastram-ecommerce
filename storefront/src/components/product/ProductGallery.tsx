'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ZoomIn, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductVideo } from '@/types';

interface ProductGalleryProps {
  images: string[];
  title: string;
  videos?: ProductVideo[];
}

export default function ProductGallery({
  images,
  title,
  videos = [],
}: ProductGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedMediaType, setSelectedMediaType] = useState<'image' | 'video'>(
    'image'
  );
  const imageRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Filter out potential empty strings if any
  const validImages = images.filter((img) => img);
  const hasVideos = videos && videos.length > 0;

  // Combined media count for navigation
  const totalMedia = validImages.length + (hasVideos ? videos.length : 0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const { left, top, width, height } =
      imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  const handlePrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setSelectedIndex((prev) => (prev === 0 ? totalMedia - 1 : prev - 1));
      // Update media type based on index
      if (selectedIndex < validImages.length) {
        setSelectedMediaType('image');
      } else {
        setSelectedMediaType('video');
      }
    },
    [totalMedia, validImages.length, selectedIndex]
  );

  const handleNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setSelectedIndex((prev) => (prev === totalMedia - 1 ? 0 : prev + 1));
      // Update media type based on index
      const nextIndex =
        selectedIndex === totalMedia - 1 ? 0 : selectedIndex + 1;
      if (nextIndex < validImages.length) {
        setSelectedMediaType('image');
      } else {
        setSelectedMediaType('video');
      }
    },
    [totalMedia, validImages.length, selectedIndex]
  );

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') setIsLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, handlePrev, handleNext]);

  // Early return after all hooks
  if (validImages.length === 0 && !hasVideos) {
    return (
      <div className="aspect-[3/4] bg-stone-100 flex items-center justify-center text-stone-300 font-serif italic text-2xl rounded-sm">
        No Imagery
      </div>
    );
  }

  // Get current media (image or video)
  const isCurrentVideo = selectedIndex >= validImages.length;
  const currentVideoIndex = isCurrentVideo
    ? selectedIndex - validImages.length
    : -1;
  const currentVideo =
    isCurrentVideo && hasVideos ? videos[currentVideoIndex] : null;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }

    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <div className="space-y-4">
      {/* Main Media Container (Image or Video) */}
      <div
        ref={imageRef}
        className={cn(
          'relative aspect-[3/4] bg-stone-100 overflow-hidden rounded-sm group touch-pan-y',
          !isCurrentVideo && 'cursor-zoom-in' // Only zoom for images
        )}
        onMouseEnter={() => !isCurrentVideo && setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseMove={!isCurrentVideo ? handleMouseMove : undefined}
        onClick={() => !isCurrentVideo && setIsLightboxOpen(true)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* PHASE 2.3: Video Display */}
        {isCurrentVideo && currentVideo ? (
          <video
            src={currentVideo.url}
            poster={currentVideo.thumbnail}
            controls
            className="w-full h-full object-cover"
            preload="metadata"
          >
            Your browser does not support video playback.
          </video>
        ) : (
          /* Image Display */
          <>
            <OptimizedImage
              src={validImages[selectedIndex]}
              alt={`${title} - View ${selectedIndex + 1}`}
              fill
              className={cn(
                'object-cover transition-opacity duration-300',
                isHovering ? 'opacity-0' : 'opacity-100'
              )}
              priority
            />

            {/* Zoomed Image Overlay */}
            {isHovering && (
              <div
                className="absolute inset-0 pointer-events-none hidden md:block"
                style={{
                  backgroundImage: `url(${validImages[selectedIndex]})`,
                  backgroundPosition: `${mousePos.x}% ${mousePos.y}%`,
                  backgroundSize: '200%',
                  backgroundRepeat: 'no-repeat',
                }}
              />
            )}
          </>
        )}

        {/* Hover Controls (Desktop) - Only for images */}
        {!isCurrentVideo && validImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 min-h-[44px] min-w-[44px] bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-stone-800 flex items-center justify-center"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 min-h-[44px] min-w-[44px] bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-stone-800 flex items-center justify-center"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <ZoomIn size={16} />
        </div>

        {/* Video Indicator */}
        {isCurrentVideo && (
          <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-medium">
            <Play size={14} fill="currentColor" />
            Video
          </div>
        )}
      </div>

      {/* Thumbnails - Combined Images and Videos */}
      {totalMedia > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {/* Image Thumbnails */}
          {validImages.map((img, idx) => (
            <button
              key={`img-${idx}`}
              onClick={() => {
                setSelectedIndex(idx);
                setSelectedMediaType('image');
              }}
              className={cn(
                'relative aspect-[3/4] bg-stone-100 overflow-hidden rounded-sm transition-all border',
                selectedIndex === idx && !isCurrentVideo
                  ? 'border-stone-900 ring-1 ring-stone-900 opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-100'
              )}
            >
              <OptimizedImage
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                fill
                className="object-cover"
                sizes="100px"
              />
            </button>
          ))}
          {/* Video Thumbnails */}
          {hasVideos &&
            videos.map((video, idx) => {
              const videoIndex = validImages.length + idx;
              return (
                <button
                  key={`video-${idx}`}
                  onClick={() => {
                    setSelectedIndex(videoIndex);
                    setSelectedMediaType('video');
                  }}
                  className={cn(
                    'relative aspect-[3/4] bg-stone-100 overflow-hidden rounded-sm transition-all border',
                    selectedIndex === videoIndex && isCurrentVideo
                      ? 'border-stone-900 ring-1 ring-stone-900 opacity-100'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  )}
                >
                  {video.thumbnail ? (
                    <OptimizedImage
                      src={video.thumbnail}
                      alt={`Video ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="100px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-stone-200">
                      <Play size={20} className="text-stone-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-black/60 rounded-full flex items-center justify-center">
                      <Play size={14} className="text-white ml-0.5" />
                    </div>
                  </div>
                </button>
              );
            })}
        </div>
      )}

      {/* Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 text-white p-2 min-h-[44px] min-w-[44px] hover:bg-white/10 rounded-full transition-colors z-50 flex items-center justify-center"
            >
              <X size={32} />
            </button>

            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 min-h-[44px] min-w-[44px] text-white hover:bg-white/10 rounded-full transition-colors z-50 flex items-center justify-center"
            >
              <ChevronLeft size={48} />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 min-h-[44px] min-w-[44px] text-white hover:bg-white/10 rounded-full transition-colors z-50 flex items-center justify-center"
            >
              <ChevronRight size={48} />
            </button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()} // Prevent clicking image from closing modal
            >
              <OptimizedImage
                src={validImages[selectedIndex]}
                alt={title}
                fill
                className="object-contain" // Contain to show full image without cropping
                quality={100}
                priority
              />
            </motion.div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 font-mono text-sm">
              {selectedIndex + 1} / {validImages.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

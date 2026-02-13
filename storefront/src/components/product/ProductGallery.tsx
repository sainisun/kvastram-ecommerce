'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn exists, if not I'll define it or use clsx directly

interface ProductGalleryProps {
    images: string[];
    title: string;
}

export default function ProductGallery({ images, title }: ProductGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const imageRef = useRef<HTMLDivElement>(null);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    // Filter out potential empty strings if any
    const validImages = images.filter(img => img);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!imageRef.current) return;
        const { left, top, width, height } = imageRef.current.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setMousePos({ x, y });
    };

    const handlePrev = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        setSelectedIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
    }, [validImages.length]);

    const handleNext = useCallback((e?: React.MouseEvent) => {
        e?.stopPropagation();
        setSelectedIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
    }, [validImages.length]);

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
    if (validImages.length === 0) {
        return (
            <div className="aspect-[3/4] bg-stone-100 flex items-center justify-center text-stone-300 font-serif italic text-2xl rounded-sm">
                No Imagery
            </div>
        );
    }



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
            {/* Main Image Container */}
            <div
                ref={imageRef}
                className="relative aspect-[3/4] bg-stone-100 overflow-hidden cursor-zoom-in rounded-sm group touch-pan-y"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onMouseMove={handleMouseMove}
                onClick={() => setIsLightboxOpen(true)}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <Image
                    src={validImages[selectedIndex]}
                    alt={`${title} - View ${selectedIndex + 1}`}
                    fill
                    className={cn(
                        "object-cover transition-opacity duration-300",
                        isHovering ? "opacity-0" : "opacity-100"
                    )}
                    priority
                />

                {/* Zoomed Image Overlay */}
                {isHovering && (
                    <div
                        className="absolute inset-0 pointer-events-none hidden md:block" // Hide zoom on mobile
                        style={{
                            backgroundImage: `url(${validImages[selectedIndex]})`,
                            backgroundPosition: `${mousePos.x}% ${mousePos.y}%`,
                            backgroundSize: '200%',
                            backgroundRepeat: 'no-repeat',
                        }}
                    />
                )}

                {/* Hover Controls (Desktop) */}
                {validImages.length > 1 && (
                    <>
                        <button
                            onClick={handlePrev}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-stone-800"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={handleNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-stone-800"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </>
                )}

                <div className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <ZoomIn size={16} />
                </div>
            </div>

            {/* Thumbnails */}
            {validImages.length > 1 && (
                <div className="grid grid-cols-5 gap-3">
                    {validImages.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedIndex(idx)}
                            className={cn(
                                "relative aspect-[3/4] bg-stone-100 overflow-hidden rounded-sm transition-all border",
                                selectedIndex === idx
                                    ? "border-stone-900 ring-1 ring-stone-900 opacity-100"
                                    : "border-transparent opacity-60 hover:opacity-100"
                            )}
                        >
                            <Image
                                src={img}
                                alt={`Thumbnail ${idx + 1}`}
                                fill
                                className="object-cover"
                                sizes="100px"
                            />
                        </button>
                    ))}
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
                            className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-50"
                        >
                            <X size={32} />
                        </button>

                        <button
                            onClick={handlePrev}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/10 rounded-full transition-colors z-50"
                        >
                            <ChevronLeft size={48} />
                        </button>

                        <button
                            onClick={handleNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/10 rounded-full transition-colors z-50"
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
                            <Image
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

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ImageViewerProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    fileName: string;
    onNext?: () => void;
    onPrev?: () => void;
    hasNext?: boolean;
    hasPrev?: boolean;
}

const ImageViewer: React.FC<ImageViewerProps> = ({
    isOpen,
    onClose,
    imageUrl,
    fileName,
    onNext,
    onPrev,
    hasNext,
    hasPrev
}) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPan, setStartPan] = useState({ x: 0, y: 0 });
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Reset zoom/pan when image changes or viewer opens
    useEffect(() => {
        if (isOpen) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
        }
    }, [isOpen, imageUrl]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight' && hasNext && onNext) onNext();
            if (e.key === 'ArrowLeft' && hasPrev && onPrev) onPrev();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, hasNext, hasPrev, onNext, onPrev, onClose]);

    if (!isOpen) return null;

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY * -0.001;
        const newScale = Math.min(Math.max(1, scale + delta), 4);

        // If zooming out to 1, reset position
        if (newScale === 1) {
            setPosition({ x: 0, y: 0 });
        }

        setScale(newScale);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (scale > 1) {
            setIsDragging(true);
            setStartPan({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && scale > 1) {
            e.preventDefault();
            const newX = e.clientX - startPan.x;
            const newY = e.clientY - startPan.y;
            setPosition({ x: newX, y: newY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.5, 4));
    const handleZoomOut = () => {
        setScale(prev => {
            const newScale = Math.max(1, prev - 0.5);
            if (newScale === 1) setPosition({ x: 0, y: 0 });
            return newScale;
        });
    };
    const handleReset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    return (
        <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center text-white z-50 bg-gradient-to-b from-black/50 to-transparent">
                <h3 className="text-lg font-medium truncate max-w-[70%] drop-shadow-md">{fileName}</h3>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white/10 rounded-lg p-1 mr-4 backdrop-blur-md border border-white/20">
                        <button onClick={handleZoomOut} className="p-2 hover:bg-white/20 rounded-md transition-colors" title="Zoom Out">
                            <ZoomOut className="w-5 h-5" />
                        </button>
                        <span className="w-12 text-center text-sm font-mono">{Math.round(scale * 100)}%</span>
                        <button onClick={handleZoomIn} className="p-2 hover:bg-white/20 rounded-md transition-colors" title="Zoom In">
                            <ZoomIn className="w-5 h-5" />
                        </button>
                        <div className="w-px h-6 bg-white/20 mx-1"></div>
                        <button onClick={handleReset} className="p-2 hover:bg-white/20 rounded-md transition-colors" title="Reset">
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                        <X className="w-8 h-8" />
                    </button>
                </div>
            </div>

            {/* Navigation Buttons */}
            {hasPrev && (
                <button
                    onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
                    className="absolute left-4 p-3 text-white hover:bg-white/10 rounded-full transition-colors z-50 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                    <ChevronLeft className="w-10 h-10 drop-shadow-lg" />
                </button>
            )}

            {hasNext && (
                <button
                    onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                    className="absolute right-4 p-3 text-white hover:bg-white/10 rounded-full transition-colors z-50 focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                    <ChevronRight className="w-10 h-10 drop-shadow-lg" />
                </button>
            )}

            {/* Image Container */}
            <div
                ref={containerRef}
                className="w-full h-full flex items-center justify-center overflow-hidden"
                onWheel={handleWheel}
            >
                <img
                    ref={imageRef}
                    src={imageUrl}
                    alt={fileName}
                    draggable={false}
                    className={`
            max-w-full max-h-full object-contain transition-transform duration-100 ease-out select-none
            ${scale > 1 ? 'cursor-grab active:cursor-grabbing' : ''}
          `}
                    style={{
                        transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                />
            </div>
        </div>
    );
};

export default ImageViewer;

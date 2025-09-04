import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Promotion {
    id: string;
    promotion_flyer: string;
    start_date: string;
    end_date: string;
    url_redirect?: string;
    is_active: boolean;
}

interface PromotionPopupProps {
    promotion: Promotion;
    suppressDuration?: number;
}

export default function PromotionPopup({ promotion, suppressDuration = 24 }: PromotionPopupProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (!promotion) return;

        const storageKey = `promotion_${promotion.id}_dismissed`;
        const lastDismissed = localStorage.getItem(storageKey);

        let shouldShow = true;

        if (lastDismissed) {
            const dismissedTime = new Date(lastDismissed);
            const now = new Date();
            const hoursSinceLastDismiss = (now.getTime() - dismissedTime.getTime()) / (1000 * 60 * 60);

            if (hoursSinceLastDismiss < suppressDuration) {
                shouldShow = false;
            }
        }

        const now = new Date();
        const startDate = new Date(promotion.start_date);
        const endDate = new Date(promotion.end_date);

        if (now < startDate || now > endDate || !promotion.is_active) {
            shouldShow = false;
        }

        if (shouldShow) {
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [promotion, suppressDuration]);

    const handleClose = () => {
        setIsOpen(false);

        const storageKey = `promotion_${promotion.id}_dismissed`;
        localStorage.setItem(storageKey, new Date().toISOString());
    };

    const handleRedirect = () => {
        if (promotion.url_redirect) {
            const isExternal = !promotion.url_redirect.startsWith('/') && !promotion.url_redirect.startsWith(window.location.origin);

            if (isExternal) {
                window.open(promotion.url_redirect, '_blank', 'noopener,noreferrer');
            } else {
                window.location.href = promotion.url_redirect;
            }
        }
        handleClose();
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    if (!promotion) return null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="flex h-[85vh] flex-col border-0 bg-transparent p-0 shadow-none" onClick={handleBackdropClick}>
                <div className="relative flex h-full flex-col">
                    <Button
                        onClick={handleClose}
                        variant="secondary"
                        size="icon"
                        className="absolute -top-4 right-2 z-10 h-8 w-8 rounded-full bg-white shadow-lg hover:bg-gray-100"
                    >
                        <X className="h-4 w-4" />
                    </Button>

                    <div
                        className="group relative flex min-h-0 flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-lg"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        onClick={handleRedirect}
                    >
                        <img
                            src={promotion.promotion_flyer}
                            alt="Promosi Aksademy"
                            className={`max-h-full max-w-full rounded-2xl object-contain transition-all duration-300 ${
                                isHovered ? 'brightness-90' : ''
                            }`}
                            onError={() => {
                                console.error('Error loading promotion image');
                                handleClose();
                            }}
                        />

                        <div className={`absolute right-8 bottom-4 transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-60'}`}>
                            <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm">
                                Klik untuk {promotion.url_redirect ? 'detail' : 'tutup'}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

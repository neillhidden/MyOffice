import React, { useState } from 'react';
import {
  Package,
  Shirt,
  Laptop,
  Smartphone,
  ShoppingBag,
  Boxes,
  Tag,
  Headphones,
  Watch,
  Coffee,
} from 'lucide-react';

interface ProductThumbnailProps {
  src?: string | null;
  alt?: string;
  category?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg'; // default md = 48x48
}

export const ProductThumbnail: React.FC<ProductThumbnailProps> = ({
  src,
  alt = 'Produto',
  category,
  className = '',
  size = 'md',
}) => {
  const [hasError, setHasError] = useState(false);

  // Check if image is the known face portrait from seed data
  const isPortraitFace = src ? src.includes('photo-1521572267360-ee0c2909d518') : false;
  const shouldRenderPlaceholder = !src || hasError || isPortraitFace;

  const sizeClasses =
    size === 'sm'
      ? 'w-8 h-8 rounded-md'
      : size === 'lg'
      ? 'w-16 h-16 rounded-xl'
      : 'w-12 h-12 rounded-lg'; // 48x48px (Item 2.2)

  const iconSizeClasses = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';

  const renderCategoryIcon = () => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('moda') || cat.includes('vestu') || cat.includes('roupa') || cat.includes('t-shirt') || cat.includes('camis')) {
      return <Shirt className={`${iconSizeClasses} text-slate-500 dark:text-slate-400`} />;
    }
    if (cat.includes('inform') || cat.includes('comput') || cat.includes('laptop') || cat.includes('pc')) {
      return <Laptop className={`${iconSizeClasses} text-slate-500 dark:text-slate-400`} />;
    }
    if (cat.includes('telem') || cat.includes('smart') || cat.includes('phone') || cat.includes('celular')) {
      return <Smartphone className={`${iconSizeClasses} text-slate-500 dark:text-slate-400`} />;
    }
    if (cat.includes('fone') || cat.includes('audio') || cat.includes('headphone') || cat.includes('auricular')) {
      return <Headphones className={`${iconSizeClasses} text-slate-500 dark:text-slate-400`} />;
    }
    if (cat.includes('relog') || cat.includes('watch')) {
      return <Watch className={`${iconSizeClasses} text-slate-500 dark:text-slate-400`} />;
    }
    if (cat.includes('alimen') || cat.includes('bebid') || cat.includes('café')) {
      return <Coffee className={`${iconSizeClasses} text-slate-500 dark:text-slate-400`} />;
    }
    if (cat.includes('calc') || cat.includes('sapato') || cat.includes('acess')) {
      return <ShoppingBag className={`${iconSizeClasses} text-slate-500 dark:text-slate-400`} />;
    }
    return <Package className={`${iconSizeClasses} text-slate-400 dark:text-slate-500`} />;
  };

  return (
    <div
      className={`${sizeClasses} shrink-0 overflow-hidden border border-slate-200/90 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${className}`}
      title={alt}
    >
      {shouldRenderPlaceholder ? (
        <div className="w-full h-full flex items-center justify-center bg-slate-100/90 dark:bg-slate-800">
          {renderCategoryIcon()}
        </div>
      ) : (
        <img
          src={src!}
          alt={alt}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
};

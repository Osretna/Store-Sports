import React, { useState, useEffect } from "react";
import { X, Plus, Minus, ShoppingBag, Zap, Star, ChevronLeft, ChevronRight, Dumbbell } from "lucide-react";
import { Product } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface ProductDetailsModalProps {
  product: Product;
  allProducts: Product[];
  onClose: () => void;
  onAddToCart: (p: Product, quantity: number) => void;
  onDirectBuy: (p: Product, quantity: number) => void;
  onSelectProduct: (p: Product) => void;
  language: "ar" | "en";
}

export default function ProductDetailsModal({
  product,
  allProducts,
  onClose,
  onAddToCart,
  onDirectBuy,
  onSelectProduct,
  language
}: ProductDetailsModalProps) {
  const isAr = language === "ar";
  const name = isAr ? product.nameAr : product.nameEn;
  const desc = isAr ? product.descriptionAr : product.descriptionEn;
  const category = isAr ? product.categoryAr : product.categoryEn;

  // Resolve image list: if images is defined and has elements, use it, else fallback to single image
  const imagesList = product.images && product.images.length > 0 ? product.images : [product.image || ""];
  
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // Reset indices and quantity when product changes
  useEffect(() => {
    setCurrentImgIdx(0);
    setQuantity(1);
  }, [product]);

  const t = {
    ar: {
      detailsTitle: "تفاصيل المنتج المتميز ⭐",
      addToCart: "أضف للسلة 🛒",
      buyNow: "اتمام الشراء ⚡",
      similarProducts: "منتجات مشابهة قد تناسبك 🔥",
      currency: "ج.م",
      qty: "الكمية المطلوبة :",
      category: "الفئة :",
      rating: "التقييم العام :",
      noSimilar: "لا توجد منتجات مشابهة متوفرة حالياً في هذه الفئة.",
      close: "إغلاق النافذة"
    },
    en: {
      detailsTitle: "Premium Product Details ⭐",
      addToCart: "Add to Bag 🛒",
      buyNow: "Checkout Now ⚡",
      similarProducts: "Similar Athletic Gear You Might Like 🔥",
      currency: "EGP",
      qty: "Required Quantity:",
      category: "Category:",
      rating: "General Rating:",
      noSimilar: "No other matched products available in this category.",
      close: "Close Panel"
    }
  }[language];

  // Similar Products from same category, excluding active one
  const similarProducts = allProducts
    .filter((p) => p.id !== product.id && (p.categoryEn === product.categoryEn || p.categoryAr === product.categoryAr))
    .slice(0, 4);

  // Star ratings representation
  const ratingValue = product.rating || 4.5;
  const stars = Array.from({ length: 5 }, (_, i) => {
    const starVal = i + 1;
    return (
      <Star
        key={i}
        className={`w-4 h-4 ${
          starVal <= Math.round(ratingValue)
            ? "fill-yellow-400 text-yellow-400"
            : "text-zinc-300 dark:text-zinc-700"
        }`}
      />
    );
  });

  return (
    <AnimatePresence>
      <div 
        id="product-modal-container"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto"
      >
        {/* Backdrop overlay styled in elegant slate tones */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md"
        />

        {/* Modal Window Sheet */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh] md:max-h-[85vh] text-start"
        >
          {/* Header Action bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-emerald-550 shrink-0" />
              <h3 className="font-extrabold text-sm md:text-base text-zinc-900 dark:text-white uppercase tracking-wider">
                {t.detailsTitle}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white transition duration-250 cursor-pointer"
              title={t.close}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal scrollable workspace content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
              
              {/* LEFT HALF DIRECTORY: Multimedia Gallery Container */}
              <div className="md:col-span-6 space-y-4">
                <div className="relative w-full aspect-video md:aspect-[4/3] bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden group/modalimg">
                  <img
                    src={imagesList[currentImgIdx]}
                    alt={name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-all duration-300"
                  />

                  {/* Left-Right Chevrons for images list navigation */}
                  {imagesList.length > 1 && (
                    <>
                      <button
                        onClick={() => {
                          setCurrentImgIdx((prev) => (prev === 0 ? imagesList.length - 1 : prev - 1));
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-zinc-900/70 hover:bg-zinc-900 text-white rounded-full flex items-center justify-center cursor-pointer transition border border-white/10"
                      >
                        <ChevronLeft className="w-4.5 h-4.5" />
                      </button>
                      <button
                        onClick={() => {
                          setCurrentImgIdx((prev) => (prev === imagesList.length - 1 ? 0 : prev + 1));
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-zinc-900/70 hover:bg-zinc-900 text-white rounded-full flex items-center justify-center cursor-pointer transition border border-white/10"
                      >
                        <ChevronRight className="w-4.5 h-4.5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Smaller Thumbnails Grid row */}
                {imagesList.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {imagesList.map((imgSrc, imgIndex) => (
                      <button
                        key={imgIndex}
                        onClick={() => setCurrentImgIdx(imgIndex)}
                        className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                          imgIndex === currentImgIdx
                            ? "border-emerald-500 scale-102 shadow"
                            : "border-zinc-250 dark:border-zinc-800 hover:border-zinc-400"
                        }`}
                      >
                        <img 
                          src={imgSrc} 
                          alt={`${name} thumbnail ${imgIndex}`} 
                          className="w-full h-full object-cover" 
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT HALF DIRECTORY: Attributes and Details Panel */}
              <div className="md:col-span-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 max-w-max dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/40">
                      {category}
                    </span>
                  </div>

                  <h2 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white leading-tight">
                    {name}
                  </h2>

                  <div className="flex items-center gap-2 py-1 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex">{stars}</div>
                    <span className="text-xs text-zinc-400 font-bold">
                      ({product.ratingCount || 10} {isAr ? "تقييمات وثقوا بنا" : "verified ratings"})
                    </span>
                  </div>
                </div>

                {/* Display Price directly with athletic layout accent colors */}
                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-250 dark:border-zinc-808/60 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] text-zinc-400 font-extrabold tracking-wider uppercase mb-0.5">
                      {isAr ? "سعر القطعة المخصصة" : "Unit Special Price"}
                    </span>
                    <span className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                      {product.price} <span className="text-sm font-bold text-zinc-500">{t.currency}</span>
                    </span>
                  </div>
                  {quantity > 1 && (
                    <div className="text-right">
                      <span className="block text-[10px] text-zinc-400 font-extrabold tracking-wider uppercase mb-0.5">
                        {isAr ? "الاجمالي للكمية" : "Quantity Total Price"}
                      </span>
                      <span className="text-lg font-bold text-zinc-600 dark:text-zinc-300">
                        {product.price * quantity} {t.currency}
                      </span>
                    </div>
                  )}
                </div>

                {/* Structured paragraphs description info */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-zinc-400 tracking-wider">
                    {isAr ? "وصف ومميزات المنتج 📝" : "Product Specifications & Details 📝"}
                  </p>
                  <p className="text-sm text-zinc-650 dark:text-zinc-350 leading-relaxed font-medium whitespace-pre-line bg-zinc-50/55 dark:bg-zinc-950/20 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    {desc}
                  </p>
                </div>

                {/* Active Quantity Adjuster */}
                <div className="flex items-center justify-between gap-4 py-4 border-t border-b border-zinc-100 dark:border-zinc-800">
                  <span className="text-xs md:text-sm font-extrabold text-zinc-700 dark:text-zinc-300">
                    {t.qty}
                  </span>

                  <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-955 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <button
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-750 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-emerald-500 hover:border-emerald-500 dark:hover:text-emerald-400 dark:hover:border-emerald-400 cursor-pointer active:scale-90 transition duration-150"
                      title="Minus"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 text-center text-sm font-black text-zinc-800 dark:text-white bg-transparent outline-none focus:ring-0 border-none"
                    />

                    <button
                      onClick={() => setQuantity((prev) => prev + 1)}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-750 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-emerald-500 hover:border-emerald-500 dark:hover:text-emerald-400 dark:hover:border-emerald-400 cursor-pointer active:scale-90 transition duration-150"
                      title="Plus"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Operational Submit Triggers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  <button
                    onClick={() => {
                      onAddToCart(product, quantity);
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:border-emerald-500 dark:hover:border-emerald-400 text-zinc-800 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 font-extrabold text-sm transition-all shadow-sm cursor-pointer"
                  >
                    <ShoppingBag className="w-4.5 h-4.5" />
                    <span>{t.addToCart}</span>
                  </button>

                  <button
                    onClick={() => {
                      onDirectBuy(product, quantity);
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-black text-sm rounded-xl shadow-md cursor-pointer transition active:scale-98"
                  >
                    <Zap className="w-4.5 h-4.5 fill-yellow-250 text-yellow-250" />
                    <span>{t.buyNow}</span>
                  </button>
                </div>

              </div>

            </div>

            {/* LOWER BOTTOM DISCOVERY ZONE: SIMILAR PRODUCTS GRID PANEL */}
            <div className="pt-8 border-t border-zinc-150 dark:border-zinc-800/80 space-y-4">
              <h4 className="font-extrabold text-sm md:text-base text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-555 animate-pulse" />
                <span>{t.similarProducts}</span>
              </h4>

              {similarProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-809 rounded-xl font-bold">
                  {t.noSimilar}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {similarProducts.map((p) => {
                    const simName = isAr ? p.nameAr : p.nameEn;
                    const simImage = p.image || (p.images && p.images[0]) || "";
                    return (
                      <div
                        key={p.id}
                        onClick={() => onSelectProduct(p)}
                        className="group flex flex-col bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 hover:border-emerald-500 dark:hover:border-emerald-400 rounded-xl overflow-hidden p-2.5 cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                      >
                        <div className="w-full aspect-video rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-900 mb-2">
                          <img
                            src={simImage}
                            alt={simName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                          />
                        </div>
                        <h5 className="text-xs font-extrabold text-zinc-850 dark:text-zinc-205 line-clamp-1 group-hover:text-emerald-550 dark:group-hover:text-emerald-400 transition-colors">
                          {simName}
                        </h5>
                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-zinc-100 dark:border-zinc-900">
                          <span className="text-[10px] text-zinc-400 font-bold">
                            {isAr ? p.categoryAr : p.categoryEn}
                          </span>
                          <span className="text-xs font-black text-emerald-650 dark:text-emerald-400">
                            {p.price} {isAr ? "ج" : "EGP"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Modal Panel Footer status accent bar */}
          <div className="px-6 py-3 border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 flex justify-between items-center bg-transparent">
            <span>SECURE CHECKOUT SSL 🔑</span>
            <span>WORLDWIDE SPORTS GEAR 🏆</span>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}

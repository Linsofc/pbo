'use client';

import { useState, useEffect, useCallback } from 'react';

// Daftar Banner
const banners = [
  '/banners/banner-1.png',
  '/banners/banner-2.png',
  '/banners/banner-3.png',
];

export default function BannerSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fungsi Next Slide
  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, []);

  // Fungsi Prev Slide
  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  // Auto Slide 5 Detik
  useEffect(() => {
    const slideInterval = setInterval(nextSlide, 5000);
    return () => clearInterval(slideInterval);
  }, [nextSlide]);

  return (
    <div className="w-full aspect-[16/6] md:aspect-[21/7] rounded-2xl mb-8 overflow-hidden shadow-2xl shadow-blue-900/10 relative group border border-gray-800 bg-[#18181b]">
      
      {/* GAMBAR BANNER */}
      {banners.map((banner, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <img 
            src={banner} 
            alt={`Banner ${index + 1}`} 
            className="w-full h-full object-cover"
          />
          {/* Overlay Gradient Bawah */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0a0a0b] to-transparent opacity-80"></div>
        </div>
      ))}

      {/* --- TOMBOL NAVIGASI (< dan >) --- */}
      
      {/* Tombol Kiri (<) */}
      <button 
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-blue-600/80 text-white backdrop-blur-sm transition-all duration-300 opacity-0 group-hover:opacity-100 border border-white/10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      {/* Tombol Kanan (>) */}
      <button 
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-blue-600/80 text-white backdrop-blur-sm transition-all duration-300 opacity-0 group-hover:opacity-100 border border-white/10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>

      {/* Indikator Dots */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-blue-500 w-8' : 'bg-gray-500/50 w-2 hover:bg-white'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
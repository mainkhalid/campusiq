import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { images } from "../assets";
import { Link } from "react-router-dom";

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      image: images.zetImage1,
      title: "Shape Your Future at Zetech",
      secondaryLink: "/academics",
      subtitle:
        "Join a community of innovators and world-changers. Applications for 2026 intake are now open.",
      buttonText: "Apply Now",
      link: "/admissions",
      secondaryText: "Learn More",
    },
    {
      image: images.zetImage2,
      title: "Excellence in Technology",
      subtitle:
        "Experience world-class facilities and a curriculum designed for the modern digital economy.",
      buttonText: "Explore Courses",
      link: "/academics",
      secondaryLink: "/programmes",
      secondaryText: "Programmes",
    },
    {
      image: images.zetImage3,
      title: "Vibrant Student Life",
      subtitle:
        "Beyond academics, discover your passions through our diverse clubs and sports programs.",
      buttonText: "Join the Experience",
      link: "/about",
      secondaryLink: "/programmes",
      secondaryText: "Sports",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () =>
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  return (
    <div className="relative h-[600px] w-full overflow-hidden bg-slate-900">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center scale-105"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a2b4c]/90 to-transparent" />
          </div>

          {/* Content */}
          <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
            <div
              className={`max-w-2xl text-white transition-all duration-700 delay-300 transform ${
                index === currentSlide
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
            >
              <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
                {slide.title}
              </h1>
              <p className="text-lg md:text-xl text-slate-200 mb-8 font-light leading-relaxed">
                {slide.subtitle}
              </p>
              <div className="flex gap-4">
                {/* Primary CTA – always shown */}
                <Link
                  to={slide.link}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-md font-bold transition-all transform hover:scale-105 shadow-lg inline-block"
                >
                  {slide.buttonText}
                </Link>

                {/* Secondary CTA – only if it exists */}
                {slide.secondaryLink && (
                  <Link
                    to={slide.secondaryLink}
                    className="border-2 border-white/30 hover:bg-white/10 text-white px-8 py-4 rounded-md font-bold transition-all inline-block"
                  >
                    {slide.secondaryText}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 text-white hover:bg-black/50 transition-colors z-20"
      >
        <ChevronLeft size={32} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 text-white hover:bg-black/50 transition-colors z-20"
      >
        <ChevronRight size={32} />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentSlide ? "w-12 bg-orange-500" : "w-3 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSection;

import React from 'react';
import { motion } from 'framer-motion';

export default function AIShowcase() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center">
        {/* Left side - Image */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
        >
          <div className="relative overflow-hidden rounded-lg shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop"
              alt="AI researchers working with technology"
              className="w-full h-auto object-cover"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"
            />
          </div>
        </motion.div>

        {/* Right side - Content */}
        <div className="space-y-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl md:text-6xl font-serif text-gray-900"
          >
            More powerful computers
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg text-gray-700 leading-relaxed"
          >
            Artificial intelligence systems have the potential to revolutionize our understanding of
            the world around us. The technology could enable the rapid design and
            development of life-saving drugs, clean energy, and optimized commerce.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-lg text-gray-700 leading-relaxed"
          >
            Leading Zetech University researchers are working on{' '}
            <span className="font-semibold underline decoration-2 decoration-blue-600">
              detecting and removing biases
            </span>{' '}
            in artificial intelligence systems,{' '}
            <span className="font-semibold underline decoration-2 decoration-blue-600">
              improving the accuracy
            </span>{' '}
            of the predictions AI models make, and{' '}
            <span className="font-semibold underline decoration-2 decoration-blue-600">
              utilizing neural networks to process information
            </span>
            .
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            whileHover={{ scale: 1.05, x: 5 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 bg-gray-700 hover:bg-gray-800 text-white px-6 py-4 rounded-full shadow-lg transition-colors"
          >
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </motion.div>
            <span className="text-lg font-medium">
              Learn more about the future of artificial intelligence
            </span>
          </motion.button>
        </div>
      </div>

      {/* Floating elements for visual interest */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          repeat: Infinity,
          duration: 4,
          ease: "easeInOut",
        }}
        className="absolute top-20 right-20 w-32 h-32 bg-blue-400 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          y: [0, 20, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          repeat: Infinity,
          duration: 5,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute bottom-20 left-20 w-40 h-40 bg-purple-400 rounded-full blur-3xl"
      />
    </div>
  );
}
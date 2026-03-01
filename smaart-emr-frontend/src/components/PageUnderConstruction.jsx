// =========================================================
// PAGE UNDER CONSTRUCTION - Placeholder component
// =========================================================
import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PageUnderConstruction = ({ title = "Page Under Construction", description = "This page is being developed and will be available soon." }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* Animated Building Icon */}
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-7xl mb-6"
        >
          🏗️
        </motion.div>

        <h1 className="text-4xl font-bold text-gray-800 mb-2">{title}</h1>
        <p className="text-gray-600 mb-8">{description}</p>

        {/* Back Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          <ArrowLeft size={20} />
          Go Back
        </motion.button>

        {/* Status Text */}
        <div className="mt-12 p-6 bg-white rounded-lg shadow-md border-l-4 border-blue-600">
          <p className="text-sm text-gray-600">
            ✨ This feature is coming soon. Check back later for updates!
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default PageUnderConstruction;

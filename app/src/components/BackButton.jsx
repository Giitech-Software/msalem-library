// src/components/BackButton.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const BackButton = ({ label = "🔙 Back", className = "" }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className={`bg-green-600 text-yellow-400 font-bold px-4 py-2 rounded-lg shadow hover:bg-green-700 transition mb-4 ${className}`}
    >
      {label}
    </button>
  );
};

export default BackButton;

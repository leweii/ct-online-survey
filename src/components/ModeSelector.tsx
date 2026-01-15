"use client";

interface ModeSelectorProps {
  mode: "create" | "take";
  onModeChange: (mode: "create" | "take") => void;
}

export function ModeSelector({ mode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="flex bg-gray-100 p-1 rounded-full">
      <button
        onClick={() => onModeChange("create")}
        className={`flex-1 px-6 py-2 rounded-full text-sm font-medium transition-all ${
          mode === "create"
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-600 hover:text-gray-800"
        }`}
      >
        Create Survey
      </button>
      <button
        onClick={() => onModeChange("take")}
        className={`flex-1 px-6 py-2 rounded-full text-sm font-medium transition-all ${
          mode === "take"
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-600 hover:text-gray-800"
        }`}
      >
        Take Survey
      </button>
    </div>
  );
}

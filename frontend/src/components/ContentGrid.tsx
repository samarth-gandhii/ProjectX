"use client";

import { useState } from "react";
import { AlignLeft, Play, ChevronDown, ChevronUp } from "lucide-react";

// 1. Added interface to accept the click handler from page.tsx
interface ContentGridProps {
  onCardClick?: (id: string) => void;
}

const CONTENT_DATA = [
  {
    id: "dijkstra",
    title: "Dijkstra's Algorithm",
    subtitle: "algorithms",
    icon: <AlignLeft className="text-gray-400 mt-1 shrink-0" size={18} />,
    header: (
      <div className="h-32 bg-blue-900 relative">
        <div className="absolute inset-0 opacity-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      </div>
    ),
  },
  {
    id: "a-star",
    title: "A* Search Algorithm",
    subtitle: "algorithms",
    icon: <AlignLeft className="text-gray-400 mt-1 shrink-0" size={18} />,
    header: (
      <div className="h-32 bg-white flex items-center justify-center border-b border-gray-100">
        <span className="font-serif text-xl font-bold text-gray-800">A* Search</span>
      </div>
    ),
  },
  {
    id: "greedy",
    title: "Greedy Algorithms",
    subtitle: "algorithms",
    icon: <AlignLeft className="text-gray-400 mt-1 shrink-0" size={18} />,
    header: (
      <div className="h-32 bg-indigo-900 relative">
        <div className="absolute inset-0 opacity-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      </div>
    ),
  },
  {
    id: "solar-system",
    title: "Solar System Basics",
    subtitle: "Space",
    icon: <Play className="text-gray-400 mt-1 shrink-0" size={18} />,
    header: (
      <div className="h-32 bg-gray-800 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      </div>
    ),
  }
];

const TABS = ["For You", "Algorithms", "Space"];

// 2. Accept the prop here
export default function ContentGrid({ onCardClick }: ContentGridProps) {
  const [activeTab, setActiveTab] = useState("For You");
  const [visibleCount, setVisibleCount] = useState(3);

  const filteredData = CONTENT_DATA.filter((card) => {
    if (activeTab === "For You") return true;
    if (activeTab === "Algorithms" && card.subtitle === "algorithms") return true;
    if (activeTab === "Space" && card.subtitle === "Space") return true;
    return false;
  });

  const toggleShowMore = () => {
    if (visibleCount >= filteredData.length) {
      setVisibleCount(3);
    } else {
      setVisibleCount((prev) => prev + 3);
    }
  };

  const isShowingAll = visibleCount >= filteredData.length;

  // 3. Update click handler to use the prop instead of router.push
  const handleCardClick = (id: string) => {
    if (onCardClick) {
      onCardClick(id);
    }
  };

  return (
    <>
      {/* Tabs Section */}
      <div className="flex space-x-2 overflow-x-auto pb-4 mb-6 hide-scrollbar">
        {TABS.map((tab, i) => (
          <button
            key={i}
            onClick={() => {
              setActiveTab(tab);
              setVisibleCount(3); // Reset visible count when switching tabs
            }}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap border transition-colors ${activeTab === tab
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Render only the filtered and sliced data */}
        {filteredData.slice(0, visibleCount).map((card) => (
          <div
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            className="border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow cursor-pointer flex flex-col"
          >
            {card.header}
            <div className="p-4 flex gap-3 flex-1">
              {card.icon}
              <div>
                <h3 className="font-medium text-gray-900 leading-tight">
                  {card.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                  {card.subtitle}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More Button (Only renders if filtered data is greater than 3) */}
      {filteredData.length > 3 && (
        <div className="text-center">
          <button
            onClick={toggleShowMore}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center justify-center mx-auto gap-1 transition-colors"
          >
            {isShowingAll ? "Show Less" : "Show More"}
            {isShowingAll ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      )}
    </>
  );
}
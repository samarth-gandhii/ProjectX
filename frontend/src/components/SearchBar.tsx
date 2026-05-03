import { useState, useRef, useEffect, forwardRef } from "react";
import { ArrowUp, ChevronDown, Bot, Sparkles, FileText, Video, HelpCircle, Box, X } from "lucide-react";

interface SearchBarProps {
  prompt: string;
  setPrompt: (val: string) => void;
  onGenerate: () => void;
  // NEW PROPS ADDED HERE:
  selectedModel: string;
  setSelectedModel: (val: string) => void;
  contentType: string;
  setContentType: (val: string) => void;
  architectModel?: string;
  setArchitectModel?: (val: string) => void;
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ prompt, setPrompt, onGenerate, selectedModel, setSelectedModel, contentType, setContentType, architectModel = "Gemini", setArchitectModel }, ref) => {
    // Dropdown states (UI only)
    const [isAutoOpen, setIsAutoOpen] = useState(false);
    const [isContextOpen, setIsContextOpen] = useState(false);
    const [isArchitectOpen, setIsArchitectOpen] = useState(false);

    // Refs for clicking outside
    const autoRef = useRef<HTMLDivElement>(null);
    const contextRef = useRef<HTMLDivElement>(null);
    const architectRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (autoRef.current && !autoRef.current.contains(event.target as Node)) {
          setIsAutoOpen(false);
        }
        if (contextRef.current && !contextRef.current.contains(event.target as Node)) {
          setIsContextOpen(false);
        }
        if (architectRef.current && !architectRef.current.contains(event.target as Node)) {
          setIsArchitectOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Listen for backspace to delete the context pill
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') onGenerate();
      if (e.key === 'Backspace' && prompt === '' && contentType) {
        setContentType(""); // Instantly deletes the whole @ tag
      }
    };

    const contextOptions = [
      { id: "Text", icon: FileText },
      { id: "Video", icon: Video },
      { id: "Quiz", icon: HelpCircle },
      { id: "3D_simulation", icon: Box },
    ];

    return (
      <div className="max-w-3xl mx-auto border border-gray-200 rounded-xl sm:rounded-2xl p-2 bg-white shadow-sm flex flex-col mb-8 sm:mb-16 relative">

        {/* Input Area */}
        <div className="flex items-center px-1 gap-1 sm:gap-2">
          {/* Dynamic Context Pill */}
          {contentType && (
            <div className="flex items-center bg-blue-100 text-blue-800 text-xs sm:text-sm font-semibold px-2 py-0.5 rounded-md ml-1 sm:ml-2 whitespace-nowrap gap-1">
              @{contentType.replace('_', ' ')}
              <button onClick={() => setContentType("")} className="hover:text-blue-900 bg-blue-200 rounded-full p-0.5 ml-1">
                <X size={10} />
              </button>
            </div>
          )}

          <input
            ref={ref}
            type="text"
            placeholder={contentType ? "Continue typing..." : "Learn anything / Generate 3D Scene..."}
            className="w-full p-2.5 sm:p-3 outline-none text-sm sm:text-base text-gray-800 placeholder-gray-400 bg-transparent flex-1 min-w-0"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center justify-between mt-2 px-2 pb-1 relative gap-2 flex-wrap">
          <div className="flex gap-2 flex-wrap">

            {/* Model Selector Dropdown */}
            <div className="relative" ref={autoRef}>
              <button
                onClick={() => setIsAutoOpen(!isAutoOpen)}
                className="text-xs text-gray-600 hover:bg-gray-100 px-2 py-1 rounded flex items-center gap-1 border border-gray-200 transition-colors bg-white font-medium whitespace-nowrap max-w-40"
              >
                {/* Fallback to ensure it is never empty */}
                <Sparkles size={12} className={selectedModel === "Gemini 2.5 Flash" ? "text-amber-500" : "text-gray-500"} />
                <span className="truncate">{selectedModel || "Gemini 2.5 Flash"}</span>
                <ChevronDown size={12} className="ml-1 text-gray-400" />
              </button>

              {isAutoOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-44 sm:w-48 bg-white border border-gray-200 shadow-lg rounded-xl p-1 z-50">
                  <button
                    onClick={() => { setSelectedModel("Auto"); setIsAutoOpen(false); }}
                    className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700"
                  >
                    <Sparkles size={14} className="text-blue-500" /> Auto
                  </button>
                  <button
                    onClick={() => { setSelectedModel("Falcon 7B"); setIsAutoOpen(false); }}
                    className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700"
                  >
                    <Bot size={14} className="text-gray-500" /> Falcon 7B
                  </button>
                  <button
                    onClick={() => { setSelectedModel("Gemini 2.5 Flash"); setIsAutoOpen(false); }}
                    className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700"
                  >
                    <Sparkles size={14} className="text-amber-500" /> Gemini 2.5 Flash
                  </button>
                </div>
              )}
            </div>

            {/* Context Selector Dropdown */}
            <div className="relative" ref={contextRef}>
              <button
                onClick={() => setIsContextOpen(!isContextOpen)}
                className="text-xs text-gray-600 hover:bg-gray-100 px-2 py-1 rounded flex items-center gap-1 border border-gray-200 transition-colors bg-white font-medium"
              >
                @ Add Context
              </button>

              {isContextOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-44 sm:w-48 bg-white border border-gray-200 shadow-lg rounded-xl p-1 z-50">
                  {contextOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => { setContentType(opt.id); setIsContextOpen(false); }}
                      className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700"
                    >
                      <opt.icon size={14} className="text-gray-500" /> {opt.id.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Start of architect */}
            {/* Architect Selector Dropdown */}

            <div className="relative" ref={architectRef}>
              <button
                onClick={() => setIsArchitectOpen(!isArchitectOpen)}
                className="text-xs text-purple-600 hover:bg-purple-50 px-2 py-1 rounded flex items-center gap-1 border border-purple-200 transition-colors bg-purple-50/50 font-medium whitespace-nowrap max-w-40"
              >
                <Sparkles size={12} className="text-purple-500" />
                <span className="truncate">Architect: {architectModel}</span>
                <ChevronDown size={12} className="ml-1 text-purple-400" />
              </button>

              {isArchitectOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-44 sm:w-48 bg-white border border-gray-200 shadow-lg rounded-xl p-1 z-50">
                  <button
                    onClick={() => { setArchitectModel?.("Gemini"); setIsArchitectOpen(false); }}
                    className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700"
                  >
                    <Sparkles size={14} className="text-amber-500" /> Gemini
                  </button>
                  <button
                    onClick={() => { setArchitectModel?.("Falcon"); setIsArchitectOpen(false); }}
                    className="w-full flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700"
                  >
                    <Bot size={14} className="text-gray-500" /> Falcon
                  </button>
                </div>
              )}
            </div>

            {/*end of architect */}

          </div>

          <button
            onClick={onGenerate}
            disabled={!prompt.trim()}
            className="bg-gray-400 hover:bg-gray-500 disabled:opacity-50 text-white p-2 rounded-full transition-colors shrink-0"
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    );
  }
);

SearchBar.displayName = "SearchBar";
export default SearchBar;
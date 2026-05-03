"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import ContentGrid from "@/components/ContentGrid";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userName] = useState("New User");

  const query = searchParams.get("q") ?? "";

  const [prompt, setPrompt] = useState(query);
  const [selectedModel, setSelectedModel] = useState("Gemini 2.5 Flash");
  const [contentType, setContentType] = useState("Text");
  const [architectModel, setArchitectModel] = useState("Gemini");

  useEffect(() => {
    setPrompt(query);
  }, [query]);

  const handleSearch = () => {
    if (!prompt.trim()) return;
    router.push(`/search?q=${encodeURIComponent(prompt.trim())}`);
  };

  return (
    <div className="flex min-h-screen bg-[#fafafa] text-gray-900 font-sans">
      <Sidebar
        userName={userName}
        onHomeClick={() => router.push("/")}
        onSearchClick={() => router.push("/search")}
        onChatClick={() => router.push("/chat")}
        onHistoryClick={() => router.push("/history")}
        onHistoryItemClick={(topicId) => router.push(`/topic/${topicId}`)}
      />

      <main className="flex-1 overflow-y-auto bg-white relative flex flex-col min-w-0 md:ml-64">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-14 sm:pt-16 md:pt-20 pb-10 md:pb-12 w-full">
          <div className="text-center mb-8 md:mb-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-900">Search Topics</h1>
            {query && (
              <p className="mt-2 text-sm text-gray-500">Showing results for &quot;{query}&quot;</p>
            )}
          </div>

          <SearchBar
            prompt={prompt}
            setPrompt={setPrompt}
            onGenerate={handleSearch}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            contentType={contentType}
            setContentType={setContentType}
            architectModel={architectModel}
            setArchitectModel={setArchitectModel}
          />

          <ContentGrid
            searchQuery={query}
            onCardClick={(topicId) => router.push(`/topic/${topicId}`)}
          />
        </div>
      </main>
    </div>
  );
}

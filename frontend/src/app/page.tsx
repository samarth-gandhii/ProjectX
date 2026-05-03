"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import ContentGrid from "@/components/ContentGrid";

export default function Home() {
  const router = useRouter();
  const [userName] = useState("New User");
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("Gemini 2.5 Flash");
  const [contentType, setContentType] = useState("Text");
  const [architectModel, setArchitectModel] = useState("Gemini");

  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    const params = new URLSearchParams({
      prompt,
      type: contentType || "Text",
      architect: architectModel,
    });
    router.push(`/chat?${params.toString()}`);
    setPrompt("");
  };

  const handleCardSelect = (topicId: string) => {
    router.push(`/topic/${topicId}`);
  };

  return (
    <div className="flex min-h-screen bg-[#fafafa] text-gray-900 font-sans">

      <Sidebar
        userName={userName}
        onSearchClick={() => {
          router.push("/search");
        }}
        onChatClick={() => router.push("/chat")}
        onHistoryClick={() => router.push("/history")}
        onHistoryItemClick={(topicId) => router.push(`/topic/${topicId}`)}
        onHomeClick={() => {
          router.push("/");
          setTimeout(() => searchInputRef.current?.focus(), 100);
        }}
      />

      <main className="flex-1 overflow-y-auto bg-white relative flex flex-col min-w-0 md:ml-64">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pt-14 sm:pt-16 md:pt-20 pb-10 md:pb-12 w-full">
          <div className="text-center mb-8 md:mb-10">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-900">Welcome to Bodh AI, ready to learn?</h1>
          </div>

          <SearchBar
            ref={searchInputRef}
            prompt={prompt}
            setPrompt={setPrompt}
            onGenerate={handleGenerate}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            contentType={contentType}
            setContentType={setContentType}
            architectModel={architectModel}
            setArchitectModel={setArchitectModel}
          />

          <ContentGrid onCardClick={handleCardSelect} />
        </div>

      </main>
    </div>
  );
}
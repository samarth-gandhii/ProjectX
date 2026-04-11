"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bot, X, Code, Loader2, Maximize, Minimize, HelpCircle } from "lucide-react";
import SearchBar from "./SearchBar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import QuizUI, { type QuizQuestion } from "./QuizUI";

interface CardsProps {
    topicId: string;
}

// 1. Define what a message looks like
interface Message {
    id: string;
    role: "user" | "ai";
    content: string;
    code?: string | null;
    quiz_data?: QuizQuestion[] | null;
}

interface CardResponse {
    text_explanation?: string;
    code?: string | null;
    quiz_data?: QuizQuestion[] | null;
}

interface GenerateResponse {
    text_explanation: string;
    media_type?: string;
    canvas_code?: string | null;
    quiz_data?: QuizQuestion[] | null;
}

type MarkdownRenderProps = React.HTMLAttributes<HTMLElement> & {
    children?: React.ReactNode;
    className?: string;
};

function createMessageId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function Cards({ topicId }: CardsProps) {
    const [prompt, setPrompt] = useState("");
    const [isCanvasOpen, setIsCanvasOpen] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [activePanelMode, setActivePanelMode] = useState<"3D" | "Quiz" | null>(null);
    const [activeQuizData, setActiveQuizData] = useState<QuizQuestion[] | null>(null);

    const [selectedModel, setSelectedModel] = useState("Gemini 2.5 Flash");
    const [contentType, setContentType] = useState("Text");

    const [isLoading, setIsLoading] = useState(false);

    const [messages, setMessages] = useState<Message[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const hasFetchedInitialCard = useRef(false);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    // Initial Fetch Logic based on Topic ID
    useEffect(() => {
        const fetchInitialCard = async () => {
            if (hasFetchedInitialCard.current) return;
            hasFetchedInitialCard.current = true;
            setIsLoading(true);

            try {
                const response = await fetch(`http://localhost:8000/api/cards/${topicId}`);
                if (!response.ok) throw new Error("Failed to fetch card");
                const data: CardResponse = await response.json();

                const aiMsg: Message = {
                    id: createMessageId(),
                    role: "ai",
                    content: data.text_explanation || "Card content could not be loaded.",
                    code: data.code || null,
                    quiz_data: data.quiz_data || null
                };

                setMessages([aiMsg]);

                if (data.code) {
                    setActivePanelMode("3D");
                    setIsCanvasOpen(true);
                } else if (data.quiz_data) {
                    setActiveQuizData(data.quiz_data);
                    setActivePanelMode("Quiz");
                    setIsCanvasOpen(true);
                }
            } catch (error) {
                console.error("Fetch Card Error:", error);
                const errorMsg: Message = {
                    id: createMessageId(),
                    role: "ai",
                    content: "Failed to connect to the Bodh AI backend to fetch the card. Is the FastAPI server running?"
                };
                setMessages([errorMsg]);
            } finally {
                setIsLoading(false);
            }
        };

        if (topicId) {
            fetchInitialCard();
        }
    }, [topicId]);

    const generateContent = async (userPrompt: string) => {
        if (!userPrompt.trim()) return;

        const userMsg: Message = { id: createMessageId(), role: "user", content: userPrompt };
        setMessages((prev) => [...prev, userMsg]);

        const historyPayload = [...messages, userMsg].map((m) => ({
            role: m.role === "ai" ? "assistant" : "user",
            content: m.content
        }));

        setIsLoading(true);
        setIsCanvasOpen(false);

        try {
            const response = await fetch("http://localhost:8000/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: userPrompt,
                    history: historyPayload,
                    model_choice: selectedModel,
                    context_type: contentType || "Text"
                }),
            });

            const data: GenerateResponse = await response.json();

            const aiMsg: Message = {
                id: createMessageId(),
                role: "ai",
                content: data.text_explanation,
                code: data.media_type === "3D_simulation" ? data.canvas_code : null,
                quiz_data: data.quiz_data || null
            };

            setMessages((prev) => [...prev, aiMsg]);

            if (data.media_type === "3D_simulation" && data.canvas_code) {
                setActivePanelMode("3D");
                setIsCanvasOpen(true);
            } else if (data.media_type === "Quiz" && data.quiz_data) {
                setActiveQuizData(data.quiz_data);
                setActivePanelMode("Quiz");
                setIsCanvasOpen(true);
            }

        } catch (error) {
            console.error("Engine Connection Error:", error);
            const errorMsg: Message = {
                id: createMessageId(),
                role: "ai",
                content: "Failed to connect to the Akriti backend. Is the FastAPI server running?"
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerate = () => {
        generateContent(prompt);
        setPrompt("");
    };

    const latestCanvasCode = messages.filter((m) => m.code).pop()?.code;
    const safeCanvasCode = latestCanvasCode ?? "";
    const encodedCanvasCode = encodeURIComponent(safeCanvasCode);
    const canvasSrcDoc = `<!DOCTYPE html><html><head><style>body { margin: 0; overflow: hidden; background-color: #000; }</style><script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script><script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script><script>window.OrbitControls = THREE.OrbitControls;</script></head><body><script>const __ENCODED_CODE__ = "${encodedCanvasCode}"; const __USER_CODE__ = decodeURIComponent(__ENCODED_CODE__); try { new Function(__USER_CODE__)(); } catch(e) { const errMsg = (e && e.message) ? e.message : String(e); const errorDiv = document.createElement('div'); errorDiv.style.color = 'red'; errorDiv.style.padding = '20px'; errorDiv.style.fontFamily = 'sans-serif'; errorDiv.textContent = 'Error running 3D code: ' + errMsg; document.body.innerHTML = ''; document.body.appendChild(errorDiv); }</script></body></html>`;

    return (
        <div className="flex absolute inset-0 w-full h-full bg-white overflow-hidden">

            {/* LEFT SIDE: Chat Interface - Updated for floating gradient UI */}
            <div className={`relative h-full transition-all duration-300 ease-in-out ${isCanvasOpen ? (isFullScreen ? 'hidden' : 'hidden md:block md:w-1/2 md:border-r md:border-gray-200') : 'w-full max-w-4xl mx-auto'}`}>

                <div className="absolute inset-0 overflow-y-auto p-4 sm:p-6 pb-44 sm:pb-48 space-y-6 sm:space-y-8 scroll-smooth">

                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                            {msg.role === 'user' ? (
                                <div className="bg-gray-100 text-gray-900 px-4 sm:px-5 py-3 rounded-3xl max-w-[88%] sm:max-w-[80%] shadow-sm">
                                    {msg.content}
                                </div>
                            ) : (
                                <div className="flex items-start gap-3 sm:gap-4 max-w-[100%] sm:max-w-[90%] w-full">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                                        <Bot size={18} className="text-blue-600" />
                                    </div>
                                    <div className="space-y-4 text-gray-800 leading-relaxed w-full">
                                        <div className="prose prose-blue max-w-none w-full">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    p({ children, ...props }: MarkdownRenderProps) {
                                                        return <p className="mb-5 leading-relaxed" {...props}>{children}</p>;
                                                    },
                                                    li({ children, ...props }: MarkdownRenderProps) {
                                                        return <li className="mb-2 ml-4 list-disc" {...props}>{children}</li>;
                                                    },
                                                    code({ className, children, ...props }: MarkdownRenderProps) {
                                                        const childText = String(children ?? "");
                                                        const isBlock = Boolean(className?.includes("language-")) || childText.includes("\n");

                                                        if (isBlock) {
                                                            return (
                                                                <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono">
                                                                    <code className={className} {...props}>{children}</code>
                                                                </pre>
                                                            );
                                                        }

                                                        return (
                                                            <code className="bg-gray-100 text-pink-600 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                                                                {children}
                                                            </code>
                                                        );
                                                    },
                                                }}
                                            >
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>

                                        {msg.code && (
                                            <div className="mt-8 mb-4 relative z-20">
                                                <p className="text-gray-500 italic mb-3 font-medium text-sm">
                                                    💡 You can get a better understanding with this interactive 3D simulation:
                                                </p>
                                                <div className="border border-gray-200 rounded-2xl p-4 flex items-center justify-between bg-[#fbfbfb] hover:bg-gray-50 transition-colors w-full max-w-md">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-white border border-gray-200 p-2 rounded-lg">
                                                            <Code size={18} className="text-gray-600" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-900">3D Simulation Generated</h4>
                                                            <p className="text-xs text-gray-500">Three.js Canvas Ready</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => { setActivePanelMode("3D"); setIsCanvasOpen(true); }} className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium px-4 py-1.5 rounded-full text-sm transition-colors cursor-pointer relative z-20">
                                                        Open
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {msg.quiz_data && msg.quiz_data.length > 0 && (
                                            <div className="mt-8 mb-4 relative z-20">
                                                <p className="text-purple-600/80 italic mb-3 font-medium text-sm">
                                                    🎯 We&apos;ve reached the end of this topic! Let&apos;s test what you learned:
                                                </p>
                                                <div className="border border-purple-200 rounded-2xl p-4 flex items-center justify-between bg-purple-50/50 hover:bg-purple-50 transition-colors w-full max-w-md">
                                                    <div className="flex items-center gap-3">
                                                        <div className="bg-white border border-purple-200 p-2 rounded-lg">
                                                            <HelpCircle size={18} className="text-purple-600" />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-900">Interactive Quiz Generated</h4>
                                                            <p className="text-xs text-purple-600 font-medium">Test your knowledge</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => { setActiveQuizData(msg.quiz_data!); setActivePanelMode("Quiz"); setIsCanvasOpen(true); }} className="bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium px-4 py-1.5 rounded-full text-sm transition-colors cursor-pointer relative z-20">
                                                        Open
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Loading Indicator */}
                    {isLoading && (
                        <div className="flex items-start gap-3 sm:gap-4 max-w-[100%] sm:max-w-[90%]">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                                <Bot size={18} className="text-blue-600" />
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 mt-2">
                                <Loader2 className="animate-spin" size={20} />
                                <span>Bodh AI Engine is fetching...</span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} className="h-4 shrink-0" />
                </div>

                {/* Floating Search Bar with Gradient */}
                <div className="absolute bottom-0 left-0 w-full pt-16 sm:pt-20 pb-4 sm:pb-6 px-3 sm:px-6 bg-gradient-to-t from-white via-white/90 to-transparent z-10 pointer-events-none">
                    <div className={`pointer-events-auto ${isCanvasOpen ? 'w-full' : 'max-w-3xl mx-auto'}`}>
                        <SearchBar
                            prompt={prompt}
                            setPrompt={setPrompt}
                            onGenerate={handleGenerate}
                            selectedModel={selectedModel}
                            setSelectedModel={setSelectedModel}
                            contentType={contentType}
                            setContentType={setContentType}
                        />
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE: Sliding Canvas Panel */}
            <div className={`bg-[#fbfbfb] h-full transition-all duration-300 ease-in-out flex flex-col ${isCanvasOpen ? (isFullScreen ? 'w-full translate-x-0' : 'w-full md:w-1/2 translate-x-0 md:border-l md:border-gray-200') : 'w-0 translate-x-full overflow-hidden'}`}>
                <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white shrink-0">
                    <span className="font-medium text-sm text-gray-800">
                        {activePanelMode === "Quiz" ? "Interactive Quiz" : "Bodh AI 3D Sandbox"}
                    </span>
                    <button onClick={() => { setIsCanvasOpen(false); setIsFullScreen(false); }} className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <div className="flex-1 p-2 sm:p-4">
                    <div className="w-full h-full bg-black rounded-xl border border-gray-200 overflow-hidden relative shadow-inner">
                        {activePanelMode === "Quiz" ? (
                            <QuizUI data={activeQuizData} />
                        ) : latestCanvasCode ? (
                            <>
                                <iframe
                                    title="3D Canvas"
                                    srcDoc={canvasSrcDoc}
                                    className="w-full h-full border-0"
                                    sandbox="allow-scripts"
                                />
                                <button
                                    onClick={() => setIsFullScreen(!isFullScreen)}
                                    className="absolute bottom-4 right-4 bg-gray-800/70 hover:bg-gray-700 text-white p-2 rounded-lg backdrop-blur-sm transition-all shadow-lg z-10"
                                    title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                                >
                                    {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
                                </button>
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <span className="text-gray-500 text-sm">No content active.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
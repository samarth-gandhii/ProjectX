import React, { useState, useEffect, useRef } from "react";
import { Bot, X, Code, Loader2 } from "lucide-react";
import SearchBar from "./SearchBar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SpaceProps {
    initialPrompt: string;
}

// 1. Define what a message looks like
interface Message {
    id: string;
    role: "user" | "ai";
    content: string;
    code?: string | null;
}

export default function Space({ initialPrompt }: SpaceProps) {
    const [prompt, setPrompt] = useState("");
    const [isCanvasOpen, setIsCanvasOpen] = useState(false);

    const [selectedModel, setSelectedModel] = useState("Gemini 2.5 Flash");
    const [contentType, setContentType] = useState("Text");

    const [isLoading, setIsLoading] = useState(false);

    // 2. State is now an array of messages, not just a single string!
    const [messages, setMessages] = useState<Message[]>([]);

    // Reference for auto-scrolling
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll whenever messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const generateContent = async (userPrompt: string) => {
        if (!userPrompt.trim()) return;

        // Add the user's message to the chat history
        const userMsg: Message = { id: Date.now().toString(), role: "user", content: userPrompt };
        setMessages((prev) => [...prev, userMsg]);

        setIsLoading(true);
        setIsCanvasOpen(false);

        try {
            const response = await fetch("http://localhost:8000/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: userPrompt,
                    model_choice: selectedModel,
                    context_type: contentType || "Text"
                }),
            });

            const data = await response.json();

            // Add the AI's response to the chat history
            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "ai",
                content: data.text_explanation,
                code: data.media_type === "3D_simulation" ? data.canvas_code : null
            };

            setMessages((prev) => [...prev, aiMsg]);

            // Auto-open canvas if code was generated
            if (data.media_type === "3D_simulation" && data.canvas_code) {
                setIsCanvasOpen(true);
            }

        } catch (error) {
            console.error("Engine Connection Error:", error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "ai",
                content: "Failed to connect to the Akriti backend. Is the FastAPI server running?"
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    // Run automatically when the Space mounts with the prompt from the Home screen
    useEffect(() => {
        if (initialPrompt && messages.length === 0) {
            generateContent(initialPrompt);
        }
    }, [initialPrompt]);

    const handleGenerate = () => {
        generateContent(prompt);
        setPrompt("");
    };

    return (
        <div className="flex h-full w-full bg-white relative overflow-hidden">

            {/* LEFT SIDE: Chat Interface */}
            <div className={`flex flex-col h-full transition-all duration-300 ease-in-out ${isCanvasOpen ? 'w-1/2 border-r border-gray-200' : 'w-full max-w-4xl mx-auto'}`}>

                {/* Scrollable Chat Area (Flex-1 allows it to take remaining space above search bar) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Map through all messages to create the continuous chat feed */}
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                            {msg.role === 'user' ? (
                                /* User Bubble */
                                <div className="bg-gray-100 text-gray-900 px-5 py-3 rounded-3xl max-w-[80%] shadow-sm">
                                    {msg.content}
                                </div>
                            ) : (
                                /* AI Bubble */
                                <div className="flex items-start gap-4 max-w-[90%] w-full">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                                        <Bot size={18} className="text-blue-600" />
                                    </div>
                                    <div className="space-y-4 text-gray-800 leading-relaxed w-full">
                                        <div className="prose prose-blue max-w-none w-full">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    code({ node, inline, className, children, ...props }: any) {
                                                        return !inline ? (
                                                            <div className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono">
                                                                <code {...props}>{children}</code>
                                                            </div>
                                                        ) : (
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

                                        {/* Show 3D button inside the specific message that generated it */}
                                        {msg.code && (
                                            <div className="border border-gray-200 rounded-2xl p-4 flex items-center justify-between bg-[#fbfbfb] hover:bg-gray-50 transition-colors w-full max-w-md mt-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-white border border-gray-200 p-2 rounded-lg">
                                                        <Code size={18} className="text-gray-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-gray-900">3D Simulation Generated</h4>
                                                        <p className="text-xs text-gray-500">Three.js Canvas Ready</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => setIsCanvasOpen(true)} className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium px-4 py-1.5 rounded-full text-sm transition-colors">
                                                    Open
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Loading Indicator */}
                    {isLoading && (
                        <div className="flex items-start gap-4 max-w-[90%]">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                                <Bot size={18} className="text-blue-600" />
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 mt-2">
                                <Loader2 className="animate-spin" size={20} />
                                <span>Akriti Engine is reasoning...</span>
                            </div>
                        </div>
                    )}

                    {/* Invisible div to anchor the auto-scroll */}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Bar pinned to bottom using flex shrink (NO absolute positioning!) */}
                <div className="shrink-0 p-6 bg-white border-t border-gray-100">
                    <div className={`${isCanvasOpen ? 'w-full' : 'max-w-3xl mx-auto'}`}>
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
            <div className={`bg-[#fbfbfb] h-full transition-all duration-300 ease-in-out flex flex-col border-l border-gray-200 ${isCanvasOpen ? 'w-1/2 translate-x-0' : 'w-0 translate-x-full overflow-hidden'}`}>
                <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white shrink-0">
                    <span className="font-medium text-sm text-gray-800">Akriti 3D Sandbox</span>
                    <button onClick={() => setIsCanvasOpen(false)} className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <div className="flex-1 p-4">
                    <div className="w-full h-full bg-black rounded-xl border border-gray-200 overflow-hidden relative shadow-inner">
                        {/* We use the code from the MOST RECENT message that has code */}
                        {messages.filter(m => m.code).pop()?.code ? (
                            <iframe
                                title="3D Canvas"
                                srcDoc={`<!DOCTYPE html><html><head><style>body { margin: 0; overflow: hidden; background-color: #000; }</style><script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script><script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script><script>window.OrbitControls = THREE.OrbitControls;</script></head><body><script>try { ${messages.filter(m => m.code).pop()?.code} } catch(e) { document.body.innerHTML = '<div style="color:red; padding:20px; font-family:sans-serif;">Error running 3D code: ' + e.message + '</div>'; }</script></body></html>`}
                                className="w-full h-full border-0"
                                sandbox="allow-scripts"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <span className="text-gray-500 text-sm">No simulation active.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
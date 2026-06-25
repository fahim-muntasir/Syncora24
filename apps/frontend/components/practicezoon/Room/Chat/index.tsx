"use client";
import React, { useState, useEffect, useRef } from "react";
import { Smile, Reply, Pencil, Trash2 } from "lucide-react";
import { Message } from '@/types/chat';
import ChatInputs from "./ChatInputs";

export default function Chat({messages, setMessages}: {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}) {
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ChatInputs owns the socket emit. This callback only does two things:
  // 1. Optimistically append the sender's own bubble immediately (no round-trip lag)
  // 2. Clear the active reply thread
  const handleSend = (payload: {
    text?: string;
    emojiOnly?: boolean;
    imageUrl?: string;
    gifUrl?: string;
  }) => {

    if (!payload.text?.trim() && !payload.imageUrl && !payload.gifUrl) return;

    const optimistic: Message = {
      id: `optimistic-${Date.now()}`,
      sender: "user",
      name: "You",
      ...payload,
      replyTo: replyTo
        ? {
          id: replyTo.id,
          name: replyTo.name,
          text: replyTo.text,
        }
        : undefined,
      reactions: [],
    };

    setMessages((prev) => [...prev, optimistic]);
    setReplyTo(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-101px)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-lg">
              💬
            </div>
            <p className="text-sm text-gray-500">No messages yet</p>
            <p className="text-xs text-gray-600">Say something to get the conversation started</p>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.sender === "user";

          const replySource = msg.replyTo;

          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex flex-col max-w-[75%] group ${isOwn ? "items-end" : "items-start"}`}
              >
                {/* Sender name */}
                <span className="text-[11px] text-gray-500 mb-1 px-1">
                  {isOwn ? "You" : msg.name}
                </span>

                {/* Bubble */}
                <div
                  className={`relative px-3.5 py-2.5 rounded-2xl text-sm break-words leading-relaxed
                    ${isOwn
                      ? "bg-emerald-500/20 text-white border border-emerald-500/20 rounded-br-sm"
                      : "bg-white/[0.07] text-white border border-white/[0.08] rounded-bl-sm"
                    }`}
                >
                  {/* Reply preview */}
                  {replySource && (
                    <div className="bg-white/[0.07] border-l-2 border-emerald-500/60 text-xs px-2.5 py-1.5 mb-2 rounded-lg">
                      <span className="font-semibold text-emerald-400">
                        {replySource.name}
                      </span>
                      <p className="text-gray-400 mt-0.5 truncate max-w-[200px]">
                        {replySource.text}
                      </p>
                    </div>
                  )}

                  {/* Text content */}
                  {msg.text && !msg.emojiOnly && (
                    <span>{msg.text}</span>
                  )}

                  {/* Emoji-only */}
                  {msg.emojiOnly && (
                    <span className="text-3xl leading-none">{msg.text}</span>
                  )}

                  {/* Image */}
                  {msg.imageUrl && (
                    <div className="mt-2">
                      <img
                        src={msg.imageUrl}
                        alt="uploaded"
                        className="w-44 h-44 object-cover rounded-xl border border-white/10"
                      />
                    </div>
                  )}

                  {/* GIF */}
                  {msg.gifUrl && (
                    <div className="mt-2">
                      <img
                        src={msg.gifUrl}
                        alt="gif"
                        className="w-44 h-44 object-cover rounded-xl border border-white/10"
                      />
                    </div>
                  )}

                  {/* Reactions */}
                  {msg.reactions.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {msg.reactions.map((reaction, index) => (
                        <button
                          key={index}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/[0.08] border border-white/[0.08] hover:bg-white/[0.12] transition-colors"
                        >
                          <span className="text-sm leading-none">{reaction.emoji}</span>
                          <span className="text-[11px] text-gray-300 font-medium">
                            {reaction.users.length}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hover action row */}
                <div
                  className={`flex gap-2 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                >
                  <button className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-gray-300 transition-colors">
                    <Smile size={12} strokeWidth={2} /> React
                  </button>
                  <button
                    className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-gray-300 transition-colors"
                    onClick={() => setReplyTo(msg)}
                  >
                    <Reply size={12} strokeWidth={2} /> Reply
                  </button>
                  {isOwn && (
                    <>
                      <button className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-gray-300 transition-colors">
                        <Pencil size={12} strokeWidth={2} /> Edit
                      </button>
                      <button
                        className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-red-400 transition-colors"
                        onClick={() => setMessages((prev) => prev.filter((m) => m.id !== msg.id))}
                      >
                        <Trash2 size={12} strokeWidth={2} /> Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Reply preview bar */}
      {replyTo && (
        <div className="mx-4 mb-1 flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-0.5 h-8 bg-emerald-500 rounded-full shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-emerald-400">{replyTo.name}</p>
              <p className="text-xs text-gray-500 truncate max-w-[200px]">{replyTo.text}</p>
            </div>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="text-gray-600 hover:text-gray-300 transition-colors text-xs ml-3 shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input */}
      <ChatInputs onSend={handleSend} replyTo={replyTo} />
    </div>
  );
}
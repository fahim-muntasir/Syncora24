"use client";
import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Reply, Trash2, X } from "lucide-react";
import { ChatItem, Message } from "@/types/chat";
import ChatInputs from "./ChatInputs";
import ActivityMessage from "./ActivityMessage";

const actionButton =
  "flex items-center gap-1 text-[11px] text-gray-500 transition-colors hover:text-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-500/60 motion-reduce:transition-none";

export default function Chat({
  messages,
  setMessages,
}: {
  messages: ChatItem[];
  setMessages: React.Dispatch<React.SetStateAction<ChatItem[]>>;
}) {
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (payload: {
    text?: string;
    emojiOnly?: boolean;
    imageUrl?: string;
    gifUrl?: string;
  }) => {
    if (!payload.text?.trim() && !payload.imageUrl && !payload.gifUrl) return;

    const optimisticMessage: Message = {
      id: `optimistic-${Date.now()}`,
      sender: "user",
      name: "You",
      ...payload,
      replyTo: replyTo
        ? { id: replyTo.id, name: replyTo.name, text: replyTo.text }
        : undefined,
      reactions: [],
    };

    setMessages((prev) => [
      ...prev,
      {
        type: "message",
        id: optimisticMessage.id,
        message: optimisticMessage,
        timestamp: Date.now(),
      },
    ]);

    setReplyTo(null);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <MessageCircle size={20} className="text-gray-600" />
            <p className="text-sm text-gray-400">No messages yet</p>
            <p className="text-xs text-gray-600">Say something to get the conversation started</p>
          </div>
        )}

        {messages.map((item) => {
          if (item.type === "activity") {
            return <ActivityMessage key={item.id} activity={item.activity} />;
          }

          const msg = item.message;
          const isOwn = msg.sender === "user";
          const replySource = msg.replyTo;

          return (
            <div key={item.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
              <div
                className={`group flex max-w-[80%] flex-col ${isOwn ? "items-end" : "items-start"}`}
              >
                <div className="mb-1 flex items-center gap-2 px-1">
                  <span className="text-[11px] text-gray-400">{isOwn ? "You" : msg.name}</span>
                  <time
                    dateTime={new Date(item.timestamp).toISOString()}
                    className="text-[10px] text-gray-600"
                  >
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </time>
                </div>

                <div
                  className={`break-words rounded-xl border px-3.5 py-2.5 text-sm leading-relaxed text-white ${
                    isOwn
                      ? "rounded-br-sm border-green-500/20 bg-green-500/[0.12]"
                      : "rounded-bl-sm border-white/[0.08] bg-white/[0.05]"
                  }`}
                >
                  {replySource && (
                    <div className="mb-2 rounded-md border-l-2 border-green-500/60 bg-white/[0.06] px-2.5 py-1.5 text-xs">
                      <span className="font-medium text-green-400">{replySource.name}</span>
                      <p className="mt-0.5 max-w-[200px] truncate text-gray-400">
                        {replySource.text}
                      </p>
                    </div>
                  )}

                  {msg.text && !msg.emojiOnly && <span>{msg.text}</span>}

                  {msg.emojiOnly && (
                    <span className="text-3xl leading-none">{msg.text}</span>
                  )}

                  {msg.imageUrl && (
                    <div className="mt-2">
                      <img
                        src={msg.imageUrl}
                        alt="uploaded"
                        className="h-44 w-44 rounded-lg border border-white/10 object-cover"
                      />
                    </div>
                  )}

                  {msg.gifUrl && (
                    <div className="mt-2">
                      <img
                        src={msg.gifUrl}
                        alt="gif"
                        className="h-44 w-44 rounded-lg border border-white/10 object-cover"
                      />
                    </div>
                  )}

                  {msg.reactions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.reactions.map((reaction, index) => (
                        <span
                          key={index}
                          className="flex items-center gap-1 rounded-md border border-white/[0.08] bg-white/[0.08] px-1.5 py-0.5"
                        >
                          <span className="text-sm leading-none">{reaction.emoji}</span>
                          <span className="text-[11px] font-medium text-gray-300">
                            {reaction.users.length}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  className={`mt-1 flex gap-3 px-1 opacity-100 transition-opacity duration-150 focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 motion-reduce:transition-none ${
                    isOwn ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <button type="button" className={actionButton} onClick={() => setReplyTo(msg)}>
                    <Reply size={12} strokeWidth={2} />
                    Reply
                  </button>

                  {isOwn && (
                    <button
                      type="button"
                      className={`${actionButton} hover:!text-red-400`}
                      onClick={() =>
                        setMessages((prev) => prev.filter((m) => m.id !== msg.id))
                      }
                    >
                      <Trash2 size={12} strokeWidth={2} />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {replyTo && (
        <div className="mx-3 mb-2 flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="h-8 w-0.5 shrink-0 rounded-full bg-green-500" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-green-400">{replyTo.name}</p>
              <p className="max-w-[200px] truncate text-xs text-gray-500">{replyTo.text}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setReplyTo(null)}
            aria-label="Cancel reply"
            className="ml-3 shrink-0 rounded-md p-1 text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-gray-200 motion-reduce:transition-none"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <ChatInputs onSend={handleSend} replyTo={replyTo} />
    </div>
  );
}
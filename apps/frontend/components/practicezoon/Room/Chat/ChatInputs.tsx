"use client";
import React, { useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Paperclip, Send } from "lucide-react";
import toast from "react-hot-toast";
import { roomSocketManager } from "@/libs/socket/index";

type SentPayload = {
  text?: string;
  emojiOnly?: boolean;
  imageUrl?: string;
  gifUrl?: string;
};

type ChatInputsProps = {
  onSend: (payload: SentPayload) => void;
  replyTo?: { id: number | string; name: string; text?: string } | null;
};

const isEmojiOnly = (str: string) =>
  /^(\p{Emoji_Presentation}|\p{Extended_Pictographic}|\s)+$/u.test(str.trim());

export default function ChatInputs({ onSend, replyTo }: ChatInputsProps) {
  const [msg, setMsg] = useState("");
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { id } = useParams();
  const roomId = Array.isArray(id) ? id[0] : (id ?? "");

  const sendPayload = async (
    payload: SentPayload,
    reply?: { id: number | string; name: string; text?: string } | null,
  ) => {
    if (!roomId || isSending) return;

    setIsSending(true);
    try {
      await roomSocketManager.emitWithAck("sendMessage", {
        roomId,
        message: {
          ...payload,
          ...(reply !== undefined
            ? {
              replyTo: reply
                ? { id: reply.id, name: reply.name, text: reply.text }
                : null,
            }
            : {}),
        },
      });
      onSend(payload);
      if (payload.text) setMsg("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to send the message.",
      );
    } finally {
      setIsSending(false);
    }
  };

  const submitHandler = () => {
    const trimmed = msg.trim();
    if (!trimmed) return;

    void sendPayload(
      {
        text: trimmed,
        emojiOnly: isEmojiOnly(trimmed),
      },
      replyTo,
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitHandler();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    const payload: SentPayload = { imageUrl: localUrl };

    void sendPayload(payload);
    e.target.value = "";
  };

  return (
    <div className="shrink-0 border-t border-white/[0.07] p-3">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={isSending}
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach image"
          title="Attach image"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] text-gray-400 transition-colors hover:border-white/[0.16] hover:bg-white/[0.04] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-green-500/60 motion-reduce:transition-none"
        >
          <Paperclip size={16} strokeWidth={1.75} />
        </button>

        <input
          type="text"
          value={msg}
          maxLength={2000}
          disabled={isSending}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={replyTo ? `Replying to ${replyTo.name}…` : "Send a message…"}
          aria-label="Message"
          className="h-10 min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-[#161616] px-3 text-sm text-white placeholder:text-gray-600 transition-colors hover:border-white/[0.14] focus:border-green-500/60 focus:outline-none motion-reduce:transition-none"
        />

        <button
          type="button"
          onClick={submitHandler}
          disabled={!msg.trim() || isSending}
          aria-label="Send message"
          title="Send"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500 text-white transition-colors enabled:hover:bg-green-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500/60 disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none"
        >
          <Send size={15} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
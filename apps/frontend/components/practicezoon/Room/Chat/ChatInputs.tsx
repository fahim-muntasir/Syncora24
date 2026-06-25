'use client';
import React, { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Sticker, Film, Send, Book, Smile, Paperclip } from 'lucide-react';
import { socketManager } from '@/libs/socket/index';
import { useAppSelector } from '@/libs/hooks';

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
  const [msg, setMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { id } = useParams();
  const roomId = Array.isArray(id) ? id[0] : (id ?? '');
  const currentUser = useAppSelector((state) => state.auth.user);

  const submitHandler = () => {
    const trimmed = msg.trim();
    if (!trimmed || !roomId) return;

    const payload: SentPayload = {
      text: trimmed,
      emojiOnly: isEmojiOnly(trimmed),
    };

    socketManager.emit('sendMessage', {
      roomId,
      message: {
        ...payload,
        senderName: currentUser?.fullName ?? 'Anonymous',
        replyTo: replyTo
          ? {
            id: replyTo.id,
            name: replyTo.name,
            text: replyTo.text,
          }
          : null,
      },
    });

    // Notify Chat so it can optimistically render the bubble
    onSend(payload);
    setMsg('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitHandler();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    const payload: SentPayload = { imageUrl: localUrl };

    socketManager.emit('sendMessage', {
      roomId,
      message: {
        ...payload,
        senderName: currentUser?.fullName ?? 'Anonymous',
      },
    });

    onSend(payload);
    e.target.value = '';
  };

  return (
    <div className="shrink-0 px-3 py-3 border-t border-white/[0.07] flex flex-col justify-center">

      <div className="flex items-center gap-2">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Input row */}
        <div className="relative flex-1">
          <input
            type="text"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={replyTo ? `Replying to ${replyTo.name}…` : 'Send a message…'}
            className="w-full pl-3 pr-28 py-2.5 bg-white/[0.05] border border-white/[0.09] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.07] transition-all"
          />

          {/* Right-side icon cluster */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {!msg ? (
              <>
                <button
                  type="button"
                  className="p-1.5 hover:bg-white/[0.08] rounded-lg transition-colors text-gray-500 hover:text-gray-300"
                  title="Emoji"
                >
                  <Smile size={16} strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  className="p-1.5 hover:bg-white/[0.08] rounded-lg transition-colors text-gray-500 hover:text-gray-300"
                  title="Sticker"
                >
                  <Sticker size={16} strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  className="p-1.5 hover:bg-white/[0.08] rounded-lg transition-colors text-gray-500 hover:text-gray-300"
                  title="GIF"
                >
                  <Film size={16} strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 hover:bg-white/[0.08] rounded-lg transition-colors text-gray-500 hover:text-gray-300"
                  title="Image"
                >
                  <Paperclip size={16} strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  className="p-1.5 hover:bg-white/[0.08] rounded-lg transition-colors text-gray-500 hover:text-gray-300"
                  title="Create"
                >
                  <Book size={16} strokeWidth={1.75} />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={submitHandler}
                className="w-7 h-7 flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-all active:scale-95"
                title="Send"
              >
                <Send size={14} strokeWidth={2} className="text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
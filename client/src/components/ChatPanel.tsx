import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { useSocket } from '../hooks/useSocket';
import { soundManager } from '../utils/sounds';
import { TokenIcon, MessageSquare, Send, X } from './Icons';
import type { ChatMessage } from '../types';

const QUICK_CHAT = ['Good game!', 'Deal?', 'No deal', 'Nice roll!', 'Watch out!', 'Well played!'];

export default function ChatPanel() {
  const {
    showChat,
    setShowChat,
    roomCode,
    playerId,
    chatMessages,
    addChatMessage,
  } = useGameStore();
  const { socket, emit } = useSocket();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Listen to incoming messages
  useEffect(() => {
    const handleChatMessage = (msg: ChatMessage) => {
      addChatMessage(msg);
      if (msg.playerId !== playerId) {
        soundManager.chat();
      }
    };

    socket.on('chat-message', handleChatMessage);
    return () => {
      socket.off('chat-message', handleChatMessage);
    };
  }, [socket, addChatMessage, playerId]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (showChat) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, showChat]);

  const handleSend = (text?: string, type: 'chat' | 'reaction' = 'chat') => {
    const msg = (text || inputText).trim();
    if (!msg) return;

    emit('send-chat', {
      roomCode,
      playerId,
      message: msg,
      type,
    }).catch(console.error);

    if (!text) setInputText('');
  };

  if (!showChat) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-xs flex justify-end"
        onClick={() => setShowChat(false)}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm h-full bg-emerald-950/95 border-l border-gold-600/30 flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-gold-600/20 flex items-center justify-between bg-emerald-900/40">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gold-400" />
              <div>
                <h3 className="font-display font-bold gold-text text-sm">Table Chat</h3>
                <p className="text-[11px] text-emerald-400/70">Room: {roomCode}</p>
              </div>
            </div>
            <button
              onClick={() => setShowChat(false)}
              className="w-7 h-7 rounded-full bg-emerald-900/60 text-emerald-300 hover:text-white flex items-center justify-center border border-gold-600/20"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Chat Pills */}
          <div className="px-3 py-2 bg-emerald-900/20 border-b border-emerald-800/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_CHAT.map((phrase) => (
              <button
                key={phrase}
                onClick={() => handleSend(phrase, 'chat')}
                className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-900/60 hover:bg-gold-500/20 border border-emerald-700/50 hover:border-gold-400 text-emerald-200 hover:text-gold-200 transition-colors shrink-0"
              >
                {phrase}
              </button>
            ))}
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-emerald-400/50 text-xs">
                <MessageSquare className="w-8 h-8 mb-2 opacity-50 text-gold-400" />
                <p>No messages yet</p>
                <p className="text-[10px] mt-0.5">Start communicating with players</p>
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isMe = msg.playerId === playerId;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <TokenIcon avatarId={msg.playerAvatar} size={12} className="text-emerald-400" />
                      <span className="text-[10px] font-semibold text-emerald-300">
                        {isMe ? 'You' : msg.playerName}
                      </span>
                      <span className="text-[9px] text-emerald-500/60">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-1.5 text-xs break-words ${
                        isMe
                          ? 'bg-gold-500/20 text-gold-100 border border-gold-500/40'
                          : 'bg-emerald-900/60 text-emerald-100 border border-emerald-700/40'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 border-t border-gold-600/20 bg-emerald-900/40 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type message..."
              maxLength={200}
              className="flex-1 bg-emerald-950/80 border border-gold-600/30 rounded-xl px-3 py-2 text-xs text-white placeholder-emerald-500/60 focus:outline-none focus:border-gold-500"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="btn-primary p-2 rounded-xl disabled:opacity-40 flex items-center justify-center"
              title="Send"
            >
              <Send className="w-3.5 h-3.5 text-emerald-950" />
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

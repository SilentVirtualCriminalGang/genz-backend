import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { motion } from "framer-motion";

// Backend URL
const socket = io("https://jsh-53qu.onrender.com");


export default function App() {
  const [status, setStatus] = useState("🔴 Not Connected");
  const [connected, setConnected] = useState(false);
  const [partnerFound, setPartnerFound] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef(null);
  const messageLock = useRef(false); // prevent double send

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      setConnected(true);
      setStatus("🟢 Connected to GENZ Server");
    });

    socket.on("disconnect", () => {
      setConnected(false);
      setPartnerFound(false);
      setStatus("🔴 Disconnected");
    });

    socket.on("waiting", (msg) => setStatus(msg));
    socket.on("partner-found", () => {
      setPartnerFound(true);
      setStatus("💬 Partner found! Start chatting...");
    });

    socket.on("partner-disconnected", () => {
      setPartnerFound(false);
      setStatus("❌ Partner disconnected. Find another!");
    });

    socket.on("message", (msg) => {
      setMessages((prev) => [...prev, { sender: "partner", text: msg }]);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("waiting");
      socket.off("partner-found");
      socket.off("partner-disconnected");
      socket.off("message");
    };
  }, []);

  const handleFindPartner = () => {
    setMessages([]);
    socket.emit("find-partner");
    setStatus("⏳ Finding a partner...");
  };

  const sendMessage = () => {
    if (!input.trim() || messageLock.current) return;
    messageLock.current = true;
    socket.emit("message", input);
    setMessages((prev) => [...prev, { sender: "you", text: input }]);
    setInput("");
    setTimeout(() => (messageLock.current = false), 200); // debounce
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#1f005c] via-[#5b0060] to-[#870160] p-3 font-sans text-white">
      {/* Logo */}
      <motion.h1
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-6xl font-extrabold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 drop-shadow-lg"
      >
        GENZ Chat 💫
      </motion.h1>

      {/* Status Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-3 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full text-sm shadow-inner border border-white/20"
      >
        {status}
      </motion.div>

      {/* Chat Box */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-lg mt-6 flex flex-col backdrop-blur-2xl bg-white/10 rounded-3xl shadow-[0_0_40px_rgba(255,255,255,0.2)] border border-white/20 overflow-hidden h-[75vh]"
      >
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3 scrollbar-thin scrollbar-thumb-pink-500 scrollbar-track-transparent">
          {messages.length === 0 && (
            <div className="text-center text-white/60 text-sm mt-20">
              {partnerFound
                ? "Start chatting with your partner 💬"
                : "Press 'Find Partner' to begin ⚡"}
            </div>
          )}
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                msg.sender === "you"
                  ? "ml-auto bg-gradient-to-r from-purple-600 to-pink-600 text-right shadow-lg"
                  : "mr-auto bg-white/20 text-left backdrop-blur-sm border border-white/20"
              }`}
            >
              <p>{msg.text}</p>
              <span className="block text-[10px] mt-1 opacity-70">
                {msg.sender === "you" ? "You" : "Partner"}
              </span>
            </motion.div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 flex items-center gap-2 bg-white/10">
          {partnerFound ? (
            <>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 bg-white/20 rounded-full px-4 py-2 text-sm text-white placeholder-white/60 focus:outline-none"
              />
              <button
                onClick={sendMessage}
                className="bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-2 rounded-full font-semibold text-white hover:scale-105 active:scale-95 transition"
              >
                Send
              </button>
            </>
          ) : (
            <button
              onClick={handleFindPartner}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 py-3 rounded-full font-semibold hover:scale-105 active:scale-95 transition"
            >
              🔍 Find Partner
            </button>
          )}
        </div>
      </motion.div>

      {/* Footer */}
      <p className="mt-4 text-xs text-white/60">
        © 2025 GENZ Random Chat • Built with 💜 by KAzi
      </p>
    </div>
  );
}

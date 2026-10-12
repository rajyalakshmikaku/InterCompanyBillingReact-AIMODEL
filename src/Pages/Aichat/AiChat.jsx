import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "./AiChat.css";
import { logout } from "../../redux/LoginSlice";
import { sendChatMessage } from "../../services/AiChatApi";



const SUGGESTIONS = [
  "Help me understand this project",
  "Help me with an idea",
  "Help me with a technical task",
  "Summarize a topic for me",
];

export default function AiChat() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const listRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  const startNewChat = () => {
    setMessages([]);
    setInput("");
    setLoading(false);
  };

  const sendMessage = async (override) => {
    const text = (typeof override === "string" ? override : input).trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { id: Date.now(), role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const data = await sendChatMessage(text);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: data.response?.replace(/^Python received:\s*/i, ""),
        },
      ]);
    } catch (error) {
      console.error("AI API Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text:
            error.message || "Unable to connect to AIMODEL. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/", { replace: true });
  };

  const displayName = user?.name || user?.userName || "Guest";

  return (
    <div className={`ai-app ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
      <aside className="ai-sidebar">
        <div className="sidebar-top">
          <button
            type="button"
            className="icon-button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ☰
          </button>
        </div>

        <button type="button" className="new-chat-btn" onClick={startNewChat}>
          <span className="plus">+</span>
          New chat
        </button>

        <div className="sidebar-history">
          <div className="history-label">Today</div>
          <div className="history-item active">
            {messages.find((m) => m.role === "user")?.text || "New chat"}
          </div>
        </div>

        
      </aside>

      <main className="ai-main">
        <header className="top-header">
          <div className="header-left">
            {!sidebarOpen && (
              <button
                type="button"
                className="icon-button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                ☰
              </button>
            )}
            <span className="model-name">AIMODEL</span>
          </div>

         
        </header>

        <div className="messages-container" ref={listRef}>
          {messages.length === 0 ? (
            <div className="welcome-section">
              <h2>How can I help you today?</h2>
              <div className="suggestion-row">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => sendMessage(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="thread">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message-wrapper ${message.role}`}
                >
                  {message.role === "assistant" && (
                    <div className="message-avatar">AI</div>
                  )}
                  <div className="message-text">{message.text}</div>
                </div>
              ))}

              {loading && (
                <div className="message-wrapper assistant">
                  <div className="message-avatar">AI</div>
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="composer-area">
          <div className="composer-box">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message AIMODEL"
            />
            <button
              type="button"
              className="send-button"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              ↑
            </button>
          </div>
          <div className="composer-note">
            AIMODEL can make mistakes. Check important information.
          </div>
        </div>
      </main>
    </div>
  );
}

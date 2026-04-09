import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import BackButton from "../components/BackButton";
import "./CommunityChat.css";
import { API_BASE_URL } from "../config/api";

const socket = io(API_BASE_URL);
const API_BASE = API_BASE_URL;

function CommunityChat({ communityName }) {
  const { community: urlCommunity } = useParams();
  const community = communityName || urlCommunity;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [currentUser] = useState(() => ({
    id: localStorage.getItem("familyId"),
    name: localStorage.getItem("userName")
  }));

  const bottomRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_BASE}/messages/${community}`
      );
      const data = await res.json();
      setMessages(data);
    } catch (_err) {
      console.log("Fetch error");
    }
  }, [community]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      if (data.community === community) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
      }
    });

    return () => socket.off("receiveMessage");
  }, [community]);

  //  Send message
  const sendMessage = () => {
    if (!message.trim()) return;

    const data = {
      id: Date.now() + Math.random(),
      text: message,
      user: {
        id: currentUser.id,
        name: currentUser.name
      },
      community: community,
      time: Date.now(),
    };

    socket.emit("sendMessage", data);
    setMessage("");
  };

  const handleClearChat = async () => {
    if (!window.confirm(`Are you sure you want to clear all messages in the ${community} chat? This cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/messages/${community}`, { method: "DELETE" });
      if (res.ok) {
        setMessages([]);
      }
    } catch (_err) {
      console.error("Error clearing chat");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else if (e.key === "Enter") {
      e.preventDefault();
      setMessage(message + "\n");
    }
  };

  const handleTextChange = (e) => {
    const textarea = e.target;
    setMessage(textarea.value);
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + "px";
  };

  //  Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-container">

      {/* HEADER */}
      <div className="chat-header">
        <BackButton />
        <h3>{community}</h3>
        {(currentUser.id === "ADMIN" || currentUser.id === "ADMIN01" || 
          (currentUser.id === "HEAD_ALTAR" && community === "Altar Servers") || 
          (currentUser.id === "HEAD_LECTORS" && community === "Lectors Ministry")) && (
          <button onClick={handleClearChat} className="clear-chat-btn" style={{ background: '#f44336', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
            Clear History
          </button>
        )}
      </div>

      {/* MESSAGES */}
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={`chat-bubble ${
              msg.user?.id === currentUser.id ? "my-msg" : ""
            }`}
          >
            <div style={{ fontSize: "12px", color: "gray" }}>
              {new Date(msg.time).toLocaleTimeString()}
            </div>

            <strong>
              {msg.user?.id === currentUser.id ? "You" : msg.user?.name}
            </strong>

            <p>{msg.text}</p>
          </div>
        ))}

        <div ref={bottomRef}></div>
      </div>

      {/* INPUT */}
      <div className="chat-input">
        <textarea
          placeholder="Type message... (Shift+Enter to send, Enter for new line)"
          value={message}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          style={{ resize: "none", overflow: "hidden", maxHeight: "150px", minHeight: "40px" }}
        />
        <button onClick={sendMessage}>Send</button>
      </div>

    </div>
  );
}

export default CommunityChat;
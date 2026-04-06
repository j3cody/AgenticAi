import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Planner from "./Planner";
import History from "./History";
import axios from "axios";

function Chat() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [tab, setTab] = useState("chat"); // chat | planner | history
  const navigate = useNavigate();
  const bottomRef = useRef(null);

  const user = localStorage.getItem("user");

  useEffect(() => {
    if (!user) navigate("/");
  }, [navigate, user]);

  // Load history
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("history")) || [];
    setChat(saved);
  }, []);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMsg = { sender: "user", text: message };
    const updatedChat = [...chat, userMsg];
    setChat(updatedChat);

    try {
      const res = await axios.post("http://localhost:5000/chat", {
        message,
      });

      const botMsg = {
        sender: "bot",
        text: res.data.reply,
        mood: res.data.mood,
        plan: res.data.plan,
      };

      const finalChat = [...updatedChat, botMsg];
      setChat(finalChat);

      // save history
      localStorage.setItem("history", JSON.stringify(finalChat));
      localStorage.setItem("plan", JSON.stringify(res.data.plan));

    } catch (err) {
      console.log(err);
    }

    setMessage("");
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  return (
    <div className="h-screen flex flex-col bg-gray-100">

      {/* Header */}
      <div className="bg-white shadow px-6 py-3 flex justify-between items-center">
        <h1 className="font-semibold">Health Assistant</h1>

        <div className="flex gap-4">
          <button onClick={() => setTab("chat")} className="text-blue-600">
            Chat
          </button>
          <button onClick={() => setTab("planner")}>
            Planner
          </button>
          <button onClick={() => setTab("history")}>
            History
          </button>
        </div>

        <button
          onClick={() => {
            localStorage.clear();
            navigate("/");
          }}
          className="text-red-500 text-sm"
        >
          Logout
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full">

        {/* CHAT TAB */}
        {tab === "chat" && (
          <>
            {chat.map((msg, index) => (
              <div key={index} className="mb-3">
                {msg.sender === "user" ? (
                  <div className="text-right">
                    <span className="bg-blue-600 text-white px-3 py-2 rounded">
                      {msg.text}
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="bg-white p-3 rounded shadow-sm inline-block">
                      {msg.text}
                    </div>

                    {msg.mood && (
                      <div className="text-sm text-gray-600 mt-1">
                        Mood: {msg.mood}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef}></div>
          </>
        )}

        {/* PLANNER TAB */}
        {tab === "planner" && (
          <Planner />
        )}

        {/* HISTORY TAB */}
        {tab === "history" && (
          <History />
        )}

      </div>

      {/* INPUT */}
      {tab === "chat" && (
        <div className="bg-white border-t p-3 flex gap-2">
          <input
            className="flex-1 border rounded px-3 py-2"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 text-white px-4 rounded"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}

export default Chat;
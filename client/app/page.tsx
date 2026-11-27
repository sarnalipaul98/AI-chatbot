
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";

type Message = {
  _id?: string;
  conversationId?: string;
  role: "user" | "assistant";
  content: string;
  rating?: number | null;
};

type Conversation = {
  _id: string;
  title: string;
  category: "casual" | "professional" | "creative" | "educational" | "coding";
  updatedAt?: string;
};

export default function Home() {
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [creatingConversation, setCreatingConversation] = useState(true);
 const [selectedCategory, setSelectedCategory] = useState<
  "casual" | "professional" | "creative" | "educational" | "coding"
>("casual");
  // Profile and settings
const [profileOpen, setProfileOpen] = useState(false);
const [activePanel, setActivePanel] = useState("");
const [userName, setUserName] = useState("");
const [userEmail, setUserEmail] = useState("");
const [profileMessage, setProfileMessage] = useState("");
const [savingProfile, setSavingProfile] = useState(false);
const [theme, setTheme] = useState<"light" | "dark">("light");
const [chatbotName, setChatbotName] = useState("AI Assistant");
const [chatbotNameMessage, setChatbotNameMessage] = useState("");
const [savingChatbotName, setSavingChatbotName] = useState(false);
  const started = useRef(false);
  // Socket.io connection reference
const socketRef = useRef<Socket | null>(null);

const activeConversationIdRef = useRef("");

const addMessage = (incomingMessage: Message) => {
  setMessages((previous) => {
    // Prevent duplicate messages
    if (
      incomingMessage._id &&
      previous.some((msg) => msg._id === incomingMessage._id)
    ) {
      return previous;
    }

    // Replace the temporary user message with the saved message
    const optimisticIndex = previous.findIndex(
      (msg) =>
        !msg._id &&
        msg.role === incomingMessage.role &&
        msg.content === incomingMessage.content
    );

    if (optimisticIndex !== -1) {
      const updated = [...previous];
      updated[optimisticIndex] = incomingMessage;
      return updated;
    }

    return [...previous, incomingMessage];
  });
};

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  // Connect frontend to Socket.io backend
useEffect(() => {
 const token = localStorage.getItem("chatbot_token");

if (!token) return;

const socket = io(API_URL, {
  auth: {
    token: token
  }
});

  socketRef.current = socket;
  socket.on("new_message", (incomingMessage: Message) => {
  if (
    incomingMessage.conversationId === activeConversationIdRef.current
  ) {
    addMessage(incomingMessage);
  }
});

  socket.on("connect", () => {
    console.log("Socket.io connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("Socket.io disconnected");
  });

  return () => {
    socket.disconnect();
    socketRef.current = null;
  };
}, []);

  // Apply selected theme to the entire page
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);


  // Verify login token
  const verifyToken = async (token: string) => {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      localStorage.removeItem("chatbot_token");
      router.replace("/login");
      return false;
    }

    return true;
  };

  //
  // Fetch logged-in user's profile
  const fetchUserProfile = async (token: string) => {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Could not load profile");
    }

    setUserName(data.user.name);
    setChatbotName(data.user.chatbotName || "AI Assistant");
    setUserEmail(data.user.email);
    setTheme(data.user.theme || "light");
  };

  // Save updated profile name
  const saveProfile = async () => {
    const token = localStorage.getItem("chatbot_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!userName.trim()) {
      setProfileMessage("Name cannot be empty.");
      return;
    }

    try {
      setSavingProfile(true);
      setProfileMessage("");

      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: userName.trim()
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not update profile");
      }

      setUserName(data.user.name);
      setProfileMessage("Profile updated successfully!");

    } catch (err) {
      setProfileMessage(
        err instanceof Error ? err.message : "Profile update failed"
      );
    } finally {
      setSavingProfile(false);
    }
  };



  // Change account password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const changePassword = async () => {
    const token = localStorage.getItem("chatbot_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!currentPassword || !newPassword) {
      setPasswordMessage("Please enter both passwords.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage("New password must contain at least 6 characters.");
      return;
    }

    try {
      setChangingPassword(true);
      setPasswordMessage("");

      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not change password");
      }

      setCurrentPassword("");
      setNewPassword("");
      setPasswordMessage("Password changed successfully!");

    } catch (err) {
      setPasswordMessage(
        err instanceof Error ? err.message : "Password change failed"
      );
    } finally {
      setChangingPassword(false);
    }
  };


  // Update and save theme preference
  const updateTheme = async (selectedTheme: "light" | "dark") => {
    const token = localStorage.getItem("chatbot_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/theme`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ theme: selectedTheme })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not update theme");
      }

      setTheme(selectedTheme);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update theme"
      );
    }
  };

const saveChatbotName = async () => {
  const token = localStorage.getItem("chatbot_token");

  if (!token) {
    router.replace("/login");
    return;
  }

  if (!chatbotName.trim() || chatbotName.trim().length > 30) {
    setChatbotNameMessage("Name must be between 1 and 30 characters.");
    return;
  }

  try {
    setSavingChatbotName(true);
    setChatbotNameMessage("");

    const response = await fetch(`${API_URL}/api/auth/chatbot-name`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        chatbotName: chatbotName.trim()
      })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Could not update chatbot name");
    }

    setChatbotName(data.chatbotName);
    setChatbotNameMessage("Chatbot name updated successfully!");

  } catch (err) {
    setChatbotNameMessage(
      err instanceof Error ? err.message : "Update failed"
    );
  } finally {
    setSavingChatbotName(false);
  }
};


  // Fetch past conversations
  const fetchPastConversations = async () => {
    const token = localStorage.getItem("chatbot_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not fetch conversations");
      }

      setConversations(data.conversations || []);

    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load chat history"
      );
    }
  };

  // Open an existing conversation
  const openConversation = async (id: string) => {
    const token = localStorage.getItem("chatbot_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setError("");
      setLoading(true);

      const response = await fetch(`${API_URL}/api/conversations/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not open conversation");
      }

      setConversationId(data.conversation._id);
      setSelectedCategory(data.conversation.category || "casual");
      activeConversationIdRef.current = data.conversation._id;
      setMessages(data.messages || []);
      // Join this conversation's Socket.io room
socketRef.current?.emit(
  "join_conversation",
  data.conversation._id
);

    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not open conversation"
      );
    } finally {
      setLoading(false);
    }
  };

  // Create a new conversation
  const createNewConversation = async () => {
    const token = localStorage.getItem("chatbot_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setError("");
      setCreatingConversation(true);
      setMessages([]);
      setConversationId("");

      const response = await fetch(`${API_URL}/api/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
  title: "New Chat",
  category: selectedCategory
}),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not create conversation");
      }

      setConversationId(data.conversation._id);

      activeConversationIdRef.current = data.conversation._id;

socketRef.current?.emit(
  "join_conversation",
  data.conversation._id
);
      await fetchPastConversations();

    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create conversation"
      );
    } finally {
      setCreatingConversation(false);
    }
  };

  // Check login and initialize chat
  useEffect(() => {
    if (started.current) return;

    started.current = true;

    const initializeChat = async () => {

      const token = localStorage.getItem("chatbot_token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        // Verify token before loading dashboard
        const isValid = await verifyToken(token);

        if (!isValid) return;
        await fetchUserProfile(token);

        // Fetch conversations
        const response = await fetch(`${API_URL}/api/conversations`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Could not fetch conversations");
        }

        const savedConversations = data.conversations || [];

        setConversations(savedConversations);

        if (savedConversations.length > 0) {
          await openConversation(savedConversations[0]._id);
        } else {
          await createNewConversation();
        }

      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
      } finally {
        setCreatingConversation(false);
      }
    };

    initializeChat();
  }, [router]);

  // Send message to AI
  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!message.trim() || loading) return;

    if (!conversationId) {
      setError("Please wait while your conversation is being created.");
      return;
    }

    const token = localStorage.getItem("chatbot_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    const userMessage = message.trim();

    setMessage("");
    setError("");
    setLoading(true);

    setMessages((previous) => [
      ...previous,
      { role: "user", content: userMessage }
    ]);

    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 30000);

    try {
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          conversationId,
          content: userMessage
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to get AI response");
      }

      addMessage(data.assistantMessage);

    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("Request timed out. Please try again.");
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
        );
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };



  // Rate an AI response
  const rateMessage = async (messageId: string, rating: number) => {
    const token = localStorage.getItem("chatbot_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/messages/${messageId}/rating`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ rating })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not save rating");
      }

      setMessages((previous) =>
        previous.map((msg) =>
          msg._id === messageId
            ? { ...msg, rating: data.rating }
            : msg
        )
      );

    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save rating"
      );
    }
  };

  // Delete a conversation
  const deleteConversation = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this conversation?"
    );

    if (!confirmed) return;

    const token = localStorage.getItem("chatbot_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/api/conversations/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Could not delete conversation");
      }

      const remaining = conversations.filter(
        (conversation) => conversation._id !== id
      );

      setConversations(remaining);

      if (conversationId === id) {
        setMessages([]);
        setConversationId("");

        if (remaining.length > 0) {
          await openConversation(remaining[0]._id);
        } else {
          await createNewConversation();
        }
      }

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not delete conversation"
      );
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("chatbot_token");
    router.replace("/login");
  };

  return (
   <main className={`flex min-h-screen ${
  theme === "dark"
    ? "bg-gray-950 text-white"
    : "bg-gray-100 text-gray-900"
}`}>

      {/* Sidebar */}
      <aside className={`hidden w-64 flex-col p-5 text-white md:flex ${
  theme === "dark" ? "bg-black" : "bg-gray-900"
}`}>

        <h1 className="mb-8 text-2xl font-bold">
          AI Chatbot
        </h1>

        <button
          onClick={createNewConversation}
          disabled={creatingConversation}
          className="rounded-lg bg-gray-700 px-4 py-3 text-left hover:bg-gray-600 disabled:opacity-50"
        >
          + New Chat
        </button>

        <h3 className="mb-3 mt-8 text-sm font-semibold text-gray-400">
          CHAT HISTORY
        </h3>

        <div className="flex flex-col gap-2 overflow-y-auto">

          {conversations.length === 0 && (
            <p className="text-sm text-gray-400">
              No conversations yet.
            </p>
          )}

          {conversations.map((conversation) => (
            <div
              key={conversation._id}
              className="flex items-center gap-1"
            >
              <button
                onClick={() => openConversation(conversation._id)}
                className={`min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-700 ${
                  conversationId === conversation._id ? "bg-gray-700" : ""
                }`}
              >
                {conversation.title}
              </button>

              <button
                type="button"
                onClick={() => deleteConversation(conversation._id)}
                title="Delete conversation"
                aria-label={`Delete ${conversation.title}`}
                className="rounded-lg px-2 py-2 text-sm text-gray-400 hover:bg-red-600 hover:text-white"
              >
                🗑️
              </button>
            </div>
          ))}

        </div>
      </aside>

      {/* Chat area */}
      <section className="flex min-h-screen flex-1 flex-col">

        {/* Header */}
        
{/* Header */}
<header className={`flex items-center justify-between border-b px-6 py-5 ${
  theme === "dark"
    ? "border-gray-700 bg-gray-900 text-white"
    : "bg-white text-gray-900"
}`}>

  <div>
    <h2 className="text-xl font-semibold">
  {chatbotName}
</h2>

    <p className="text-sm text-gray-500">
      Powered by Groq AI
    </p>
  </div>

  <div className="relative flex items-center gap-3">

    {/* Profile Icon */}
    <button
      type="button"
      onClick={() => setProfileOpen(!profileOpen)}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 hover:bg-blue-200"
      title="Profile"
    >
      {userName ? userName.charAt(0).toUpperCase() : "U"}
    </button>

    {/* Logout */}
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
    >
      Logout
    </button>

    {/* Profile Dropdown */}
    {profileOpen && (
      <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border bg-white p-2 text-gray-900 shadow-xl">

        <div className="border-b px-3 py-3">
          <p className="font-semibold">{userName || "User"}</p>
          <p className="truncate text-xs text-gray-500">
            {userEmail}
          </p>
        </div>

        <button
          onClick={() => {
            setActivePanel("profile");
            setProfileOpen(false);
          }}
          className="w-full rounded-lg px-3 py-3 text-left text-sm hover:bg-gray-100"
        >
          👤 Profile
        </button>

        <button
          onClick={() => {
            setActivePanel("settings");
            setProfileOpen(false);
          }}
          className="w-full rounded-lg px-3 py-3 text-left text-sm hover:bg-gray-100"
        >
          ⚙️ Settings
        </button>

        <button
          onClick={() => {
            setActivePanel("help");
            setProfileOpen(false);
          }}
          className="w-full rounded-lg px-3 py-3 text-left text-sm hover:bg-gray-100"
        >
          ❓ Help
        </button>

      </div>
    )}

  </div>
</header>


{/* Chat Category */}
<div className="border-b border-gray-200 dark:border-gray-700 px-6 py-3">
  <label className="block text-sm font-medium mb-2">
    Chat Category
  </label>

  <select
    value={selectedCategory}
    onChange={(e) =>
      setSelectedCategory(
        e.target.value as
          | "casual"
          | "professional"
          | "creative"
          | "educational"
          | "coding"
      )
    }
    className="w-full max-w-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm"
  >
    <option value="casual" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">Casual</option>
<option value="professional" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">Professional</option>
<option value="creative" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">Creative</option>
<option value="educational" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">Educational</option>
<option value="coding" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">Coding</option>
  </select>

  <p className="mt-1 text-xs text-gray-500">
    This category will be used when you start a new chat.
  </p>
</div>


{/* Profile Panel */}
{activePanel === "profile" && (
  <div className="border-b bg-white p-6">
    <div className={`mx-auto max-w-xl rounded-xl border p-6 shadow-sm ${
  theme === "dark"
    ? "border-gray-700 bg-gray-800 text-white"
    : "border-gray-200 bg-white text-gray-900"
}`}>

      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold">My Profile</h2>

        <button
          type="button"
          onClick={() => {
            setActivePanel("");
            setProfileMessage("");
          }}
          className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100"
        >
          ✕
        </button>
      </div>

      <label className="mb-2 block text-sm font-medium">
        Full Name
      </label>

      <input
        type="text"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
        placeholder="Enter your name"
      />

      <label className="mb-2 block text-sm font-medium">
        Email Address
      </label>

      <input
        type="email"
        value={userEmail}
        readOnly
        className="mb-5 w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-gray-500"
      />

      <button
        type="button"
        onClick={saveProfile}
        disabled={savingProfile}
        className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {savingProfile ? "Saving..." : "Save Changes"}
      </button>

      {profileMessage && (
        <p className="mt-4 text-sm text-green-600">
          {profileMessage}
        </p>
      )}

    </div>
  </div>
)}


{/* Settings Panel */}
{activePanel === "settings" && (
  <div className="border-b bg-white p-6">
    <div className={`mx-auto max-w-xl rounded-xl border p-6 shadow-sm ${
  theme === "dark"
    ? "border-gray-700 bg-gray-800 text-white"
    : "border-gray-200 bg-white text-gray-900"
}`}>

      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold">Settings</h2>

        <button
          type="button"
          onClick={() => {
            setActivePanel("");
            setPasswordMessage("");
          }}
          className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100"
        >
          ✕
        </button>
      </div>

<h3 className="mb-3 font-semibold">Customize Chatbot Name</h3>

<input
  type="text"
  value={chatbotName}
  onChange={(e) => setChatbotName(e.target.value)}
  maxLength={30}
  placeholder="Enter chatbot name"
  className="mb-3 w-full rounded-lg border px-4 py-3 text-gray-900"
/>

<button
  type="button"
  onClick={saveChatbotName}
  disabled={savingChatbotName}
  className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
>
  {savingChatbotName ? "Saving..." : "Save Chatbot Name"}
</button>

{chatbotNameMessage && (
  <p className="mt-3 text-sm text-green-600">
    {chatbotNameMessage}
  </p>
)}

<hr className="my-6" />


      <h3 className="mb-4 font-semibold">Change Password</h3>

      <input
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        placeholder="Current password"
        className="mb-3 w-full rounded-lg border px-4 py-3"
      />

      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="New password (minimum 6 characters)"
        className="mb-3 w-full rounded-lg border px-4 py-3"
      />

      <button
        type="button"
        onClick={changePassword}
        disabled={changingPassword}
        className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {changingPassword ? "Updating..." : "Update Password"}
      </button>

      {passwordMessage && (
        <p className="mt-3 text-sm text-green-600">
          {passwordMessage}
        </p>
      )}

      <hr className="my-6" />

      <h3 className="mb-3 font-semibold">Appearance</h3>

      <p className="mb-3 text-sm text-gray-500">
        Choose your preferred theme.
      </p>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => updateTheme("light")}
          className={`rounded-lg border px-5 py-3 ${
            theme === "light"
              ? "border-blue-600 bg-blue-50 text-blue-700"
              : "border-gray-300"
          }`}
        >
          ☀️ Light
        </button>

        <button
          type="button"
          onClick={() => updateTheme("dark")}
          className={`rounded-lg border px-5 py-3 ${
            theme === "dark"
              ? "border-blue-600 bg-blue-50 text-blue-700"
              : "border-gray-300"
          }`}
        >
          🌙 Dark
        </button>
      </div>

    </div>
  </div>
)}

{/* Help Panel */}
{activePanel === "help" && (
  <div className={`mx-auto max-w-xl rounded-xl border p-6 shadow-sm ${
  theme === "dark"
    ? "border-gray-700 bg-gray-800 text-white"
    : "border-gray-200 bg-white text-gray-900"
}`}>
    <div className="mx-auto max-w-xl rounded-xl border p-6 shadow-sm">

      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold">Help & Support</h2>

        <button
          type="button"
          onClick={() => setActivePanel("")}
          className="rounded-lg px-3 py-2 hover:bg-gray-200 hover:text-gray-900"
        >
          ✕
        </button>
      </div>

      <h3 className="mb-2 font-semibold">How to use AI Chatbot</h3>

      <ul className={`list-disc space-y-3 pl-5 text-sm ${
  theme === "dark" ? "text-gray-200" : "text-gray-700"
}`}>
        <li>Type your question in the message box.</li>
        <li>Click Send to receive an AI-generated response.</li>
        <li>Click New Chat to start a fresh conversation.</li>
        <li>Use Chat History to open previous conversations.</li>
        <li>Click the delete icon to remove a conversation.</li>
        <li>Open Profile to update your name.</li>
        <li>Open Settings to change your password or theme.</li>
        <li>Click Logout to securely leave your account.</li>
      </ul>

      <p className={`mt-5 text-sm ${
  theme === "dark" ? "text-gray-400" : "text-gray-500"
}`}>
        Thank you for using AI Chatbot!
      </p>

    </div>
  </div>
)}



        {/* Messages */}
      <div className={`flex flex-1 flex-col gap-4 overflow-y-auto p-6 ${
  theme === "dark" ? "bg-gray-950" : "bg-gray-100"
}`}>
          {creatingConversation && (
            <p className="text-center text-sm text-gray-500">
              Creating your conversation...
            </p>
          )}

          {messages.length === 0 && !creatingConversation && (
            <div className="flex flex-1 flex-col items-center justify-center text-center">

              <div className="mb-4 text-5xl">
                🤖
              </div>

              <h2 className="mb-3 text-3xl font-bold">
                Hello! How can I help you?
              </h2>

              <p className="text-gray-500">
                Ask me anything. I am here to help.
              </p>

            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >

              
              <div className="max-w-[80%]">
                <div
                  className={`whitespace-pre-wrap rounded-2xl px-5 py-3 ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : theme === "dark"
                        ? "bg-gray-800 text-white shadow"
                        : "bg-white text-gray-900 shadow"
                  }`}
                >
                  {msg.content}
                </div>

                {msg.role === "assistant" && msg._id && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      Rate this response:
                    </span>

                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => rateMessage(msg._id!, star)}
                        aria-label={`Rate ${star} out of 5 stars`}
                        className={`text-xl ${
                          msg.rating && star <= msg.rating
                            ? "text-yellow-400"
                            : "text-gray-400"
                        }`}
                      >
                        ★
                      </button>
                    ))}

                    {msg.rating && (
                      <span className="text-xs text-green-600">
                        {msg.rating}/5 saved
                      </span>
                    )}
                  </div>
                )}
              </div>


            </div>
          ))}

          {loading && (
            <div className="text-sm text-gray-500">
              AI is thinking...
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-100 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

        </div>

        {/* Message input */}
        <div className={`border-t p-5 ${
  theme === "dark"
    ? "border-gray-700 bg-gray-900"
    : "bg-white"
}`}>

          <form
            onSubmit={handleSend}
            className="mx-auto flex max-w-3xl gap-3"
          >

            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              disabled={loading || creatingConversation}
              className={`flex-1 rounded-xl border px-4 py-3 outline-none focus:border-blue-500 ${
  theme === "dark"
    ? "border-gray-600 bg-gray-800 text-white placeholder-gray-400"
    : "border-gray-300 bg-white text-gray-900"
}`}
            />

            <button
              type="submit"
              disabled={
                !message.trim() ||
                loading ||
                creatingConversation
              }
              className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send"}
            </button>

          </form>

        </div>

      </section>
    </main>
  );
}

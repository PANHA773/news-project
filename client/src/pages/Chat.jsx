import { useEffect, useState, useRef, useContext } from "react";
import api from "../api/axios";
import AuthContext from "../context/AuthContext";
import { Send, MessageSquare, Video, Phone, User as UserIcon, Edit, Trash2, Image, Mic, Paperclip, X, Play, Pause, Smile } from "lucide-react";
import CallModal from "../components/CallModal";
import UserChatProfileModal from "../components/UserChatProfileModal";
import { useSocket } from "../context/SocketContext";
import { toAbsoluteMediaUrl } from "../config/urls";

const Chat = () => {
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const { user } = useContext(AuthContext);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const [showCallModal, setShowCallModal] = useState(false);
  const [callData, setCallData] = useState(null);
  const [isIncoming, setIsIncoming] = useState(false);

  // Edit/Delete state
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState("");

  // Profile state
  const [profileUser, setProfileUser] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [privateRecipient, setPrivateRecipient] = useState(null); // { _id, name }

  // Media state
  const [isUploading, setIsUploading] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null); // { type, url, file }
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  // Emoji + input ref
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // Don't set up listeners if socket isn't ready yet
    if (!socket || !user) return;

    // Join notification room for signaling
    socket.emit("join_notifications", user._id);
    // Join chat room so server can emit private messages to this user
    socket.emit("join_chat", user._id);

    // Fetch History
    const fetchHistory = async () => {
      try {
        const { data } = await api.get("/chat");
        setMessages(data);
      } catch (error) {
        console.error("Error fetching chat history", error);
      }
    };
    fetchHistory();

    // Listen for incoming messages
    socket.on("receive_message", (data) => {
      setMessages((list) => [...list, data]);
    });

    // Listen for edited messages
    socket.on("message_edited", (updatedMessage) => {
      setMessages((list) => list.map(msg => msg._id === updatedMessage._id ? updatedMessage : msg));
    });

    // Listen for deleted messages
    socket.on("message_deleted", (messageId) => {
      setMessages((list) => list.filter(msg => msg._id !== messageId));
    });

    // Listen for incoming calls
    socket.on("incoming_call", ({ fromName, fromId, offer, type }) => {
      setCallData({ fromName, fromId, offer, type });
      setIsIncoming(true);
      setShowCallModal(true);
    });

    return () => {
      socket.off("receive_message");
      socket.off("message_edited");
      socket.off("message_deleted");
      socket.off("incoming_call");
    };
  }, [user, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e) => {
    if (e) e.preventDefault();

    let imageUrl = "";
    let videoUrl = "";
    let audioUrl = "";

    if (previewMedia) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("image", previewMedia.file);

      try {
        const { data } = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });

        if (previewMedia.type === 'image') imageUrl = data;
        else if (previewMedia.type === 'video') videoUrl = data;
        else if (previewMedia.type === 'audio') audioUrl = data;
      } catch (error) {
        console.error("Media upload failed", error);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
      setPreviewMedia(null);
    }

    if (currentMessage.trim() !== "" || imageUrl || videoUrl || audioUrl) {
      const messageData = {
        senderId: user._id,
        content: currentMessage,
        senderName: user.name,
        recipientId: privateRecipient?._id || null,
        image: imageUrl,
        video: videoUrl,
        audio: audioUrl
      };

      await socket.emit("send_message", messageData);
      setCurrentMessage("");
      // If it was a private message, clear the recipient after sending
      if (privateRecipient) setPrivateRecipient(null);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const type = file.type.startsWith('image/') ? 'image' :
      file.type.startsWith('video/') ? 'video' : null;

    if (type) {
      setPreviewMedia({
        type,
        url: URL.createObjectURL(file),
        file
      });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], "voice-message.webm", { type: 'audio/webm' });
        setPreviewMedia({
          type: 'audio',
          url: URL.createObjectURL(audioBlob),
          file: audioFile
        });
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEdit = (msg) => {
    setEditingMessageId(msg._id);
    setEditContent(msg.content);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (editContent.trim()) {
      socket.emit("edit_message", { messageId: editingMessageId, content: editContent });
      setEditingMessageId(null);
      setEditContent("");
    }
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  const deleteMessage = (messageId) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      socket.emit("delete_message", { messageId });
    }
  };

  const initiateCall = (targetUser, type) => {
    setCallData({
      toId: targetUser._id,
      toName: targetUser.name,
      type
    });
    setIsIncoming(false);
    setShowCallModal(true);
  };


  const openProfile = async (target) => {
    if (!target) return;

    // If we already have a full user object (with a name), open directly
    if (typeof target === 'object' && target.name) {
      setProfileUser(target);
      setIsProfileOpen(true);
      return;
    }

    // Determine an ID string from the provided value
    const id = typeof target === 'string' ? target : (target._id || target);

    try {
      const { data } = await api.get(`/users/${id}`);
      setProfileUser(data);
      setIsProfileOpen(true);
    } catch (err) {
      console.error('Error fetching user profile', err);
    }
  };

  const handlePrivateMessage = (targetUser) => {
    // Open private conversation and fetch history
    selectUserConversation(targetUser);
    setIsProfileOpen(false);
  };

  const [sidebarUsers, setSidebarUsers] = useState([]);
  const [activeConversationWith, setActiveConversationWith] = useState(null); // id or null for public
  const [allUsers, setAllUsers] = useState([]);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const emojiList = [
    "😀","😁","😂","🤣","😊","😉","😍","😘","😜","🤗",
    "🤔","🤩","😎","😭","😅","😇","😴","👍","👎","🙏",
    "🎉","🔥","💯","❤️","🎶","🚀","🙌","👏","🤝","🫶"
  ];

  const fetchConversation = async (otherId = null) => {
    try {
      if (otherId) {
        const { data } = await api.get(`/chat/conversation/${otherId}`);
        setMessages(data);
      } else {
        const { data } = await api.get('/chat');
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching conversation', err);
    }
  };

  useEffect(() => {
    if (!user) return;
    // fetch active conversations for sidebar
    const loadConversations = async () => {
      try {
        const { data } = await api.get('/chat/conversations');
        setSidebarUsers(data || []);
      } catch (err) {
        console.error('Error fetching conversations', err);
      }
    };
    loadConversations();

    // fetch all users for quick access (if permitted)
    const loadAllUsers = async () => {
      try {
        const { data } = await api.get('/users');
        // exclude current user
        setAllUsers((data || []).filter(u => u._id !== user._id));
      } catch (err) {
        // ignore permission errors or failures
        console.error('Error fetching all users', err);
        setAllUsers([]);
      }
    };
    loadAllUsers();
  }, [user]);

  const selectUserConversation = async (target) => {
    if (!target) {
      // Public
      setPrivateRecipient(null);
      setActiveConversationWith(null);
      await fetchConversation(null);
      return;
    }

    setPrivateRecipient({ _id: target._id, name: target.name });
    setActiveConversationWith(target._id);
    await fetchConversation(target._id);
  };

  const filteredUsers = allUsers.filter(u => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
  });

  return (
    <div className="flex h-[calc(100vh-100px)]">
      <aside className="w-72 p-4">
        <div className="glass-card rounded-xl p-3 h-full overflow-y-auto border border-[rgba(255,255,255,0.05)]">
          <h3 className="text-sm font-black text-white mb-3">Conversations</h3>
          <button
            className={"w-full text-left py-2 px-3 rounded-lg mb-2 " + (activeConversationWith === null ? "bg-[rgba(255,255,255,0.04)]" : "hover:bg-[rgba(255,255,255,0.02)]")}
            onClick={() => selectUserConversation(null)}
          >
            Public Chat
          </button>
          <div className="space-y-2 mt-2">
                  {sidebarUsers.map(f => (
              <button
                key={f._id}
                onClick={() => selectUserConversation(f)}
                className={"w-full flex items-center gap-3 py-2 px-3 rounded-lg text-left " + (activeConversationWith === f._id ? "bg-[rgba(255,255,255,0.04)]" : "hover:bg-[rgba(255,255,255,0.02)]")}
              >
                <div className="w-8 h-8 rounded-md bg-gray-800 overflow-hidden relative">
                  {f.avatar ? (
                    <img
                      src={toAbsoluteMediaUrl(f.avatar)}
                      alt={f.name}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white truncate">{f.name}</div>
                  <div className="text-xs text-gray-400 truncate">{f.email}</div>
                </div>
              </button>
            ))}
            {/* All Users (optional, requires permission) */}
            <div className="mt-4">
              <button onClick={() => setShowAllUsers(s => !s)} className="w-full text-left py-2 px-3 rounded-lg mb-2 bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.03)]">
                {showAllUsers ? 'Hide All Users' : 'Show All Users'}
              </button>
              {showAllUsers && (
                <div className="mt-2">
                  <div className="px-3 mb-2">
                    <input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search users by name or email..."
                      className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] text-sm text-white focus:outline-none"
                    />
                  </div>

                  {filteredUsers.length === 0 ? (
                    <div className="text-xs text-gray-400 px-3">No users match your search.</div>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {filteredUsers.map(u => (
                        <div key={u._id} className={"w-full flex items-center gap-3 py-2 px-3 rounded-lg text-left " + (activeConversationWith === u._id ? "bg-[rgba(255,255,255,0.04)]" : "hover:bg-[rgba(255,255,255,0.02)]")}>
                          <div className="w-8 h-8 rounded-md bg-gray-800 overflow-hidden relative">
                            {u.avatar ? (
                              <img
                                src={toAbsoluteMediaUrl(u.avatar)}
                                alt={u.name}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <UserIcon className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-bold text-white truncate cursor-pointer" onClick={() => openProfile(u)}>{u.name}</div>
                            <div className="text-xs text-gray-400 truncate">{u.email}</div>
                          </div>
                          <button onClick={() => selectUserConversation(u)} className="text-xs text-(--primary-glow) font-black">Message</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col glass-card rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.05)] overflow-hidden">
      {showCallModal && (
        <CallModal
          callData={callData}
          incomingCall={isIncoming}
          onEndCall={() => setShowCallModal(false)}
          socket={socket}
        />
      )}

      {isProfileOpen && (
        <UserChatProfileModal
          user={profileUser}
          onClose={() => setIsProfileOpen(false)}
          onMessage={handlePrivateMessage}
        />
      )}

      <div className="bg-[rgba(255,255,255,0.03)] p-4 text-white flex items-center shadow-lg z-10 border-b border-[rgba(255,255,255,0.05)] backdrop-blur-md">
        <MessageSquare className="w-6 h-6 mr-3 text-(--primary-glow) drop-shadow-[0_0_5px_var(--primary-glow)]" />
        <h2 className="text-lg font-bold tracking-wide">University Community Chat</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-(--bg-dark) scrollbar-thin scrollbar-thumb-(--primary-glow) scrollbar-track-transparent">
        {messages.map((msg, index) => {
          const senderId = msg.sender?._id || msg.sender; // works if sender is object or just ID
          const senderName = msg.sender?.name || msg.senderName || "Unknown"; // fallback name
          const isMe = senderId === user._id;
          const isBeingEdited = editingMessageId === msg._id;

          return (
            <div
              key={msg._id || index}
              className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fade-in group`}
            >
              <div className={`flex flex-col max-w-[70%]`}>
                {!isMe && (
                  <div className="group flex items-center gap-2 mb-1 ml-1">
                    <button
                      onClick={() => openProfile(msg.sender)}
                      className="text-xs text-(--primary-glow) font-black hover:underline decoration-2 underline-offset-2 transition-all cursor-pointer"
                    >
                      {senderName}
                    </button>
                    <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => initiateCall(msg.sender, 'video')}
                        className="p-1 rounded-md hover:bg-white/10 text-(--primary-glow) transition-all"
                        title="Video Call"
                      >
                        <Video className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => initiateCall(msg.sender, 'voice')}
                        className="p-1 rounded-md hover:bg-white/10 text-green-400 transition-all"
                        title="Voice Call"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
                <div
                  className={`group relative px-4 py-2 rounded-2xl shadow-sm wrap-break-word ${isMe
                      ? "bg-[rgba(188,19,254,0.2)] text-white border border-(--secondary-glow) rounded-br-none glow-box"
                      : "bg-[rgba(255,255,255,0.05)] text-gray-200 border border-[rgba(255,255,255,0.1)] rounded-bl-none hover:bg-[rgba(255,255,255,0.08)] transition-colors"
                    }`}
                >
                  {isMe && !isBeingEdited && (
                    <div className="absolute -left-16 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all bg-[#101020]/90 backdrop-blur-sm p-1 rounded-lg border border-white/10 shadow-xl">
                      <button
                        onClick={() => handleEdit(msg)}
                        className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-blue-400 transition-all"
                        title="Edit Message"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteMessage(msg._id)}
                        className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-red-500 transition-all"
                        title="Delete Message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {!isMe && (
                    <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0f0f1a]/80 backdrop-blur-sm p-1 rounded-lg border border-white/10 shadow-xl z-20">
                      <button
                        onClick={() => initiateCall(msg.sender, 'video')}
                        className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-(--primary-glow) transition-all"
                        title="Video Call"
                      >
                        <Video className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => initiateCall(msg.sender, 'voice')}
                        className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-green-400 transition-all"
                        title="Voice Call"
                      >
                        <Phone className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {isBeingEdited ? (
                    <form onSubmit={saveEdit} className="flex flex-col gap-2 min-w-[200px]">
                      <input
                        autoFocus
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="bg-[rgba(0,0,0,0.3)] border border-white/10 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-(--primary-glow)"
                      />
                      <div className="flex justify-end gap-2 text-[10px]">
                        <button type="button" onClick={cancelEdit} className="text-gray-400 hover:text-white uppercase font-black">Cancel</button>
                        <button type="submit" className="text-(--primary-glow) hover:brightness-110 uppercase font-black">Save</button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-2">
                      {msg.image && (
                        <div className="rounded-lg overflow-hidden border border-white/10 shadow-lg">
                          <img src={toAbsoluteMediaUrl(msg.image)} alt="Shared" className="max-w-full h-auto object-cover hover:scale-[1.02] transition-transform cursor-pointer" onClick={() => window.open(toAbsoluteMediaUrl(msg.image), '_blank')} />
                        </div>
                      )}
                      {msg.video && (
                        <div className="rounded-lg overflow-hidden border border-white/10 shadow-lg bg-black">
                          <video controls className="max-w-full h-auto">
                            <source src={toAbsoluteMediaUrl(msg.video)} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      )}
                      {msg.audio && (
                        <div className="p-2 bg-white/5 rounded-xl border border-white/10 min-w-[200px]">
                          <audio controls className="w-full h-8 scale-90 origin-left">
                            <source src={toAbsoluteMediaUrl(msg.audio)} type="audio/webm" />
                            Your browser does not support the audio tag.
                          </audio>
                        </div>
                      )}
                      {msg.content && (
                        <p className="text-sm">
                          {msg.content}
                          {msg.isEdited && <span className="ml-2 text-[10px] text-gray-400 italic">(edited)</span>}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <span className={`text-[10px] text-gray-500 mt-1 ${isMe ? "text-right mr-1" : "ml-1"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>



      <div className="p-4 bg-[rgba(255,255,255,0.02)] border-t border-[rgba(255,255,255,0.05)]">
        {previewMedia && (
          <div className="mb-4 p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden">
                {previewMedia.type === 'image' ? (
                  <img src={previewMedia.url} className="w-full h-full object-cover" />
                ) : previewMedia.type === 'video' ? (
                  <Video className="w-5 h-5 text-blue-400" />
                ) : (
                  <Mic className="w-5 h-5 text-red-500" />
                )}
              </div>
              <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                {previewMedia.type === 'audio' ? `Voice Recording (${formatTime(recordingTime)})` : `Ready to send ${previewMedia.type}`}
              </span>
            </div>
            <button onClick={() => setPreviewMedia(null)} className="p-2 rounded-full hover:bg-white/10 text-gray-400 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {privateRecipient && (
          <div className="mb-3 p-2 bg-yellow-600/10 border border-yellow-400/20 rounded-xl flex items-center justify-between">
            <div className="text-xs text-yellow-300 font-bold">Private to {privateRecipient.name}</div>
            <button onClick={() => setPrivateRecipient(null)} className="text-xs text-yellow-200/90 underline">Cancel</button>
          </div>
        )}

        <div className="relative flex items-end gap-2">
            <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={currentMessage}
              onChange={(event) => setCurrentMessage(event.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={isRecording ? "Recording..." : "Type a message..."}
              disabled={isRecording}
              className="w-full pl-4 pr-12 py-3 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.1)] rounded-xl focus:outline-none focus:ring-1 focus:ring-(--primary-glow) text-white transition-all placeholder-gray-600 disabled:opacity-50"
            />
            <div className="absolute right-2 flex items-center gap-1">
              <label className="p-2 rounded-lg hover:bg-white/5 text-gray-400 cursor-pointer transition-all">
                <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileSelect} />
                <Paperclip className="w-5 h-5" />
              </label>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(s => !s)}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 transition-all"
                title="Insert Emoji"
              >
                <Smile className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-2 rounded-lg transition-all ${isRecording ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-gray-400 hover:bg-white/5'}`}
              >
                <Mic className="w-5 h-5" />
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-12 right-0 z-50 w-48 bg-[#071123] p-2 rounded-lg shadow-xl border border-white/5">
                  <div className="grid grid-cols-6 gap-2">
                    {emojiList.map((emo) => (
                      <button
                        key={emo}
                        onClick={() => {
                          setCurrentMessage(prev => prev + emo);
                          setShowEmojiPicker(false);
                          setTimeout(() => inputRef.current?.focus(), 0);
                        }}
                        className="p-1 text-lg"
                        title={emo}
                      >
                        {emo}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={sendMessage}
            className="bg-(--primary-glow) text-black p-3.5 rounded-xl hover:brightness-110 transition-all shadow-[0_0_15px_rgba(0,243,255,0.3)] disabled:opacity-50 disabled:shadow-none h-[48px] aspect-square flex items-center justify-center"
            disabled={isUploading || (!currentMessage.trim() && !previewMedia)}
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
  );
};

export default Chat;

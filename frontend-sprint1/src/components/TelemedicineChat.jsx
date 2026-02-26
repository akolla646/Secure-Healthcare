import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";
import { Video } from "lucide-react";

const TelemedicineChat = ({ sessionId, appointment }) => {
    const { user } = useAuth();
    const [session, setSession] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [socket, setSocket] = useState(null);
    const [error, setError] = useState(null);
    const [isVideoActive, setIsVideoActive] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const isEnded = session?.status === "ENDED";
    const endTime = appointment ? new Date(appointment.scheduled_end) : null;
    const hasPastAppointments = appointment?.hasPastAppointments || false;

    // Chat is globally enabled ONLY IF:
    // 1. THIS specific appointment has currently ended OR
    // 2. The pair already has at least one purely past appointment (chat unlocks permanently)
    const isChatAllowed = (endTime && currentTime >= endTime) || isEnded || hasPastAppointments;

    const messagesEndRef = useRef(null);

    // Auto-scroll to latest message
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!sessionId || !user) return;

        let activeSocket;
        let isMounted = true;

        const fetchSessionData = async () => {
            try {
                // Fetch session details
                const sessionRes = await client.get(`/telemedicine/session/${sessionId}`);
                if (!isMounted) return;
                setSession(sessionRes.data.data);

                // Fetch previous messages
                const messagesRes = await client.get(`/telemedicine/messages/${sessionId}`);
                if (!isMounted) return;
                setMessages(messagesRes.data.data);

                // Initialize Socket
                const token = localStorage.getItem("token"); // Assuming token is stored here
                const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
                activeSocket = io(backendUrl, {
                    auth: { token }
                });

                activeSocket.on("connect", () => {
                    activeSocket.emit("join-session", { sessionId });
                });

                activeSocket.on("receive-message", (message) => {
                    setMessages((prev) => {
                        // Prevent duplicate message by checking message_id
                        if (prev.some(m => m.message_id === message.message_id)) return prev;
                        return [...prev, message];
                    });

                    // If we receive a message from the other person, emit mark-read
                    if (message.sender_id !== user.user_id) {
                        activeSocket.emit("mark-read", { sessionId });
                    }
                });

                activeSocket.on("session-ended", () => {
                    setSession((prev) => ({ ...prev, status: "ENDED" }));
                });

                activeSocket.on("error", (err) => {
                    if (isMounted) setError(err.message);
                });

                if (isMounted) setSocket(activeSocket);
            } catch (err) {
                console.error("Failed to load chat data", err);
                if (isMounted) setError("Could not load telemedicine chat.");
            }
        };

        fetchSessionData();

        return () => {
            isMounted = false;
            if (activeSocket) {
                activeSocket.disconnect();
            }
        };
    }, [sessionId, user]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket || !isChatAllowed) return;

        socket.emit("send-message", { sessionId, messageText: newMessage });
        setNewMessage("");
    };

    const handleEndSession = () => {
        if (socket && user.role === "DOCTOR") {
            socket.emit("end-session", { sessionId });
            setIsVideoActive(false);
        }
    };

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg shadow">
                <p className="font-semibold">Error</p>
                <p>{error}</p>
            </div>
        );
    }

    if (!session) {
        return <div className="p-4 text-center text-gray-500">Loading session...</div>;
    }

    const isDoctor = user.role === "DOCTOR";

    // Video is allowed only during the appointment (and not ended)
    const isVideoAllowed = !isEnded && endTime && currentTime < endTime;

    const jitsiRoomUrl = `https://meet.jit.si/SecureHealth_Telemedicine_${sessionId}`;

    return (
        <div className={`flex flex-col md:flex-row h-[600px] w-full ${isVideoActive ? 'max-w-6xl' : 'max-w-2xl'} transition-all duration-300 ease-in-out gap-4`}>

            {/* Jitsi Video Container */}
            {isVideoActive && (
                <div className="flex-1 bg-black rounded-xl shadow-sm border border-gray-200 overflow-hidden relative min-w-[300px]">
                    <iframe
                        src={`${jitsiRoomUrl}#config.prejoinPageEnabled=false&userInfo.displayName="${user.name}"`}
                        allow="camera; microphone; fullscreen; display-capture; autoplay"
                        className="w-full h-full border-0"
                        title="Telemedicine Video Call"
                    ></iframe>
                </div>
            )}

            {/* Chat Container */}
            <div className={`flex flex-col h-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden ${isVideoActive ? 'w-full md:w-96 flex-shrink-0' : 'flex-1'}`}>
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Telemedicine Consultation</h2>
                        <p className="text-sm text-gray-500">
                            {isEnded ? "Session Ended" : session.status === "ACTIVE" ? "Session Active" : "Waiting..."}
                        </p>
                    </div>

                    <div className="flex space-x-2">
                        {isVideoAllowed && !isVideoActive && (
                            <button
                                onClick={() => setIsVideoActive(true)}
                                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 flex items-center text-white text-sm font-semibold rounded-lg transition-colors"
                            >
                                <Video className="w-4 h-4 mr-1.5" />
                                Start Video
                            </button>
                        )}

                        {isVideoActive && (
                            <button
                                onClick={() => setIsVideoActive(false)}
                                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold rounded-lg transition-colors"
                            >
                                Hide Video
                            </button>
                        )}

                        {isDoctor && !isEnded && (
                            <button
                                onClick={handleEndSession}
                                className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors"
                            >
                                End Consultation
                            </button>
                        )}
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4">
                    {messages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                            No messages yet. Say hello!
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMine = msg.sender_id === user.user_id;

                            return (
                                <div
                                    key={msg.message_id}
                                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm
                        ${isMine
                                                ? "bg-blue-600 text-white rounded-br-none"
                                                : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
                                            }
                    `}
                                    >
                                        <p className="break-words">{msg.message_text}</p>
                                        <div className={`text-[10px] mt-1 flex justify-end ${isMine ? "text-blue-200" : "text-gray-400"}`}>
                                            {msg.sent_at ? new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-100">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={!isChatAllowed}
                            placeholder={!isChatAllowed ? "Chat unlocks after your first consultation concludes" : "Type a message..."}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 text-sm"
                        />
                        <button
                            type="submit"
                            disabled={!isChatAllowed || !newMessage.trim()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TelemedicineChat;

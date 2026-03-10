// ============================================================
// TelemedicineChat.jsx
// Core chat + video call component for telemedicine sessions.
//
// Receives:
//   sessionId  : UUID of the telemedicine session
//   appointment: appointment object, including:
//     - scheduled_start / scheduled_end (for time-based gates)
//     - hasPastAppointments (for permanent chat unlock)
//
// Features:
//   - Loads message history via REST on mount
//   - Connects to Socket.IO for real-time messaging
//   - Chat unlock gate: enabled only after first consultation ends
//   - Video call via Jitsi Meet (available during appointment window)
//   - Doctor-only "End Consultation" button
// ============================================================

import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";
import { Video } from "lucide-react";

const TelemedicineChat = ({ sessionId, appointment }) => {
    const { user } = useAuth(); // Currently logged-in user

    const [session, setSession] = useState(null);     // Session details from DB
    const [messages, setMessages] = useState([]);        // Full chat history
    const [newMessage, setNewMessage] = useState("");        // Current input field value
    const [socket, setSocket] = useState(null);      // Active Socket.IO instance
    const [error, setError] = useState(null);      // Error state for UI
    const [isVideoActive, setIsVideoActive] = useState(false); // Jitsi iframe toggle
    const [currentTime, setCurrentTime] = useState(new Date()); // Live clock for time gates

    // Update currentTime every 60 seconds so the time-based gates re-evaluate
    // automatically without requiring a page refresh
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer); // Clean up on unmount
    }, []);

    // Derived state: whether the session has been ended by the doctor
    const isEnded = session?.status === "ENDED";

    // Parse the appointment end time once; used for both chat and video gates
    const endTime = appointment ? new Date(appointment.scheduled_end) : null;

    // Whether this doctor-patient pair has ever completed an appointment before
    const hasPastAppointments = appointment?.hasPastAppointments || false;

    // -------------------------------------------------------
    // Chat Unlock Gate
    // Chat is enabled if ANY of the following is true:
    //   1. The current appointment's end time has passed
    //   2. The doctor has explicitly ended this session
    //   3. The pair has at least one completed past appointment
    //      (chat unlocks permanently once they've met)
    // -------------------------------------------------------
    const isChatAllowed = (endTime && currentTime >= endTime) || isEnded || hasPastAppointments;

    // Ref to the invisible element at the bottom of the message list
    // Used for auto-scrolling to the latest message
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Auto-scroll whenever the messages array changes (new message added)
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // -------------------------------------------------------
    // Main setup effect (runs when sessionId or user changes)
    // 1. Fetch session details from REST API
    // 2. Fetch existing message history from REST API
    // 3. Connect Socket.IO with JWT authentication
    // 4. Register socket event listeners
    // 5. Clean up socket on unmount / sessionId change
    // -------------------------------------------------------
    useEffect(() => {
        if (!sessionId || !user) return;

        let activeSocket;
        let isMounted = true; // Guard against state updates after unmount

        const fetchSessionData = async () => {
            try {
                // Step 1: Load session info (status, doctor_id, patient_id)
                const sessionRes = await client.get(`/telemedicine/session/${sessionId}`);
                if (!isMounted) return;
                setSession(sessionRes.data.data);

                // Step 2: Load full chat history before connecting socket
                // This avoids a blank chat screen on initial load
                const messagesRes = await client.get(`/telemedicine/messages/${sessionId}`);
                if (!isMounted) return;
                setMessages(messagesRes.data.data);

                // Step 3: Connect Socket.IO with JWT from localStorage
                // The socket server will verify this token in its middleware
                const token = localStorage.getItem("token");
                const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
                activeSocket = io(backendUrl, {
                    auth: { token } // Sent as socket.handshake.auth.token on the server
                });

                // Step 4a: Once connected, join the session's Socket.IO room
                activeSocket.on("connect", () => {
                    activeSocket.emit("join-session", { sessionId });
                });

                // Step 4b: Handle incoming messages from other participants
                activeSocket.on("receive-message", (message) => {
                    setMessages((prev) => {
                        // Deduplication: don't add a message we already have
                        // (possible race between REST load and socket broadcast)
                        if (prev.some(m => m.message_id === message.message_id)) return prev;
                        return [...prev, message];
                    });

                    // Automatically mark messages as read if they're from the other person
                    if (message.sender_id !== user.user_id) {
                        activeSocket.emit("mark-read", { sessionId });
                    }
                });

                // Step 4c: Handle doctor ending the session
                activeSocket.on("session-ended", () => {
                    // Update local session status to ENDED so the UI reflects it
                    setSession((prev) => ({ ...prev, status: "ENDED" }));
                });

                // Step 4d: Handle session status changing to ACTIVE
                activeSocket.on("session-status-changed", ({ status }) => {
                    setSession((prev) => ({ ...prev, status }));
                });

                // Step 4e: Handle server-emitted errors (auth failures, etc.)
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

        // Cleanup: disconnect socket when component unmounts or sessionId changes
        return () => {
            isMounted = false;
            if (activeSocket) {
                activeSocket.disconnect();
            }
        };
    }, [sessionId, user]);

    // -------------------------------------------------------
    // handleSendMessage
    // Called on form submit. Emits the message to the socket server.
    // The server saves it and broadcasts it back to the room via
    // "receive-message", so the sender also sees the sent message.
    // Guard: does nothing if chat is locked or message is empty.
    // -------------------------------------------------------
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket || !isChatAllowed) return;

        socket.emit("send-message", { sessionId, messageText: newMessage });
        setNewMessage(""); // Clear the input field after sending
    };

    // -------------------------------------------------------
    // handleEndSession
    // Only callable by the doctor. Emits "end-session" to the
    // socket server, which updates the DB and notifies the room.
    // Also hides video if it's active.
    // -------------------------------------------------------
    const handleEndSession = () => {
        if (socket && user.role === "DOCTOR") {
            socket.emit("end-session", { sessionId });
            setIsVideoActive(false); // Hide the Jitsi iframe on session end
        }
    };

    // -------------------------------------------------------
    // Error and loading states
    // -------------------------------------------------------
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

    // -------------------------------------------------------
    // Video Call Gate
    // Video is ONLY available during the active appointment window:
    //   - The session must not have ended
    //   - Current time must be before the appointment end time
    // (Chat is allowed after the appointment ends; video is not)
    // -------------------------------------------------------
    const isVideoAllowed = !isEnded && endTime && currentTime < endTime;

    // Each session gets a unique Jitsi room derived from its session_id
    // Ensures doctor and patient always land in the same room
    const jitsiRoomUrl = `https://meet.jit.si/SecureHealth_Telemedicine_${sessionId}`;

    return (
        // Outer container: side-by-side layout when video is active
        <div className={`flex flex-col md:flex-row h-full min-h-[600px] w-full ${isVideoActive ? 'max-w-6xl' : 'max-w-2xl'} transition-all duration-300 ease-in-out gap-4`}>

            {/* ---- Jitsi Video Call Panel ---- */}
            {/* Rendered only when the user clicks "Start Video" */}
            {isVideoActive && (
                <div className="flex-[2] bg-black rounded-xl shadow-sm border border-gray-200 overflow-hidden relative min-w-[300px] min-h-[400px]">
                    <iframe
                        src={`${jitsiRoomUrl}#config.prejoinPageEnabled=false&userInfo.displayName="${encodeURIComponent(user.name)}"`}
                        allow="camera; microphone; fullscreen; display-capture; autoplay"
                        className="w-full h-full border-0"
                        title="Telemedicine Video Call"
                    ></iframe>
                </div>
            )}

            {/* ---- Chat Panel ---- */}
            {/* Always visible; shrinks to fixed width when video is active */}
            <div className={`flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden ${isVideoActive ? 'w-full md:w-96 flex-shrink-0' : 'flex-1'}`}>

                {/* Header: session status + action buttons */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Telemedicine Consultation</h2>
                        <p className="text-sm text-gray-500">
                            {/* Display current session status */}
                            {isEnded ? "Session Ended" : session.status === "ACTIVE" ? "Session Active" : "Waiting..."}
                        </p>
                    </div>

                    <div className="flex space-x-2">
                        {/* "Start Video" button: shown only during appointment window */}
                        {isVideoAllowed && !isVideoActive && (
                            <button
                                onClick={() => setIsVideoActive(true)}
                                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 flex items-center text-white text-sm font-semibold rounded-lg transition-colors"
                            >
                                <Video className="w-4 h-4 mr-1.5" />
                                Start Video
                            </button>
                        )}

                        {/* "Hide Video" button: shown when video panel is open */}
                        {isVideoActive && (
                            <button
                                onClick={() => setIsVideoActive(false)}
                                className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-semibold rounded-lg transition-colors"
                            >
                                Hide Video
                            </button>
                        )}

                        {/* "End Consultation" button: doctor only, session must be active */}
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

                {/* Messages Area: scrollable list of chat bubbles */}
                <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4">
                    {messages.length === 0 ? (
                        // Empty state placeholder
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                            No messages yet. Say hello!
                        </div>
                    ) : (
                        messages.map((msg) => {
                            // Determine if this message was sent by the current user
                            const isMine = msg.sender_id === user.user_id;

                            return (
                                <div
                                    key={msg.message_id}
                                    // Right-align own messages, left-align others'
                                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm
                        ${isMine
                                                ? "bg-blue-600 text-white rounded-br-none"       // Own message: blue bubble
                                                : "bg-white border border-gray-200 text-gray-800 rounded-bl-none" // Other's message: white bubble
                                            }
                    `}
                                    >
                                        <p className="break-words">{msg.message_text}</p>
                                        {/* Timestamp shown below each message */}
                                        <div className={`text-[10px] mt-1 flex justify-end ${isMine ? "text-blue-200" : "text-gray-400"}`}>
                                            {msg.sent_at ? new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    {/* Invisible anchor element for auto-scrolling to bottom */}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input Area */}
                <div className="p-4 bg-white border-t border-gray-100">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={!isChatAllowed} // Locked until consultation completes
                            placeholder={!isChatAllowed ? "Chat unlocks after your first consultation concludes" : "Type a message..."}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500 text-sm"
                        />
                        <button
                            type="submit"
                            disabled={!isChatAllowed || !newMessage.trim()} // Can't send if chat locked or empty
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

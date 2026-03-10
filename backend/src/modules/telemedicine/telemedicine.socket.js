// ============================================================
// telemedicine.socket.js
// Real-Time WebSocket Layer for the Telemedicine module.
// Built with Socket.IO on top of the existing HTTP server.
//
// Responsibilities:
//   - Authenticate incoming socket connections via JWT
//   - Manage session rooms (join / leave)
//   - Relay chat messages in real time
//   - Handle session lifecycle events (end-session)
//   - Write audit logs for key actions
// ============================================================

const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const pool = require("../../config/db");
const telemedicineRepo = require("./telemedicine.repository");
const { logAudit } = require("../../utils/auditLogger");

// Module-level io instance — shared across all events
let io;

// ------------------------------------------------------------
// initSocket
// Attaches a Socket.IO server to the existing HTTP server and
// registers all event handlers.
// Called once at application startup in server.js.
// ------------------------------------------------------------
exports.initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Allow all origins (restrict to frontend URL in production)
            methods: ["GET", "POST"]
        }
    });

    // ----------------------------------------------------------
    // JWT Authentication Middleware (runs before every connection)
    // The client must send { auth: { token: "<jwt>" } } in the
    // socket.io handshake options.
    // If valid, the decoded payload is attached to socket.user
    // so all event handlers can access the authenticated user.
    // ----------------------------------------------------------
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;

        // Reject connections that don't provide a token
        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        }

        try {
            // Verify and decode the JWT using the server secret
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded; // e.g. { user_id, role, name, ... }
            next();               // Proceed to connection handler
        } catch (err) {
            // Token is expired, tampered, or invalid
            return next(new Error("Authentication error: Invalid token"));
        }
    });

    // ----------------------------------------------------------
    // Main connection handler
    // Runs for each successfully authenticated socket client.
    // ----------------------------------------------------------
    io.on("connection", (socket) => {
        console.log(`🔌 Socket connected: User ${socket.user.user_id}`);

        // -------------------------------------------------------
        // Event: "join-session"
        // Emitted by the client when the TelemedicineChat component
        // mounts and the user wants to subscribe to a session room.
        //
        // Validation:
        //   1. Session must exist in the DB.
        //   2. Requesting user must be the doctor or patient.
        // On success: user is added to a Socket.IO room keyed by sessionId.
        // Audit log: JOIN_SESSION event is recorded.
        // -------------------------------------------------------
        socket.on("join-session", async ({ sessionId }) => {
            try {
                const session = await telemedicineRepo.getSessionById(sessionId);

                // Guard: session must exist
                if (!session) {
                    return socket.emit("error", { message: "Session not found" });
                }

                // Guard: only participants (doctor/patient) can join
                if (session.doctor_id !== socket.user.user_id && session.patient_id !== socket.user.user_id) {
                    return socket.emit("error", { message: "Unauthorized to join this session" });
                }

                // Add this socket to the session's dedicated room
                // All future broadcasts for this session use io.to(sessionId)
                socket.join(sessionId);

                // If a doctor joins and the session is currently WAITING, set it to ACTIVE
                if (socket.user.role === "DOCTOR" && session.status === "WAITING") {
                    const updatedSession = await telemedicineRepo.activateSession(sessionId);
                    if (updatedSession) {
                        io.to(sessionId).emit("session-status-changed", { sessionId, status: "ACTIVE" });
                    }
                }

                // Write an audit log entry for compliance/traceability
                await logAudit({
                    actor_user_id: socket.user.user_id,
                    action: "JOIN_SESSION",
                    entity_type: "TELEMEDICINE_SESSION",
                    entity_id: sessionId,
                    ip_address: socket.request.connection.remoteAddress || ""
                });

                console.log(`👤 User ${socket.user.user_id} joined session ${sessionId}`);
            } catch (err) {
                console.error("Join session error:", err);
            }
        });

        // -------------------------------------------------------
        // Event: "send-message"
        // Emitted by the client when the user submits a chat message.
        //
        // Flow:
        //   1. Re-validate that the sender belongs to the session.
        //      (Server-side auth — never trust client claims alone.)
        //   2. Persist the message in the DB via repository.
        //   3. Broadcast the saved message to ALL users in the room,
        //      including the sender (so they see the server-stored version).
        // -------------------------------------------------------
        socket.on("send-message", async ({ sessionId, messageText }) => {
            try {
                const session = await telemedicineRepo.getSessionById(sessionId);

                // Silently drop if session no longer exists
                if (!session) return;

                // Re-validate sender is a session participant
                if (session.doctor_id !== socket.user.user_id && session.patient_id !== socket.user.user_id) {
                    return socket.emit("error", { message: "Unauthorized to send messages in this session" });
                }

                // Persist message and get back the full DB row (includes message_id, sent_at)
                const message = await telemedicineRepo.createMessage(sessionId, socket.user.user_id, messageText);

                // Broadcast the DB-saved message to the entire room
                // Using io.to() (not socket.to()) so the sender also receives it
                io.to(sessionId).emit("receive-message", message);
            } catch (err) {
                console.error("Send message error:", err);
            }
        });

        // -------------------------------------------------------
        // Event: "mark-read"
        // Emitted by the client when they receive a message from
        // the other party. Marks unread messages in the session as
        // read in the DB (excluding messages sent by the receiver).
        // -------------------------------------------------------
        socket.on("mark-read", async ({ sessionId }) => {
            try {
                // Updates is_read = TRUE for all unread messages not sent by this user
                await telemedicineRepo.markMessagesAsRead(sessionId, socket.user.user_id);
            } catch (err) {
                console.error("Mark read error:", err);
            }
        });

        // -------------------------------------------------------
        // Event: "end-session"
        // Only the DOCTOR can end a session.
        //
        // Flow:
        //   1. Validate session exists and requesting user is the doctor.
        //   2. Update session status to ENDED in the DB.
        //   3. Broadcast "session-ended" to the entire room so both
        //      doctor and patient UIs reflect the session end.
        // -------------------------------------------------------
        socket.on("end-session", async ({ sessionId }) => {
            try {
                const session = await telemedicineRepo.getSessionById(sessionId);

                // Silently drop if session no longer exists
                if (!session) return;

                // Only the doctor of this session can trigger end
                if (session.doctor_id !== socket.user.user_id) {
                    return socket.emit("error", { message: "Only the doctor can end the session" });
                }

                // Persist the ENDED status and ended_at timestamp
                await telemedicineRepo.endSession(sessionId);

                // Notify all room members (doctor + patient) that the session is over
                io.to(sessionId).emit("session-ended", { sessionId, endedBy: socket.user.user_id });
            } catch (err) {
                console.error("End session error:", err);
            }
        });

        // -------------------------------------------------------
        // Event: "disconnect"
        // Fires automatically when a socket loses connection
        // (browser closed, network lost, user navigated away).
        // Writes an audit log for the leave event.
        // -------------------------------------------------------
        socket.on("disconnect", async () => {
            console.log(`🔌 Socket disconnected: User ${socket.user?.user_id || 'Unknown'}`);

            // Record the disconnect in audit logs; use .catch() so a DB error here
            // doesn't surface as an unhandled rejection
            if (socket.user && socket.user.user_id) {
                logAudit({
                    actor_user_id: socket.user.user_id,
                    action: "LEAVE_SOCKET",
                    entity_type: "USER",
                    entity_id: socket.user.user_id,
                    ip_address: socket.request.connection.remoteAddress || ""
                }).catch(e => console.error("Audit log error on disconnect:", e));
            }
        });
    });
};

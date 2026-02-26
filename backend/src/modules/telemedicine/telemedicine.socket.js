const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const pool = require("../../config/db");
const telemedicineRepo = require("./telemedicine.repository");

let io;

exports.initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Or specify exact frontend URL
            methods: ["GET", "POST"]
        }
    });

    // Middleware: Authenticate socket connection via handshake token
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error("Authentication error: No token provided"));
        }
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = decoded; // Attach user to socket context
            next();
        } catch (err) {
            return next(new Error("Authentication error: Invalid token"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`🔌 Socket connected: User ${socket.user.user_id}`);

        /**
         * "join-session"
         * Validate user is session.doctor_id OR session.patient_id
         */
        socket.on("join-session", async ({ sessionId }) => {
            try {
                const session = await telemedicineRepo.getSessionById(sessionId);
                if (!session) {
                    return socket.emit("error", { message: "Session not found" });
                }

                if (session.doctor_id !== socket.user.user_id && session.patient_id !== socket.user.user_id) {
                    return socket.emit("error", { message: "Unauthorized to join this session" });
                }

                // Join room
                socket.join(sessionId);

                // Audit Log for Join event
                await pool.query(
                    "INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, ip_address) VALUES ($1, $2, 'TELEMEDICINE_SESSION', $3, $4)",
                    [socket.user.user_id, "JOIN_SESSION", sessionId, socket.request.connection.remoteAddress || ""]
                );

                console.log(`👤 User ${socket.user.user_id} joined session ${sessionId}`);
            } catch (err) {
                console.error("Join session error:", err);
            }
        });

        /**
         * "send-message"
         * Validate sender belongs to session, insert into DB, emit to room
         */
        socket.on("send-message", async ({ sessionId, messageText }) => {
            try {
                const session = await telemedicineRepo.getSessionById(sessionId);
                if (!session) return;

                if (session.doctor_id !== socket.user.user_id && session.patient_id !== socket.user.user_id) {
                    return socket.emit("error", { message: "Unauthorized to send messages in this session" });
                }

                const message = await telemedicineRepo.createMessage(sessionId, socket.user.user_id, messageText);

                // Broadcast to the room
                io.to(sessionId).emit("receive-message", message);
            } catch (err) {
                console.error("Send message error:", err);
            }
        });

        /**
         * "mark-read"
         * Update message is_read for the session
         */
        socket.on("mark-read", async ({ sessionId }) => {
            try {
                await telemedicineRepo.markMessagesAsRead(sessionId, socket.user.user_id);
            } catch (err) {
                console.error("Mark read error:", err);
            }
        });

        /**
         * "end-session"
         * Only doctor allowed, Update status to ENDED, Emit session-ended event
         */
        socket.on("end-session", async ({ sessionId }) => {
            try {
                const session = await telemedicineRepo.getSessionById(sessionId);
                if (!session) return;

                if (session.doctor_id !== socket.user.user_id) {
                    return socket.emit("error", { message: "Only the doctor can end the session" });
                }

                await telemedicineRepo.endSession(sessionId);

                // Emit to room that session ended
                io.to(sessionId).emit("session-ended", { sessionId, endedBy: socket.user.user_id });
            } catch (err) {
                console.error("End session error:", err);
            }
        });

        socket.on("disconnect", async () => {
            console.log(`🔌 Socket disconnected: User ${socket.user?.user_id || 'Unknown'}`);
            if (socket.user && socket.user.user_id) {
                await pool.query(
                    "INSERT INTO audit_logs (actor_user_id, action, entity_type, ip_address) VALUES ($1, $2, 'TELEMEDICINE_SOCKET', $3)",
                    [socket.user.user_id, "LEAVE_SOCKET", socket.request.connection.remoteAddress || ""]
                ).catch(e => console.error("Audit log error on disconnect:", e));
            }
        });
    });
};

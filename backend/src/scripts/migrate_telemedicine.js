require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const pool = require("../config/db");

const migrate = async () => {
    try {
        console.log("Starting telemedicine chat migration...");

        // 1. Create telemedicine_sessions table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS telemedicine_sessions (
        session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id UUID REFERENCES appointments(appointment_id) ON DELETE CASCADE,
        doctor_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        patient_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        status VARCHAR(20) CHECK (status IN ('WAITING','ACTIVE','ENDED')) DEFAULT 'WAITING',
        started_at TIMESTAMP,
        ended_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log("✅ Created telemedicine_sessions table");

        // 2. Create telemedicine_messages table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS telemedicine_messages (
        message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES telemedicine_sessions(session_id) ON DELETE CASCADE,
        sender_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        message_text TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log("✅ Created telemedicine_messages table");

        // 3. Add Indexes
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_telemedicine_sessions_doctor ON telemedicine_sessions(doctor_id);
      CREATE INDEX IF NOT EXISTS idx_telemedicine_sessions_patient ON telemedicine_sessions(patient_id);
      CREATE INDEX IF NOT EXISTS idx_telemedicine_messages_session ON telemedicine_messages(session_id);
    `);
        console.log("✅ Created indexes for telemedicine tables");

        console.log("🎉 Migration completed successfully!");
    } catch (error) {
        console.error("❌ Migration failed:", error);
    } finally {
        await pool.end();
    }
};

migrate();

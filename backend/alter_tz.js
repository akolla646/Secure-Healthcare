require('dotenv').config();
const pool = require('./src/config/db');

const query = `
  ALTER TABLE telemedicine_sessions ALTER COLUMN started_at TYPE TIMESTAMPTZ USING started_at AT TIME ZONE 'UTC';
  ALTER TABLE telemedicine_sessions ALTER COLUMN ended_at TYPE TIMESTAMPTZ USING ended_at AT TIME ZONE 'UTC';
  ALTER TABLE telemedicine_sessions ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';
  ALTER TABLE telemedicine_messages ALTER COLUMN sent_at TYPE TIMESTAMPTZ USING sent_at AT TIME ZONE 'UTC';
`;

pool.query(query)
    .then(() => {
        console.log('Successfully altered columns to TIMESTAMPTZ');
        process.exit(0);
    })
    .catch((e) => {
        console.error('Error altering columns:', e);
        process.exit(1);
    });

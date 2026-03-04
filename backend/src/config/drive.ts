import { google } from 'googleapis';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '1PqHqKAQdYB3GLQrYtnas23wjvm9m5Gr7'; // Default fallback

if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    console.error('❌ Missing Google Drive Credentials in .env');
}

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    'https://developers.google.com/oauthplayground' // Redirect URI
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// Create the drive service
const drive = google.drive({ version: 'v3', auth: oauth2Client });

export { drive, FOLDER_ID };

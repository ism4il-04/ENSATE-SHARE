# Google Drive Integration - Documentation

This document outlines the implementation, setup, and usage of the Google Drive integration for file storage in the application.

---

## 1. Overview

The application utilizes the **Google Drive API v3** to store, retrieve, and manage uploaded files (PDFs, images, etc.). This replaces the previous Cloudinary storage implementation.

### Key Features
- **File Upload**: Files are streamed directly to a designated Google Drive folder.
- **File Management**: Uploaded files generate a view link (`webViewLink`), download link (`webContentLink`), and thumbnail link (`thumbnailLink`).
- **Permissions**: Files are automatically set to `reader` permission for `anyone`, making them publicly accessible via direct link.
- **Quota Management**: Uses OAuth 2.0 User Credentials (via a Refresh Token) to upload files on behalf of an admin account, bypassing the 0-byte storage limit of Service Accounts.

---

## 2. Setup Prerequisites

To run this integration, you need:
1.  A Google Account.
2.  A Google Cloud Project with the **Google Drive API** enabled.
3.  **OAuth 2.0 Client Credentials** (Client ID & Client Secret).
4.  A **Refresh Token** authorized with `https://www.googleapis.com/auth/drive` scope.

---

## 3. Configuration Steps

### Step 1: Create OAuth Credentials
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2.  Create an **OAuth client ID** (Application type: **Web application**).
3.  Add `https://developers.google.com/oauthplayground` to the **Authorized redirect URIs**.
4.  Note down the **Client ID** and **Client Secret**.

### Step 2: Generate Refresh Token
1.  Go to the [OAuth 2.0 Playground](https://developers.google.com/oauthplayground).
2.  Click the **Gear Icon** (⚙️) > Check **"Use your own OAuth credentials"** > Enter Client ID & Secret.
3.  Select API Scope: **Drive API v3** (`https://www.googleapis.com/auth/drive`).
4.  Click **Authorize APIs** > Log in with your Google Account.
5.  Click **"Exchange authorization code for tokens"** to get your **Refresh Token**.

### Step 3: Environment Variables
Add the following credentials to your `.env` file:

```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token
GOOGLE_DRIVE_FOLDER_ID=your_folder_id
```

---

## 4. Technical Implementation

### Architecture
- **Authentication**: Using `google-auth-library` via `googleapis`, initialized with an `OAuth2Client` and a durable Refresh Token. This ensures that the access token is automatically refreshed without manual intervention.
- **Backend**: Node.js + Express with `file.controller.ts` handling the logic.
- **Database**: MongoDB stores metadata including Drive file ID, links, and type.

### Key Files
- `src/config/drive.ts`: Initializes the Google Drive API client.
- `src/controllers/file.controller.ts`: Handles file upload streams, permission setting, and deletion.
- `src/models/File.model.ts`: Schema updated with `driveId`, `webViewLink`, `webContentLink`, `thumbnailLink`.
- `frontend/lib/utils/fileHelpers.ts`: Helper functions to generate/retrieve thumbnails from Drive links.

---

## 5. Usage

- **Upload**: Provide a file via `POST /api/files/upload`. The file is streamed to Drive, made public, and returns a file object.
- **Download**: Requests to `/api/files/:id/download` redirect to the Google Drive direct download link (`webContentLink`).
- **View**: The frontend uses `webViewLink` for previews and `thumbnailLink` for file thumbnails.

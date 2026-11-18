# Coy Discover 💗

A swipe-based profile discovery app inspired by Tinder and Bumble, built as a standalone **Discover** experience using React and Node.js.

Users can browse profiles one at a time, like or pass, and get a match only when both people like each other.

## 🌐 Live Demo

- **Frontend:** https://stirring-zabaione-75ee57.netlify.app
- **Backend:** https://coy-discover-lqof.onrender.com
- **GitHub Repository:** https://github.com/Anush0104/coy-discover

### Try it in 30 seconds

1. Open the **Discover** tab.
2. Like **Aarav** or **Vihaan** to trigger a demo match.
3. Like or Pass other profiles. Swiped profiles will not appear again.
4. Open the **Matches** tab to see mutual matches only.
5. Reload the page to verify that your swipe history is saved.

*Note: The live demo uses shared demo data. Your actions may affect what other visitors see.*

## ✨ Features

- **Three-tab navigation:** Home is an intentionally blank placeholder for Coy's existing experience, Discover contains the swipe interface, and Matches displays mutual matches.
- **30 mock profiles:** Each profile includes a photo, name, age, bio, city and interests.
- **Swipe gestures:** Drag a card right to Like or left to Pass, with card tilt and LIKE / NOPE indicators.
- **Desktop controls:** Like and Pass buttons are available alongside swipe gestures.
- **Smooth animations:** Framer Motion provides card transitions and interaction feedback.
- **Mutual matching:** A match is created only when both users have liked each other. Matching decisions are handled by the backend.
- **Match screen:** An "It's a match!" screen appears immediately after a mutual like.
- **No repeated profiles:** Once a profile is swiped, it is removed from the feed, including after a page reload.
- **Empty state:** A clear message appears when there are no profiles left.
- **Private likes:** Incoming likes are never revealed unless they become mutual matches.

## 🛠️ Tech Stack

| Area | Technology |
|---|---|
| Frontend | React, JavaScript, CSS, Framer Motion, Lucide React, esbuild |
| Backend | Node.js, Express |
| Data storage | JSON files |
| Deployment | Netlify (frontend), Render (backend) |
| Version control | Git and GitHub |

## 📁 Project Structure

```text
coy-discover/
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── public/
│   ├── build.mjs
│   ├── dev-server.mjs
│   ├── package.json
│   └── .env                 # Local only; not committed
│
├── server/
│   ├── data/
│   │   └── processed/
│   │       ├── profiles.json
│   │       └── swipes.json  # Generated automatically
│   ├── index.cjs
│   └── package.json
│
├── .gitignore
└── README.md
```

## 🚀 Run Locally

### Prerequisites

- Node.js
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Anush0104/coy-discover.git
cd coy-discover
```

### 2. Start the backend

Open a terminal:

```bash
cd server
npm install
npm start
```

The backend runs at:

```text
http://localhost:5001
```

The backend uses the `PORT` environment variable when provided, with `5001` as the local default.

### 3. Configure the frontend API URL (optional)

The frontend defaults to the same hostname on port `5001`, which works for local development.

To configure it explicitly, create `client/.env`:

```env
VITE_API_URL=http://localhost:5001
```

For a different backend URL, replace the value accordingly.

### 4. Start the frontend

Open a second terminal:

```bash
cd client
npm install
npm run start
```

Open the application:

```text
http://localhost:5173
```

### Testing on a phone

To test on a phone connected to the same Wi-Fi network:

1. Find your computer's local IPv4 address.
2. Ensure the frontend development server is configured to accept connections from your local network.
3. Set the frontend API URL to your computer's local IP and backend port, for example:

```env
VITE_API_URL=http://192.168.1.5:5001
```

4. Restart the frontend and open `http://YOUR-COMPUTER-IP:5173` on your phone.
5. Allow the required ports through your computer's firewall if prompted.

Replace the example IP with your computer's actual local IP address.

## 🔌 API Documentation

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Checks whether the backend is running |
| GET | `/feed` | Returns profiles that have not been swiped on |
| POST | `/swipe` | Records a Like or Pass and checks for a match |
| GET | `/matches` | Returns mutual matches only |

### `POST /swipe`

**Request:**

```json
{
  "profileId": 1,
  "action": "like"
}
```

The `action` field accepts either `like` or `pass`.

**Successful response:**

```json
{
  "success": true,
  "action": "like",
  "isMatch": true,
  "message": "It's a match!"
}
```

- HTTP `200`: Swipe successfully recorded.
- HTTP `400`: Invalid request data.
- HTTP `404`: Profile does not exist.
- HTTP `409`: Profile has already been swiped on.

## 💞 Matching Logic

1. The user sees a profile and chooses Like or Pass.
2. The frontend sends the swipe action to the backend.
3. The backend validates the request and saves the swipe.
4. If the user likes a profile that has already liked them, the backend creates a mutual match.
5. The backend returns `isMatch: true` for a mutual match.
6. The Matches tab retrieves and displays mutual matches through `GET /matches`.

**Privacy rule:** A one-sided like is never displayed as a match. Only mutual likes appear in the Matches tab.

## 🧪 Demo Profiles

Ten of the 30 mock profiles have synthetic incoming likes configured to demonstrate the matching flow.

**Like any of these profiles to trigger a demo match:**

Aarav, Vihaan, Arjun, Karan, Dhruv, Yash, Neil, Vivaan, Aryan and Advait.

Liking any other profile will not create a match unless the profile has an incoming like configured.

These are simulated demo interactions, not real user activity.

## 🔒 Privacy and Data Handling

- Match decisions are made on the backend, not in the browser.
- The backend removes the private `likedByUser` property before returning profiles through `/feed` and `/matches`.
- Incoming-like information is not exposed through the API.
- Profiles are returned in a fixed order, without sorting or filtering based on incoming likes.
- Previously swiped profiles are filtered out using backend-persisted swipe state.
- All profiles are mock data.
- Environment files and local swipe history are excluded through `.gitignore`.
- Profile photos use the Random User image service, with a placeholder fallback if an image fails to load.

**Important:** This is a demonstration application, not a production dating platform. It assumes a single user and does not include authentication, user accounts or a production database.

## ☁️ Deployment

### Backend — Render

Configure the Render web service with:

| Setting | Value |
|---|---|
| Root Directory | `server` |
| Build Command | `npm install` |
| Start Command | `npm start` |

The server uses Render's assigned `PORT` environment variable in deployment and defaults to port `5001` locally.

### Frontend — Netlify

Configure the Netlify site with:

| Setting | Value |
|---|---|
| Base Directory | `client` |
| Build Command | `npm run build` |
| Publish Directory | `dist` |

Set the following environment variable in Netlify under **Site settings → Environment variables**:

```env
VITE_API_URL=https://coy-discover-lqof.onrender.com
```

This variable is required for the deployed frontend to communicate with the deployed backend.

The local `client/.env` file is not committed to GitHub, so Netlify must have its own environment variable configured.

After changing environment variables, trigger a new frontend deployment so the updated configuration is included in the build.

## 💾 Swipe History and Resetting the Demo

The backend automatically creates:

```text
server/data/processed/swipes.json
```

This file stores the swipe history and matching state.

### Reset locally

1. Stop the backend server.
2. Delete `swipes.json`.
3. Restart the backend.

The initial demo state is regenerated from the mock profile data.

### Reset the live demo

The live demo uses JSON file storage. Unless a persistent disk is configured on Render, its filesystem is ephemeral, so swipe history may be lost when the service restarts or redeploys.

For a guaranteed reset, clear the backend state file using the deployed service's available storage or administration workflow.

**Shared demo state:** Since this version assumes a single user, all visitors to the live demo share the same swipe history. One visitor's actions can therefore affect another visitor's feed.

JSON file storage is suitable for this demonstration, but a production application should use a database and separate state for each authenticated user.


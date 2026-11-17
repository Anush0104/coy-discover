
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());

// Allow our React frontend to communicate with this backend.
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

const profilesPath = path.join(
  __dirname, "data", "processed", "profiles.json"
);

const statePath = path.join(
  __dirname, "data", "processed", "swipes.json"
);

const profiles = JSON.parse(
  fs.readFileSync(profilesPath, "utf8")
);

// Keep private incoming likes on the server.
// These are synthetic demo likes generated earlier.
let state;

if (fs.existsSync(statePath)) {
  state = JSON.parse(fs.readFileSync(statePath, "utf8"));
} else {
  state = {
    swipes: {},
    incomingLikes: profiles
      .filter(profile => profile.likedByUser === true)
      .map(profile => profile.id)
  };

  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

// Never send private incoming-like information to the frontend.
function publicProfile(profile) {
  const { likedByUser, ...safeProfile } = profile;
  return safeProfile;
}

function saveState() {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

// 1. Get profiles that the user has not swiped yet.
app.get("/feed", (req, res) => {
  const feed = profiles.filter(profile =>
    !state.swipes[profile.id]
  );

  res.json({
    success: true,
    profiles: feed.map(publicProfile)
  });
});

// 2. Save a Like or Pass.
app.post("/swipe", (req, res) => {
  const { profileId, action } = req.body;

  if (!Number.isInteger(profileId) ||
      !["like", "pass"].includes(action)) {
    return res.status(400).json({
      success: false,
      message: "Valid profileId and action are required."
    });
  }

  const profile = profiles.find(p => p.id === profileId);

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: "Profile not found."
    });
  }

  if (state.swipes[profileId]) {
    return res.status(409).json({
      success: false,
      message: "You have already swiped on this profile."
    });
  }

  state.swipes[profileId] = action;
  saveState();

  const isMatch =
    action === "like" &&
    state.incomingLikes.includes(profileId);

  res.json({
    success: true,
    action,
    isMatch,
    message: isMatch
      ? "It's a match!"
      : "Swipe saved successfully."
  });
});

// 3. Get only mutual matches.
app.get("/matches", (req, res) => {
  const matches = profiles.filter(profile =>
    state.swipes[profile.id] === "like" &&
    state.incomingLikes.includes(profile.id)
  );

  res.json({
    success: true,
    matches: matches.map(publicProfile)
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("--------------------------------");
  console.log("Coy Discover Backend is running!");
  console.log(`http://localhost:${PORT}`);
  console.log("--------------------------------");
});

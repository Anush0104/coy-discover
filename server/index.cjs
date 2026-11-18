const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
// Port 5000 is occupied by macOS Control Center on some development machines.
const PORT = process.env.PORT || 5001;
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

app.get("/health", (req, res) => {
  res.json({ success: true, status: "ok" });
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

const incomingLikes = profiles
  .filter(profile => profile.likedByUser === true)
  .map(profile => profile.id);


let state;

if (fs.existsSync(statePath)) {
  state = JSON.parse(fs.readFileSync(statePath, "utf8"));
} else {
  state = {
    swipes: {},
    matches: [],
    incomingLikes
  };

  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

state.swipes ||= {};
state.incomingLikes = incomingLikes;
state.matches ||= profiles
  .filter(profile =>
    state.swipes[profile.id] === "like" &&
    state.incomingLikes.includes(profile.id)
  )
  .map(profile => profile.id);

function publicProfile(profile) {
  const { likedByUser, ...safeProfile } = profile;
  return safeProfile;
}

function saveState() {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

app.get("/feed", (req, res) => {
  const feed = profiles.filter(profile =>
    !state.swipes[profile.id]
  );

  res.json({
    success: true,
    profiles: feed.map(publicProfile)
  });
});

app.post("/reset", (req, res) => {
  state.swipes = {};
  saveState();

  res.json({
    success: true,
    message: "Profiles are ready to swipe again."
  });
});

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

  const isMatch =
    action === "like" &&
    state.incomingLikes.includes(profileId);

  state.swipes[profileId] = action;

  if (isMatch && !state.matches.includes(profileId)) {
    state.matches.push(profileId);
  }

  saveState();

  res.json({
    success: true,
    action,
    isMatch,
    message: isMatch
      ? "It's a match!"
      : "Swipe saved successfully."
  });
});

app.get("/matches", (req, res) => {
  const matches = profiles.filter(profile => state.matches.includes(profile.id));

  res.json({
    success: true,
    matches: matches.map(publicProfile)
  });
});

app.listen(PORT, "0.0.0.0", () => {
  
  console.log("Coy Discover Backend is running!");
  console.log(`http://localhost:${PORT}`);
  
});
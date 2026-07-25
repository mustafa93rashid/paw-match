import { useCallback, useState } from "react";

export interface GeolocationCoords {
  latitude: number;
  longitude: number;
}

export type GeolocationStatus = "idle" | "loading" | "success" | "error";

export interface UseGeolocationResult {
  status: GeolocationStatus;
  coordinates: GeolocationCoords | null;
  errorMessage: string | null;
  request: () => void;
}

/** Wraps the browser Geolocation API — no backend geocoding endpoint exists or is needed. */
export const useGeolocation = (): UseGeolocationResult => {
  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [coordinates, setCoordinates] = useState<GeolocationCoords | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const request = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      setErrorMessage("Your browser does not support location services.");
      return;
    }

    setStatus("loading");
    setErrorMessage(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setStatus("success");
      },
      (error) => {
        setStatus("error");
        setErrorMessage(
          error.code === error.PERMISSION_DENIED
            ? "Location access was denied. Allow location access in your browser to find nearby shelters."
            : "We couldn't determine your location. Please try again.",
        );
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  return { status, coordinates, errorMessage, request };
};

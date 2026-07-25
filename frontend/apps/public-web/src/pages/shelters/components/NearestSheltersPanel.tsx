import { useMemo, useState } from "react";
import { LocateFixed, MapPinOff } from "lucide-react";
import { Button, EmptyState, ErrorState, Select } from "@paw-match/ui";
import { useGeolocation } from "@paw-match/hooks";
import { shelterHooks } from "../../../lib/shelterHooks";
import { paths } from "../../../routes/paths";
import { ShelterCard } from "./ShelterCard";
import { ShelterCardSkeleton } from "./ShelterCardSkeleton";

const distanceOptions = [
  { label: "Within 5 km", value: "5000" },
  { label: "Within 10 km", value: "10000" },
  { label: "Within 25 km", value: "25000" },
  { label: "Within 50 km", value: "50000" },
  { label: "Within 100 km", value: "100000" },
];

export const NearestSheltersPanel = () => {
  const geolocation = useGeolocation();
  const [distance, setDistance] = useState("25000");

  const params = useMemo(() => {
    if (!geolocation.coordinates) return null;

    return {
      lng: geolocation.coordinates.longitude,
      lat: geolocation.coordinates.latitude,
      distance: Number(distance),
    };
  }, [geolocation.coordinates, distance]);

  const nearestQuery = shelterHooks.useNearestShelters(params);

  if (!geolocation.coordinates) {
    return (
      <div className="mt-8">
        <EmptyState
          icon={<LocateFixed className="h-6 w-6" aria-hidden />}
          title="Find shelters near you"
          description={
            geolocation.errorMessage ??
            "Share your location to see shelters sorted by distance."
          }
          action={
            <Button
              onClick={geolocation.request}
              isLoading={geolocation.status === "loading"}
            >
              Use my location
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-48">
          <Select
            label="Search radius"
            options={distanceOptions}
            value={distance}
            onChange={(event) => setDistance(event.target.value)}
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={geolocation.request}
          isLoading={geolocation.status === "loading"}
        >
          <LocateFixed className="h-4 w-4" aria-hidden />
          Refresh location
        </Button>
      </div>

      {geolocation.status === "error" && (
        <p className="mt-2 text-sm text-red-600">{geolocation.errorMessage}</p>
      )}

      <div className="mt-8">
        {(geolocation.status === "loading" || nearestQuery.isPending) && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <ShelterCardSkeleton key={index} />
            ))}
          </div>
        )}

        {nearestQuery.isError && (
          <ErrorState
            description="We couldn't load nearby shelters right now."
            onRetry={() => nearestQuery.refetch()}
          />
        )}

        {nearestQuery.isSuccess && nearestQuery.data.length === 0 && (
          <EmptyState
            icon={<MapPinOff className="h-6 w-6" aria-hidden />}
            title="No shelters found nearby"
            description="Try increasing your search radius."
          />
        )}

        {nearestQuery.isSuccess && nearestQuery.data.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {nearestQuery.data.map((shelter) => (
              <ShelterCard
                key={shelter._id}
                shelter={shelter}
                to={`${paths.shelters}/${shelter._id}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import { motion, useReducedMotion } from "framer-motion";
import { EmptyState, ErrorState, Spinner } from "@paw-match/ui";
import { shelterEmployeeProfileHooks } from "../../lib/shelterEmployeeProfileHooks";
import { AnimalManagementBoard } from "./components/AnimalManagementBoard";

/**
 * Manager-only route (Super Admin's /animals now resolves to
 * AnimalShelterOverviewPage instead — see App.tsx). shelterId always comes
 * from the Manager's own ShelterEmployeeProfile; the actual list/filter/
 * mutation UI lives in AnimalManagementBoard, shared with Super Admin's
 * per-shelter drill-down page.
 */
const AnimalsPage = () => {
  const reduceMotion = Boolean(useReducedMotion());
  const profileQuery = shelterEmployeeProfileHooks.useMyShelterEmployeeProfile();
  const shelterId = profileQuery.data?.shelterId?._id;

  if (profileQuery.isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Spinner label="Loading…" />
      </div>
    );
  }

  if (profileQuery.isError) {
    return <ErrorState title="Couldn't load your profile" onRetry={() => profileQuery.refetch()} />;
  }

  if (!shelterId) {
    return (
      <EmptyState
        title="You're not assigned to a shelter yet"
        description="Contact your administrator to be added to a shelter."
      />
    );
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <AnimalManagementBoard
        shelterId={shelterId}
        isSuperAdmin={false}
        title="Animals"
        description="List new animals and keep profiles up to date."
      />
    </motion.div>
  );
};

export default AnimalsPage;

import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { UserRole } from "@paw-match/types";
import { useAuth } from "../lib/auth";
import { SuperAdminOverview } from "./superadmin/SuperAdminOverview";
import { ShelterEmployeeOverview } from "./shelterEmployee/ShelterEmployeeOverview";
import { VetOverview } from "./vet/VetOverview";

const roleBadgeTone: Record<UserRole, BadgeTone> = {
  superadmin: "brand",
  shelterEmployee: "accent",
  vet: "accent",
  adopter: "neutral",
};

const roleLabel: Record<UserRole, string> = {
  superadmin: "Super Admin",
  shelterEmployee: "Shelter Employee",
  vet: "Veterinarian",
  adopter: "Adopter",
};

const OverviewPage = () => {
  const reduceMotion = Boolean(useReducedMotion());
  const auth = useAuth();
  const role = auth.user?.role;

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back{auth.user ? `, ${auth.user.firstName}` : ""}
          </h1>
          {auth.user && <Badge tone={roleBadgeTone[auth.user.role]}>{roleLabel[auth.user.role]}</Badge>}
        </div>
        <p className="mt-1.5 text-sm text-slate-500">{today}</p>
      </motion.div>

      {role === "superadmin" ? (
        <SuperAdminOverview />
      ) : role === "shelterEmployee" ? (
        <ShelterEmployeeOverview />
      ) : role === "vet" ? (
        <VetOverview />
      ) : null}
    </div>
  );
};

export default OverviewPage;

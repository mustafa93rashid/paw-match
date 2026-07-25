import { ClipboardList, PawPrint } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { EmptyState, ErrorState, ListSkeleton } from "@paw-match/ui";
import type { Animal, ShelterAdoptionRequest } from "@paw-match/types";

export interface RecentRecordsFeedProps {
  animals: Animal[] | undefined;
  requests: ShelterAdoptionRequest[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

interface RecordItem {
  id: string;
  title: string;
  subtitle: string;
  createdAt: string;
  icon: typeof PawPrint;
}

const RECENT_ANIMALS_COUNT = 5;
const RECENT_REQUESTS_COUNT = 5;
const MAX_FEED_ITEMS = 8;

/** Derived from the shelter's most recently added animals + most recent adoption requests — there is no dedicated activity/audit-log endpoint on the backend. */
const buildRecordItems = (animals: Animal[], requests: ShelterAdoptionRequest[]): RecordItem[] => {
  const animalItems: RecordItem[] = animals.slice(0, RECENT_ANIMALS_COUNT).map((animal) => ({
    id: `animal-${animal._id}`,
    title: `New animal added: ${animal.name}`,
    subtitle: `${animal.breed} · ${animal.species}`,
    createdAt: animal.createdAt,
    icon: PawPrint,
  }));

  const requestItems: RecordItem[] = requests.slice(0, RECENT_REQUESTS_COUNT).map((request) => ({
    id: `request-${request._id}`,
    title: `Adoption request for ${request.animalId.name}`,
    subtitle: request.adopterId ? `${request.adopterId.firstName} ${request.adopterId.lastName}` : "Unknown adopter",
    createdAt: request.createdAt,
    icon: ClipboardList,
  }));

  return [...animalItems, ...requestItems]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_FEED_ITEMS);
};

/** Not a real activity/audit trail — the backend has no such endpoint. This is a derived approximation from recently added animals and adoption requests. */
export const RecentRecordsFeed = ({ animals, requests, isLoading, isError, onRetry }: RecentRecordsFeedProps) => {
  const reduceMotion = Boolean(useReducedMotion());

  if (isLoading) {
    return <ListSkeleton count={4} label="Loading recent records" />;
  }

  if (isError) {
    return <ErrorState title="Couldn't load recent records" onRetry={onRetry} />;
  }

  const items = buildRecordItems(animals ?? [], requests ?? []);

  if (items.length === 0) {
    return (
      <EmptyState
        title="No recent records yet"
        description="New animals and adoption requests will show up here."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item, index) => (
        <motion.li
          key={item.id}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: reduceMotion ? 0 : index * 0.05 }}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur-xl"
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
            <item.icon className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-900">{item.title}</p>
            <p className="truncate text-xs text-slate-500">{item.subtitle}</p>
          </div>
          <span className="shrink-0 text-xs text-slate-400">
            {new Date(item.createdAt).toLocaleDateString()}
          </span>
        </motion.li>
      ))}
    </ul>
  );
};

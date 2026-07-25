import { Badge, Modal } from "@paw-match/ui";
import type { BadgeTone } from "@paw-match/ui";
import type { Animal } from "@paw-match/types";

export interface AnimalQuickViewModalProps {
  animal: Animal | null;
  onClose: () => void;
}

const adoptionStatusTone: Record<Animal["adoptionStatus"], BadgeTone> = {
  available: "accent",
  pending: "brand",
  adopted: "neutral",
  unavailable: "neutral",
};

const healthStatusLabel: Record<Animal["healthStatus"], string> = {
  healthy: "Healthy",
  needsCare: "Needs care",
  specialNeeds: "Special needs",
  underTreatment: "Under treatment",
};

/** Read-only preview built entirely from data already present in the animals list response — no additional API calls. */
export const AnimalQuickViewModal = ({ animal, onClose }: AnimalQuickViewModalProps) => (
  <Modal isOpen={Boolean(animal)} onClose={onClose} title={animal?.name ?? "Animal details"}>
    {animal && (
      <div className="flex flex-col gap-4">
        {animal.images.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {animal.images.map((image) => (
              <img key={image._id} src={image.url} alt="" className="h-20 w-full rounded-lg object-cover" />
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Badge tone={adoptionStatusTone[animal.adoptionStatus]} className="capitalize">
            {animal.adoptionStatus}
          </Badge>
          <Badge tone={animal.isActive ? "accent" : "neutral"}>{animal.isActive ? "Active" : "Inactive"}</Badge>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Shelter</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{animal.shelterId.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Species</dt>
            <dd className="mt-0.5 font-medium capitalize text-slate-700">{animal.species}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Breed</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{animal.breed}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Age</dt>
            <dd className="mt-0.5 font-medium text-slate-700">
              {animal.age} {animal.ageUnit}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Gender</dt>
            <dd className="mt-0.5 font-medium capitalize text-slate-700">{animal.gender}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Size</dt>
            <dd className="mt-0.5 font-medium capitalize text-slate-700">{animal.size}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Color</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{animal.color}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Health status</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{healthStatusLabel[animal.healthStatus]}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-slate-400">Vaccinated</dt>
            <dd className="mt-0.5 font-medium text-slate-700">{animal.vaccinated ? "Yes" : "No"}</dd>
          </div>
        </dl>

        {animal.description && <p className="text-sm leading-relaxed text-slate-600">{animal.description}</p>}

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Adoption requirements</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge tone="neutral" className="capitalize">
              {animal.requirements.homeType} home
            </Badge>
            <Badge tone="neutral" className="capitalize">
              {animal.requirements.experienceLevel} experience
            </Badge>
            <Badge tone="neutral" className="capitalize">
              {animal.requirements.dailyActivityLevel} activity
            </Badge>
            {animal.requirements.suitableForKids && <Badge tone="neutral">Good with kids</Badge>}
            {animal.requirements.goodWithOtherPets && <Badge tone="neutral">Good with other pets</Badge>}
            {animal.requirements.hypoallergenic && <Badge tone="neutral">Hypoallergenic</Badge>}
          </div>
        </div>
      </div>
    )}
  </Modal>
);

import { Compass } from "lucide-react";
import { ButtonLink, EmptyState } from "@paw-match/ui";
import { paths } from "../routes/paths";

const NotFoundPage = () => (
  <EmptyState
    icon={<Compass className="h-6 w-6" aria-hidden />}
    title="Page not found"
    description="This part of the Dashboard doesn't exist."
    action={<ButtonLink to={paths.home}>Back to overview</ButtonLink>}
  />
);

export default NotFoundPage;

import { Construction } from "lucide-react";
import { ButtonLink, Container } from "@paw-match/ui";
import { paths } from "../routes/paths";

export interface ComingSoonPageProps {
  title: string;
  description?: string;
}

/** Real, designed placeholder for approved routes not yet built — keeps nav honest. */
const ComingSoonPage = ({ title, description }: ComingSoonPageProps) => (
  <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-6 py-20 text-center">
    <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-100 text-accent-600">
      <Construction className="h-8 w-8" aria-hidden />
    </span>
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        {title}
      </h1>
      <p className="mt-3 max-w-md text-slate-600">
        {description ??
          "This part of Paw Match is being built and will be available soon."}
      </p>
    </div>
    <ButtonLink to={paths.home}>Back to home</ButtonLink>
  </Container>
);

export default ComingSoonPage;

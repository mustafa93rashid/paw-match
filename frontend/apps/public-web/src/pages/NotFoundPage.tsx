import { Compass } from "lucide-react";
import { ButtonLink, Container } from "@paw-match/ui";
import { paths } from "../routes/paths";

const NotFoundPage = () => (
  <Container className="flex min-h-[60vh] flex-col items-center justify-center gap-6 py-20 text-center">
    <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
      <Compass className="h-8 w-8" aria-hidden />
    </span>
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-slate-600">
        This page doesn&apos;t exist yet, or the link you followed is out of
        date. Let&apos;s get you back on track.
      </p>
    </div>
    <ButtonLink to={paths.home}>Back to home</ButtonLink>
  </Container>
);

export default NotFoundPage;

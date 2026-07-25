import { Hero } from "./Hero";
import { FeaturedAnimals } from "./FeaturedAnimals";
import { HowItWorks } from "./HowItWorks";
import { WhyChooseUs } from "./WhyChooseUs";
import { SuccessStories } from "./SuccessStories";
import { VerifiedShelters } from "./VerifiedShelters";
import { MeetVeterinarians } from "./MeetVeterinarians";
import { Statistics } from "./Statistics";
import { FAQ } from "./FAQ";
import { WorkWithUs } from "./WorkWithUs";
import { FinalCta } from "./FinalCta";
import { SectionNav } from "./components/SectionNav";

const HomePage = () => (
  <>
    <SectionNav />
    <Hero />
    <FeaturedAnimals />
    <HowItWorks />
    <WhyChooseUs />
    <SuccessStories />
    <VerifiedShelters />
    <MeetVeterinarians />
    <Statistics />
    <FAQ />
    <WorkWithUs />
    <FinalCta />
  </>
);

export default HomePage;

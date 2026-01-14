import {
  Header,
  Hero,
  Demo,
  Features,
  Agents,
  HowItWorks,
  Pricing,
  Testimonials,
  CTA,
  Footer,
} from "@/components/landing";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Demo />
        <Features />
        <HowItWorks />
        <Agents />
        <Pricing />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </>
  );
}

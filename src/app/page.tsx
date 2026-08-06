import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import HeroSection from "@/sections/hero/hero-section";
import NeoMethodSection from "@/sections/neo-method/neomethod-sections";
import TransformationsSection from "@/sections/transformations/transformations-section";
import ProgramsSection from "@/sections/programs/programs-section";
import AboutSection from "@/sections/about/about-section";
import TestimonialsSection from "@/sections/testimonials/testimonials-section";
import FAQSection from "@/sections/faq/faq-section";
import ContactSection from "@/sections/contact/contact-section";
import FreePlanCTA from "@/components/FreePlanCTA";

export default function Home() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <NeoMethodSection />
      <TransformationsSection />
      <ProgramsSection />
      <FreePlanCTA />
      <AboutSection />
      <TestimonialsSection />
      <FAQSection />
      <ContactSection />
      <Footer />
    </main>
  );
}

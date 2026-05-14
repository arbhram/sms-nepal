import Nav         from '../components/landing/Nav.jsx';
import Hero        from '../components/landing/Hero.jsx';
import Features    from '../components/landing/Features.jsx';
import HowItWorks  from '../components/landing/HowItWorks.jsx';
import WhyWephas   from '../components/landing/WhyWephas.jsx';
import Pricing     from '../components/landing/Pricing.jsx';
import FAQ         from '../components/landing/FAQ.jsx';
import FinalCTA    from '../components/landing/FinalCTA.jsx';
import Footer      from '../components/landing/Footer.jsx';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <WhyWephas />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}

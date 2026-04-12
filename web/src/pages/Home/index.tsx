import Hero from './Hero';
import DemoVideo from './DemoVideo';
import HowItWorks from './HowItWorks';
import SilentConversion from './SilentConversion';
import AlgorithmSecret from './AlgorithmSecret';
import Features from './Features';
import UseCases from './UseCases';
import D2CTeaser from './D2CTeaser';
// import Testimonials from './Testimonials';
import FAQ from './FAQ';
// import StatsBanner from '../../components/StatsBanner';
// import CompanyCarousel from '../../components/CompanyCarousel';
import FinalCTA from '../../components/FinalCTA';

const HomePage = () => (
  <>
    <Hero />
    {/* <StatsBanner /> */}
    <DemoVideo />
    <HowItWorks />
    <SilentConversion />
    <AlgorithmSecret />
    <Features />
    <UseCases />
    <D2CTeaser />
    {/* <CompanyCarousel /> */}
    {/* <Testimonials /> */}
    <FAQ />
    <FinalCTA />
  </>
);

export default HomePage;

import Hero from './Hero';
import DemoVideo from './DemoVideo';
import HowItWorks from './HowItWorks';
import AlgorithmSecret from './AlgorithmSecret';
import Features from './Features';
import UseCases from './UseCases';
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
    <AlgorithmSecret />
    <Features />
    <UseCases />
    {/* <CompanyCarousel /> */}
    {/* <Testimonials /> */}
    <FAQ />
    <FinalCTA />
  </>
);

export default HomePage;

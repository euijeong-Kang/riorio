import { useState, useEffect } from 'react';
import Hero from './components/Hero';
import About from './components/About';
import CoursePreview from './components/CoursePreview';
import GuestStories from './components/GuestStories';
import ReservationCTA from './components/ReservationCTA';
import Footer from './components/Footer';
import ShareButton from '../../components/feature/ShareButton';
import CourseTimeModal from './components/CourseTimeModal';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className={`min-h-screen bg-[#0C2A23] transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <Hero />
      <About />
      <CoursePreview />
      <GuestStories />
      <ReservationCTA />
      <Footer />
      <ShareButton />
      <CourseTimeModal />
    </div>
  );
}

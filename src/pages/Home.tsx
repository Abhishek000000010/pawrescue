import React from 'react';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import HowItWorks from '../components/HowItWorks';
import FeatureBento from '../components/FeatureBento';
import Guardians from '../components/Guardians';
import BeforeAfterStories from '../components/BeforeAfterStories';
import CTA from '../components/CTA';

// If currentView changes, we might want to render AdoptPage or CommunityFeed here.
import AdoptPage from '../components/AdoptPage';
import CommunityFeed from '../components/CommunityFeed';
import ReportPage from '../components/ReportPage';
import RescueCommandCenter from '../components/RescueCommandCenter';
import Missions from './Missions';

interface HomeProps {
  onReportClick: () => void;
  onAdoptClick: () => void;
  onVolunteerClick: () => void;
  onJoinClick: () => void;
  onMapClick: () => void;
  onMissionsClick: () => void;
  currentView: 'home' | 'community' | 'report' | 'adopt' | 'map' | 'missions';
}

const Home: React.FC<HomeProps> = ({ onReportClick, onAdoptClick, onVolunteerClick, onJoinClick, onMapClick, onMissionsClick, currentView }) => {
  if (currentView === 'map') {
    return <RescueCommandCenter />;
  }

  if (currentView === 'adopt') {
    return <AdoptPage />;
  }
  
  if (currentView === 'community') {
    return <CommunityFeed />;
  }

  if (currentView === 'report') {
    return <ReportPage onReportSuccess={() => {}} onNavigateHome={() => {}} />;
  }

  if (currentView === 'missions') {
    return <Missions />;
  }

  return (
    <div className="flex flex-col w-full overflow-hidden bg-brand-light dark:bg-brand-dark transition-colors duration-500">
      <Hero 
        onReportClick={onReportClick} 
        onAdoptClick={onAdoptClick} 
        onVolunteerClick={onVolunteerClick} 
      />
      <FeatureBento 
        onMapClick={onMapClick}
        onMissionsClick={onMissionsClick}
        onAdoptClick={onAdoptClick}
        onVolunteerClick={onVolunteerClick}
      />
      <HowItWorks />
      <CTA onJoinClick={onJoinClick} onHelpClick={onVolunteerClick} />
    </div>
  );
};

export default Home;

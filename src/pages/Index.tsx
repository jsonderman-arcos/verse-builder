import { useNavigate } from "react-router-dom";
import { HeroSection } from "@/components/ui/hero-section";
import { Navigation } from "@/components/ui/navigation";

const Index = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/verses");
  };

  return (
    <>
      <Navigation />
      <HeroSection onGetStarted={handleGetStarted} />
    </>
  );
};

export default Index;

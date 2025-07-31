import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { HeroSection } from "@/components/ui/hero-section";
import { Navigation } from "@/components/ui/navigation";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate("/verses");
    } else {
      navigate("/signup");
    }
  };

  return (
    <>
      <Navigation />
      <HeroSection onGetStarted={handleGetStarted} />
    </>
  );
};

export default Index;

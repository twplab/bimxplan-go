import { BIMxPlanHero } from "@/components/BIMxPlanHero";
import { ChatBot } from "@/components/ChatBot";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <>
      <BIMxPlanHero />
      <ChatBot />
      
      {/* Auth CTA for logged out users */}
      <div className="fixed top-4 right-4 z-50">
        <Button 
          onClick={() => window.location.href = '/auth'}
          variant="outline"
          className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
          Sign In
        </Button>
      </div>
    </>
  );
};

export default Index;

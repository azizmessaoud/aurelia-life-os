import { AppLayout } from "@/components/layout/AppLayout";
import { GPSCoachFlow } from "@/components/gps-coach/GPSCoachFlow";

export default function GPSCoach() {
  return (
    <AppLayout>
      <div className="container py-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold gradient-text">GPS Coach</h1>
          <p className="text-muted-foreground mt-1">
            Create your goal achievement blueprint with AI-guided coaching
          </p>
        </div>
        
        <GPSCoachFlow />
      </div>
    </AppLayout>
  );
}

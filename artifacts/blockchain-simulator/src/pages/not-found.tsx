import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-6">
        <AlertCircle className="w-24 h-24 text-destructive mx-auto opacity-80" />
        <h1 className="text-4xl font-display font-bold">404 - Node Not Found</h1>
        <p className="text-muted-foreground font-mono max-w-md mx-auto">
          The block or endpoint you are looking for does not exist on this chain.
        </p>
        <Link href="/" className="inline-block mt-4">
          <Button variant="outline" size="lg">
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

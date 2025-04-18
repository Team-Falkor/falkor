import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorStateProps {
  error: string;
  retry: () => void;
}

export function ErrorState({ error, retry }: ErrorStateProps) {
  return (
    <Card className="border-destructive bg-destructive/10">
      <CardHeader>
        <CardTitle className="text-destructive">
          Error Loading Downloads
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-destructive-foreground">{error}</p>
        <Button onClick={retry} variant="destructive" className="mt-4">
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}

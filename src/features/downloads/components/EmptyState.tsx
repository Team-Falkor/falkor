import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownToLine } from "lucide-react";

export function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center h-64 py-10 text-center">
        <ArrowDownToLine className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-xl font-semibold mb-2">No Downloads Yet</p>
        <p className="text-muted-foreground">
          Downloads you start will appear here.
        </p>
      </CardContent>
    </Card>
  );
}

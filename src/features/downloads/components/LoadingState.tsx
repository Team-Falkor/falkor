import { Loader2 } from "lucide-react";

export function LoadingState() {
  return (
    <div className="flex justify-center items-center h-64 text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin mr-2" />
      <span>Loading downloads...</span>
    </div>
  );
}

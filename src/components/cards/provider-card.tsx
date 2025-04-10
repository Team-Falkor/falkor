import { PluginSetupJSON, Provider } from "@/@types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { invoke } from "@/lib";
import { format } from "date-fns";
import { Download, UserIcon } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

interface ProviderCardProps {
  provider: Provider;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const setupJSON: PluginSetupJSON = JSON.parse(provider?.setupJSON);

  // get 4 letters from name after space or use the min number of words if below 4
  const words = useMemo(() => provider.name.split(" "), [provider.name]);
  const logo = useMemo(
    () => (words.length > 4 ? words[0][0] + words[1][0] : words[0]),
    [words]
  );

  const handleInstall = async () => {
    const installed = await invoke<
      { message: string; success: boolean },
      string
    >("plugins:install", provider.setupUrl);
    if (!installed?.success) {
      toast.error(installed?.message);
      return;
    }

    toast.success("Plugin installed");
  };

  return (
    <Card className="group h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.01] relative overflow-hidden">
      <CardHeader className="justify-center items-center text-center space-y-4">
        <div className="w-full flex justify-center">
          <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted/20">
            <img
              src={setupJSON.logo}
              alt={`${provider.name} logo`}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
              onError={(e) => {
                e.currentTarget.src =
                  "https://placehold.co/96x96?text=" + encodeURIComponent(logo);
              }}
              loading="lazy"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <CardTitle className="text-xl font-semibold transition-colors duration-200 group-hover:text-primary">
            {provider.name}
          </CardTitle>
          <CardDescription className="text-sm">
            {format(new Date(provider.createdAt), "PPP")}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-pretty text-center w-full text-sm text-muted-foreground">
          {setupJSON.description}
        </p>
      </CardContent>
      <CardFooter className="w-full mt-auto">
        <div className="flex justify-between items-center w-full  gap-4">
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <a
              href={setupJSON.author?.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors duration-200 group/author"
            >
              <UserIcon className="size-4 flex-shrink-0" />
              <span className="truncate text-sm group-hover/author:underline">
                {setupJSON.author?.name}
              </span>
            </a>
            <p className="text-xs text-muted-foreground/75">
              Version {setupJSON.version}
            </p>
          </div>
          <Button
            size="sm"
            className="transition-all duration-200 hover:scale-105"
            onClick={handleInstall}
          >
            <Download />
            Install
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

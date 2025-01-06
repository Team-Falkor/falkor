import { H3 } from "@/components/typography/h3";
import { H4 } from "@/components/typography/h4";
import { useSettings } from "@/hooks";
import { cn, shouldHideTitleBar } from "@/lib";
import { ErrorComponentProps, Link } from "@tanstack/react-router";
import { H1 } from "../typography/h1";
import { Button, buttonVariants } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";

const ErrorComponent = (props: ErrorComponentProps) => {
  const { settings } = useSettings();

  return (
    <div
      className={cn(
        "flex flex-col items-start h-screen justify-start w-full gap-3 p-4",
        {
          "h-[calc(100vh-2rem)]": !shouldHideTitleBar(settings?.titleBarStyle),
        }
      )}
    >
      <div className="flex flex-col items-start justify-center w-full gap-0.5">
        <H3>{props.error.name}</H3>
        <H4 className="text-muted-foreground">{props.error.message}</H4>
      </div>
      <div className="flex-1 w-full p-1 overflow-hidden">
        <ScrollArea
          className={cn(
            "rounded-lg shadow-lg transition-all ease-in-out size-full ring-1 ring-muted p-3 overflow-y-auto"
          )}
        >
          <pre className="w-full font-mono text-sm whitespace-pre-wrap text-balance text-muted-foreground">
            {props.error.stack}
          </pre>
        </ScrollArea>
      </div>
      <div className="flex flex-col items-center w-full">
        <div className="flex flex-row justify-between w-full gap-2">
          <Link to="/" className={buttonVariants()}>
            Go to Home
          </Link>
          <H1>Report This Error to the Developer</H1>
          <Button onClick={props.reset} variant={"destructive"}>
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorComponent;

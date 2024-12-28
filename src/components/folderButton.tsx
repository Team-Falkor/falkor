import { invoke } from "@/lib";
import { Folder } from "lucide-react";
import { JSX } from "react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface Props {
  path: string | "downloads";
  icon?: JSX.Element;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | null;
  size?: "default" | "icon" | "sm" | "lg" | null;
  tooltip?: string;
}

const FolderButton = ({
  path,
  icon,
  tooltip,
  variant = "secondary",
  size = "icon",
}: Props) => {
  const handleClick = () => {
    if (path === "downloads") {
      invoke("generic:open-downloads");
      return;
    }
    invoke("generic:open-folder", path);
  };

  return (
    <Tooltip>
      <TooltipTrigger disabled={!tooltip}>
        <Button variant={variant} onClick={handleClick} size={size}>
          {icon ?? <Folder />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
};

export default FolderButton;

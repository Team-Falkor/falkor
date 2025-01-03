import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Download } from "lucide-react";

const AddDownloadButton = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="icon" size={"icon"}>
          <Download />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="grid gap-4">
          <Input placeholder="Magnet link" />
          <Button>Add</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AddDownloadButton;

import { Button } from "@/components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { invoke } from "@/lib";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

const AddPluginModal = ({ setOpen }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [_error, setError] = useState<string | null>(null);

  const handleAddPlugin = async () => {
    if (!inputRef.current) return;
    const url = inputRef?.current?.value;

    if (!url.includes(".json")) return;

    const installed = await invoke<
      { message: string; success: boolean },
      string
    >("plugins:install", url);

    if (!installed?.success) {
      setError(installed?.message ?? null);
      toast.error(installed?.message ?? null);
      return;
    }

    inputRef.current.value = "";
    setError(null);

    toast.success(installed?.message ?? null);
    setOpen(false);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add Plugin</DialogTitle>
        <DialogDescription>Add a plugin from a url</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col">
        <Input
          type="text"
          placeholder="the plugins setup.json"
          className="w-full"
          ref={inputRef}
        />
      </div>

      <DialogFooter>
        <DialogClose>
          <Button variant={"destructive"}>Cancel</Button>
        </DialogClose>

        <Button onClick={handleAddPlugin}>Add Plugin</Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default AddPluginModal;

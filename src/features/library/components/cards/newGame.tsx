import { PlusIcon } from "lucide-react";

const NewGameCard = () => {
  return (
    <div className="relative w-full p-0 overflow-hidden rounded-t-lg cursor-pointer h-44 group">
      {/* BG */}
      <div className="w-full h-full rounded-md bg-linear-to-tr from-blue-400 to-purple-400" />
      <div className="absolute inset-0 z-0 flex items-center justify-center transition-all opacity-100 bg-linear-to-tl from-background to-transparent hover:opacity-85">
        <PlusIcon fill="white" className="size-10" />
      </div>
    </div>
  );
};

export { NewGameCard };

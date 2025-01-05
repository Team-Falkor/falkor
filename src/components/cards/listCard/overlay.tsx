import { H5 } from "@/components/typography/h5";

interface ListCardOverlayProps {
  title: string;
}

const ListCardOverlay: React.FC<ListCardOverlayProps> = ({ title }) => (
  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center transition duration-300 ease-out translate-y-full rounded opacity-0 cursor-pointer bg-slate-700/80 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 group-focus:translate-y-0 group-focus:opacity-100">
    <div className="flex flex-col items-center justify-center w-full gap-4 p-2">
      <div className="flex flex-col w-full gap-1">
        <H5 className="text-center text-white whitespace-pre-line break-before-avoid text-balance">
          {title}
        </H5>
      </div>
    </div>
  </div>
);

export default ListCardOverlay;

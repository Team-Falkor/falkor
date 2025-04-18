import { ProtonDBTierColor } from "@/@types";
import { useProtonDb } from "@/hooks";

import protonDBBadge from "@/assets/protondb.png";

interface Props {
  appId: string;
}

const ProtonDbBadge = ({ appId }: Props) => {
  const { data, error, isPending } = useProtonDb(appId);

  if (isPending || error) return null;
  if (!data) return null;

  const { tier } = data;

  if (tier === "pending" || !tier) return null;

  const color = ProtonDBTierColor[tier as keyof typeof ProtonDBTierColor];

  return (
    <div
      className="flex items-center justify-center h-8 gap-0.5 px-3 py-1 overflow-hidden"
      style={{ backgroundColor: color }}
    >
      <img src={protonDBBadge} className="object-contain size-full" />
      {/* <span className="text-lg font-bold text-black uppercase">{tier}</span> */}
    </div>
  );
};

export default ProtonDbBadge;

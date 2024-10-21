import { useMemo } from "react";

interface Props {
  percent: number;
}

const PercentBar = ({ percent }: Props) => {
  const barStyle = useMemo(() => {
    return { width: `${percent}%` };
  }, [percent]);

  return (
    <div className="inset-x-0 bottom-0 z-[3] w-full h-1 bg-primary/20 overflow-hidden relative rounded-full">
      <div
        className="absolute inset-x-0 bottom-0 z-[4] h-full bg-gradient-to-br from-blue-400 to-purple-400 transition-all duration-300 ease-in-out"
        style={barStyle}
      />
    </div>
  );
};

export default PercentBar;
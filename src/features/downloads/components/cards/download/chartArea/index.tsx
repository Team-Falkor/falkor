import { useMemo } from "react";
import PercentBar from "../percentBar";
import DownloadCardChart from "./chart";

type ChartData = {
  speed: number;
};

interface Props {
  progress: number;
  timeRemaining: number | "completed";
  chartData: ChartData[];
}

const DownloadCardChartArea = ({ progress, timeRemaining, chartData }: Props) => {
  const memoizedProgress = useMemo(() => progress ?? 0, [progress]);
  const memoizedChartData = useMemo(() => chartData, [chartData]);

  return (
    <div className="size-full p-3.5 py-4 bg-card border rounded-xl overflow-hidden">
      <div className="size-full flex flex-col relative gap-5 justify-between">
        <div className="size-full overflow-hidden">
          <DownloadCardChart chartData={memoizedChartData} />
        </div>
        <div className="w-full">
          <PercentBar percent={memoizedProgress} timeRemaning={timeRemaining} />
        </div>
      </div>
    </div>
  );
};

export default DownloadCardChartArea;

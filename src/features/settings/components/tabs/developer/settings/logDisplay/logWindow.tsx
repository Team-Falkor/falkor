import { ScrollArea } from "@/components/ui/scroll-area";

import { H5 } from "@/components/ui/typography";
import { cn, trpc } from "@/lib";
import LogSwitch from "./logSwitch";

interface LogWindowProps {
	enabled: boolean;
}

const LogWindow = ({ enabled }: LogWindowProps) => {
	const { data: logs } = trpc.logging.getLogs.useQuery(undefined, {
		enabled,
	});

	return (
		<div>
			<ScrollArea
				className={cn("size-full h-0 rounded-lg transition-all ease-in-out", {
					"mt-4 h-96 w-full ring-1 ring-muted": enabled,
					"": !enabled,
				})}
			>
				<div className="flex size-full flex-col items-start justify-start gap-2 py-2">
					{logs?.length ? (
						logs.map((log) => {
							return (
								<LogSwitch {...log} key={log.message?.split("")?.join("")} />
							);
						})
					) : (
						<div className="flex size-full items-center justify-center">
							<H5>No logs</H5>
						</div>
					)}
				</div>
			</ScrollArea>
		</div>
	);
};

export default LogWindow;

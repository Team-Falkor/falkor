import { CloudDownload } from "lucide-react";
import FalkorDevTools, { type DevTool } from "./DevTools";
import UpdaterDevToolPanel from "./items/UpdaterDevToolPanel";

const devTools: DevTool[] = [
	{
		name: "updater",
		icon: <CloudDownload className="text-yellow-400" />,
		component: <UpdaterDevToolPanel />,
	},
];

const DisplayDevTools = () => {
	if (process.env.NODE_ENV !== "development") {
		return null;
	}

	return <FalkorDevTools tools={devTools} />;
};

export default DisplayDevTools;

import { CloudDownload, LayoutPanelLeft } from "lucide-react";
import FalkorDevTools, { type DevTool } from "./DevTools";
import GenericDevTools from "./items/GenericDevTools";
import UpdaterDevToolPanel from "./items/UpdaterDevToolPanel";

const devTools: DevTool[] = [
	{
		name: "updater",
		icon: <CloudDownload className="text-yellow-400" />,
		component: <UpdaterDevToolPanel />,
	},
	{
		name: "generic",
		icon: <LayoutPanelLeft className="text-blue-400" />,
		component: <GenericDevTools />,
	},
];

const DisplayDevTools = () => {
	if (process.env.NODE_ENV !== "development") {
		return null;
	}

	return <FalkorDevTools tools={devTools} />;
};

export default DisplayDevTools;

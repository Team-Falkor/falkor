import { PropsWithChildren } from "react";

const SettingsContainer = ({ children }: PropsWithChildren) => {
  return <div className="flex flex-col gap-3 p-4 px-7">{children}</div>;
};

export default SettingsContainer;

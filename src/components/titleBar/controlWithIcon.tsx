import { invoke } from "@/lib";
import { HtmlHTMLAttributes, PropsWithChildren } from "react";

interface TitleBarControlProps extends HtmlHTMLAttributes<HTMLButtonElement> {
  type: "minimize" | "maximize" | "close";
}

const TitleBarControlWithIcon = ({
  type,
  className,
  children,
  ...props
}: PropsWithChildren<TitleBarControlProps>) => {
  return (
    <button
      className="p-1 transition-transform transform rounded-full outline-hidden cursor-pointer titlebar-button group hover:scale-110 focus-visible:ring-2"
      onClick={() => invoke(`app:${type}`)}
      aria-label={type}
      {...props}
    >
      {children}
    </button>
  );
};

export default TitleBarControlWithIcon;

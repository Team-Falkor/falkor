import { cn } from "@/lib";
import { HTMLAttributes, PropsWithChildren, Ref } from "react";

type Props = PropsWithChildren<HTMLAttributes<HTMLDivElement>> & {
  ref?: Ref<HTMLDivElement>;
};

const MainContainer = ({ children, className, id, ref, ...rest }: Props) => {
  return (
    <div
      ref={ref}
      className={cn("main-container", "p-6 lg:px-10", className)}
      id={id}
      {...rest}
    >
      {children}
    </div>
  );
};

export default MainContainer;

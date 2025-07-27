import clsx from "clsx";
import { PropsWithChildren } from "react";

interface WaitlistWrapperProps extends PropsWithChildren {
  minHeight?: string;
}

export function WaitlistWrapper({ children, minHeight = "600px" }: WaitlistWrapperProps) {
  return (
    <div
      className={clsx(
        "w-full max-w-2xl mx-auto flex flex-col justify-center items-center bg-gray-1/85 pb-0 overflow-hidden rounded-2xl",
        "shadow-[0px_170px_48px_0px_rgba(18,_18,_19,_0.00),_0px_109px_44px_0px_rgba(18,_18,_19,_0.01),_0px_61px_37px_0px_rgba(18,_18,_19,_0.05),_0px_27px_27px_0px_rgba(18,_18,_19,_0.09),_0px_7px_15px_0px_rgba(18,_18,_19,_0.10)]"
      )}
      style={{ minHeight }}
    >
      <div className="flex flex-col items-center justify-center gap-4 flex-1 text-center w-full p-8 pb-4">
        <div className="flex flex-col gap-10 w-full max-w-lg">{children}</div>
      </div>
    </div>
  );
}

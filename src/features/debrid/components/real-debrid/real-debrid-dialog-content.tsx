import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import { DialogContent, DialogTitle } from "@/components/ui/dialog";
import { P, TypographyMuted } from "@/components/ui/typography";
import { trpc } from "@/lib";

interface RealDebridDialogContentProps {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
	onAuthenticated?: (token: string) => void;
}

const RealDebridDialogContent = ({
	open,
	setOpen,
	onAuthenticated,
}: RealDebridDialogContentProps) => {
	// Step 1: get device code
	const {
		data: deviceCodeInfo,
		isLoading: isGettingCode,
		error: codeError,
	} = trpc.realdebrid.auth.getDeviceCode.useQuery(undefined, {
		enabled: open,
	});

	// Step 2: subscribe to token polling once we have a device code
	const { data: pollResult, error: pollError } =
		trpc.realdebrid.auth.startPolling.useSubscription(
			{
				deviceCode: deviceCodeInfo?.device_code ?? "",
			},
			{
				enabled: !!deviceCodeInfo && !isGettingCode && !codeError && open,
				onData: (result) => {
					if ("token" in result) {
						// Authenticated successfully
						onAuthenticated?.(result.token.access_token);
						setOpen(false);
						toast.success("Real Debrid authenticated successfully");
					} else if ("error" in result && result.error?.message?.length) {
						console.error("Polling error:", result.error);
						toast.error("Real Debrid authentication failed");
					}
				},
				onError: (error) => {
					console.error("Subscription error:", error);
					toast.error("Real Debrid authentication failed");
				},
			},
		);

	return (
		<DialogContent>
			<DialogTitle>Real Debrid Authentication</DialogTitle>
			<div className="flex flex-col gap-3">
				{isGettingCode ? (
					<P>Loading device code...</P>
				) : codeError || pollError ? (
					<P className="text-red-500">
						Something went wrong. Please try again.
					</P>
				) : !deviceCodeInfo ? (
					<P>No device code returned.</P>
				) : (
					<>
						<P>Please go to the following URL and enter the code:</P>
						<TypographyMuted>{deviceCodeInfo.verification_url}</TypographyMuted>
						<P>
							Enter the code: <strong>{deviceCodeInfo.user_code}</strong>
						</P>
						<TypographyMuted>
							Expires in: {deviceCodeInfo.expires_in} seconds
						</TypographyMuted>
						<P>
							Waiting for you to authorize the device... This may take a moment.
						</P>
					</>
				)}
			</div>
		</DialogContent>
	);
};

export default RealDebridDialogContent;

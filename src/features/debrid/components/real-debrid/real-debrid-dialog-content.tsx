import { type Dispatch, type SetStateAction, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
	const {
		data: deviceCodeInfo,
		isLoading: isGettingCode,
		error: codeError,
	} = trpc.realdebrid.auth.getDeviceCode.useQuery(undefined, {
		enabled: open,
	});

	const handleCopyAndOpen = useCallback(() => {
		if (!deviceCodeInfo?.user_code) return;
		navigator.clipboard.writeText(deviceCodeInfo.user_code).then(
			() => {
				toast.success("Code copied to clipboard!");
			},
			(err) => {
				console.error("Failed to copy code:", err);
				toast.error("Could not copy code.");
			},
		);
	}, [deviceCodeInfo?.user_code]);

	const { data: pollResult, error: pollError } =
		trpc.realdebrid.auth.startPolling.useSubscription(
			{
				deviceCode: deviceCodeInfo?.device_code ?? "",
			},
			{
				enabled: !!deviceCodeInfo,
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
		<DialogContent className="max-h-1/2 max-w-1/2">
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

			<Button
				asChild
				onClick={handleCopyAndOpen}
				disabled={!deviceCodeInfo || isGettingCode}
				variant={"functional"}
			>
				<a
					href={deviceCodeInfo?.verification_url}
					target="_blank"
					rel="noopener noreferrer"
				>
					Copy Code & Open URL
				</a>
			</Button>
		</DialogContent>
	);
};

export default RealDebridDialogContent;

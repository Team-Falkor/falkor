/**
 * MultiStepDialog Component
 *
 * A dialog component that supports multiple steps with navigation controls.
 *
 * Features:
 * - Step-by-step navigation with Next/Previous buttons
 * - Confirmation on the last step
 * - Customizable button behavior per step (hide, disable, custom text)
 * - Validation before proceeding to next/previous steps
 *
 * Button customization options can be set globally for the dialog or per step.
 * Per-step options take precedence over global options when both are provided.
 */

import { Loader2 } from "lucide-react";
import {
	createContext,
	type FC,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type BeforeNextHandler = () => boolean | Promise<boolean>;
type BeforePrevHandler = () => boolean | Promise<boolean>;

interface MultiStepDialogContextType {
	currentStep: number;
	totalSteps: number;
	isFirstStep: boolean;
	isLastStep: boolean;
	isNavigating: boolean;
	goToNextStep: () => Promise<void>;
	goToPrevStep: () => Promise<void>;
	goToStep: (step: number) => void;
	close: () => void;
	setTitle: (title: string) => void;
	setDescription: (description: ReactNode) => void;
	setFooter: (footer: ReactNode) => void;
	setIsNavigating: (isNavigating: boolean) => void;
	setBeforeNext: (handler: BeforeNextHandler | null) => void;
}

const MultiStepDialogContext = createContext<MultiStepDialogContextType | null>(
	null,
);

export const useMultiStepDialog = () => {
	const context = useContext(MultiStepDialogContext);
	if (!context) {
		throw new Error(
			"useMultiStepDialog must be used within a MultiStepDialog component",
		);
	}
	return context;
};

export interface Step {
	title?: string;
	description?: ReactNode;
	component: ReactNode;
	beforeNext?: BeforeNextHandler;
	beforePrev?: BeforePrevHandler;
	// Button customization options
	hideNextButton?: boolean;
	disableNextButton?: boolean;
	nextButtonText?: string;
	hideConfirmButton?: boolean;
	disableConfirmButton?: boolean;
	confirmButtonText?: string;
	hidePrevButton?: boolean;
	disablePrevButton?: boolean;
	prevButtonText?: string;
	hideCancelButton?: boolean;
	disableCancelButton?: boolean;
	cancelButtonText?: string;
}

interface MultiStepDialogProps {
	isOpen: boolean;
	onClose: () => void;
	steps: Step[];
	onConfirm?: () => void;
	onCancel?: (reason: "close" | "reset") => void;
	onStepChange?: (newStep: number, oldStep: number) => void;
	initialStep?: number;
	dialogContentClassName?: string;
	nextLabel?: string;
	prevLabel?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	resetOnCancel?: boolean;
	// Global button customization options
	hidePrevButton?: boolean;
	disablePrevButton?: boolean;
	prevButtonText?: string;
	hideCancelButton?: boolean;
	disableCancelButton?: boolean;
	cancelButtonText?: string;
}

export const MultiStepDialog: FC<MultiStepDialogProps> = ({
	isOpen,
	onClose,
	steps,
	onConfirm,
	onCancel,
	onStepChange,
	initialStep = 0,
	dialogContentClassName,
	nextLabel = "Next",
	prevLabel = "Previous",
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	resetOnCancel = false,
	// Global button customization options
	hidePrevButton = false,
	disablePrevButton = false,
	prevButtonText,
	hideCancelButton = false,
	disableCancelButton = false,
	cancelButtonText,
}) => {
	const [currentStep, setCurrentStep] = useState(initialStep);
	const [isNavigating, setIsNavigating] = useState(false);
	const [title, setTitle] = useState(steps[currentStep]?.title);
	const [description, setDescription] = useState(
		steps[currentStep]?.description,
	);
	const [footer, setFooter] = useState<ReactNode>(null);

	const beforeNextHandlerRef = useRef<BeforeNextHandler | null>(null);

	const setBeforeNext = useCallback((handler: BeforeNextHandler | null) => {
		beforeNextHandlerRef.current = handler;
	}, []);

	useEffect(() => {
		if (isOpen) {
			setCurrentStep(initialStep);
		}
	}, [isOpen, initialStep]);

	const totalSteps = steps.length;
	const isLastStep = currentStep === totalSteps - 1;
	const isFirstStep = currentStep === 0;

	const goToStep = useCallback(
		(newStep: number) => {
			if (newStep >= 0 && newStep < totalSteps) {
				setCurrentStep((oldStep) => {
					onStepChange?.(newStep, oldStep);
					return newStep;
				});
			}
		},
		[totalSteps, onStepChange],
	);

	const goToNextStep = useCallback(async () => {
		if (isLastStep) return;

		// Check for step-specific beforeNext handler first, then fallback to global handler
		const stepHandler = steps[currentStep]?.beforeNext;
		const globalHandler = beforeNextHandlerRef.current;
		const handler = stepHandler || globalHandler;

		if (handler) {
			setIsNavigating(true);
			try {
				const canProceed = await handler();
				if (!canProceed) {
					return;
				}
			} finally {
				setIsNavigating(false);
			}
		}

		goToStep(currentStep + 1);
	}, [isLastStep, goToStep, currentStep, steps]);

	const goToPrevStep = useCallback(async () => {
		if (isFirstStep) return;

		// Check for step-specific beforePrev handler
		const handler = steps[currentStep]?.beforePrev;

		if (handler) {
			setIsNavigating(true);
			try {
				const canProceed = await handler();
				if (!canProceed) {
					return;
				}
			} finally {
				setIsNavigating(false);
			}
		}

		goToStep(currentStep - 1);
	}, [isFirstStep, goToStep, currentStep, steps]);

	const handleConfirm = () => {
		onConfirm?.();
		onClose();
	};

	const handleCancel = () => {
		if (resetOnCancel) {
			onCancel?.("reset");
			goToStep(initialStep);
		} else {
			onCancel?.("close");
		}
		onClose();
	};

	useEffect(() => {
		setTitle(steps[currentStep]?.title);
		setDescription(steps[currentStep]?.description);
		setFooter(null);
		beforeNextHandlerRef.current = null;
	}, [currentStep, steps]);

	const currentStepOptions = steps[currentStep] || {};
	const defaultFooter = (
		<DialogFooter>
			{!isFirstStep &&
				!hidePrevButton &&
				!currentStepOptions.hidePrevButton && (
					<Button
						variant="outline"
						onClick={goToPrevStep}
						disabled={
							isNavigating ||
							disablePrevButton ||
							currentStepOptions.disablePrevButton
						}
					>
						{currentStepOptions.prevButtonText || prevButtonText || prevLabel}
					</Button>
				)}
			{!isLastStep && !currentStepOptions.hideNextButton && (
				<Button
					onClick={goToNextStep}
					disabled={isNavigating || currentStepOptions.disableNextButton}
				>
					{isNavigating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
					{currentStepOptions.nextButtonText || nextLabel}
				</Button>
			)}
			{isLastStep && !currentStepOptions.hideConfirmButton && (
				<Button
					onClick={handleConfirm}
					disabled={isNavigating || currentStepOptions.disableConfirmButton}
				>
					{currentStepOptions.confirmButtonText || confirmLabel}
				</Button>
			)}
			{!hideCancelButton && !currentStepOptions.hideCancelButton && (
				<Button
					variant="ghost"
					onClick={handleCancel}
					disabled={
						isNavigating ||
						disableCancelButton ||
						currentStepOptions.disableCancelButton
					}
				>
					{currentStepOptions.cancelButtonText ||
						cancelButtonText ||
						cancelLabel}
				</Button>
			)}
		</DialogFooter>
	);

	const contextValue = useMemo(
		() => ({
			currentStep,
			totalSteps,
			isFirstStep,
			isLastStep,
			isNavigating,
			goToNextStep,
			goToPrevStep,
			goToStep,
			close: onClose,
			setTitle,
			setDescription,
			setFooter,
			setIsNavigating,
			setBeforeNext,
		}),
		[
			currentStep,
			totalSteps,
			isFirstStep,
			isLastStep,
			isNavigating,
			goToNextStep,
			goToPrevStep,
			goToStep,
			onClose,
			setBeforeNext,
		],
	);

	if (!isOpen) return null;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className={cn(dialogContentClassName)}>
				<MultiStepDialogContext.Provider value={contextValue}>
					<DialogHeader>
						<DialogTitle>{title}</DialogTitle>
						{description && (
							<DialogDescription>{description}</DialogDescription>
						)}
					</DialogHeader>

					<div className="flex-1 overflow-y-auto">
						{steps[currentStep]?.component}
					</div>

					{footer || defaultFooter}
				</MultiStepDialogContext.Provider>
			</DialogContent>
		</Dialog>
	);
};

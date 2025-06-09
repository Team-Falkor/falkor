export const searchParamsToObject = (
	params: string | URLSearchParams,
): Record<string, string> => {
	const searchParams =
		typeof params === "string" ? new URLSearchParams(params) : params;
	const obj: Record<string, string> = {};
	for (const [key, value] of searchParams.entries()) {
		obj[key] = value;
	}
	return obj;
};

type StringTransformer = (input: string) => string;

/** Utility: Compose a sequence of string transformers */
export const pipe =
	<T>(...fns: Array<(arg: T) => T>) =>
	(arg: T): T =>
		fns.reduce((prev, fn) => fn(prev), arg);

/** Remove "(YYYY)" release year patterns */
export const removeReleaseYear: StringTransformer = (str) =>
	str.replace(/\(\d{4}\)/g, "");

/** Remove special/edition keywords like GOTY, Deluxe, etc. */
export const removeEditionKeywords: StringTransformer = (str) =>
	str.replace(
		/\b(The |Digital )?(GOTY|Deluxe|Standard|Ultimate|Definitive|Enhanced|Collector's|Premium|Digital|Limited|Game of the Year|Reloaded) Edition\b/gi,
		"",
	);

/** Remove "Director's Cut" mention */
export const removeDirectorsCut: StringTransformer = (str) =>
	str.replace(/Director's Cut/gi, "");

/** Replace underscores with spaces */
export const underscoresToSpaces: StringTransformer = (str) =>
	str.replace(/_/g, " ");

/** Remove non-alphanumeric characters (preserve accents) */
export const removeSymbols: StringTransformer = (str) =>
	str.replace(/[^A-Za-z0-9À-ÖØ-öø-ÿ ]+/g, "");

/** Collapse multiple spaces into one */
export const collapseSpaces: StringTransformer = (str) =>
	str.replace(/\s{2,}/g, " ");

/** Trim leading/trailing whitespace */
export const trim: StringTransformer = (str) => str.trim();

/** Normalizes a game title into a clean, searchable format */
export const normalizeName = pipe<string>(
	removeReleaseYear,
	removeEditionKeywords,
	removeDirectorsCut,
	underscoresToSpaces,
	removeSymbols,
	collapseSpaces,
	trim,
);

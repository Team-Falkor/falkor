import React from "react";

// A whitelist of allowed tags.
const allowedTags = [
	"p",
	"strong",
	"em",
	"ul",
	"ol",
	"li",
	"br",
	"div",
	"span",
	"h1",
	"h2",
	"h3",
	"h4",
	"h5",
	"h6",
	"code",
	"hr",
];

// A list of void (self-closing) elements.
const voidElements = [
	"br",
	"img",
	"input",
	"hr",
	"area",
	"base",
	"col",
	"embed",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr",
];

/**
 * Recursively converts a DOM node into a React element.
 *
 * @param node - The DOM Node to convert.
 * @param key - A unique key for the React element.
 * @returns A React node or null if the node is not allowed.
 */
export function convertNodeToElement(
	node: Node,
	key: number | string,
): React.ReactNode {
	// For text nodes, simply return the text content.
	if (node.nodeType === Node.TEXT_NODE) {
		return node.textContent;
	}

	// Process only element nodes.
	if (node.nodeType !== Node.ELEMENT_NODE) {
		// Preserve whitespace in code blocks
		if (node.parentElement?.tagName.toLowerCase() === "code") {
			return node.textContent;
		}
		return null;
	}

	const element = node as Element;
	const tagName = element.tagName.toLowerCase();

	// If the tag is not in the allowed list, skip it.
	if (!allowedTags.includes(tagName)) {
		return null;
	}

	// Handle void elements.
	if (voidElements.includes(tagName)) {
		// If it's a <br> tag, return two <br> tags to create additional spacing.
		if (tagName === "br") {
			return (
				<>
					<br key={`${key}-br-1`} />
					<br key={`${key}-br-2`} />
				</>
			);
		}
		// Handle horizontal rules with proper styling
		if (tagName === "hr") {
			return <hr key={key} className="my-4 border-border border-t" />;
		}
		return React.createElement(tagName, { key });
	}

	// Recursively process child nodes.
	const children: React.ReactNode[] = [];
	element.childNodes.forEach((child, index) => {
		const childElement = convertNodeToElement(child, index);
		if (childElement !== null) {
			children.push(childElement);
		}
	});

	// Add appropriate classes based on tag type
	const props: { key: number | string; className?: string } = { key };

	switch (tagName) {
		case "h1":
			props.className = "text-3xl font-bold mt-4 mb-4";
			break;
		case "h2":
			props.className = "text-2xl font-bold mt-4 mb-4 w-full border-b pb-2";
			break;
		case "ul":
			props.className = "list-disc pl-6 space-y-1 mb-4";
			break;
		case "ol":
			props.className = "list-decimal pl-6 space-y-1 mb-4";
			break;
		case "li":
			props.className = "pl-1.5";
			break;
		case "p":
			props.className = "mb-4";
			break;
		case "code":
			props.className = "px-1.5 py-0.5 rounded bg-muted font-mono text-sm";
			break;
		case "strong":
			props.className = "font-bold";
			break;
		case "em":
			props.className = "italic";
			break;
	}

	return React.createElement(tagName, props, children);
}

/**
 * Converts an HTML string into an array of React elements after parsing and filtering allowed tags.
 *
 * @param htmlString - The HTML string to parse.
 * @returns An array of React nodes.
 */
export function parseHtmlString(htmlString: string): Array<React.ReactNode> {
	// Use DOMParser to convert the string into a document.
	const parser = new DOMParser();
	const doc = parser.parseFromString(htmlString, "text/html");
	const body = doc.body;

	const elements: React.ReactNode[] = [];
	Array.from(body.childNodes).forEach((node, index) => {
		const element = convertNodeToElement(node, index);
		if (element !== null) {
			elements.push(element);
		}
	});

	return elements;
}

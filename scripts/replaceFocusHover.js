import { promises as fs } from "fs";
import path from "path";

// Define constants for directories to improve readability and maintainability
const SRC_DIR = "./src";
const UI_DIR = path.join(SRC_DIR, "components/ui");
const EXCLUDED_DIR_PREFIX = path.resolve(UI_DIR); // Resolve to absolute path for robust comparison

// Recursively get all .tsx files, excluding those in the UI_DIR
async function getTSXFiles(dir) {
  const absoluteDir = path.resolve(dir); // Work with absolute paths for consistency
  const entries = await fs.readdir(absoluteDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(absoluteDir, entry.name);

    if (entry.isDirectory()) {
      // Skip the UI directory and its subdirectories
      if (fullPath.startsWith(EXCLUDED_DIR_PREFIX)) {
        continue;
      }
      // Use Promise.all for potentially faster parallel recursion
      const nestedFiles = await getTSXFiles(fullPath);
      files.push(...nestedFiles);
    } else if (entry.isFile() && fullPath.endsWith(".tsx")) {
      // The directory check above already handles exclusion,
      // but an explicit check here is fine for clarity if preferred.
      // if (!fullPath.startsWith(EXCLUDED_DIR_PREFIX)) {
      files.push(fullPath);
      // }
    }
  }

  return files;
}

// Replace focus/hover states inside class="..." and className="..."
function replaceClasses(content) {
  // Improved regex to handle various quote types and ensure proper capture
  // It also handles cases where there might be no classes.
  return content.replace(
    /class(Name)?=(["'])([^"']*?)\2/g,
    (match, nameSuffix, quote, classes) => {
      // If there are no classes, return the original match
      if (!classes.trim()) {
        return match;
      }

      const classList = classes.split(/\s+/).filter(Boolean); // Filter out empty strings from multiple spaces
      const newClassList = classList.map((cls) => {
        if (cls.startsWith("focus:")) {
          return "focus-states:" + cls.substring("focus:".length);
        }
        if (cls.startsWith("hover:")) {
          // Potentially combine hover and focus if that's the intent,
          // otherwise, this will overwrite focus if hover comes after.
          // If you want to preserve both, you might need a more complex logic
          // or ensure a specific order in your original classes.
          // For now, it directly replaces hover: with focus-states:
          return "focus-states:" + cls.substring("hover:".length);
        }
        if (cls.startsWith("group-hover:")) {
          return "group-focus-states:" + cls.substring("group-hover:".length);
        }
        return cls;
      });

      // Remove duplicates while preserving order (Set doesn't guarantee order for this purpose)
      // A more robust way to deduplicate while preserving order:
      const dedupedClassList = newClassList.filter(
        (value, index, self) => self.indexOf(value) === index,
      );

      return `class${nameSuffix || ""}="${dedupedClassList.join(" ")}"`;
    },
  );
}

// Process files and apply changes
async function processFiles() {
  console.log("Starting file processing...");
  let filesToProcess;
  try {
    filesToProcess = await getTSXFiles(SRC_DIR);
  } catch (error) {
    console.error(`Error getting TSX files: ${error.message}`);
    // Re-throw or handle more gracefully if needed, e.g., process.exit(1)
    throw error;
  }

  if (filesToProcess.length === 0) {
    console.log("No .tsx files found to process (outside of UI directory).");
    return;
  }

  console.log(`Found ${filesToProcess.length} files to process.`);
  let updatedCount = 0;

  // Process files sequentially to avoid too many open files,
  // or use a library like 'p-limit' for concurrent processing with limits.
  for (const file of filesToProcess) {
    try {
      const content = await fs.readFile(file, "utf8");
      const updatedContent = replaceClasses(content);

      if (content !== updatedContent) {
        await fs.writeFile(file, updatedContent, "utf8");
        console.log(`✔️ Updated ${file}`);
        updatedCount++;
      }
    } catch (error) {
      // Log error for specific file and continue with others
      console.error(`❌ Error processing file ${file}: ${error.message}`);
      // Optionally, you could collect errors and report them at the end
    }
  }

  if (updatedCount > 0) {
    console.log(`\nSuccessfully updated ${updatedCount} files.`);
  } else {
    console.log("\nNo files required updates.");
  }
}

// Main execution block
(async () => {
  try {
    await processFiles();
    console.log("Script finished successfully.");
  } catch (err) {
    // Catch errors from getTSXFiles if re-thrown, or other unexpected errors
    console.error("An unexpected error occurred during script execution:", err);
    process.exit(1); // Exit with an error code
  }
})();

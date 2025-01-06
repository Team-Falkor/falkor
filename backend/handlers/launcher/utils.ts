import child_process from "child_process";
import path from "path";

export function spawnSync(
  command: string,
  programPath: string,
  args: string[],
  options: child_process.SpawnOptions
) {
  let cmd = programPath;

  if (typeof options.cwd === "string") {
    cmd = path.join(options.cwd, programPath);
  }

  return child_process.spawn(command, [cmd, ...args], {
    ...options,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //  @ts-expect-error
    env: { ...process.env, WINEDEBUG: "fixme-all" },
  });
}

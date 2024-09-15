import fs from "node:fs/promises"
import path from "node:path"

export default async function findProjectRootFromDirectory(
	start_dir, debug_print = false
) {
	const entries = await fs.readdir(start_dir)

	if (debug_print) {
		console.log("findProjectRootFromDirectory", start_dir)
	}

	for (const entry of entries) {
		let absolute_path = path.join(start_dir, entry)
		const stat = await fs.lstat(absolute_path)

		if (entry === "fourtune.config.mjs" && stat.isFile()) {
			return path.dirname(absolute_path)
		}
	}

	if (start_dir !== "/") {
		return await findProjectRootFromDirectory(path.resolve(start_dir, ".."))
	}

	return false
}

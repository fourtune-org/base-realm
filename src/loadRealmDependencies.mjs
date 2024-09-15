import getFourtuneBaseDir from "./getFourtuneBaseDir.mjs"
import path from "node:path"
import fs from "node:fs/promises"

export default async function(project_root) {
	const realm_dependencies_path = path.resolve(
		getFourtuneBaseDir(project_root), "realm_dependencies", "dependencies.mjs"
	)

	try {
		const stat = await fs.lstat(realm_dependencies_path)

		if (!stat.isFile()) {
			throw new Error()
		}
	} catch (e) {
		throw new Error(
			`Unable to locate realm dependencies at '${realm_dependencies_path}'.\n` +
			`Determined project root: ${project_root}.`
		)
	}

	try {
		const {default: dependencies} = await import(realm_dependencies_path)

		return {
			getDependency(name)  {
				for (const dependency of dependencies) {
					if (dependency.name === name) {
						return dependency.module
					}
				}

				return null
			},

			getDependencyVersion(name) {
				for (const dependency of dependencies) {
					if (dependency.name === name) {
						return dependency.version
					}
				}

				return null
			}
		}
	} catch (e) {
		throw new Error(
			`Unable to load realm dependencies at '${realm_dependencies_path}'. Reason: ${e.message}.`
		)
	}
}

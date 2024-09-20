import getFourtuneBaseDir from "./getFourtuneBaseDir.mjs"
import path from "node:path"
import fs from "node:fs/promises"
import getPackageName from "./getPackageName.mjs"

export default async function(project_root, realm) {
	const realm_path = path.resolve(
		getFourtuneBaseDir(project_root), "realm_dependencies", "realm.mjs"
	)

	const platform_path = path.resolve(
		getFourtuneBaseDir(project_root), "realm_dependencies", "platform.mjs"
	)

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
		const {default: current_realm} = await import(realm_path)
		const {default: expected_platform} = await import(platform_path)
		const {default: dependencies} = await import(realm_dependencies_path)

		if (current_realm !== realm) {
			throw new Error(
				`Expected realm '${realm}' does not match current installed realm '${current_realm}'.\n` +
				`Make sure to install @fourtune/${realm}.`
			)
		}

		const current_platform = `${process.platform}-${process.arch}`

		if (current_platform !== expected_platform) {
			throw new Error(
				`Refusing to serve realm dependencies that were produced on a different platform.\n` +
				`Expected platform: ${expected_platform}, your platform: ${current_platform}.\n` +
				`This can be fixed by re-installing @fourtune/realm-<REALM> inside your project.`
			)
		}

		return {
			getDependency(name)  {
				for (const dependency of dependencies) {
					if (dependency.name === name) {
						return dependency.module
					}
				}

				return null
			},

			getPathOfDependency(name) {
				for (const dependency of dependencies) {
					if (dependency.name === name) {
						const pkg_name = getPackageName(name)

						return path.resolve(
							getFourtuneBaseDir(project_root),
							"realm_dependencies",
							pkg_name,
							"node_modules",
							name
						)
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
			`Unable to load realm dependencies at '${realm_dependencies_path}'. Reason: ${e.message}`
		)
	}
}

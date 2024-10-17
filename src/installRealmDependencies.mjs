import path from "node:path"
import fs from "node:fs/promises"
import getFourtuneBaseDir from "./getFourtuneBaseDir.mjs"
import findProjectRootFromDirectory from "./findProjectRootFromDirectory.mjs"
import {spawnSync} from "node:child_process"
import getPackageName from "./getPackageName.mjs"

async function checkProjectRoot(project_root_1) {
	const project_root_2 = await findProjectRootFromDirectory(project_root_1)

	const p1 = path.normalize(project_root_1 + "/")
	const p2 = path.normalize(project_root_2 + "/")

	if (p1 !== p2) {
		throw new Error(`Invalid project root: ${p1} != ${p2}.`)
	}
}

async function ensureBaseDirExists(project_root) {
	await fs.mkdir(getFourtuneBaseDir(project_root), {
		recursive: true
	})
}

async function removeOldDependencies(project_root) {
	const entries = await fs.readdir(
		getFourtuneBaseDir(project_root)
	)

	for (const entry of entries) {
		if (!entry.startsWith("realm_dependencies.")) continue

		const absolute_path = path.join(
			getFourtuneBaseDir(project_root), entry
		)

		await fs.rm(absolute_path, {
			recursive: true,
			force: true
		})
	}
}

function installPackage(pkg_path, dependency, version) {
	const child = spawnSync("npm", [
		"install",
		"--prefix",
		pkg_path,
		`${dependency}@${version}`
	])

	if (child.status !== 0) {
		throw new Error(`Failed to npm install ${dependency}@${version}.\n` + child.stderr.toString())
	}
}

function defaultImportCode(dependency) {
	return `import dependency from ${JSON.stringify(dependency)};\nexport default dependency;\n`
}

async function installLinkedPackage(pkg_path, dependency, {import_from}) {
	let node_modules_base_path
	let package_base_name
	let levels = 0

	//
	// if package name contains "/" then the base will be:
	// node_modules/<ORG>
	//
	if (import_from.includes("/")) {
		node_modules_base_path = path.join(pkg_path, "node_modules", import_from.split("/")[0])
		package_base_name = import_from.split("/")[1]
		levels = 3
	}
	// otherwise the base will be just "node_modules/"
	else {
		node_modules_base_path = path.join(pkg_path, "node_modules")
		package_base_name = import_from
		levels = 2
	}

	await fs.mkdir(node_modules_base_path, {recursive: true})

	// symlink to source package
	await fs.symlink(
		path.join(
			"../".repeat(levels),
			getPackageName(import_from),
			"node_modules",
			import_from
		),
		path.join(node_modules_base_path, package_base_name)
	)

	const source_package_json_str = (await fs.readFile(
		path.join(node_modules_base_path, package_base_name, "package.json")
	)).toString()

	const source_package_json = JSON.parse(source_package_json_str)

	return {
		version: source_package_json.dependencies[dependency]
	}
}

async function installDependencies(project_root, realm, dependencies) {
	const id = Math.random().toString(32).slice(2)

	const tmp_path = path.join(
		getFourtuneBaseDir(project_root), `realm_dependencies.${id}`
	)

	await fs.mkdir(tmp_path)

	let js_file = `let dependencies = []\n\n`
	let i = 0

	for (const dependency in dependencies) {
		let version = "unknown"
		let source = dependency

		let import_code = defaultImportCode(dependency)

		if ("import_code" in dependencies[dependency]) {
			import_code = dependencies[dependency].import_code
		}

		const pkg_name = getPackageName(dependency)
		const pkg_path = path.join(tmp_path, pkg_name)

		await fs.mkdir(pkg_path)

		// only install package if package isn't provided
		// by another package in the dependencies
		if (!("import_from" in dependencies[dependency])) {
			version = dependencies[dependency].version

			installPackage(pkg_path, dependency, version)
		} else {
			const tmp = await installLinkedPackage(pkg_path, dependency, dependencies[dependency])

			version = tmp.version
			source = dependencies[dependency].import_from
		}

		await fs.writeFile(
			path.join(pkg_path, "index.mjs"), import_code
		)

		js_file += `import dependency_${i} from "./${pkg_name}/index.mjs"\n`

		js_file += `dependencies.push({\n`
		js_file += `    name: ${JSON.stringify(dependency)},\n`
		js_file += `    module: dependency_${i},\n`,
		js_file += `    version: ${JSON.stringify(version)},\n`
		js_file += `    source: ${JSON.stringify(source)}\n`
		js_file += `})\n`

		++i
	}

	js_file += `\nexport default dependencies;\n`

	await fs.writeFile(
		path.join(tmp_path, "dependencies.mjs"), js_file
	)

	await fs.writeFile(
		path.join(tmp_path, "realm.mjs"), `export default ${JSON.stringify(realm)};\n`
	)

	const platform = `${process.platform}-${process.arch}`

	await fs.writeFile(
		path.join(tmp_path, "platform.mjs"), `export default ${JSON.stringify(platform)};\n`
	)

	return id
}

export default async function(project_root, realm, dependencies) {
	await checkProjectRoot(project_root)
	await ensureBaseDirExists(project_root)

	await removeOldDependencies(project_root)

	const tmp_id = await installDependencies(project_root, realm, dependencies)

	// todo:
	// mv current realm_dependencies -> random name
	// mv tmp name -> realm_dependencies
	// rm random name
	await fs.rm(
		path.join(getFourtuneBaseDir(project_root), "realm_dependencies"), {
			recursive: true,
			force: true
		}
	)

	await fs.rename(
		path.join(getFourtuneBaseDir(project_root), `realm_dependencies.${tmp_id}`),
		path.join(getFourtuneBaseDir(project_root), "realm_dependencies")
	)
}

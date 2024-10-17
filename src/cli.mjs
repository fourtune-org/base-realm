#!/usr/bin/env node
import process from "node:process"

const args = process.argv.slice(2)

if (args.length !== 3) {
	process.stderr.write(`
		Usage: install <project_root> <realm> <dependencies_file.mjs>\n`
	)
	process.exit(2)
}

const [project_root, realm, dependencies_file] = args

import installRealmDependencies from "./installRealmDependencies.mjs"
import fs from "node:fs/promises"

const {default: dependencies} = await import(
	await fs.realpath(dependencies_file)
)

await installRealmDependencies(
	project_root, realm, dependencies
)

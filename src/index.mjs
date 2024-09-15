import findProjectRootFromDirectory_impl from "./findProjectRootFromDirectory.mjs"
import installRealmDependencies_impl from "./installRealmDependencies.mjs"
import loadRealmDependencies_impl from "./loadRealmDependencies.mjs"

export const findProjectRootFromDirectory = findProjectRootFromDirectory_impl
export const installRealmDependencies = installRealmDependencies_impl
export const loadRealmDependencies = loadRealmDependencies_impl

export default {
	findProjectRootFromDirectory,
	installRealmDependencies,
	loadRealmDependencies
}

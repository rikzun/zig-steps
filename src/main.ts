import type { ExtensionContext } from 'vscode'
import * as vs from 'vscode'
import { StepsProvider } from './treeProvider'
import { getSteps } from './getSteps'
import { Config } from './config'

export const extensionID = 'zigStepsView'
export const readyVariable = 'zigStepsReady'
const buildCommand = extensionID + '.' + 'buildStep'

export function activate(context: ExtensionContext) {
	const cwd = vs.workspace.workspaceFolders![0].uri.fsPath

	const treeDataProvider = new StepsProvider()
	const treeView = vs.window.createTreeView(extensionID, { treeDataProvider })

	treeView.onDidChangeSelection((e) => {
		if (!e.selection.length) return
		treeDataProvider.blur(e.selection[0].id!)

		vs.commands.executeCommand(buildCommand, e.selection[0].label)
	})

	const configListener = vs.workspace.onDidChangeConfiguration((e) => {
		if (!e.affectsConfiguration(extensionID + '.excludedSteps')) {
			treeDataProvider.excludeSteps(Config.excludedSteps)
		} else if (!e.affectsConfiguration(extensionID + '.descriptionInTooltip')) {
			treeDataProvider.updateDescription()
		} else if (!e.affectsConfiguration(extensionID + '.descriptionInDescription')) {
			treeDataProvider.updateDescription()
		}
	})

	const buildStepCommand = vs.commands.registerCommand(buildCommand, (arg: string) => {
		const terminal = vs.window.activeTerminal ?? vs.window.createTerminal()
		terminal.show()
		terminal.sendText(Config.zigPath + ' build ' + arg)
	})

	const buildFileListener = vs.workspace.onDidSaveTextDocument((document) => {
		if (!document.uri.fsPath.endsWith('build.zig')) return
		treeDataProvider.turnLoader()

		getSteps(Config.zigPath, cwd).then((steps) => {
			const filteredSteps = steps.filter((v) => {
				return !Config.excludedSteps.includes(v.label as string)
			})

			treeDataProvider.updateSteps(filteredSteps)
		})
	})

	getSteps(Config.zigPath, cwd).then((steps) => {
		const filteredSteps = steps.filter((v) => {
			return !Config.excludedSteps.includes(v.label as string)
		})

		treeDataProvider.updateSteps(filteredSteps)
		vs.commands.executeCommand('setContext', readyVariable, true)
	})
	
	context.subscriptions.push(treeView, configListener, buildStepCommand, buildFileListener)
}
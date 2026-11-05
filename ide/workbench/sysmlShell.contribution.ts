/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// [SysML Diagram Modeler] Shell contribution copied into Code-OSS by ide/scripts/bootstrap.mjs.

import { RunOnceScheduler } from '../../../../base/common/async.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { mainWindow } from '../../../../base/browser/window.js';
import { localize } from '../../../../nls.js';
import { MenuId, MenuRegistry } from '../../../../platform/actions/common/actions.js';
import { registerWorkbenchContribution2, WorkbenchPhase } from '../../../common/contributions.js';

const HIDDEN_ACTIVITY_LABELS = ['Explorer', 'Source Control', 'Run and Debug', 'Extensions', 'Remote Explorer', 'Testing'];

const modelMenu = new MenuId('SysmlMenubarModelMenu');
const diagramMenu = new MenuId('SysmlMenubarDiagramMenu');

MenuRegistry.appendMenuItem(MenuId.MenubarMainMenu, {
	submenu: modelMenu,
	title: {
		value: localize('sysml.modelMenu', "Model"),
		original: 'Model',
		mnemonicTitle: localize({ key: 'sysml.mModel', comment: ['&& denotes a mnemonic'] }, "&&Model"),
	},
	order: 3,
});

MenuRegistry.appendMenuItem(MenuId.MenubarMainMenu, {
	submenu: diagramMenu,
	title: {
		value: localize('sysml.diagramMenu', "Diagram"),
		original: 'Diagram',
		mnemonicTitle: localize({ key: 'sysml.mDiagram', comment: ['&& denotes a mnemonic'] }, "&&Diagram"),
	},
	order: 4,
});

MenuRegistry.appendMenuItem(modelMenu, {
	group: '1_model',
	order: 1,
	command: { id: 'sysml.showHome', title: localize('sysml.showHome', "Home") },
});

MenuRegistry.appendMenuItem(diagramMenu, {
	group: '1_diagram',
	order: 1,
	command: { id: 'sysml.showDiagram', title: localize('sysml.showDiagram', "Show Diagram") },
});

MenuRegistry.appendMenuItem(diagramMenu, {
	group: '1_diagram',
	order: 2,
	command: { id: 'sysml.toggleCanvas', title: localize('sysml.toggleCanvas', "Toggle Experimental Canvas") },
});

class SysmlShellContribution extends Disposable {
	constructor() {
		super();
		const scheduler = this._register(new RunOnceScheduler(() => this.apply(), 400));
		const observer = new mainWindow.MutationObserver(() => scheduler.schedule());
		observer.observe(mainWindow.document.body, { childList: true, subtree: true });
		this._register({ dispose: () => observer.disconnect() });
		this.apply();
	}

	private apply(): void {
		const labels = mainWindow.document.querySelectorAll('.action-label, .menubar-menu-button');
		for (const label of labels) {
			const raw = label.getAttribute('aria-label') ?? label.textContent ?? '';
			const name = raw.split(' (')[0].trim();
			if (HIDDEN_ACTIVITY_LABELS.includes(name)) {
				const item = label.closest('.action-item') as HTMLElement | null;
				if (item) {
					item.style.display = 'none';
				}
			}
		}
	}
}

registerWorkbenchContribution2('sysml.shell', SysmlShellContribution, WorkbenchPhase.AfterRestored);

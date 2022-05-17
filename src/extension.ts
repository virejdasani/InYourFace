// The module 'vscode' contains the VS Code extensibility API
import * as vscode from "vscode";
import { CustomSidebarViewProvider } from "./customSidebarViewProvider";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  let numErrors = 0;
  let numWarnings = 0;

  let aggregatedDiagnostics: any = {};
  let diagnostic: vscode.Diagnostic;

  const activeTextEditor: vscode.TextEditor | undefined =
    vscode.window.activeTextEditor;

  // vscode.languages.getDiagnostics(activeTextEditor);

  // Iterate over each diagnostic that VS Code has reported for this file. For each one, add to
  // a list of objects, grouping together diagnostics which occur on a single line.
  // for (diagnostic of vscode.languages.getDiagnostics(
  //   activeTextEditor.document.uri
  // )) {
  //   let key = "line" + diagnostic.range.start.line;

  //   if (aggregatedDiagnostics[key]) {
  //     // Already added an object for this key, so augment the arrayDiagnostics[] array.
  //     aggregatedDiagnostics[key].arrayDiagnostics.push(diagnostic);
  //   } else {
  //     // Create a new object for this key, specifying the line: and a arrayDiagnostics[] array
  //     aggregatedDiagnostics[key] = {
  //       line: diagnostic.range.start.line,
  //       arrayDiagnostics: [diagnostic],
  //     };
  //   }

  //   switch (diagnostic.severity) {
  //     case 0:
  //       numErrors += 1;
  //       break;

  //     case 1:
  //       numWarnings += 1;
  //       break;

  //     // Ignore other severities.
  //   }
  //   console.log("Ignoring diagnostic with severity: " + diagnostic.severity);
  // }

  // Console diagnostic information (console.log) and errors (console.error)
  // Will only be executed once when your extension is activated
  console.log("Extension activated");

  const provider = new CustomSidebarViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      CustomSidebarViewProvider.viewType,
      provider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vscodeSidebar.menu.view", () => {
      const message = "Menu/Title of extension is clicked";
      vscode.window.showInformationMessage(message);
    })
  );

  // Command has been defined in the package.json file
  // Provide the implementation of the command with registerCommand
  // CommandId parameter must match the command field in package.json
  let openWebView = vscode.commands.registerCommand(
    "vscodeSidebar.openview",
    () => {
      // Display a message box to the user
      vscode.window.showInformationMessage(
        'Command " Sidebar View [vscodeSidebar.openview] " called.'
      );
    }
  );

  context.subscriptions.push(openWebView);
}

// ////////

// this method is called when your extension is deactivated
export function deactivate() {}

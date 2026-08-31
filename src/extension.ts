// Based on:
// https://github.com/microsoft/vscode-extension-samples/tree/main/webview-view-sample
// https://code.visualstudio.com/api/extension-guides/webview

import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext): void {
  const provider = new CustomSidebarViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      CustomSidebarViewProvider.viewType,
      provider
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate(): void {}

type DiagnosticCounts = {
  errors: number;
  warnings: number;
};

class CustomSidebarViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "in-your-face.openview";

  readonly #extensionUri: vscode.Uri;

  constructor(extensionUri: vscode.Uri) {
    this.#extensionUri = extensionUri;
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    webviewView.webview.options = {
      // The webview only renders static HTML, no scripts needed
      enableScripts: false,
      localResourceRoots: [this.#extensionUri],
    };

    let lastHtml = "";
    const render = () => {
      const html = this.getHtmlContent(webviewView.webview);
      // Only touch the webview when something actually changed,
      // otherwise setting `html` reloads the DOM for no reason.
      if (html !== lastHtml) {
        lastHtml = html;
        webviewView.webview.html = html;
      }
    };

    const listeners = [
      vscode.languages.onDidChangeDiagnostics(render),
      vscode.window.onDidChangeActiveTextEditor(render),
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("InYourFace")) {
          render();
        }
      }),
    ];
    webviewView.onDidDispose(() => {
      for (const listener of listeners) {
        listener.dispose();
      }
    });

    render();
  }

  private getHtmlContent(webview: vscode.Webview): string {
    const useWarnings = vscode.workspace
      .getConfiguration("InYourFace")
      .get<boolean>("error.usewarnings", false);

    const { errors, warnings } = countDiagnostics();

    // Warnings count as half an error when enabled.
    const severity = errors + (useWarnings ? warnings / 2 : 0);
    const face = severity === 0 ? 0 : severity < 5 ? 1 : severity < 10 ? 2 : 3;

    const stylesheetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.#extensionUri, "assets", "main.css")
    );
    const doomFaceUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.#extensionUri, "assets", `doom${face}.png`)
    );

    const colorClass = errors ? "alarm" : useWarnings && warnings ? "yellow" : "";
    const errorLabel = `${errors} ${errors === 1 ? "error" : "errors"}`;
    const warningLabel = useWarnings
      ? `${warnings} ${warnings === 1 ? "warning" : "warnings"}`
      : "";

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <link rel="stylesheet" href="${stylesheetUri}" />
  </head>
  <body>
    <section>
      <img src="${doomFaceUri}" alt="Doom face" />
      <h2 class="${colorClass}">
        ${errorLabel}
        ${warningLabel}
      </h2>
    </section>
  </body>
</html>`;
  }
}

// Count the errors and warnings VS Code reports for the active file.
function countDiagnostics(): DiagnosticCounts {
  const document = vscode.window.activeTextEditor?.document;
  if (!document) {
    return { errors: 0, warnings: 0 };
  }

  let errors = 0;
  let warnings = 0;

  for (const diagnostic of vscode.languages.getDiagnostics(document.uri)) {
    if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
      errors += 1;
    } else if (diagnostic.severity === vscode.DiagnosticSeverity.Warning) {
      warnings += 1;
    }
  }

  return { errors, warnings };
}

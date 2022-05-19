"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { CustomSidebarViewProvider } from "./customSidebarViewProvider";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log("Extension activated");

  const provider = new CustomSidebarViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      CustomSidebarViewProvider.viewType,
      provider
    )
  );

  let _statusBarItem: vscode.StatusBarItem;
  let errorLensEnabled: boolean = true;

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // console.log('Visual Studio Code Extension "errorlens" is now active');

  // Commands are defined in the package.json file
  let disposableEnableErrorLens = vscode.commands.registerCommand(
    "ErrorLens.enable",
    () => {
      errorLensEnabled = true;

      const activeTextEditor: vscode.TextEditor | undefined =
        vscode.window.activeTextEditor;
      if (activeTextEditor) {
        updateDecorationsForUri(activeTextEditor.document.uri);
      }
    }
  );

  context.subscriptions.push(disposableEnableErrorLens);

  let disposableDisableErrorLens = vscode.commands.registerCommand(
    "ErrorLens.disable",
    () => {
      errorLensEnabled = false;

      const activeTextEditor: vscode.TextEditor | undefined =
        vscode.window.activeTextEditor;
      if (activeTextEditor) {
        updateDecorationsForUri(activeTextEditor.document.uri);
      }
    }
  );

  context.subscriptions.push(disposableDisableErrorLens);

  function GetErrorBackgroundColor(): string {
    const cfg = vscode.workspace.getConfiguration("errorLens");
    const errorColor: string = cfg.get("errorColor") || "rgba(240,10,0,0.5)";
    return errorColor;
  }

  function GetErrorTextColor(): string {
    const cfg = vscode.workspace.getConfiguration("errorLens");
    const errorTextColor: string =
      cfg.get("errorTextColor") || "rgba(240,240,240,1.0)";
    return errorTextColor;
  }

  function GetWarningBackgroundColor(): string {
    const cfg = vscode.workspace.getConfiguration("errorLens");
    const warningColor: string =
      cfg.get("warningColor") || "rgba(200,100,0,0.5)";
    return warningColor;
  }

  function GetWarningTextColor(): string {
    const cfg = vscode.workspace.getConfiguration("errorLens");
    const warningTextColor: string =
      cfg.get("warningTextColor") || "rgba(240,240,240,1.0)";
    return warningTextColor;
  }

  function GetInfoBackgroundColor(): string {
    const cfg = vscode.workspace.getConfiguration("errorLens");
    const infoColor: string = cfg.get("infoColor") || "rgba(40,20,120,0.5)";
    return infoColor;
  }

  function GetInfoTextColor(): string {
    const cfg = vscode.workspace.getConfiguration("errorLens");
    const infoTextColor: string =
      cfg.get("infoTextColor") || "rgba(240,240,240,1.0)";
    return infoTextColor;
  }

  function GetHintBackgroundColor(): string {
    const cfg = vscode.workspace.getConfiguration("errorLens");
    const hintColor: string = cfg.get("hintColor") || "rgba(20,120,40,0.5)";
    return hintColor;
  }

  function GetHintTextColor(): string {
    const cfg = vscode.workspace.getConfiguration("errorLens");
    const hintTextColor: string =
      cfg.get("hintTextColor") || "rgba(240,240,240,1.0)";
    return hintTextColor;
  }

  function GetAnnotationFontStyle(): string {
    const cfg = vscode.workspace.getConfiguration("errorLens");
    const annotationFontStyle: string = cfg.get("fontStyle") || "italic";
    return annotationFontStyle;
  }

  function GetAnnotationFontWeight(): string {
    const cfg = vscode.workspace.getConfiguration("errorLens");
    const annotationFontWeight: string = cfg.get("fontWeight") || "normal";
    return annotationFontWeight;
  }

  function GetAnnotationMargin(): string {
    const cfg = vscode.workspace.getConfiguration("errorLens");
    const annotationMargin: string = cfg.get("fontMargin") || "40px";
    return annotationMargin;
  }

  function GetEnabledDiagnosticLevels(): string[] {
    const cfg = vscode.workspace.getConfiguration("errorLens");
    const enabledDiagnosticLevels: string[] = cfg.get(
      "enabledDiagnosticLevels"
    ) || ["error", "warning"];
    return enabledDiagnosticLevels;
  }

  function IsErrorLevelEnabled() {
    return GetEnabledDiagnosticLevels().indexOf("error") >= 0;
  }

  function IsWarningLevelEnabled() {
    return GetEnabledDiagnosticLevels().indexOf("warning") >= 0;
  }

  function IsInfoLevelEnabled() {
    return GetEnabledDiagnosticLevels().indexOf("info") >= 0;
  }

  function IsHintLevelEnabled() {
    return GetEnabledDiagnosticLevels().indexOf("hint") >= 0;
  }

  function GetStatusBarControl(): string {
    const cfg = vscode.workspace.getConfiguration("errorLens");
    const statusBarControl: string =
      cfg.get("statusBarControl") || "hide-when-no-issues";
    return statusBarControl;
  }

  function AddAnnotationTextPrefixes(): boolean {
    const cfg = vscode.workspace.getConfiguration("errorLens");
    const addAnnotationTextPrefixes: boolean =
      cfg.get("addAnnotationTextPrefixes") || false;
    return addAnnotationTextPrefixes;
  }

  // Create decorator types that we use to amplify lines containing errors, warnings, info, etc.
  // createTextEditorDecorationType() ref. @ https://code.visualstudio.com/docs/extensionAPI/vscode-api#window.createTextEditorDecorationType
  // DecorationRenderOptions ref.  @ https://code.visualstudio.com/docs/extensionAPI/vscode-api#DecorationRenderOptions

  let errorLensDecorationTypeError: vscode.TextEditorDecorationType =
    vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      backgroundColor: GetErrorBackgroundColor(),
    });
  let errorLensDecorationTypeWarning: vscode.TextEditorDecorationType =
    vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      backgroundColor: GetWarningBackgroundColor(),
    });
  let errorLensDecorationTypeInfo: vscode.TextEditorDecorationType =
    vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      backgroundColor: GetInfoBackgroundColor(),
    });
  let errorLensDecorationTypeHint: vscode.TextEditorDecorationType =
    vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      backgroundColor: GetHintBackgroundColor(),
    });

  vscode.languages.onDidChangeDiagnostics(
    (diagnosticChangeEvent) => {
      onChangedDiagnostics(diagnosticChangeEvent);
    },
    null,
    context.subscriptions
  );

  // Note: URIs for onDidOpenTextDocument() can contain schemes other than file:// (such as git://)
  vscode.workspace.onDidOpenTextDocument(
    (textDocument) => {
      updateDecorationsForUri(textDocument.uri);
    },
    null,
    context.subscriptions
  );

  // Update on editor switch.
  vscode.window.onDidChangeActiveTextEditor(
    (textEditor) => {
      if (textEditor === undefined) {
        return;
      }
      updateDecorationsForUri(textEditor.document.uri);
    },
    null,
    context.subscriptions
  );

  /**
   * Invoked by onDidChangeDiagnostics() when the language diagnostics change.
   *
   * @param {vscode.DiagnosticChangeEvent} diagnosticChangeEvent - Contains info about the change in diagnostics.
   */
  function onChangedDiagnostics(
    diagnosticChangeEvent: vscode.DiagnosticChangeEvent
  ) {
    if (!vscode.window) {
      return;
    }

    const activeTextEditor: vscode.TextEditor | undefined =
      vscode.window.activeTextEditor;
    if (!activeTextEditor) {
      return;
    }

    // Many URIs can change - we only need to decorate the active text editor
    for (const uri of diagnosticChangeEvent.uris) {
      // Only update decorations for the active text editor.
      if (uri.fsPath === activeTextEditor.document.uri.fsPath) {
        updateDecorationsForUri(uri);
        break;
      }
    }
  }

  /**
   * Update the editor decorations for the provided URI. Only if the URI scheme is "file" is the function
   * processed. (It can be others, such as "git://<something>", in which case the function early-exits).
   *
   * @param {vscode.Uri} uriToDecorate - Uri to add decorations to.
   */
  function updateDecorationsForUri(uriToDecorate: vscode.Uri) {
    if (!uriToDecorate) {
      return;
    }

    // Only process "file://" URIs.
    if (uriToDecorate.scheme !== "file") {
      return;
    }

    if (!vscode.window) {
      return;
    }

    const activeTextEditor: vscode.TextEditor | undefined =
      vscode.window.activeTextEditor;
    if (!activeTextEditor) {
      return;
    }

    if (!activeTextEditor.document.uri.fsPath) {
      return;
    }

    const errorLensDecorationOptionsError: vscode.DecorationOptions[] = [];
    const errorLensDecorationOptionsWarning: vscode.DecorationOptions[] = [];
    const errorLensDecorationOptionsInfo: vscode.DecorationOptions[] = [];
    const errorLensDecorationOptionsHint: vscode.DecorationOptions[] = [];
    let numErrors = 0;
    let numWarnings = 0;

    // The aggregatedDiagnostics object will contain one or more objects, each object being keyed by "lineN",
    // where N is the source line where one or more diagnostics are being reported.
    // Each object which is keyed by "lineN" will contain one or more arrayDiagnostics[] array of objects.
    // This facilitates gathering info about lines which contain more than one diagnostic.
    // {
    //     line28: {
    //         line: 28,
    //         arrayDiagnostics: [ <vscode.Diagnostic #1> ]
    //     },
    //     line67: {
    //         line: 67,
    //         arrayDiagnostics: [ <vscode.Diagnostic# 1>, <vscode.Diagnostic# 2> ]
    //     },
    //     line93: {
    //         line: 93,
    //         arrayDiagnostics: [ <vscode.Diagnostic #1> ]
    //     }
    // };

    if (errorLensEnabled) {
      let aggregatedDiagnostics: any = {};
      let diagnostic: vscode.Diagnostic;

      // Iterate over each diagnostic that VS Code has reported for this file. For each one, add to
      // a list of objects, grouping together diagnostics which occur on a single line.
      for (diagnostic of vscode.languages.getDiagnostics(uriToDecorate)) {
        let key = "line" + diagnostic.range.start.line;

        if (aggregatedDiagnostics[key]) {
          // Already added an object for this key, so augment the arrayDiagnostics[] array.
          aggregatedDiagnostics[key].arrayDiagnostics.push(diagnostic);
        } else {
          // Create a new object for this key, specifying the line: and a arrayDiagnostics[] array
          aggregatedDiagnostics[key] = {
            line: diagnostic.range.start.line,
            arrayDiagnostics: [diagnostic],
          };
        }

        switch (diagnostic.severity) {
          case 0:
            numErrors += 1;
            break;

          case 1:
            numWarnings += 1;
            break;

          // Ignore other severities.
        }
      }

      let key: any;
      let addMessagePrefix: boolean = AddAnnotationTextPrefixes();
      for (key in aggregatedDiagnostics) {
        // Iterate over property values (not names)
        let aggregatedDiagnostic = aggregatedDiagnostics[key];
        let messagePrefix: string = "";

        if (addMessagePrefix) {
          if (aggregatedDiagnostic.arrayDiagnostics.length > 1) {
            // If > 1 diagnostic for this source line, the prefix is "Diagnostic #1 of N: "
            messagePrefix +=
              "Diagnostic 1/" +
              aggregatedDiagnostic.arrayDiagnostics.length +
              ": ";
          } else {
            // If only 1 diagnostic for this source line, show the diagnostic severity
            switch (aggregatedDiagnostic.arrayDiagnostics[0].severity) {
              case 0:
                messagePrefix += "Error: ";
                break;

              case 1:
                messagePrefix += "Warning: ";
                break;

              case 2:
                messagePrefix += "Info: ";
                break;

              case 3:
              default:
                messagePrefix += "Hint: ";
                break;
            }
          }
        }

        let decorationTextColor;
        let addErrorLens = false;
        switch (aggregatedDiagnostic.arrayDiagnostics[0].severity) {
          // Error
          case 0:
            if (IsErrorLevelEnabled()) {
              addErrorLens = true;
              decorationTextColor = GetErrorTextColor();
            }
            break;
          // Warning
          case 1:
            if (IsWarningLevelEnabled()) {
              addErrorLens = true;
              decorationTextColor = GetWarningTextColor();
            }
            break;
          // Info
          case 2:
            if (IsInfoLevelEnabled()) {
              addErrorLens = true;
              decorationTextColor = GetInfoTextColor();
            }
            break;
          // Hint
          case 3:
            if (IsHintLevelEnabled()) {
              addErrorLens = true;
              decorationTextColor = GetHintTextColor();
            }
            break;
        }

        if (addErrorLens) {
          // Generate a DecorationInstanceRenderOptions object which specifies the text which will be rendered
          // after the source-code line in the editor, and text rendering options.
          const decInstanceRenderOptions: vscode.DecorationInstanceRenderOptions =
            {
              after: {
                contentText: truncate(
                  messagePrefix +
                    aggregatedDiagnostic.arrayDiagnostics[0].message
                ),
                fontStyle: GetAnnotationFontStyle(),
                fontWeight: GetAnnotationFontWeight(),
                margin: GetAnnotationMargin(),
                color: decorationTextColor,
              },
            };

          // See type 'DecorationOptions': https://code.visualstudio.com/docs/extensionAPI/vscode-api#DecorationOptions
          const diagnosticDecorationOptions: vscode.DecorationOptions = {
            range: aggregatedDiagnostic.arrayDiagnostics[0].range,
            renderOptions: decInstanceRenderOptions,
          };

          switch (aggregatedDiagnostic.arrayDiagnostics[0].severity) {
            // Error
            case 0:
              errorLensDecorationOptionsError.push(diagnosticDecorationOptions);
              break;
            // Warning
            case 1:
              errorLensDecorationOptionsWarning.push(
                diagnosticDecorationOptions
              );
              break;
            // Info
            case 2:
              errorLensDecorationOptionsInfo.push(diagnosticDecorationOptions);
              break;
            // Hint
            case 3:
              errorLensDecorationOptionsHint.push(diagnosticDecorationOptions);
              break;
          }
        }
      }
    }

    // The errorLensDecorationOptions<X> arrays have been built, now apply them.
    activeTextEditor.setDecorations(
      errorLensDecorationTypeError,
      errorLensDecorationOptionsError
    );
    activeTextEditor.setDecorations(
      errorLensDecorationTypeWarning,
      errorLensDecorationOptionsWarning
    );
    activeTextEditor.setDecorations(
      errorLensDecorationTypeInfo,
      errorLensDecorationOptionsInfo
    );
    activeTextEditor.setDecorations(
      errorLensDecorationTypeHint,
      errorLensDecorationOptionsHint
    );

    updateStatusBar(numErrors, numWarnings);
  }

  /**
   * Update the Visual Studio Code status bar, showing the number of warnings and/or errors.
   * Control over when (or if) to show the ErrorLens info in the status bar is controlled via the
   * errorLens.statusBarControl configuration property.
   *
   * @param {number} numErrors - The number of error diagnostics reported.
   * @param {number} numWarnings - The number of warning diagnostics reported.
   */
  function updateStatusBar(numErrors: number, numWarnings: number) {
    // Create _statusBarItem if needed
    if (!_statusBarItem) {
      _statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left
      );
    }

    const statusBarControl = GetStatusBarControl();
    var showStatusBarText = false;
    if (errorLensEnabled) {
      if (statusBarControl === "always") {
        showStatusBarText = true;
      } else if (statusBarControl === "never") {
        showStatusBarText = false;
      } else if (statusBarControl === "hide-when-no-issues") {
        if (numErrors + numWarnings > 0) {
          showStatusBarText = true;
        }
      }
    }

    const activeTextEditor: vscode.TextEditor | undefined =
      vscode.window.activeTextEditor;

    if (!activeTextEditor || showStatusBarText === false) {
      // No open text editor or don't want to show ErrorLens info.
      _statusBarItem.hide();
    } else {
      let statusBarText: string;

      if (numErrors + numWarnings === 0) {
        statusBarText = "ErrorLens: No errors or warnings";
      } else {
        statusBarText =
          "$(bug) ErrorLens: " +
          numErrors +
          " error(s) and " +
          numWarnings +
          " warning(s).";
        console.log("Errors: " + numErrors);
      }

      _statusBarItem.text = statusBarText;

      _statusBarItem.show();
    }
  }

  /**
   * Truncate the supplied string to a constant number of characters. (This truncation
   * limit is hard-coded, and may be changed only by editing the const inside this function).
   *
   * @param {string} str - The string to truncate.
   * @returns {string} - The truncated string, if the string argument is over the hard-coded limit.
   */
  function truncate(str: string): string {
    const truncationLimit: number = 300;
    return str.length > truncationLimit
      ? str.slice(0, truncationLimit) + "…"
      : str;
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}

import * as vscode from "vscode";
import { QuickPickItem } from "vscode";
import * as child from "child_process";
import { CLIRunner } from "../cli_runner";
import {
  WIZ_HANDLE_SCAN_FINISHED_COMMAND,
  WIZ_NAME,
  WIZ_SCAN_DOCKERFILE_IMAGES_COMMAND,
  WIZ_SCAN_IMAGE_COMMAND,
  WIZ_SCAN_WORKSPACE_FOLDER_COMMAND,
} from "../wiz_constants";
import { showErrorMessageNoWait } from "../messages";
import { ScanType } from "../scan_type";
import { selectImage } from "../image_selection";
import { FindingsProvider } from "../findings_provider";
import * as os from "node:os";
import { logger } from "../logging/logger";
import * as fs from "node:fs";
import { mapImagesHandleError } from "../image_mapper";

class FolderItem implements QuickPickItem {
  label: string;
  detail: string;

  constructor(
    public name: string,
    public uri: string,
  ) {
    this.label = name;
    this.detail = uri;
  }
}

// Scan function for scanning the user selected workspace folder
export async function scanWorkspaceFolder(context: vscode.ExtensionContext, cliRunner: CLIRunner) {
  // Make sure there's a workspace/folder open
  if (!vscode.workspace || !vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length <= 0) {
    showErrorMessageNoWait(`${WIZ_NAME}: Please open a folder to scan.`);
    return;
  }
  const workspaceFolders = vscode.workspace.workspaceFolders;

  let selectedWorkspaceFolder: string | undefined = workspaceFolders[0].uri.path;

  if (workspaceFolders.length > 1) {
    const workspaceQuickPickItems: FolderItem[] = [];

    for (let i = 0; i < workspaceFolders.length; i++) {
      workspaceQuickPickItems.push(new FolderItem(workspaceFolders[i].name, workspaceFolders[i].uri.path));
    }

    const result = await vscode.window.showQuickPick(workspaceQuickPickItems, {
      placeHolder: "Select the VS Code workspace folder to scan",
    });
    selectedWorkspaceFolder = result?.uri;
  }

  // If Windows, adjust the file paths to be Windows compliant
  if (selectedWorkspaceFolder && os.platform() === "win32") {
    selectedWorkspaceFolder = selectedWorkspaceFolder.replace(/\//gi, "\\").slice(1);
  }

  // Only run a scan if a workspace folder was selected
  if (selectedWorkspaceFolder) {
    logger.info(`Selected workspace folder ${selectedWorkspaceFolder} for scan`);
    if (fs.existsSync(selectedWorkspaceFolder)) {
      await cliRunner.run(ScanType.iac, selectedWorkspaceFolder);
    }
  }
}

async function scanDockerfileImages(cliRunner: CLIRunner, quiet: boolean = false) {
  const activeEditor = vscode.window.activeTextEditor;

  if (activeEditor && activeEditor.document.fileName.toLowerCase().endsWith("dockerfile")) {
    const pullDockerfileImages = vscode.workspace.getConfiguration("wiz").get("pullDockerfileImages");

    const imagesToScan: string[] = [];

    // Enmuerate all images in the dockerfile
    for (let i = 0; i < activeEditor.document.lineCount; i++) {
      const lineText = activeEditor.document.lineAt(i).text;
      const imageName = lineText.startsWith("FROM")
        ? lineText.includes("--platform=")
          ? lineText.split(" ")[2]
          : lineText.split(" ")[1]
        : "";

      if (imageName && !imagesToScan.includes(imageName)) {
        imagesToScan.push(imageName);
      }
    }

    // Pull all images
    for (let i = 0; i < imagesToScan.length; i++) {
      if (pullDockerfileImages) {
        vscode.window
          .withProgress(
            {
              location: quiet ? vscode.ProgressLocation.Window : vscode.ProgressLocation.Notification,
              title: `Pulling image ${imagesToScan[i]}...`,
              cancellable: true,
            },
            (progress, token) => {
              const pullPromise = pullDockerImage(progress, token, imagesToScan[i]);

              let pullTime = 0;

              setInterval(() => {
                pullTime += 5;
                progress.report({ message: `[${pullTime}s]` });
              }, 5000);

              return pullPromise;
            },
          )
          .then(
            async () => {
              await cliRunner.run(ScanType.image, imagesToScan[i], quiet);
            },
            (rejectReason) => {
              showErrorMessageNoWait(rejectReason);
            },
          );
      } else {
        await cliRunner.run(ScanType.image, imagesToScan[i], quiet);
      }
    }
  }
}

function pullDockerImage(
  progress: vscode.Progress<{ message?: string; increment?: number }>,
  token: vscode.CancellationToken,
  imageName: string,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const pullImageProcess = child.exec(`docker pull ${imageName}`, function (error, stdout, stderr) {
      if (error) {
        reject(error.message);
      }

      resolve();
    });

    // User cancelled the scan
    token.onCancellationRequested(() => {
      pullImageProcess.kill();
      reject(`User canceled the image pull for '${imageName}'.`);
    });
  });
}

// Scan function for scanning a container image
async function scanImage(context: vscode.ExtensionContext, cliRunner: CLIRunner, imageName?: string) {
  await mapImagesHandleError();

  if (!imageName) {
    const image = await selectImage("Image scan", false);
    imageName = image?.label;
  }
  if (imageName) {
    await cliRunner.run(ScanType.image, imageName);
  }
}

export function registerLegacyScanCommands(
  context: vscode.ExtensionContext,
  cliRunner: CLIRunner,
  findingsProvider: FindingsProvider,
) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      WIZ_SCAN_WORKSPACE_FOLDER_COMMAND,
      async () => await scanWorkspaceFolder(context, cliRunner),
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      WIZ_SCAN_DOCKERFILE_IMAGES_COMMAND,
      async () => await scanDockerfileImages(cliRunner),
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(WIZ_SCAN_IMAGE_COMMAND, async (imageName?: string) => {
      await scanImage(context, cliRunner, imageName);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      WIZ_HANDLE_SCAN_FINISHED_COMMAND,
      findingsProvider.handleScanFinished.bind(findingsProvider),
    ),
  );
}

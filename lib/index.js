/*
Copyright (c) Anthony Beaumont
This source code is licensed under the MIT License
found in the LICENSE file in the root directory of this source tree.
*/

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir, EOL } from "node:os";
import { join, parse } from "node:path";
import { Failure } from "@xan105/error";
import { resolve } from "@xan105/fs/path"; 
import { shouldWindows } from "@xan105/is/assert";
import { writeFile, deleteFile, exists } from "@xan105/fs";
import { asString, asStringNotEmpty, asIntegerPositive } from "@xan105/is/opt";

async function notify(option = {}){

  shouldWindows();

  const options = {
    title: asString(option.title) ?? "",
    message: asStringNotEmpty(option.message) ?? "Hello there.", //Can not be empty 
    ico: asStringNotEmpty(option.ico),
    type: [0,1,2].includes(option.type) ? option.type : 0, //Info, Warning, Error 
    showTime: asIntegerPositive(option.showTime) ?? 7,
    callback: {
      onActivated: typeof option.callback?.onActivated === "function" || function(){},
      onDismissed: typeof option.callback?.onDismissed === "function" || function(){}
    }
  };

  let template = `(Get-Process -Id $pid).PriorityClass = 'High'`+ EOL +
                 `Add-Type -AssemblyName System.Windows.Forms` + EOL +
                 `$balloon = New-Object System.Windows.Forms.NotifyIcon` + EOL;
                    
  if (options.ico && await exists(options.ico)) 
  {
    const ext = parse(options.ico).ext;           
    if (ext === ".exe")
      template += `$balloon.Icon = [System.Drawing.Icon]::ExtractAssociatedIcon("${resolve(options.ico)}")` + EOL;
    else if (ext === ".ico") 
      template += `$balloon.Icon = "${resolve(options.ico)}"` + EOL;
    else
      throw new Failure("Accepted icon file ext are '.exe' or '.ico'", 1);
  } 
  else 
  {
    template += `$balloon.Icon = [System.Drawing.Icon]::ExtractAssociatedIcon((Get-Process -id $pid).Path)` + EOL;
  }
          
  const TYPES = {
    0: "Info",
    1: "Warning",
    2: "Error"
  };        
          
  template += `$balloon.BalloonTipIcon = "${TYPES[options.type]}"` + EOL +
              `$balloon.BalloonTipText = "${options.message}"` + EOL +
              `$balloon.BalloonTipTitle = "${options.title}"` + EOL +
              `$balloon.Visible = $true` + EOL +
              `Register-ObjectEvent -SourceIdentifier cb0 -InputObject $balloon -EventName BalloonTipClicked -Action { Write-Host "<@onActivated/>"; New-Event -SourceIdentifier cbDone0} | Out-Null` + EOL +
              `Register-ObjectEvent -SourceIdentifier cb1 -InputObject $balloon -EventName BalloonTipClosed -Action { Write-Host "<@onDismissed/>"; New-Event -SourceIdentifier cbDone1} | Out-Null` + EOL +             
              `$balloon.ShowBalloonTip(${options.showTime * 1000})` + EOL +
              `Wait-Event -SourceIdentifier cbDone* -TimeOut ${options.showTime}` + EOL +
              `Unregister-Event -SourceIdentifier cb*` + EOL +
              `Remove-Event -SourceIdentifier cbDone*` + EOL +
              `$balloon.Dispose()`+ EOL;

  const rng = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const scriptPath = join(tmpdir() || process.env.TEMP, `${Date.now()}${rng(0, 1000)}.ps1`);
  
  try{
    //Create script
    await writeFile(scriptPath, template, { encoding: "utf8", bom: true });

    //Excecute script
    const cmd = `-NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`;
    const ps = await promisify(exec)(`powershell ${cmd}`,{windowsHide: true});
    if (ps.stderr) throw new Failure(ps.stderr,"ERR_UNEXPECTED_POWERSHELL_FAIL");

    if (ps.stdout) {
      if (ps.stdout.includes("<@onActivated/>")){
        options.callback.onActivated(); //cb
      } else if (ps.stdout.includes("<@onDismissed/>")) {
        options.callback.onDismissed(); //cb
      }
    }

    //Clean up
    await deleteFile(scriptPath);
  }catch(err){
    await deleteFile(scriptPath);
    throw err;
  } 
}

export default notify;
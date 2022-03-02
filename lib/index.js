/*
MIT License

Copyright (c) Anthony Beaumont

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import { exec } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir, EOL } from "node:os";
import { join, resolve, parse } from "node:path";
import { Failure } from "@xan105/error";
import { shouldWindows } from "@xan105/is/assert";
import { writeFile, deleteFile, exists } from "@xan105/fs";
import { isStringNotEmpty, isIntegerPositive } from "@xan105/is";

async function notify(option = {}){

  shouldWindows();

  const options = {
    title: option.title || "",
    message: isStringNotEmpty(option.message) ? option.message : "Hello World !", //Can not be empty 
    ico: isStringNotEmpty(option.ico) ? option.ico : null,
    type: [0,1,2].includes(option.type) ? option.type : 0, //Info, Warning, Error 
    showTime: isIntegerPositive(option.showTime) ? option.showTime : 7,
    callback: {
      onActivated: option.callback?.onActivated || function () {},
      onDismissed: option.callback?.onDismissed || function () {}
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
                   
  switch(options.type){
    case 0:
      template += `$balloon.BalloonTipIcon = "Info"` + EOL;
      break;
    case 1:
      template += `$balloon.BalloonTipIcon = "Warning"` + EOL;
      break;
    case 2:
      template += `$balloon.BalloonTipIcon = "Error"` + EOL;
      break;
  }
                   
  template += `$balloon.BalloonTipText = "${options.message}"` + EOL +
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
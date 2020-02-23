'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const util = require('util'); 
const { exec } = require('child_process');

module.exports = async (option = {}) => {

  if (os.platform() !== 'win32') throw "API is only available in Windows.";
  
  const temp = os.tmpdir() || process.env.TEMP;
  const rng = function(min, max) {
      return Math.floor(Math.random() * (max - min + 1) ) + min;
  };
  var script = path.join(temp,`${Date.now()}${rng(0,1000)}.ps1`);

  try {

    let options = {
      title: option.title || "",
      message: option.message || "Hello World !", //Can not be empty
      ico: (option.ico) ? path.resolve(option.ico) : null,
      type: option.type || 0, //Info, Warning, Error
      showTime: option.showTime || 7000
    };

    let template = `(Get-Process -Id $pid).PriorityClass = 'High'`+ os.EOL +
                   `Add-Type -AssemblyName System.Windows.Forms` + os.EOL +
                   `$balloon = New-Object System.Windows.Forms.NotifyIcon` + os.EOL;
                    
                   if (options.ico && await exists(options.ico)) 
                   {
                     if (path.parse(options.ico).ext === '.exe') {
                        template += `$balloon.Icon = [System.Drawing.Icon]::ExtractAssociatedIcon("${options.ico}")` + os.EOL;
                     } else {
                        template += `$balloon.Icon = "${options.ico}"` + os.EOL;
                     }
                   } else {
                      template += `$balloon.Icon = [System.Drawing.Icon]::ExtractAssociatedIcon((Get-Process -id $pid).Path)` + os.EOL;
                   }
                   
                   switch(options.type){
                     case 0:
                       template += `$balloon.BalloonTipIcon = "Info"` + os.EOL;
                       break;
                     case 1:
                       template += `$balloon.BalloonTipIcon = "Warning"` + os.EOL;
                       break;
                     case 2:
                       template += `$balloon.BalloonTipIcon = "Error"` + os.EOL;
                       break;
                     default:
                       template += `$balloon.BalloonTipIcon = "Info"` + os.EOL;
                   }
                   
    template += `$balloon.BalloonTipText = "${options.message}"` + os.EOL +
                `$balloon.BalloonTipTitle = "${options.title}"` + os.EOL +
                `$balloon.Visible = $true` + os.EOL +
                `$balloon.ShowBalloonTip(${options.showTime})`;

    const bom = "\ufeff";
    await fs.promises.writeFile(script, bom+template, "utf8");

    const output = await util.promisify(exec)(`powershell -ExecutionPolicy Bypass -File "${script}"`,{windowsHide: true});
    if (output.stderr) throw output.stderr;
      
    await fs.promises.unlink(script).catch(()=>{});

  }catch(err) {
     fs.unlink(script, function(){
        throw err;
     });
  }
}

function exists (target) {
   return new Promise((resolve) => {
      fs.promises.access(target, fs.constants.F_OK).then(() => resolve(true)).catch(() => resolve(false));
   });
}
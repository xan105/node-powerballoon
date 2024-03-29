About
=====

Windows balloon notification using PowerShell.<br />
Doesn't use any native module. Everything is done through PowerShell.<br />

Looking for Windows toast notification ? [node-powertoast](https://github.com/xan105/node-powertoast)

Example
=======
<table>
<tr>
<td align="left"><img src="https://github.com/xan105/node-powerballoon/raw/master/screenshot/win7.png"></td>
<td align="left"><img src="https://github.com/xan105/node-powerballoon/raw/master/screenshot/win10.png"></td>
</tr>
<tr>
<td align="center">Windows 7</td>
<td align="center">Windows 10</td>
</tr>
</table>

Sending a simple balloon notification

```js 
import balloon from 'powerballoon';

balloon({
  title: "NPM",
  message: "Installed.",
  ico: "C:\\Program Files\\nodejs\\node.exe",
  showTime: 7,
  callback: {
    onActivated: ()=>{
      console.log("clicked");
    },
    onDismissed: ()=>{
      console.log("closed");
    }
  }
})
.then(()=>{
  console.log("done");
})
.catch((err) => { 
  console.error(err);
});
```

Installation
============

```
npm install powerballoon
```

API
===

⚠️ This module is only available as an ECMAScript module (ESM) starting with version 2.0.0.<br />
Previous version(s) are CommonJS (CJS) with an ESM wrapper.

## Default export

#### `(option?: obj): Promise<void>`

- **title**
  
  The title of your notification

- **message**

  The content message of your notification.
  This can not be empty !<br />
  Thus _default to "Hello World !"_

- **ico**

  Path to the icon shown in the systray.<br />
  Path can target either an .ico file or an .exe.<br />
  _default to the PowerShell executable icon._

- **type**

  + 0 (ℹ️ Info)
  + 1 (⚠️ Warning)
  + 2 (❌ Error)
  
  This change the icon displayed within the tooltip.<br />
  _default to '0 (Info)'_

- **showTime** 

  balloon duration in sec.<br />
  _default to 7._
  
  ⚠️ Please note that Windows can dismiss the pop-up before the timeout expires.
  
- **callback**

  onActivated() : When the balloon tooltip is clicked.<br/>
  onDismissed() : When the balloon tooltip is closed.
  
NB: Please note that since v2.0.0. The promise will resolve when the balloon tooltip is done because we need to wait and then clean up the systray.

Common Issues
=============

- Windows balloon are disabled

  There is a registry setting that controls whether a balloons can be show or not.<br />
  `HKCU\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced`<br />
  DWORD::EnableBalloonTips
  
- Powershell is not recognized as an internal or external command [...]

  Powershell needs to be installed.<br />
  Windows 7/Server 2008 R2 are the first Windows versions to come with PowerShell installed.

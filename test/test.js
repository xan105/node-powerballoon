import balloon from "../lib/index.js";

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
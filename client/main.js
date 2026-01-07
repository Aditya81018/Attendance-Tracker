const ws = new WebSocket("ws://localhost:8080/ws");
const id = crypto.randomUUID();

let data = {};

ws.addEventListener("open", () => {
  console.log("WS CONNECTED");
  ws.send("init client " + id);
});

ws.addEventListener("message", (message) => {
  data = JSON.parse(message.data);
  console.dir(data);
  update();
  render();
});

ws.addEventListener("close", () => {
  console.log("WS DISCONNECTED");
});

function update() {}
function render() {
  renderLog();
  renderMotion();
  renderRfid();
}

function renderLog() {
  const logSection = document.getElementById("log-section");
  const log = document.createElement("div");
  log.classList.add("log");
  log.innerText = data.logs.at(-1);
  logSection.prepend(log);
}

function renderMotion() {
  // const motionSection = document.getElementById("motion-section");
  const indoorIR = document.getElementById("indoor-ir");
  const outdoorIR = document.getElementById("outdoor-ir");
  const motionLog = document.getElementById("motion-log");

  const { indoorStatus, outdoorStatus } = data.irScanHistory.at(-1);
  // console.log(indoorStatus, outdoorStatus);
  if (indoorStatus) {
    indoorIR.classList.add("active");
  } else {
    indoorIR.classList.remove("active");
  }
  if (outdoorStatus) {
    outdoorIR.classList.add("active");
  } else {
    outdoorIR.classList.remove("active");
  }

  const motionRecord = data.motionHistory.at(-1);
  motionLog.innerText = motionRecord.towards === "INDOOR" ? "<--" : "-->";
}

function renderRfid() {
  const indoorRfid = document.getElementById("indoor-rfid");
  const outdoorRfid = document.getElementById("outdoor-rfid");
  const lastScan = data.rfidScanHistory.at(-1);
  const uid = lastScan.recordedUID;

  if (lastScan.location === "INDOOR") {
    indoorRfid.innerText = uid;
  } else {
    outdoorRfid.innerText = uid;
  }
}

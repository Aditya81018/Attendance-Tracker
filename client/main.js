const ws = new WebSocket("ws://localhost:8080/ws");
const id = crypto.randomUUID();

let data = {};
let motionTimeout = undefined;
let lastMotionRecord = undefined;
let lastLogRecorded = undefined;

ws.addEventListener("open", () => {
  console.log("WS CONNECTED");
  ws.send("init client " + id);
});

ws.addEventListener("message", (message) => {
  Object.assign(data, JSON.parse(message.data));
  console.dir(data);
  update();
  render();
});

ws.addEventListener("close", () => {
  console.log("WS DISCONNECTED");
});

function update() { }
function render() {
  renderLog();
  renderMotion();
  renderRfid();
  renderStudentsIndoor();
  renderStudentsPresenceHistory();
}

function renderLog() {
  const logSection = document.getElementById("log-section");
  const lastLog = data.logs.at(-1);

  if (lastLogRecorded === lastLog) return;
  lastLogRecorded = lastLog;

  const log = document.createElement("div");
  log.classList.add("log");
  log.innerText = lastLog;
  logSection.prepend(log);
}

function renderMotion() {
  // const motionSection = document.getElementById("motion-section");
  const indoorIR = document.getElementById("indoor-ir");
  const outdoorIR = document.getElementById("outdoor-ir");
  const motionLog = document.getElementById("motion-log");

  if (data.irScanHistory.length === 0) return;
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

  // if there is no motion record exit
  if (data.motionHistory.length === 0) return;

  const motionRecord = data.motionHistory.at(-1);

  if (lastMotionRecord && lastMotionRecord.id === motionRecord.id) return;
  lastMotionRecord = motionRecord;
  motionLog.innerText = motionRecord.towards === "INDOOR" ? "<-----" : "----->";

  if (motionTimeout) clearTimeout(motionTimeout);
  motionTimeout = setTimeout(() => {
    motionLog.innerText = "";
    motionTimeout = undefined;
  }, 1000);
}

function renderRfid() {
  const indoorRfid = document.getElementById("indoor-rfid");
  const outdoorRfid = document.getElementById("outdoor-rfid");

  if (!data.lastRfidScan) {
    indoorRfid.innerText = "SCANNER";
    outdoorRfid.innerText = "SCANNER";
    return;
  }

  const uid = data.lastRfidScan.recordedUID;
  if (data.lastRfidScan.location === "INDOOR") {
    indoorRfid.innerText = uid;
  } else {
    outdoorRfid.innerText = uid;
  }
}

function renderStudentsIndoor() {
  const studnetsIndoorLabel = document.getElementById("students-indoor-label");
  const newChildren = [];

  for (const studentID of data.studentsIndoor) {
    const node = document.createElement("div");
    node.classList.add("student-label");
    node.innerText = data.studentsList[studentID];
    newChildren.push(node);
  }

  studnetsIndoorLabel.replaceChildren(...newChildren);
}

// function renderStudentsPresenceHistory() {
//   const presenceSection = document.getElementById("students-presence-section");
//   const logs = [];
//
//   const indoorHistory = data.studentsPresenceHistory.filter(rec => rec.location === "INDOOR");
//   const outdoorHistory = data.studentsPresenceHistory.filter(rec => rec.location === "OUTDOOR");
//
//   for (let i = 0; i < indoorHistory.length; i++) {
//     const studentId = indoorHistory[i].studentId;
//     const log = {id: studentId, name: data.studentsList[studentId], startTime }
//     for (let j = 0; j < history.length; j++) {
//
//     }
//   }
// }

// AI Generated Logic and further modified
function renderStudentsPresenceHistory() {
  const presenceSection = document.getElementById("students-presence-section");
  if (!presenceSection) return;
  presenceSection.innerHTML = "";

  const logs = [];
  const tempEntryTracker = {}; // Keeps track of the last "Indoor" record per student

  // 1. Sort history by time to ensure chronological processing
  const sortedHistory = [...data.studentsPresenceHistory].sort(
    (a, b) => new Date(a.recordedAt) - new Date(b.recordedAt),
  );

  console.log(sortedHistory);
  // 2. Pair Indoor and Outdoor events
  sortedHistory.forEach((record) => {
    const sId = record.studentId;
    const isIndoor = record.location === "INDOOR"; // Adjust string if your enum is different

    if (isIndoor) {
      // Student entered: Create a new pending log
      tempEntryTracker[sId] = {
        id: sId,
        name: data.studentsList[sId],
        startTime: new Date(record.recordedAt),
        endTime: null,
        duration: "In Progress",
      };
      logs.push(tempEntryTracker[sId]);
    } else if (!isIndoor && tempEntryTracker[sId]) {
      // Student exited: Find their last pending log and close it
      const entry = tempEntryTracker[sId];
      entry.endTime = new Date(record.recordedAt);

      // Calculate duration in minutes
      const diffMs = entry.endTime - entry.startTime;
      const diffMins = Math.floor(diffMs / 60000);
      entry.duration = `${diffMins} mins`;

      // Clear tracker for this student so the next "Indoor" starts a new log
      tempEntryTracker[sId] = null;
    }
  });
  console.log(logs);

  // 3. Render to DOM
  logs.forEach((log, index) => {
    const presenceLog = document.createElement("div");
    presenceLog.classList.add("students-presence-log");

    const sTime = log.startTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const eTime = log.endTime
      ? log.endTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
      : "--:--";

    // Structure: SL No | ID | Start | End | Duration
    presenceLog.innerHTML = `
      <span>${index + 1}</span>
      <span style="margin-left:10px">${log.id}</span>
      <span style="margin-left:10px">${log.name}</span>
      <span style="margin-left:10px">${sTime}</span>
      <span style="margin-left:10px">${eTime}</span>
      <span style="margin-left:10px; font-weight:bold">${log.duration}</span>
    `;

    presenceSection.appendChild(presenceLog);
  });
}

document.getElementById("buzzer-btn").addEventListener("click", () => {
  ws.send("buzzer");
});

document.getElementById("beep-btn").addEventListener("click", () => {
  ws.send("beep");
});

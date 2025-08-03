const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("call");
call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

// Media controls
async function getMedia(deviceId) {
    const initialConstrains = {
        audio: true,
        video: {facingMode: "user"},
    };
    const cameraConstraints = {
        audio: true,
        video: {deviceId: {exact: deviceId}},
    };

    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstraints : initialConstrains
        );
        myFace.srcObject = myStream;
        if (!deviceId) {
            await getCameras();
        }
    } catch (e) {
        console.log(e);
    }
}

async function getCameras() {
    try {
        const devices =
            await navigator.mediaDevices.enumerateDevices();
        const cameras =
            devices.filter((dev) => dev.kind === "videoinput");
        cameras.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            camerasSelect.appendChild(option);
        });
    } catch (e) {
        console.log(e);
    }
}

function handleCameraClick() {
    myStream
        .getVideoTracks()
        .forEach((track) => (track.enabled = !track.enabled));
    if (cameraOff) {
        cameraBtn.innerText = "Turn Camera Off";
        cameraOff = false;
    } else {
        cameraBtn.innerText = "Turn Camera On";
        cameraOff = true;
    }
}

function handleMuteClick() {
    myStream
        .getAudioTracks()
        .forEach((track) => (track.enabled = !track.enabled));
    if (!muted) {
        muteBtn.innerText = "Unmute";
        muted = true;
    } else {
        muteBtn.innerText = "Mute";
        muted = false;
    }
}

async function handleCameraChange() {
    await getMedia(camerasSelect.value);
    if (myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
            .getSenders()
            .find((sender) => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
    }
}

// Room Member Controls
const nicknameDiv = document.getElementById("nickname");
const roomNav = document.getElementById("roomNav");
const createDiv = document.getElementById("create");
const createForm = createDiv.querySelector("form");
const exitBtn = document.getElementById("exit");
const welcome = document.getElementById("welcome");

async function handleCreateRoom(event) {
    event.preventDefault();
    const roomInput = createDiv.querySelector("input");
    enterRoom(roomInput.value, nicknameDiv.querySelector("input").value);
}

async function enterRoom(_roomName, _nickName) {
    if (!_roomName || !_nickName) {
        return alert("방 이름과 닉네임을 입력해주세요.");
    }
    const initRoom = async () => {
        welcome.innerText = `Welcome to ${_roomName}: ${_nickName}`;
        roomName = _roomName;
        nicknameDiv.hidden = true;
        createDiv.hidden = true;
        call.hidden = false;
        roomNav.hidden = true;
        exitBtn.hidden = false;
        await getMedia();
        makeConnection();
    }
    await initRoom();
    socket.emit("enter_room", _roomName, _nickName, () => {
        console.log(`Entered room: ${_roomName}`);
    });
}

// Socket Code
socket.on("welcome", async (nickname) => {
    console.log(`user ${nickname} joined`);
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer");
    socket.emit("offer", offer, roomName);
});
socket.on("offer", async (offer) => {
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
});

socket.on("answer", (answer) => {
    myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
    myPeerConnection.addIceCandidate(ice);
});

socket.on("room_update", (rooms) => {
    const roomList = roomNav.querySelector("ul");
    roomList.innerHTML = ""; // 기존 목록 초기화
    rooms.forEach(room => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.innerText = `${room.name}(${room.size})`;
        btn.onclick = () => {
            enterRoom(room.name, nicknameDiv.querySelector("input").value);
        };
        roomList.appendChild(li);
        li.appendChild(btn);
    });
})

// RTC connection
function makeConnection() {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun.l.google.com:5349",
                    "stun:stun1.l.google.com:3478",
                    "stun:stun1.l.google.com:5349"
                ]
            }
        ]
    });
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    myStream
        .getTracks()
        .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
    console.log("sent candidate");
    socket.emit("ice", data.candidate, roomName);
}

function handleAddStream(data) {
    const peerFace = document.getElementById("peerFace");
    peerFace.srcObject = data.stream;
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);
createForm.addEventListener("submit", handleCreateRoom);
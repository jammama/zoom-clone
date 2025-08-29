const socket = io();

const welcome = document.querySelector("h2")
const nickNameDiv = document.querySelector("#nickname");
const roomNav = document.querySelector("nav");
const createDiv = document.querySelector("#create");
const exitBtn = document.querySelector("#exit");
const roomDiv = document.querySelector("#room");

exitBtn.hidden = true;
roomDiv.hidden = true;
let roomName ;
/**
 * 방 입장
 */
function handleCreateRoom(event) {
    event.preventDefault();
    const roomInput = createDiv.querySelector("input");
    enterRoom(roomInput.value, nickNameDiv.querySelector("input").value);
}
function enterRoom(_roomName, _nickName) {
    if (!_roomName || !_nickName) {
        return alert("방 이름과 닉네임을 입력해주세요.");
    }
    socket.emit("enter_room", _roomName, _nickName, () => {
        welcome.innerText = `Welcome to czoom: ${_nickName}`;
        roomDiv.querySelector("h3").innerText = `방 이름: ${_roomName}`;
        roomName = _roomName;
        exitBtn.hidden = false;
        roomDiv.hidden = false;
        nickNameDiv.hidden = true;
        createDiv.hidden = true;
        roomNav.hidden = true;
    });
}

/**
 * 방 나가기
 */
function handleExitRoom(event) {
    event.preventDefault();
    socket.disconnect();
    welcome.innerText = `Welcome to czoom`;
    roomDiv.querySelector("h3").innerText = '';
    socket.connect();
    exitBtn.hidden = true;
    roomDiv.hidden = true;
    nickNameDiv.hidden = false;
    createDiv.hidden = false;
    roomNav.hidden = false;
}

/**
 * 메세지 추가하기
 */
function addMessage(message) {
    const ul = roomDiv.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}
/**
 * 메세지 보내기
 */
function handleMessageSubmit(event) {
    event.preventDefault();
    const messageInput = roomDiv.querySelector("form input");
    const message = messageInput.value;
    if (message === "") {
        return;
    }
    socket.emit("message", message, roomName);
    messageInput.value = "";
    messageInput.focus();
    addMessage(`나: ${message}`);
}

// 소켓 이벤트 리스너
socket.on("welcome", (nickName) => {
    addMessage(`${nickName}님이 입장하셨습니다.`);
});
socket.on("bye", (nickName) => {
    addMessage(`${nickName}님이 퇴장하셨습니다.`);
});
socket.on("message", addMessage);
socket.on("room_update" , (rooms) => {
    const roomList = roomNav.querySelector("ul");
    roomList.innerHTML = ""; // 기존 목록 초기화
    rooms.forEach(room => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.innerText = `${room.name}(${room.size})`;
        btn.onclick = () => {
            enterRoom(room.name, nickNameDiv.querySelector("input").value);
        };
        roomList.appendChild(li);
        li.appendChild(btn);
    });
})
createDiv.querySelector("form")
    .addEventListener("submit", handleCreateRoom);
exitBtn.addEventListener("click", handleExitRoom);
roomDiv.querySelector("form")
    .addEventListener("submit", handleMessageSubmit);
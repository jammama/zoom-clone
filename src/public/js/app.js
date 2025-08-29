const welcome = document.querySelector('h2');
const nickNameForm = document.querySelector('#nickname');
const roomDiv = document.querySelector('#room');
const ws = new WebSocket(`ws://${window.location.host}`);

roomDiv.hidden = true;
let roomName;

function makeMessage(type, payload) {
    const msg = { type, payload };
    return JSON.stringify(msg);
}
/**
 * 방 입장
 */
function handleCreateRoom(event) {
    event.preventDefault();
    const roomInput = nickNameForm.querySelector('input');
    enterRoom(nickNameForm.querySelector('input').value);
}
function enterRoom(_nickName) {
    if (!_nickName) {
        return alert('닉네임을 입력해주세요.');
    }
    ws.send(makeMessage('enter_room', _nickName));
    roomDiv.hidden = false;
    nickNameForm.hidden = true;
}
/**
 * 메세지 추가하기
 */
function addMessage(message) {
    console.log(message);
    const ul = roomDiv.querySelector('ul');
    const li = document.createElement('li');
    li.innerText = message.data;
    ul.appendChild(li);
}
/**
 * 메세지 보내기
 */
function handleMessageSubmit(event) {
    event.preventDefault();
    const messageInput = roomDiv.querySelector('form input');
    const message = messageInput.value;
    if (message === '') {
        return;
    }
    ws.send(makeMessage('message', message));
    messageInput.value = '';
    messageInput.focus();
}

// 소켓 이벤트 리스너
ws.addEventListener('message', addMessage);
nickNameForm.addEventListener('submit', handleCreateRoom);
roomDiv.querySelector('form').addEventListener('submit', handleMessageSubmit);
ws.addEventListener('open', () => {
    console.log('welcome', ws);
});

document.getElementById('btn-login').addEventListener('click', login);
document.getElementById('btn-logout').addEventListener('click', logout);
document.getElementById('btn-dl').addEventListener('click', download);

function login() {
	chrome.runtime.sendMessage({
		type: 'login',
		url: document.getElementById('txt-url').value,
		username: document.getElementById('txt-username').value,
		password: document.getElementById('txt-password').value,
	});
}

function logout() {
	chrome.storage.local.clear();
	checkLoggedIn();
	chrome.runtime.sendMessage({
		type: 'loggedout',
	});
}

function download() {
	chrome.runtime.sendMessage({
		type: 'download',
		url: document.getElementById('txt-dl').value,
	});
}

function checkLoggedIn() {
	chrome.storage.local.get(['data']).then((result) => {
		if (result.data === undefined) {
			document.getElementById('login').style.display = 'block';
			document.getElementById('logout').style.display = 'none';
			document.getElementById('lbl-site').textContent = '';
			document.getElementById('lbl-user').textContent = '';
		} else {
			console.log(result.data);
			document.getElementById('login').style.display = 'none';
			document.getElementById('logout').style.display = 'block';
			document.getElementById('lbl-site').textContent = result.data.server;
			document.getElementById('lbl-user').textContent = result.data.loginName;
		}
	});
}

checkLoggedIn();

chrome.runtime.onMessage.addListener(handleMessage);

function handleMessage(msg) {
	switch (msg.type) {
		case 'loggedin': {
			checkLoggedIn();
			break;
		}
	}
}

chrome.runtime.onMessage.addListener(handleMessage);

let contextMenuItem = {
	id: 'ncdl',
	title: 'Send to NCDownloader',
	contexts: ['link'],
};

checkLoggedIn();

function handleMessage(msg) {
	switch (msg.type) {
		case 'login': {
			login(msg.url);
			break;
		}
		case 'download': {
			download(msg.url);
			break;
		}
		case 'loggedout': {
			checkLoggedIn();
			break;
		}
	}
}

function checkLoggedIn() {
	chrome.storage.local.get(['data']).then((result) => {
		if (result.data === undefined) {
			chrome.contextMenus.removeAll();
		} else {
			chrome.contextMenus.create(contextMenuItem);
			chrome.contextMenus.onClicked.addListener(function (data) {
				download(data.linkUrl);
			});
		}
	});
}

function download(url) {
	chrome.storage.local.get(['data']).then((result) => {
		if (result.data === undefined) {
			return;
		}

		var requestOptions = {
			method: 'POST',
			redirect: 'follow',
			headers: {
				Authorization: 'Bearer ' + result.data.appPassword,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				'text-input-value': url,
				type: 'aria2',
				torrentfile: '',
				_path: '',
			}),
		};

		fetch(result.data.server + '/apps/ncdownloader/new', requestOptions).catch(
			(error) => console.log('error', error)
		);
	});
}

function login(url) {
	if (url.charAt(url.length - 1) != '/') {
		url += '/';
	}
	chrome.permissions.request(
		{
			origins: [url],
		},
		(granted) => {
			if (granted) {
				console.log('granted');
				var requestOptions = {
					method: 'POST',
					redirect: 'follow',
				};

				fetch(url + 'index.php/login/v2', requestOptions)
					.then((response) => response.json())
					.then((result) => {
						pollLoginData(result.poll.endpoint, result.poll.token, 0);
						chrome.tabs.create({ url: result.login });
					})
					.catch((error) => console.log('error', error));
			}
		}
	);
}

async function pollLoginData(url, token, tries) {
	if (tries >= 30) {
		return;
	}

	var requestOptions = {
		method: 'POST',
		redirect: 'follow',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: 'token=' + token,
	};

	fetch(url, requestOptions)
		.then(async (response) => {
			if (response.status === 404) {
				await Sleep(5000);
				pollLoginData(url, token, (tries += 1));
				return undefined;
			}
			return response.json();
		})
		.then((result) => {
			if (result === undefined) {
				return;
			}
			chrome.storage.local.set({ data: result });
			checkLoggedIn();
			chrome.runtime.sendMessage({
				type: 'loggedin',
			});
		})
		.catch((error) => console.log('error', error));
}

function Sleep(milliseconds) {
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

const socket = io();

// Elements

const $messageControls = document.querySelector('#message-controls');
const $messageInput = document.querySelector('#message-input')
const $messageSubmit = document.querySelector('#message-submit');
const $messageLocation = document.querySelector('#message-location');
const $messages = document.querySelector('#messages');

// Templates

const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoScroll = () => {
	// New message element
	const $newMessage = $messages.lastElementChild

	const messagesVerticle = $messages.offsetHeight + $messages.scrollTop;
	const messagesHeight = $messages.scrollHeight;
	
	$messages.scrollTo({
		top: messagesVerticle,
		behavior: "smooth"
	});
}

// Events
socket.on('roomData', ({ room, users }) => {
	const $sidebar = document.querySelector('#sidebar');
	
	const html = Mustache.render(sidebarTemplate, {
		room,
		users
	})
	$sidebar.innerHTML = html;
});

socket.on('message', (message) => {
	const html = Mustache.render(messageTemplate, {
		username: message.username,
		message: message.text,
		createdAt: moment(message.createdAt).format('h:mm:ss A')
	});
	$messages.insertAdjacentHTML('beforeend', html);
	autoScroll();
});

socket.on('locationMessage', (message) => {
	const html = Mustache.render(locationMessageTemplate, {
		username: message.username,
		url:  message.url,
		createdAt: moment(message.createdAt).format('h:mm:ss A')
	});
	$messages.insertAdjacentHTML('beforeend', html);
	autoScroll();
})

$messageControls.addEventListener('submit', () => {
	const message = $messageInput.value;
	event.preventDefault();

	if (!message) { return console.error('The message is empty!') }
	$messageSubmit.setAttribute('disabled', 'disabled');

	socket.emit('logMessage', message, (error) => {
		$messageSubmit.removeAttribute('disabled');
		$messageInput.value = '';
		$messageInput.focus();
		
		if (error) { return console.error(error) }
		console.info('Message delivered!');
	});
});

$messageLocation.addEventListener('click', () => {
	if (!navigator.geolocation) { return console.error('Geolocation is not supported for your browser!') }

	$messageLocation.setAttribute('disabled', 'disabled');
	
	navigator.geolocation.getCurrentPosition((position) => {
		socket.emit('logLocation', {
			latitude: position.coords.latitude,
			longitude: position.coords.longitude
		}, () => {
			console.info('Location shared!');
			$messageLocation.removeAttribute('disabled');
		})
	});
});

socket.emit('join', { username, room }, (error) => {
	if (error) {
		alert(error)
		location.href = '/'
	}
});
const { getAllDocs, getDoc, createDocWithId, updateDoc } = require('./dataProviders/couchdb');
const request = require('request-promise');

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

const sendNotification = async function(psid, message) {
	const options = {
		url: 'https://chatbot.festbot.com/send-notification',
		json: {
			accessToken: process.env.FESTBOT_ACCESS_TOKEN,
			message,
			psid
		}
	};

	return await request.post(options);
};

const queueNotification = async function({ date, festivalId, stageId, artistId, userId, eventId }) {
	try {
		await createDocWithId('notifications', userId + ':' + eventId, {
			date,
			festivalId,
			stageId,
			artistId,
			eventId,
			userId,
			fired: false
		});
	} catch (e) {
		console.log(e.message);
	}
};

const updateNotification = async function(notification) {
	await updateDoc('notifications', { ...notification, fired: true });
};

const getUsers = async function() {
	const userData = await getAllDocs('users');
	return userData.rows.map(user => user.doc);
};

const getNotifications = async function() {
	const notifications = await getAllDocs('notifications');
	return notifications.rows.map(notification => notification.doc);
};

const getArtistData = async function(id) {
	return await getDoc('artists', id);
};

const getStageData = async function(id) {
	return await getDoc('venues', id);
};

const getUserData = async function(id) {
	return await getDoc('users', id);
};

const getEventData = async function(id) {
	return await getDoc('events', id);
};

const eachEvent = async function(callback) {
	const users = await getUsers();

	for (let i = 0; i < users.length; i++) {
		const savedShows = users[i].savedShows;

		if (!savedShows) {
			continue;
		}

		for (let j = 0; j < savedShows.length; j++) {
			try {
				const event = await getEventData(savedShows[j]);
				const startTimestamp = new Date(event.startDate).getTime();
				const diff = startTimestamp - Date.now();

				if (diff > 0) {
					await callback(event, users[i]);
				}
			} catch (e) {
				console.log(e.message);
			}
		}
	}
};

const eachNotification = async function(callback) {
	const notifications = await getNotifications();

	for (let i = 0; i < notifications.length; i++) {
		const notification = notifications[i];
		const timestamp = new Date(notification.date).getTime();
		const timeUntilStart = timestamp - Date.now();

		if (!notification.fired && timeUntilStart > 0) {
			callback(notifications[i], timeUntilStart);
		}
	}
};

async function queueNotifications() {
	console.log('Queueing new notifications...');

	await eachEvent(async function(event, user) {
		console.log(`${user.firstName} : ${event.artist} : ${event.festival}`);

		await queueNotification({
			artistId: event.artistId,
			festivalId: event.festivalId,
			stageId: event.stageId,
			date: event.startDate,
			userId: user._id,
			eventId: event._id
		});
	});

	console.log('Done.');
}

async function sendOutNotifications() {
	console.log('Sending out notifications...');

	await eachNotification(async function(notification, timeUntilStart) {
		const artist = await getArtistData(notification.artistId);
		const stage = await getStageData(notification.stageId);
		const user = await getUserData(notification.userId);

		if (user.firstName !== 'Andor') {
			return;
		}

		if (timeUntilStart < 1 * HOUR) {
			await updateNotification(notification);
			await sendNotification(user.psid, `Csak szólok, hogy ${artist.name} 1 órán belül kezd itt: ${stage.name} 😎`);
			console.log('Notification sent out to', user.firstName, 'about', artist.name);
		}
	});

	console.log('Done.');
}

(async function() {
	await queueNotifications();
	await sendOutNotifications();
})();

setInterval(async function() {
	await queueNotifications();
	await sendOutNotifications();
}, 5 * MINUTE);

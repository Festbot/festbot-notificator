const request = require('request-promise');

const getUUID = async function() {
	const { uuids } = await request.get({
		url: `https://api.festbot.com/_uuids`,
		json: true,
	});

	return uuids[0];
};

const getAllDocs = async function(db) {
	const options = {
		url: 'https://api.festbot.com/' + db + '/_all_docs?include_docs=true',
		json: true,
	};

	return await request.get(options);
};


const getDoc = async function(db, id) {
	const options = {
		url: 'https://api.festbot.com/' + db + '/' + id,
		json: true,
	};

	return await request.get(options);
};

const deleteDoc = async function(db, id) {
	const options = {
		url: 'https://api.festbot.com/' + db,
		json: true,
	};

	return await request.delete(options);
};

const createDoc = async function(db, data) {
	const options = {
		url: 'https://api.festbot.com/' + db,
		json: data,
	};

	return await request.post(options);
};

const createDocWithId = async function(db, id, data) {
	const options = {
		url: 'https://api.festbot.com/' + db + '/' + id,
		json: data,
	};

	return await request.put(options);
};

const find = async function(db, selector) {
	const options = {
		url: 'https://api.festbot.com/' + db + '/_find',
		json: {
			selector,
		},
	};

	return await request.post(options);
};

const updateDoc = async function(db, doc) {
	const options = {
		url: 'https://api.festbot.com/' + db + '/' + doc._id + '?rev=' + doc._rev,
		json: doc
	};

	return await request.put(options);
};

module.exports = {
	getUUID,
	createDoc,
	createDocWithId,
	find,
	updateDoc,
	getDoc,
    deleteDoc,
    getAllDocs,
};

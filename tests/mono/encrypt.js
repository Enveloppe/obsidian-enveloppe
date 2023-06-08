const enc = new TextEncoder();
const dec = new TextDecoder();
const keyPair = window.crypto.subtle.generateKey({
	name: "RSA-OAEP",
	modulusLength: 4096,
	publicExponent: new Uint8Array([1, 0, 1]),
	hash: "SHA-256"
},
true,
["encrypt", "decrypt"]
);
const encodedMessage = enc.encode("hello");
(async () => {
	const {
		privateKey,
		publicKey
	} = await keyPair;
	const encryptedText = await window.crypto.subtle.encrypt({
		name: "RSA-OAEP"
	},
	publicKey,
	encodedMessage
	);
	console.log(encryptedText);
	const decryptedText = await window.crypto.subtle.decrypt({
		name: "RSA-OAEP"
	},
	privateKey,
	encryptedText
	);
	console.log(decryptedText);
	console.log(dec.decode(decryptedText));
})();
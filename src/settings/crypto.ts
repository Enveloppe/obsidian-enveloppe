import { arrayBufferToBase64, base64ToArrayBuffer, App, PluginManifest } from "obsidian";
import { noticeLog } from "src/src/utils";

interface KeyPair {
	publicKey: CryptoKey;
	privateKey: CryptoKey;
}
	
async function generateKey(): Promise<KeyPair> {
	return await window.crypto.subtle.generateKey(
		{
			name: "RSA-OAEP",
			modulusLength: 4096,
			publicExponent: new Uint8Array([1, 0, 1]),
			hash: "SHA-256",
		},
		true,
		["encrypt", "decrypt"]
	);
}

export async function writeKeyPair(app: App, manifest: PluginManifest) {
	console.log("writing key pair");
	const keyPair = await generateKey();
	const exportedPublicKey = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
	const exportedPrivateKey = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
	const keyPairJson = {
		publicKey: exportedPublicKey,
		privateKey: exportedPrivateKey,
	};
	await app.vault.adapter.write(`${app.vault.configDir}/plugins/${manifest.id}/keyPair.json`, JSON.stringify(keyPairJson));
}

async function loadKeyPair(app: App, manifest: PluginManifest): Promise<KeyPair> {
	const keyPairFile = await isEncrypted(app, manifest);
	if (!keyPairFile) {
		await writeKeyPair(app, manifest);
	}
	console.log("loading key pair with JSON")
	const keys = JSON.parse(await app.vault.adapter.read(`${app.vault.configDir}/plugins/${manifest.id}/keyPair.json`));
	console.log(keys);
	const publicKey = await window.crypto.subtle.importKey(
		"jwk", 
		keys.publicKey, { 
			name: "RSA-OAEP", 
			hash: "SHA-256" 
		}, 
		true, 
		["encrypt"]
	);
	const privateKey = await window.crypto.subtle.importKey(
		"jwk", 
		keys.privateKey, { 
			name: "RSA-OAEP", hash: "SHA-256" 
		}, 
		true, 
		["decrypt"]);
	console.log("loaded key pair", publicKey, privateKey);
	return {
		publicKey,
		privateKey,
	};
	
}

export async function encrypt(data: string, app: App, manifest: PluginManifest):Promise<string> {
	const enc = new TextEncoder();
	const keyPair = await loadKeyPair(app, manifest);
	const encodedData = enc.encode(data);
	const {publicKey} = keyPair;
	const encryptedText = await window.crypto.subtle.encrypt({
		name: "RSA-OAEP"
	},
	publicKey,
	encodedData
	);
	console.log("encrypted data", arrayBufferToBase64(encryptedText));
	return arrayBufferToBase64(encryptedText);
}

export async function decrypt(data: string, app: App, manifest: PluginManifest): Promise<string> {
	console.log("decrypting data: ", data);
	const dec = new TextDecoder();
	console.log("LOAD KEY PAIR");
	const keyPair = await loadKeyPair(app, manifest);
	const {privateKey} = keyPair;
	console.log("decrypting data: ", base64ToArrayBuffer(data));
	const decryptData = await window.crypto.subtle.decrypt({
		name: "RSA-OAEP"
	},
	privateKey,
	base64ToArrayBuffer(data)
	);
	console.log(dec);
	console.log("decrypted data", dec.decode(decryptData));
	return dec.decode(decryptData);
}

export async function isEncrypted(app: App, manifest: PluginManifest) {
	console.log("checking if encrypted");
	const isExist= await app.vault.adapter.exists(`${app.vault.configDir}/plugins/${manifest.id}/keyPair.json`);
	console.log("is encrypted", isExist);
	return isExist;
}
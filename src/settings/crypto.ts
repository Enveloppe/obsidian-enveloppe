import { arrayBufferToBase64, base64ToArrayBuffer, App, PluginManifest } from "obsidian";

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
	const keyPairFile = app.vault.getAbstractFileByPath(`${app.vault.configDir}/plugins/${manifest.id}/keyPair.json`);
	if (!keyPairFile) {
		await writeKeyPair(app, manifest);
	}
	const keys = JSON.parse(await app.vault.adapter.read(`${app.vault.configDir}/plugins/${manifest.id}/keyPair.json`));
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
	return arrayBufferToBase64(encryptedText);
}

export async function decrypt(data: string, app: App, manifest: PluginManifest): Promise<string> {
	const dec = new TextDecoder();
	const keyPair = await loadKeyPair(app, manifest);
	const {privateKey} = keyPair;
	const decryptData = await window.crypto.subtle.decrypt({
		name: "RSA-OAEP"
	},
	privateKey,
	base64ToArrayBuffer(data)
	);
	return dec.decode(decryptData);
}

export function isEncrypted(app: App, manifest: PluginManifest) {
	const keyPairFile = app.vault.getAbstractFileByPath(`${app.vault.configDir}/plugins/${manifest.id}/keyPair.json`);
	if (!keyPairFile) {
		// No keypair file, so no encryption
		return false;
	}
	return true;
}
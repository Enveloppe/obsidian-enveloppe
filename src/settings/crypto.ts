import { arrayBufferToBase64, base64ToArrayBuffer} from "obsidian";
import GithubPublisher from "src/main";
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

export async function writeKeyPair(plugin: GithubPublisher) {
	const manifest = plugin.manifest;
	const keyPair = await generateKey();
	const exportedPublicKey = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
	const exportedPrivateKey = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
	const keyPairJson = {
		publicKey: exportedPublicKey,
		privateKey: exportedPrivateKey,
	};
	await app.vault.adapter.write(`${app.vault.configDir}/plugins/${manifest.id}/keyPair.json`, JSON.stringify(keyPairJson));
}

async function loadKeyPair(plugin: GithubPublisher): Promise<KeyPair> {
	const keyPairFile = await isEncrypted(plugin);
	if (!keyPairFile) {
		await writeKeyPair(plugin);
	}
	const manifest = plugin.manifest;
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

export async function encrypt(data: string, plugin: GithubPublisher):Promise<string> {
	if (data.length === 0) return data;
	try {
		const enc = new TextEncoder();
		const keyPair = await loadKeyPair(plugin);
		const encodedData = enc.encode(data);
		const {publicKey} = keyPair;
		const encryptedText = await window.crypto.subtle.encrypt({
			name: "RSA-OAEP"
		},
		publicKey,
		encodedData
		);
		return arrayBufferToBase64(encryptedText);
	} catch (e) {
		noticeLog(e, plugin.settings);
		return "";
	}
}

export async function decrypt(data: string, plugin: GithubPublisher): Promise<string> {
	const dec = new TextDecoder();
	const keyPair = await loadKeyPair(plugin);
	const bufferData = base64ToArrayBuffer(data);
	const decryptData = await window.crypto.subtle.decrypt({
		name: "RSA-OAEP"
	},
	keyPair.privateKey,
	bufferData
	);
	return dec.decode(decryptData);
}

export async function isEncrypted(plugin: GithubPublisher): Promise<boolean> {
	const {manifest, settings} = plugin;
	const isExist= await app.vault.adapter.exists(`${app.vault.configDir}/plugins/${manifest.id}/keyPair.json`) && settings.github.token.length > 0 && !settings.github.token.startsWith("ghp");
	return isExist;
}

export async function regenerateTokenKeyPair(plugin: GithubPublisher) {
	noticeLog("Regenerating token key pair", plugin.settings);
	const settings = plugin.settings;
	const token = await decrypt(settings.github.token, plugin);
	await writeKeyPair(plugin);
	const encryptedToken = await encrypt(token, plugin);
	settings.github.token = encryptedToken;
	await plugin.saveSettings();
	noticeLog("Regenerated token key pair", plugin.settings);
}
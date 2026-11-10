import { stripAttachmentPathPrefix } from "src/conversion/file_path";
import { describe, expect, it } from "vitest";

describe("stripAttachmentPathPrefix", () => {
	it.each([
		["empty prefix", "public/assets/photo.png", "", "public/assets/photo.png"],
		["whitespace-only prefix", "public/assets/photo.png", "   ", "public/assets/photo.png"],
		["simple prefix", "public/assets/photo.png", "public", "/assets/photo.png"],
		["prefix with trailing slash", "public/assets/photo.png", "public/", "/assets/photo.png"],
		["prefix with leading slash", "/public/assets/photo.png", "/public", "/assets/photo.png"],
		["prefix with both slashes", "/public/assets/photo.png", "/public/", "/assets/photo.png"],
		["path with leading slash", "/public/images/photo.png", "public", "/images/photo.png"],
		["nested prefix", "public/assets/images/photo.png", "public/assets", "/images/photo.png"],
		[
			"nested prefix with trailing slash",
			"public/assets/images/photo.png",
			"public/assets/",
			"/images/photo.png",
		],
		["non-matching prefix", "assets/photo.png", "public", "assets/photo.png"],
		["partial segment match", "public_files/photo.png", "public", "public_files/photo.png"],
		["exact match", "public", "public", "/"],
		["exact match with slashes", "/public/", "public", "/"],
		["file directly under prefix", "public/resume.pdf", "public", "/resume.pdf"],
	])("%s", (_name, linkPath, prefix, expected) => {
		expect(stripAttachmentPathPrefix(linkPath, prefix)).toBe(expected);
	});
});

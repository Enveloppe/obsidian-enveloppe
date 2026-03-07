/**
 * Tests for stripAttachmentPathPrefix
 *
 * Run with: npx tsx src/conversion/strip_path_prefix_test.ts
 */

import { stripAttachmentPathPrefix } from "./file_path";

interface TestCase {
    name: string;
    linkPath: string;
    prefix: string;
    expected: string;
}

const testCases: TestCase[] = [
    // Empty / unset prefix → no change
    { name: "empty prefix returns path unchanged", linkPath: "public/assets/photo.png", prefix: "", expected: "public/assets/photo.png" },
    { name: "whitespace-only prefix returns path unchanged", linkPath: "public/assets/photo.png", prefix: "   ", expected: "public/assets/photo.png" },

    // Basic stripping
    { name: "strips simple prefix", linkPath: "public/assets/photo.png", prefix: "public", expected: "/assets/photo.png" },
    { name: "strips prefix with trailing slash", linkPath: "public/assets/photo.png", prefix: "public/", expected: "/assets/photo.png" },
    { name: "strips prefix with leading slash", linkPath: "/public/assets/photo.png", prefix: "/public", expected: "/assets/photo.png" },
    { name: "strips prefix with both slashes", linkPath: "/public/assets/photo.png", prefix: "/public/", expected: "/assets/photo.png" },

    // Path with textPrefix already applied (e.g., "/" prefix from settings)
    { name: "strips from path with leading slash", linkPath: "/public/images/photo.png", prefix: "public", expected: "/images/photo.png" },

    // Nested prefix
    { name: "strips nested prefix", linkPath: "public/assets/images/photo.png", prefix: "public/assets", expected: "/images/photo.png" },
    { name: "strips nested prefix with trailing slash", linkPath: "public/assets/images/photo.png", prefix: "public/assets/", expected: "/images/photo.png" },

    // Non-matching prefix → no change
    { name: "non-matching prefix returns path unchanged", linkPath: "assets/photo.png", prefix: "public", expected: "assets/photo.png" },
    { name: "partial match at start is not stripped", linkPath: "public_files/photo.png", prefix: "public", expected: "public_files/photo.png" },

    // Exact match edge case
    { name: "exact match returns root", linkPath: "public", prefix: "public", expected: "/" },
    { name: "exact match with slashes returns root", linkPath: "/public/", prefix: "public", expected: "/" },

    // File directly under prefix
    { name: "file directly under prefix", linkPath: "public/resume.pdf", prefix: "public", expected: "/resume.pdf" },
];

let passed = 0;
let failed = 0;

for (const tc of testCases) {
    const result = stripAttachmentPathPrefix(tc.linkPath, tc.prefix);
    if (result === tc.expected) {
        passed++;
        console.log(`  ✓ ${tc.name}`);
    } else {
        failed++;
        console.error(`  ✗ ${tc.name}`);
        console.error(`    input:    stripAttachmentPathPrefix("${tc.linkPath}", "${tc.prefix}")`);
        console.error(`    expected: "${tc.expected}"`);
        console.error(`    got:      "${result}"`);
    }
}

console.log(`\n${passed} passed, ${failed} failed out of ${testCases.length} tests`);

if (failed > 0) {
    process.exit(1);
}

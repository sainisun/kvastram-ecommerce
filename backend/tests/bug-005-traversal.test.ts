import {
  generateSecureFilename,
  validateExtension,
  validateMimeType,
  isPathWithinUploadDir,
  sanitizeFilename,
  validateFileUpload,
  MAX_FILE_SIZE,
  getUploadDir
} from '../src/utils/safe-file-upload';

console.log('='.repeat(70));
console.log('Bug-005: Directory Traversal Protection Tests');
console.log('='.repeat(70));
console.log();

let passCount = 0;
let failCount = 0;

function test(name: string, condition: boolean, details: string = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${name}`);
    passCount++;
  } else {
    console.log(`  ✗ FAIL: ${name}`);
    if (details) console.log(`        ${details}`);
    failCount++;
  }
}

console.log('\n📋 Test Suite 1: Secure Filename Generation');
console.log('-'.repeat(70));

// Test 1.1: Generate unique filenames
const filename1 = generateSecureFilename('test.jpg');
const filename2 = generateSecureFilename('test.jpg');
test('Generates unique filenames', filename1 !== filename2, `${filename1} vs ${filename2}`);

// Test 1.2: Format check (timestamp-64hex.jpg)
test('Correct format (timestamp-64hex.jpg)', /^\d+-[a-f0-9]{64}\.jpg$/.test(filename1), filename1);

// Test 1.3: Original filename not in result
test('Original name not leaked', !filename1.includes('test'), filename1);

// Test 1.4: Extension preserved
const extTests: [string, string][] = [
  ['photo.png', '.png'],
  ['doc.pdf', '.pdf'],
  ['image.JPG', '.jpg'],
  ['file.DOCX', '.docx']
];
extTests.forEach(([input, expectedExt]) => {
  const result = generateSecureFilename(input);
  test(`Extension preserved: ${input} -> ${expectedExt}`, 
       result.endsWith(expectedExt), 
       `Got: ${result}`);
});

console.log('\n📋 Test Suite 2: Extension Validation');
console.log('-'.repeat(70));

// Test 2.1: Valid extensions
const validExts = ['file.jpg', 'file.jpeg', 'file.png', 'file.gif', 'file.webp', 'file.pdf', 'file.doc', 'file.docx'];
validExts.forEach(filename => {
  const ext = require('path').extname(filename);
  test(`Valid extension: ${ext}`, validateExtension(filename), filename);
});

// Test 2.2: Invalid extensions
const invalidExts = ['file.exe', 'file.php', 'file.js', 'file.sh', 'file.bat', 'file.py'];
invalidExts.forEach(filename => {
  const ext = require('path').extname(filename);
  test(`Invalid extension blocked: ${ext}`, !validateExtension(filename), filename);
});

console.log('\n📋 Test Suite 3: MIME Type Validation');
console.log('-'.repeat(70));

// Test 3.1: Valid MIME type combinations
const validMimeCombos: [string, string][] = [
  ['image.jpg', 'image/jpeg'],
  ['image.jpeg', 'image/jpeg'],
  ['image.png', 'image/png'],
  ['doc.pdf', 'application/pdf']
];
validMimeCombos.forEach(([filename, mime]) => {
  const ext = require('path').extname(filename);
  test(`Valid MIME: ${mime} for ${ext}`, 
       validateMimeType(filename, mime), 
       `${filename} with ${mime}`);
});

// Test 3.2: Invalid MIME type combinations
const invalidMimeCombos: [string, string][] = [
  ['image.jpg', 'image/png'],  // Wrong MIME for extension
  ['file.exe', 'application/x-msdownload'],  // Extension not allowed
  ['shell.php', 'text/x-php']  // Extension not allowed
];
invalidMimeCombos.forEach(([filename, mime]) => {
  test(`Invalid MIME blocked: ${mime} for ${filename}`, 
       !validateMimeType(filename, mime), 
       `${filename} with ${mime}`);
});

console.log('\n📋 Test Suite 4: Path Traversal Protection');
console.log('-'.repeat(70));

const uploadDir = '/app/uploads';

// Test 4.1: Safe paths
const safePaths = [
  '/app/uploads/file.jpg',
  '/app/uploads/subdir/file.png',
  '/app/uploads/2024/01/file.pdf'
];
safePaths.forEach(targetPath => {
  const name = require('path').basename(targetPath);
  test(`Safe path allowed: ${name}`, 
       isPathWithinUploadDir(targetPath, uploadDir), 
       targetPath);
});

// Test 4.2: Directory traversal attempts
const traversalPaths = [
  '/app/uploads/../etc/passwd',
  '/app/uploads/../../etc/passwd',
  '/app/uploads/../../../etc/shadow',
  '/etc/passwd',
  '/app/uploads/subdir/../../../../etc/passwd'
];
traversalPaths.forEach(targetPath => {
  test(`Traversal blocked: ${targetPath}`, 
       !isPathWithinUploadDir(targetPath, uploadDir), 
       targetPath);
});

// Test 4.3: Windows-style paths (should be normalized)
const windowsPaths = [
  'C:\\Windows\\System32\\config.jpg',
  '\\\\server\\share\\file.jpg',
  'C:/Windows/System32/config.jpg'
];
windowsPaths.forEach(targetPath => {
  test(`Windows path handled: ${targetPath.substring(0, 30)}...`, 
       !isPathWithinUploadDir(targetPath, '/app/uploads'), 
       targetPath);
});

console.log('\n📋 Test Suite 5: Filename Sanitization');
console.log('-'.repeat(70));

// Test 5.1: Path traversal in filename
const traversalFilenames = [
  '../../../etc/passwd.jpg',
  '..\\..\\windows\\system32\\config.jpg',
  '/absolute/path/file.jpg'
];
traversalFilenames.forEach((input) => {
  const sanitized = sanitizeFilename(input);
  test(`Sanitizes: ${input.substring(0, 30)}...`, 
       !sanitized.includes('..') && !sanitized.startsWith('/'), 
       `Got: ${sanitized}`);
});

// Test 5.2: Null byte handling
test('Null bytes removed', 
     !sanitizeFilename('test\x00.php.jpg').includes('\x00'), 
     sanitizeFilename('test\x00.php.jpg'));

// Test 5.3: Special characters
test('Special chars sanitized', 
     sanitizeFilename('file<script>alert(1)</script>.jpg') === 'file_script_alert_1___script_.jpg',
     sanitizeFilename('file<script>alert(1)</script>.jpg'));

// Test 5.4: Unicode and normalization
test('Unicode handling', 
     sanitizeFilename('файл\u202ejpg.exe') !== 'файл\u202ejpg.exe',
     sanitizeFilename('файл\u202ejpg.exe'));

console.log('\n📋 Test Suite 6: Complete Upload Validation');
console.log('-'.repeat(70));

// Test 6.1: Valid upload
const validUpload = validateFileUpload('photo.jpg', 'image/jpeg', 1024);
test('Valid upload accepted', 
     validUpload.valid === true && !!validUpload.secureFilename, 
     JSON.stringify(validUpload));

// Test 6.2: File too large
const largeUpload = validateFileUpload('large.jpg', 'image/jpeg', MAX_FILE_SIZE + 1);
test('Oversized file rejected', 
     !largeUpload.valid && largeUpload.error?.includes('too large') === true, 
     largeUpload.error);

// Test 6.3: Invalid extension
const invalidExtUpload = validateFileUpload('shell.php', 'text/x-php', 1024);
test('Invalid extension rejected', 
     !invalidExtUpload.valid && invalidExtUpload.error?.includes('extension') === true, 
     invalidExtUpload.error);

// Test 6.4: MIME mismatch
const mimeMismatchUpload = validateFileUpload('fake.jpg', 'application/pdf', 1024);
test('MIME mismatch rejected', 
     !mimeMismatchUpload.valid && mimeMismatchUpload.error?.includes('MIME') === true, 
     mimeMismatchUpload.error);

// Test 6.5: Double extension attack
const doubleExtUpload = validateFileUpload('shell.php.jpg', 'image/jpeg', 1024);
test('Double extension handled correctly', 
     doubleExtUpload.valid === true && doubleExtUpload.secureFilename?.endsWith('.jpg') === true, 
     doubleExtUpload.secureFilename);

console.log('\n📋 Test Suite 7: Filename Unpredictability');
console.log('-'.repeat(70));

// Test 7.1: Multiple uploads generate different names
const filenames: string[] = [];
for (let i = 0; i < 10; i++) {
  filenames.push(generateSecureFilename('test.jpg'));
}
const uniqueCount = new Set(filenames).size;
test('10 uploads generate 10 unique filenames', 
     uniqueCount === 10, 
     `Got ${uniqueCount} unique filenames`);

// Test 7.2: Hex component is 64 characters (256 bits)
const sample = filenames[0];
const hexPart = sample.split('-')[1].split('.')[0];
test('Random component is 64 hex chars (256 bits)', 
     hexPart.length === 64 && /^[a-f0-9]+$/.test(hexPart), 
     `Got: ${hexPart} (length: ${hexPart.length})`);

// Test 7.3: Timestamp component present
const timestamp = sample.split('-')[0];
test('Timestamp component is numeric', 
     /^\d+$/.test(timestamp) && timestamp.length >= 13, 
     `Got: ${timestamp}`);

console.log('\n' + '='.repeat(70));
console.log('Test Summary');
console.log('='.repeat(70));
console.log(`Total:  ${passCount + failCount}`);
console.log(`Passed: ${passCount} ✅`);
console.log(`Failed: ${failCount} ❌`);

if (failCount === 0) {
  console.log('\n🎉 All tests PASSED! Directory traversal protection is working correctly.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests FAILED - review above for details');
  process.exit(1);
}

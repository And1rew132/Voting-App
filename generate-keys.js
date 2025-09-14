const { generateRSAKeypair } = require('./crypto-utils');
const fs = require('fs');

// Generate RSA keypair for Token Issuer
const { publicKey, privateKey } = generateRSAKeypair();

console.log('Generated RSA Keypair for Token Issuer:');
console.log('\nPublic Key (for verification):');
console.log(publicKey);
console.log('\nPrivate Key (for signing - keep secure):');
console.log(privateKey);

// Save to .env file
const envContent = `# RSA Keys for Blind Signature Voting
TI_PRIVATE_KEY_PEM="${privateKey.replace(/\n/g, '\\n')}"
TI_PUBLIC_KEY_PEM="${publicKey.replace(/\n/g, '\\n')}"
`;

fs.writeFileSync('.env', envContent);
console.log('\nKeys saved to .env file');
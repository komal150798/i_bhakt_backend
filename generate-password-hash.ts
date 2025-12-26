import * as bcrypt from 'bcrypt';

async function generatePasswordHash() {
  const password = 'Komal@1234';
  const saltRounds = 10;
  
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  console.log('========================================');
  console.log('Password Hash Generated');
  console.log('========================================');
  console.log('Original Password: Komal@1234');
  console.log('Hashed Password:', hashedPassword);
  console.log('========================================');
  console.log('\nSQL UPDATE Statement:');
  console.log('========================================');
  console.log(`UPDATE cst_customer`);
  console.log(`SET password = '${hashedPassword}'`);
  console.log(`WHERE email = 'your_email@example.com'; -- Replace with actual email`);
  console.log('-- OR');
  console.log(`UPDATE cst_customer`);
  console.log(`SET password = '${hashedPassword}'`);
  console.log(`WHERE phone_number = 'your_phone_number'; -- Replace with actual phone number`);
  console.log('========================================');
}

generatePasswordHash()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error generating hash:', error);
    process.exit(1);
  });



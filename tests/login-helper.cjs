const fs=require('node:fs');
async function loginForTests(page,username='Parikh'){
 if(!await page.locator('#loginScreen').count() || !await page.locator('#loginScreen').isVisible())return;
 const filename=process.env.LOGIN_TEST_CREDENTIALS;
 if(!filename)throw Error('Set LOGIN_TEST_CREDENTIALS to the private generated credentials JSON file.');
 const credentials=JSON.parse(fs.readFileSync(filename,'utf8'));
 const user=credentials.find(record=>record.username===username);
 if(!user)throw Error('Requested test user is missing from the credentials file.');
 await page.getByRole('textbox',{name:'User ID',exact:true}).fill(user.username);
 await page.locator('#loginPassword').fill(user.password);
 await page.getByRole('button',{name:'Log in',exact:true}).click();
 await page.locator('#reportApp').waitFor({state:'visible'});
}
module.exports={loginForTests};

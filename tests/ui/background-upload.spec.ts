import {test,expect} from '@playwright/test';
import sharp from 'sharp';
test('reference upload displays worker result with original comparison and undo',async({page})=>{
 const png=await sharp({create:{width:12,height:12,channels:3,background:'white'}}).png().toBuffer();const result='data:image/png;base64,'+png.toString('base64');
 await page.route('**/api/status',r=>r.fulfill({json:{configured:true,workerConfigured:true,editingConfigured:false}}));
 await page.route('**/api/platform-config',r=>r.fulfill({json:{url:null,key:null}}));
 await page.route('**/api/ai/background',r=>r.fulfill({json:{image:result,kind:'studio-image',persistence:'device-demo'}}));
 await page.route('**/api/edit',()=>{throw Error('OpenAI must not be called');});
 await page.goto('/');await expect(page.locator('.brand-loading')).toBeHidden({timeout:10000});await page.getByRole('button',{name:'Design studio',exact:true}).click();await expect(page.locator('.brand-loading')).toBeHidden({timeout:10000});await page.getByRole('button',{name:'Create your own design',exact:true}).click();
 await page.getByLabel('Upload a reference image').setInputFiles({name:'dress.png',mimeType:'image/png',buffer:png});
 await expect(page.locator('.canvas-tools')).toContainText('2 / 2');await expect(page.locator('.zoom-button img')).toHaveAttribute('src',result);await expect(page.locator('.setup-note')).toHaveCount(0);await page.getByLabel('Describe your idea').fill('Add lace sleeves');await page.getByRole('button',{name:'Generate concept',exact:true}).click();await expect(page.locator('.canvas-tools')).toContainText('3 / 3');await expect(page.locator('.studio-bottom')).toContainText('requested changes not rendered: Add lace sleeves');
 await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.locator('.canvas-tools')).toContainText('2 / 3');
 await page.route('**/api/ai/background',r=>r.fulfill({status:502,json:{error:'Worker unavailable'}}));await page.getByLabel('Upload a reference image').setInputFiles({name:'second.png',mimeType:'image/png',buffer:png});await expect(page.locator('.error-toast')).toContainText('Worker unavailable');await expect(page.locator('.canvas-tools')).toContainText('1 / 1');await page.getByLabel('Describe your idea').fill('Shorten the skirt');await page.getByRole('button',{name:'Generate concept',exact:true}).click();await expect(page.locator('.canvas-tools')).toContainText('2 / 2');await expect(page.locator('.error-toast')).toHaveCount(0);await expect(page.locator('.studio-bottom')).toContainText('Local reference preview; requested changes not rendered: Shorten the skirt');
});


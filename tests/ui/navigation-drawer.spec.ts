import {test,expect} from '@playwright/test';
test('compact header, clear video and right navigation drawer',async({page})=>{
 await page.goto('/');await expect(page.locator('.brand-loading')).toBeHidden({timeout:10000});await expect(page.locator('header nav button')).toHaveCount(3);await expect(page.locator('.campaign-media video')).toHaveAttribute('src','/videos/atelier-opening.mp4');await expect(page.locator('.campaign-bottom button')).toHaveCount(0);
 await page.getByRole('button',{name:'Open more menu'}).click();await expect(page.getByRole('dialog',{name:'More navigation'})).toBeVisible();await page.getByRole('button',{name:'About us',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.getByRole('heading',{name:'About the atelier'})).toBeVisible();
 await page.getByRole('button',{name:'Open more menu'}).click();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

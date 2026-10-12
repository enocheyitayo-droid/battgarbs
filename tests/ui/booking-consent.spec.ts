import {test,expect} from '@playwright/test';
test('cookie rejection blocks booking iframe, settings can be changed, mobile fits',async({page})=>{
 let bookingRequests=0;await page.route('https://calendly.com/**',r=>{bookingRequests++;return r.fulfill({body:'<html>Calendar test fixture</html>',contentType:'text/html'});});
 await page.goto('/');await page.getByRole('button',{name:'Reject optional',exact:true}).click();await expect(page.locator('.cookie-banner')).toHaveCount(0);await expect(page.locator('header nav button')).toHaveCount(3);
 await page.getByRole('button',{name:'Open more menu',exact:true}).click();await page.getByRole('button',{name:'Book an appointment',exact:true}).click();await expect(page.locator('.booking-placeholder')).toBeVisible();await expect(page.locator('iframe.booking-frame')).toHaveCount(0);expect(bookingRequests).toBe(0);
 for(const width of [320,360,390,768]){await page.setViewportSize({width,height:850});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 await page.getByRole('button',{name:'Allow Calendly and load calendar',exact:true}).click();await expect(page.locator('iframe.booking-frame')).toBeVisible();await page.locator('.footer-cookie-link').click();await expect(page.locator('.cookie-options')).toBeVisible();await page.getByRole('button',{name:'Reject optional',exact:true}).click();await expect(page.locator('iframe.booking-frame')).toHaveCount(0);
});
